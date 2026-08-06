/**
 * Preferences pane: shows the recently used custom colors and a clear
 * button. The pane skeleton lives in addon/content/preferences.xhtml and
 * calls Zotero.JustEnoughColor.hooks.onPrefsEvent('load', { window }) on
 * load.
 */

import {getRecentColors} from "../reader/prefs";
import {PREFS, setPref} from "../../utils/prefs";

let win: Window | null = null;
let doc: Document | null = null;

export async function registerPrefsScripts(window: Window): Promise<void> {
	win = window;
	doc = window.document;

	renderRecentColors();
	const clearBtn = doc?.getElementById("jec-btn-clear-recent");
	clearBtn?.addEventListener("click", () => {
		setPref(PREFS.RECENT_COLORS, "[]");
		renderRecentColors();
	});

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

function renderRecentColors(): void {
	const d = doc;
	const container = d?.getElementById("jec-recent-colors");
	if (!container || !d) {
		return;
	}
	container.replaceChildren();
	const recent = getRecentColors();
	if (!recent.length) {
		container.append("（暂无）");
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
