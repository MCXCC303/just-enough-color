/**
 * Recently used custom colors, persisted in Zotero prefs.
 */

import {getPref, PREFS, setPref} from "../../utils/prefs";
import {normalizeColor} from "./common";

const MAX_RECENT = 10;

/** Recently used custom colors (normalized "#rrggbb"), most recent first. */
export function getRecentColors(): string[] {
	try {
		const raw = getPref(PREFS.RECENT_COLORS);
		const arr = typeof raw === "string" ? JSON.parse(raw) : [];
		if (!Array.isArray(arr)) {
			return [];
		}
		return arr.filter((c): c is string => !!normalizeColor(c));
	} catch {
		return [];
	}
}

/** Record a picked color at the front of the recent list. */
export function rememberColor(color: string): void {
	const c = normalizeColor(color);
	if (!c) {
		return;
	}
	const recent = getRecentColors().filter(x => x !== c);
	recent.unshift(c);
	setPref(PREFS.RECENT_COLORS, JSON.stringify(recent.slice(0, MAX_RECENT)));
}
