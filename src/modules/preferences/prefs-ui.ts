/**
 * Preferences pane: the fixed-palette editor and the recently used custom
 * colors with a clear button. The pane skeleton lives in
 * addon/content/preferences.xhtml and calls
 * Zotero.JustEnoughColor.hooks.onPrefsEvent('load', { window }) on load.
 */

import {getRecentColors} from "../reader/prefs";
import {
	addPaletteColor,
	getCustomPalette,
	movePaletteColor,
	removePaletteColor,
	resetQuickColorRotation,
	setCustomPalette,
} from "../reader/palette";
import {normalizeColor} from "../reader/common";
import {PREFS, setPref} from "../../utils/prefs";
import {getString} from "../../utils/locale";

let win: Window | null = null;
let doc: Document | null = null;

/** The pane is a XUL document, so HTML elements are created explicitly. */
const XHTML_NS = "http://www.w3.org/1999/xhtml";

/** Create an HTML element in the preferences pane. */
function h<K extends keyof HTMLElementTagNameMap>(
	tag: K,
): HTMLElementTagNameMap[K] {
	return doc!.createElementNS(XHTML_NS, tag) as HTMLElementTagNameMap[K];
}

/** Set the visible text of a button (XUL buttons use `label`). */
function setButtonText(btn: Element | null, text: string): void {
	if (!btn) {
		return;
	}
	const anyBtn = btn as any;
	if (typeof anyBtn.label === "string") {
		anyBtn.label = text;
	} else {
		anyBtn.textContent = text;
	}
}

/** Show a short status message under the palette editor. */
function setPaletteStatus(text: string): void {
	const status = doc?.getElementById("jec-palette-status");
	if (status) {
		status.textContent = text;
	}
}

export async function registerPrefsScripts(window: Window): Promise<void> {
	win = window;
	doc = window.document;

	renderRecentColors();
	const clearBtn = doc?.getElementById("jec-btn-clear-recent");
	clearBtn?.addEventListener("click", () => {
		setPref(PREFS.RECENT_COLORS, "[]");
		renderRecentColors();
	});

	// ---- Fixed palette editor ----
	const addBtn = doc?.getElementById("jec-palette-add");
	setButtonText(addBtn, getString("pref-palette-add"));
	addBtn?.addEventListener("click", onAddPaletteColor);

	const clearPaletteBtn = doc?.getElementById("jec-palette-clear");
	setButtonText(clearPaletteBtn, getString("pref-palette-clear"));
	clearPaletteBtn?.addEventListener("click", () => {
		setCustomPalette([]);
		resetQuickColorRotation();
		renderPalette();
		setPaletteStatus(getString("pref-palette-cleared"));
	});

	// The hex field and the system color input mirror each other.
	const colorInput = doc?.getElementById("jec-palette-color") as
		| HTMLInputElement
		| null;
	const hexInput = doc?.getElementById("jec-palette-hex") as
		| HTMLInputElement
		| null;
	hexInput?.addEventListener("input", () => {
		const color = normalizeColor(hexInput.value);
		if (color && colorInput) {
			colorInput.value = color;
		}
	});
	// Enter in the hex field adds the color, like the "Add" button.
	hexInput?.addEventListener("keydown", (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			onAddPaletteColor();
		}
	});
	colorInput?.addEventListener("input", () => {
		if (hexInput) {
			hexInput.value = colorInput.value;
		}
	});

	renderPalette();

	window.addEventListener(
		"unload",
		() => {
			if (win === window) {
				win = null;
				doc = null;
			}
		},
		{once: true},
	);
}

/** Add the color entered in the palette editor to the fixed palette. */
function onAddPaletteColor(): void {
	const colorInput = doc?.getElementById("jec-palette-color") as
		| HTMLInputElement
		| null;
	const hexInput = doc?.getElementById("jec-palette-hex") as
		| HTMLInputElement
		| null;
	const raw = (hexInput?.value ?? "").trim() || colorInput?.value || "";
	const color = normalizeColor(raw);
	if (!color) {
		setPaletteStatus(getString("pref-palette-invalid"));
		return;
	}
	if (!addPaletteColor(color)) {
		setPaletteStatus(getString("pref-palette-duplicate"));
		return;
	}
	if (hexInput) {
		hexInput.value = "";
	}
	setPaletteStatus(getString("pref-palette-added"));
	renderPalette();
}

/** Render the fixed palette as a list of removable, reorderable entries. */
function renderPalette(): void {
	const d = doc;
	const container = d?.getElementById("jec-palette-colors");
	if (!container || !d) {
		return;
	}
	container.replaceChildren();
	const palette = getCustomPalette();
	if (!palette.length) {
		container.append(getString("pref-palette-empty"));
		return;
	}
	palette.forEach((color, index) => {
		const entry = h("div");
		entry.style.cssText = [
			"display: inline-flex",
			"align-items: center",
			"gap: 6px",
			"margin: 0 8px 8px 0",
			"padding: 3px 6px 3px 3px",
			"border: 1px solid var(--fill-quaternary, #ccc)",
			"border-radius: 6px",
			"font-family: monospace",
			"font-size: 12px",
		].join("; ");
		const box = h("span");
		box.style.cssText = [
			"width: 16px",
			"height: 16px",
			"border-radius: 4px",
			`background: ${color}`,
			"border: 1px solid rgba(0,0,0,.2)",
		].join("; ");
		const label = h("span");
		label.textContent = color;

		const moveLeft = h("button");
		moveLeft.textContent = "◀";
		moveLeft.title = getString("pref-palette-move-up");
		moveLeft.style.cssText = MINI_BUTTON_STYLE;
		moveLeft.disabled = index === 0;
		moveLeft.addEventListener("click", () => {
			movePaletteColor(index, index - 1);
			renderPalette();
		});

		const moveRight = h("button");
		moveRight.textContent = "▶";
		moveRight.title = getString("pref-palette-move-down");
		moveRight.style.cssText = MINI_BUTTON_STYLE;
		moveRight.disabled = index === palette.length - 1;
		moveRight.addEventListener("click", () => {
			movePaletteColor(index, index + 1);
			renderPalette();
		});

		const remove = h("button");
		remove.textContent = "✕";
		remove.title = getString("pref-palette-remove");
		remove.style.cssText = MINI_BUTTON_STYLE;
		remove.addEventListener("click", () => {
			removePaletteColor(color);
			renderPalette();
		});

		entry.append(box, label, moveLeft, moveRight, remove);
		container.append(entry);
	});
}

/** Compact style of the small entry buttons. */
const MINI_BUTTON_STYLE = [
	"min-width: 18px",
	"height: 18px",
	"padding: 0 3px",
	"font-size: 10px",
	"line-height: 1",
	"border: 1px solid var(--fill-quaternary, #ccc)",
	"border-radius: 4px",
	"background: none",
	"color: inherit",
	"cursor: pointer",
].join("; ");

function renderRecentColors(): void {
	const d = doc;
	const container = d?.getElementById("jec-recent-colors");
	if (!container || !d) {
		return;
	}
	container.replaceChildren();
	const recent = getRecentColors();
	if (!recent.length) {
		container.append(getString("pref-recent-empty"));
		return;
	}
	for (const color of recent) {
		const swatch = d.createElement("div");
		swatch.style.cssText = [
			"display: inline-flex",
			"align-items: center",
			"gap: 6px",
			"margin: 0 8px 8px 0",
			"padding: 3px 8px 3px 3px",
			"border: 1px solid var(--fill-quaternary, #ccc)",
			"border-radius: 6px",
			"font-family: monospace",
			"font-size: 12px",
		].join("; ");
		const box = d.createElement("span");
		box.style.cssText = [
			"width: 16px",
			"height: 16px",
			"border-radius: 4px",
			`background: ${color}`,
			"border: 1px solid rgba(0,0,0,.2)",
		].join("; ");
		const label = d.createElement("span");
		label.textContent = color;
		swatch.append(box, label);
		container.append(swatch);
	}
}
