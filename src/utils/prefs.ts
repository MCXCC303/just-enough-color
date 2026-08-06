import {config} from "../../package.json";

const PREFS_PREFIX = config.prefsPrefix;

/** Preference keys used by the plugin. */
export const PREFS = {
	/** JSON array of recently used custom colors, e.g. ["#ff00aa"]. */
	RECENT_COLORS: "recent-colors",
} as const;

export type PrefKey = (typeof PREFS)[keyof typeof PREFS];

/** Get a plugin preference value (global, `extensions.zotero.jec.*`). */
export function getPref(key: PrefKey): unknown {
	return Zotero.Prefs.get(`${PREFS_PREFIX}.${key}`, true);
}

/** Set a plugin preference value. */
export function setPref(key: PrefKey, value: string | number | boolean): void {
	Zotero.Prefs.set(`${PREFS_PREFIX}.${key}`, value, true);
}
