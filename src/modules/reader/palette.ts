/**
 * The user's fixed palette (issue #1).
 *
 * The plugin's built-in groups (stock Zotero colors, strong / light / Morandi
 * presets) are generated in code and never change. The *fixed palette* is the
 * opposite: a small, user-owned set of colors that is persisted in Zotero
 * prefs and used by the quick swatch in the text-selection popup.
 *
 * Storage mirrors the "recent colors" list: a JSON array string in the
 * `extensions.zotero.jec.custom-palette` pref, e.g. `["#8ab380","#b3809e"]`.
 * The array order is the rotation order - the quick swatch takes the next
 * color of the palette on every click, wrapping around at the end.
 *
 * The palette is read on demand (never cached at module load) because the
 * user can edit it at any time from the settings pane or the color picker,
 * while Zotero keeps running.
 */

import {getPref, PREFS, setPref} from "../../utils/prefs";
import {normalizeColor} from "./common";

/** Upper bound on the palette size, so the picker stays readable. */
export const MAX_PALETTE = 24;

/**
 * The user's fixed palette, normalized to "#rrggbb" and de-duplicated.
 * Invalid entries are dropped; the stored order is preserved.
 */
export function getCustomPalette(): string[] {
	try {
		const raw = getPref(PREFS.CUSTOM_PALETTE);
		const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
		if (!Array.isArray(arr)) {
			return [];
		}
		return dedupe(arr);
	} catch {
		return [];
	}
}

/** Replace the palette with the given colors (normalized, de-duplicated). */
export function setCustomPalette(colors: string[]): void {
	setPref(PREFS.CUSTOM_PALETTE, JSON.stringify(dedupe(colors).slice(0, MAX_PALETTE)));
}

/**
 * Append a color to the palette.
 *
 * @returns true when the color was added, false when it is invalid, already
 *          present, or the palette is full.
 */
export function addPaletteColor(color: string): boolean {
	const c = normalizeColor(color);
	if (!c) {
		return false;
	}
	const palette = getCustomPalette();
	if (palette.includes(c)) {
		return false;
	}
	if (palette.length >= MAX_PALETTE) {
		return false;
	}
	palette.push(c);
	setCustomPalette(palette);
	return true;
}

/**
 * Remove a color from the palette.
 *
 * @returns true when the color was present and removed.
 */
export function removePaletteColor(color: string): boolean {
	const c = normalizeColor(color);
	if (!c) {
		return false;
	}
	const palette = getCustomPalette();
	const index = palette.indexOf(c);
	if (index < 0) {
		return false;
	}
	palette.splice(index, 1);
	setCustomPalette(palette);
	return true;
}

/**
 * Move a palette entry to another position (used to reorder the palette).
 * Out-of-range indices are ignored.
 */
export function movePaletteColor(from: number, to: number): void {
	const palette = getCustomPalette();
	if (
		from < 0 ||
		to < 0 ||
		from >= palette.length ||
		to >= palette.length ||
		from === to
	) {
		return;
	}
	const [color] = palette.splice(from, 1);
	palette.splice(to, 0, color);
	setCustomPalette(palette);
}

/**
 * The color handed out by the last `nextQuickColor()` call, used to continue
 * the rotation where the user left off.
 */
let lastQuickColor: string | null = null;

/**
 * The next color of the fixed palette, in rotation order.
 *
 * @returns the color, or null when the palette is empty - the caller then
 *          falls back to the random Morandi color.
 */
export function nextQuickColor(): string | null {
	const palette = getCustomPalette();
	if (!palette.length) {
		lastQuickColor = null;
		return null;
	}
	// Continue after the color used last; if the palette changed in between
	// (an entry was removed or added), start from the beginning.
	const index = lastQuickColor ? palette.indexOf(lastQuickColor) : -1;
	const next = palette[index + 1] ?? palette[0];
	lastQuickColor = next;
	return next;
}

/** Forget the rotation position (e.g. after the palette was cleared). */
export function resetQuickColorRotation(): void {
	lastQuickColor = null;
}

/** Normalize, drop invalid entries and remove duplicates (order kept). */
function dedupe(colors: unknown[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const entry of colors) {
		const c = normalizeColor(entry);
		if (c && !seen.has(c)) {
			seen.add(c);
			out.push(c);
		}
	}
	return out;
}
