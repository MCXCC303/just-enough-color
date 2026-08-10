/**
 * "Just-Enough-Color" entry in the selection popup's color palette.
 *
 * When text is selected the reader shows a popup with the 8 stock colors
 * (`renderTextSelectionPopup` event, CustomSections extension point). This
 * module appends a rainbow swatch right after those 8 colors; clicking it
 * picks a random color from the 20 Morandi presets and creates a
 * highlight/underline with it via the reader's own annotation manager (so
 * comments, tags, page labels, the annotation popup's color indicator and
 * right-click color switching all work exactly as for stock colors).
 */

import {
	cloneIntoFrame,
	type ReaderEvent,
	registerReaderListener,
	reportError,
	unregisterReaderListener
} from "./common";
import {buildMorandiPresets} from "./color-picker";

/**
 * The stock selection popup is capped at 198px (8 colors * 20px + gaps);
 * with the extra rainbow swatch it needs a bit more room.
 */
const POPUP_STYLE_ID = "jec-selection-popup-style";
const POPUP_STYLE = `
	.selection-popup { max-width: 232px !important; }
`;

const MORANDI_COLORS = buildMorandiPresets();
let lastRandomIndex = -1;

/** Pick a random Morandi color, avoiding the one used on the previous click. */
function pickRandomMorandi(): string {
	if (MORANDI_COLORS.length <= 1) {
		return MORANDI_COLORS[0];
	}
	let index = Math.floor(Math.random() * MORANDI_COLORS.length);
	if (index === lastRandomIndex) {
		index = (index + 1) % MORANDI_COLORS.length;
	}
	lastRandomIndex = index;
	return MORANDI_COLORS[index];
}

function ensurePopupStyle(doc: Document): void {
	if (doc.getElementById(POPUP_STYLE_ID)) {
		return;
	}
	const style = doc.createElement("style");
	style.id = POPUP_STYLE_ID;
	style.textContent = POPUP_STYLE;
	doc.head?.append(style);
}

function handleSelectionPopup(event: ReaderEvent): void {
	try {
		const {reader, doc, params, append} = event;
		if (!reader || !doc || !params?.annotation || !append) {
			return;
		}
		ensurePopupStyle(doc);

		const btn = doc.createElement("button");
		btn.className = "toolbar-button color-button";
		btn.title = "Just Enough Color";
		// Rainbow swatch sized like the native IconColor16 (16x16 rounded square
		// with a subtle stroke) centered in the 20x20 color-button, so it lines
		// up with the stock color buttons.
		const swatch = doc.createElement("span");
		swatch.style.cssText = [
			"width: 16px",
			"height: 16px",
			"border-radius: 2px",
			"background: conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
			"border: 1px solid rgba(0, 0, 0, 0.1)",
		].join("; ");
		btn.append(swatch);

		let clicked = false;
		btn.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (clicked) {
				return;
			}
			clicked = true;
			createAnnotationWithColor(reader, params.annotation, pickRandomMorandi());
		});

		append(btn);

		// Move the swatch into the colors row so it sits right after the 8
		// stock colors (the CustomSections node renders at the end of the popup).
		try {
			const colors = btn.closest(".selection-popup")?.querySelector(".colors");
			colors?.append(btn);
		} catch {
			// Popup may already be unmounted; the button keeps working anyway
		}
	} catch (e) {
		reportError("selection popup entry failed", e);
	}
}

/**
 * Create a highlight/underline annotation with an arbitrary color through
 * the reader's internal annotation manager (same pipeline as the native
 * color buttons: renders immediately, auto-saves with the item).
 */
function createAnnotationWithColor(reader: any, annotation: any, color: string): void {
	Zotero.debug(`[JEC] createAnnotationWithColor ${color}`);
	try {
		// The reader may have flipped to read-only since the swatch was clicked
		// (e.g. a failed save marks the reader read-only); bail out before
		// calling the annotation manager.
		if (reader._state?.readOnly) {
			Zotero.debug("[JEC] skipped: reader is read-only");
			return;
		}
		const internal = reader._internalReader;
		Zotero.debug(`[JEC] internalReader present: ${!!internal}, annotationManager present: ${!!internal?._annotationManager}`);
		if (!internal?._annotationManager) {
			reportError("annotationManager unavailable", new Error("_internalReader or _annotationManager missing"));
			return;
		}
		const type =
			reader._state?.textSelectionAnnotationMode === "underline"
				? "underline"
				: "highlight";
		Zotero.debug(`[JEC] annotation type: ${type}`);
		// Deep-clone to plain objects so the payload crosses the
		// chrome/content boundary cleanly (no Xray wrappers inside).
		const clone = JSON.parse(JSON.stringify(annotation));
		const payload = {
			...clone,
			type,
			color,
		};
		Zotero.debug(`[JEC] payload color: ${payload.color}, sortIndex: ${payload.sortIndex}, has position: ${!!payload.position}`);
		// Explicitly clone into the iframe realm: without this the content
		// side cannot read the payload's properties (Chrome Object Wrapper).
		const result = internal._annotationManager.addAnnotation(
			cloneIntoFrame(reader, payload),
		);
		if (result) {
			Zotero.debug(`[JEC] annotation added: ${result.id}, color: ${result.color}`);
		} else {
			// addAnnotation returns null (rather than throwing) when the
			// annotation manager is read-only - surface it instead of silently
			// dropping the annotation.
			Zotero.debug("[JEC] annotation not created (annotationManager returned null)");
			new ztoolkit.ProgressWindow("Just Enough Color")
				.createLine({type: "fail", text: "标注未创建:阅读器当前为只读或标注保存失败"})
				.show();
		}
		// Note: the selection and the popup are already cleared by the reader
		// itself when the swatch is clicked (same as the stock color buttons),
		// and the current tool (highlight/underline) is left untouched so the
		// user can keep annotating.
	} catch (e) {
		reportError("create annotation failed", e);
	}
}

export function registerSelectionEntry(): void {
	registerReaderListener("renderTextSelectionPopup", handleSelectionPopup);
	ztoolkit.log("[JEC] Selection popup entry registered");
}

export function unregisterSelectionEntry(): void {
	unregisterReaderListener("renderTextSelectionPopup", handleSelectionPopup);
}
