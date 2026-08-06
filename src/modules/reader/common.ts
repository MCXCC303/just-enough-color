/**
 * Reader integration shared types and helpers.
 *
 * `Zotero.Reader.registerEventListener` is the official Zotero 7 extension
 * API for injecting UI into the reader. Events arrive from the reader iframe
 * and carry:
 *   - `reader`: the xpcom ReaderInstance (a Proxy; unknown properties are
 *     forwarded to the iframe's internal Reader instance, e.g.
 *     `reader._internalReader._annotationManager`)
 *   - `doc`: the reader iframe document (Xray-wrapped)
 *   - `params`: event-specific data
 *   - `append`: appends a menu item (context menus) or a DOM node
 *     (CustomSections like `renderTextSelectionPopup`)
 */

/** The event names accepted by Zotero.Reader.registerEventListener. */
type ReaderEventType = Parameters<
	typeof Zotero.Reader.registerEventListener
>[0];

/** A reader event as delivered to plugins (see xpcom/reader.js). */
export type ReaderEvent = {
	reader?: ReaderLike;
	doc?: Document;
	params?: {
		x?: number;
		y?: number;
		ids?: string[];
		annotation?: any;
		[key: string]: any;
	};
	append?: (...items: any[]) => void;
};

/** Minimal structural typing for the xpcom ReaderInstance proxy. */
export type ReaderLike = {
	itemID?: number;
	_iframeWindow?: Window;
	_internalReader?: any;
	// Unknown props are forwarded to the iframe reader via the proxy:
	[key: string]: any;
};

/**
 * Register a Zotero.Reader event listener, guarding against duplicate
 * registration (e.g. when onStartup is re-run).
 */
export function registerReaderListener(
	type: ReaderEventType,
	handler: (event: ReaderEvent) => void,
): void {
	if (!Zotero.Reader?.registerEventListener) {
		ztoolkit.log("[JEC] Zotero.Reader.registerEventListener unavailable");
		return;
	}
	const listeners = (Zotero.Reader as any)._registeredListeners ?? [];
	const has = (t: string): boolean =>
		listeners.some(
			(l: any) => l.type === t && l.pluginID === addon.data.config.addonID,
		);
	if (!has(type)) {
		Zotero.Reader.registerEventListener(
			type,
			handler as never,
			addon.data.config.addonID,
		);
	}
}

/** Unregister a Zotero.Reader event listener. */
export function unregisterReaderListener(
	type: ReaderEventType,
	handler: (event: ReaderEvent) => void,
): void {
	Zotero.Reader?.unregisterEventListener?.(type, handler as never);
}

/**
 * The eight stock Zotero annotation colors (defines.js::ANNOTATION_COLORS).
 * A color not in this list is a "custom" color managed by this plugin.
 */
export const STOCK_COLORS = [
	"#ffd400",
	"#ff6666",
	"#5fb236",
	"#2ea8e5",
	"#a28ae5",
	"#e56eee",
	"#f19837",
	"#aaaaaa",
];

/** Normalize a color string to lowercase "#rrggbb". */
export function normalizeColor(color: unknown): string | null {
	if (typeof color !== "string") {
		return null;
	}
	let c = color.trim().toLowerCase();
	if (/^#[\da-f]{6}$/.test(c)) {
		return c;
	}
	// Expand 3-digit hex
	if (/^#[\da-f]{3}$/.test(c)) {
		return "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
	}
	return null;
}

/** True when the color is a valid hex not among the stock 8 colors. */
export function isCustomColor(color: unknown): boolean {
	const c = normalizeColor(color);
	return !!c && !STOCK_COLORS.includes(c);
}

/**
 * Clone a chrome-side object into the reader iframe realm.
 *
 * Calling an iframe-internal function (e.g. `_annotationManager.*`) from
 * chrome code passes arguments through the chrome-content boundary; a plain
 * chrome object arriving in the content realm is wrapped in a Chrome Object
 * Wrapper whose properties the content code cannot read (all reads return
 * undefined). Explicitly `cloneInto`-ing the argument - exactly what xpcom
 * does with the `append` callback - makes the payload a real content object.
 */
export function cloneIntoFrame(reader: ReaderLike, value: unknown): any {
	const win = reader?._iframeWindow;
	if (!win) {
		return value;
	}
	try {
		return Components.utils.cloneInto(value, win, {wrapReflectors: true});
	} catch (e) {
		Zotero.debug(`[JEC] cloneIntoFrame failed, passing value as-is: ${e}`);
		return value;
	}
}

/**
 * Log an error both to the debug console and to a visible progress window,
 * so failures during testing are immediately visible without the error
 * console.
 */
export function reportError(context: string, error: unknown): void {
	const message = error instanceof Error
		? `${error.name}: ${error.message}`
		: String(error);
	Zotero.debug(`[JEC] ${context}: ${message}`);
	Zotero.debug(`[JEC] ${context} stack: ${error instanceof Error ? error.stack : ""}`);
	try {
		new ztoolkit.ProgressWindow("Just Enough Color")
			.createLine({type: "error", text: `${context}: ${message}`})
			.show();
	} catch {
		// Progress window unavailable - ignore
	}
}
