/**
 * The arbitrary-color picker overlay.
 *
 * A floating panel created inside the reader iframe document. It offers a
 * preset rainbow grid, the stock Zotero colors, recently used custom colors
 * and a native `<input type="color">` plus hex field for truly arbitrary
 * colors. Singleton - at most one picker exists at a time; it closes on
 * outside click, Escape or the close button.
 */

import {normalizeColor, STOCK_COLORS} from "./common";
import {getRecentColors, rememberColor} from "./prefs";

const PICKER_ID = "jec-color-picker";

/** The single open picker overlay (null when closed). */
let currentPicker: HTMLElement | null = null;
let currentCleanup: (() => void) | null = null;

export type ColorPickerOptions = {
	/** The reader iframe document to create the panel in. */
	doc: Document;
	/** Viewport coordinates to place the panel near (optional). */
	x?: number;
	y?: number;
	/** Currently selected color, shown as checked in the grid. */
	initialColor?: string | null;
	/** Called with the picked color (always a normalized "#rrggbb"). */
	onPick: (color: string) => void;
};

/** Convert hsl (h 0-360, s/l 0-100) to "#rrggbb". Pure math, no DOM. */
function hslToHex(h: number, s: number, l: number): string {
	s /= 100;
	l /= 100;
	const k = (n: number) => (n + h / 30) % 12;
	const a = s * Math.min(l, 1 - l);
	const f = (n: number) =>
		l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	const toHex = (x: number) =>
		Math.round(x * 255).toString(16).padStart(2, "0");
	return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/** Strong (saturated) rainbow presets - 10 hues at 100% saturation. */
function buildStrongPresets(): string[] {
	const colors: string[] = [];
	for (let h = 0; h < 360; h += 36) {
		colors.push(hslToHex(h, 100, 50));
	}
	return colors;
}

/** Light (pastel) rainbow presets - 10 hues at low saturation. */
function buildLightPresets(): string[] {
	const colors: string[] = [];
	for (let h = 0; h < 360; h += 36) {
		colors.push(hslToHex(h, 60, 78));
	}
	return colors;
}

/** Morandi (muted, grayish) presets - 20 hues at low saturation. */
function buildMorandiPresets(): string[] {
	const colors: string[] = [];
	for (let h = 0; h < 360; h += 18) {
		colors.push(hslToHex(h, 25, 60));
	}
	return colors;
}

export function openColorPicker(options: ColorPickerOptions): void {
	closeColorPicker();
	const {doc, onPick} = options;
	const win = doc.defaultView;
	if (!win) {
		return;
	}

	const root = doc.createElement("div");
	root.id = PICKER_ID;
	root.style.cssText = [
		"position: fixed",
		"z-index: 2147483647",
		"pointer-events: auto",
		"width: 260px",
		"background: var(--material-sidepane, #ffffff)",
		"color: var(--material-text, #000000)",
		"border: 1px solid var(--fill-quaternary, #c8c8c8)",
		"border-radius: 8px",
		"box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25)",
		"font-size: 13px",
		"user-select: none",
	].join("; ");

	// ---- Header: title + close ----
	const header = doc.createElement("div");
	header.style.cssText = [
		"display: flex",
		"align-items: center",
		"justify-content: space-between",
		"padding: 6px 10px",
		"border-bottom: 1px solid var(--fill-quaternary, #e0e0e0)",
		"font-weight: 600",
	].join("; ");
	const title = doc.createElement("span");
	title.textContent = "Just Enough Color Picker";
	const closeBtn = doc.createElement("button");
	closeBtn.textContent = "✕";
	closeBtn.title = "关闭";
	closeBtn.style.cssText = [
		"border: none",
		"background: none",
		"cursor: pointer",
		"font-size: 13px",
		"color: var(--material-text, #000)",
		"padding: 2px 6px",
		"border-radius: 4px",
	].join("; ");
	closeBtn.addEventListener("click", (e) => {
		e.stopPropagation();
		closeColorPicker();
	});
	header.append(title, closeBtn);
	root.append(header);

	const body = doc.createElement("div");
	body.style.cssText = [
		"padding: 10px",
		"display: flex",
		"flex-direction: column",
		"gap: 8px",
	].join("; ");
	root.append(body);

	// ---- Color groups with section labels ----
	// Each group is a small caption ("Zotero Color", "Strong Color", ...)
	// followed by its swatch row, so the palette reads at a glance.
	const makeGroup = (title: string): {row: HTMLElement} => {
		const group = doc.createElement("div");
		group.style.cssText = [
			"display: flex",
			"flex-direction: column",
			"gap: 4px",
		].join("; ");
		const label = doc.createElement("div");
		label.textContent = title;
		label.style.cssText = [
			"font-size: 11px",
			"color: var(--fill-secondary, #888)",
			"text-transform: uppercase",
			"letter-spacing: 0.4px",
		].join("; ");
		const row = doc.createElement("div");
		row.style.cssText = [
			"display: flex",
			"flex-wrap: wrap",
			"gap: 4px",
		].join("; ");
		group.append(label, row);
		body.append(group);
		return {row};
	};
	let checked: HTMLElement | null = null;
	const clearChecked = () => {
		if (checked) {
			checked.style.outline = "";
			checked = null;
		}
	};
	const setChecked = (swatch: HTMLElement) => {
		clearChecked();
		checked = swatch;
		swatch.style.outline = "2px solid var(--material-accent, #2ea8e5)";
		swatch.style.outlineOffset = "1px";
	};
	const makeSwatch = (color: string): HTMLElement => {
		const swatch = doc.createElement("button");
		swatch.style.cssText = [
			"width: 20px",
			"height: 20px",
			"border-radius: 4px",
			"border: 1px solid rgba(0, 0, 0, 0.2)",
			"cursor: pointer",
			"padding: 0",
		].join("; ");
		swatch.style.background = color;
		swatch.title = color;
		swatch.addEventListener("click", (e) => {
			e.stopPropagation();
			Zotero.debug(`[JEC] picker swatch clicked: ${color}`);
			closeColorPicker();
			rememberColor(color);
			onPick(color);
		});
		if (color === options.initialColor) {
			setChecked(swatch);
		}
		return swatch;
	};

	// 1) Zotero's stock 8 colors
	const zoteroGroup = makeGroup("Zotero Color");
	for (const color of STOCK_COLORS) {
		zoteroGroup.row.append(makeSwatch(color));
	}

	// 2) Strong saturated hues
	const strongGroup = makeGroup("Strong Color");
	for (const color of buildStrongPresets()) {
		strongGroup.row.append(makeSwatch(color));
	}

	// 3) Light pastel hues
	const lightGroup = makeGroup("Light Color");
	for (const color of buildLightPresets()) {
		lightGroup.row.append(makeSwatch(color));
	}

	// 4) Morandi muted hues
	const morandiGroup = makeGroup("Morandi Color");
	for (const color of buildMorandiPresets()) {
		morandiGroup.row.append(makeSwatch(color));
	}

	// 5) Recently used custom colors
	const recent = getRecentColors().filter(c => normalizeColor(c));
	if (recent.length) {
		const recentGroup = makeGroup("Recently Used");
		for (const color of recent) {
			recentGroup.row.append(makeSwatch(color));
		}
	}

	// ---- Arbitrary color: native picker + hex input ----
	const customRow = doc.createElement("div");
	customRow.style.cssText = [
		"display: flex",
		"align-items: center",
		"gap: 6px",
		"border-top: 1px solid var(--fill-quaternary, #e0e0e0)",
		"padding-top: 8px",
	].join("; ");
	const colorInput = doc.createElement("input");
	colorInput.type = "color";
	colorInput.value = options.initialColor || "#ff0000";
	colorInput.title = "打开系统取色器";
	colorInput.style.cssText = [
		"width: 36px",
		"height: 24px",
		"border: none",
		"padding: 0",
		"cursor: pointer",
		"background: none",
	].join("; ");
	const hexInput = doc.createElement("input");
	hexInput.type = "text";
	hexInput.placeholder = "#rrggbb";
	hexInput.value = options.initialColor || "";
	hexInput.spellcheck = false;
	hexInput.style.cssText = [
		"flex: 1",
		"min-width: 0",
		"padding: 3px 6px",
		"border: 1px solid var(--fill-quaternary, #c8c8c8)",
		"border-radius: 4px",
		"background: var(--fill-secondary, #f9f9f9)",
		"color: var(--material-text, #000)",
		"font-family: monospace",
	].join("; ");
	const applyBtn = doc.createElement("button");
	applyBtn.textContent = "应用";
	applyBtn.style.cssText = [
		"padding: 3px 10px",
		"border: none",
		"border-radius: 4px",
		"cursor: pointer",
		"background: var(--material-accent, #2ea8e5)",
		"color: white",
	].join("; ");
	// Live-preview the input color in a small swatch next to the hex field
	const previewSwatch = doc.createElement("div");
	previewSwatch.style.cssText = [
		"width: 20px",
		"height: 20px",
		"border-radius: 4px",
		"border: 1px solid rgba(0, 0, 0, 0.2)",
		"flex-shrink: 0",
	].join("; ");
	previewSwatch.style.background = options.initialColor || "#ff0000";
	const syncFromColorInput = () => {
		const color = normalizeColor(colorInput.value);
		if (!color) {
			return;
		}
		hexInput.value = color;
		previewSwatch.style.background = color;
	};
	colorInput.addEventListener("input", () => {
		syncFromColorInput();
		clearChecked();
	});
	hexInput.addEventListener("input", () => {
		const color = normalizeColor(hexInput.value);
		if (color) {
			previewSwatch.style.background = color;
			colorInput.value = color;
			clearChecked();
		}
	});
	const pick = () => {
		const color = normalizeColor(hexInput.value) || normalizeColor(colorInput.value);
		if (!color) {
			Zotero.debug(`[JEC] pick ignored, invalid color: "${hexInput.value}"`);
			return;
		}
		Zotero.debug(`[JEC] picker pick: ${color}`);
		closeColorPicker();
		rememberColor(color);
		onPick(color);
	};
	applyBtn.addEventListener("click", (e) => {
		e.stopPropagation();
		pick();
	});
	hexInput.addEventListener("keydown", (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			e.stopPropagation();
			pick();
		}
	});
	customRow.append(colorInput, previewSwatch, hexInput, applyBtn);
	body.append(customRow);

	// ---- Placement ----
	if (!doc.body) {
		closeColorPicker();
		return;
	}
	doc.body.append(root);
	// Position after append so we can measure
	const margin = 8;
	let left = (options.x ?? 0) + margin;
	let top = (options.y ?? 0) + margin;
	const rect = root.getBoundingClientRect();
	if (left + rect.width > win.innerWidth) {
		left = Math.max(margin, win.innerWidth - rect.width - margin);
	}
	if (top + rect.height > win.innerHeight) {
		top = Math.max(margin, win.innerHeight - rect.height - margin);
	}
	root.style.left = left + "px";
	root.style.top = top + "px";

	// ---- Outside click / Escape dismissal ----
	const onMouseDown = (event: MouseEvent) => {
		if (!root.contains(event.target as Node)) {
			closeColorPicker();
		}
	};
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === "Escape") {
			event.stopPropagation();
			closeColorPicker();
		}
	};
	win.addEventListener("mousedown", onMouseDown, true);
	win.addEventListener("keydown", onKeyDown as EventListener, true);

	currentPicker = root;
	currentCleanup = () => {
		win.removeEventListener("mousedown", onMouseDown, true);
		win.removeEventListener("keydown", onKeyDown, true);
	};
}

export function closeColorPicker(): void {
	if (currentCleanup) {
		currentCleanup();
		currentCleanup = null;
	}
	if (currentPicker) {
		currentPicker.remove();
		currentPicker = null;
	}
}
