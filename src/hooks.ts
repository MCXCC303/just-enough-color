import {registerSelectionEntry, unregisterSelectionEntry} from "./modules/reader/selection-entry";
import {registerAnnotationMenu, unregisterAnnotationMenu} from "./modules/reader/annotation-menu";
import {registerPrefsScripts} from "./modules/preferences/prefs-ui";
import {config} from "../package.json";

async function onStartup() {
	Zotero.debug("[JEC] onStartup begin");
	await Promise.all([
		Zotero.initializationPromise,
		Zotero.unlockPromise,
		Zotero.uiReadyPromise,
	]);

	// Register the preferences pane
	Zotero.PreferencePanes.register({
		pluginID: config.addonID,
		id: "jec-prefpane",
		src: rootURI + "content/preferences.xhtml",
		label: "Just Enough Color",
		image: `chrome://${config.addonRef}/content/icons/favicon.svg`,
	});
	Zotero.debug("[JEC] PreferencePanes registered");

	// Register reader event listeners (global, not per window)
	registerSelectionEntry();
	registerAnnotationMenu();

	addon.data.initialized = true;
}

async function onMainWindowLoad(_win: _ZoteroTypes.MainWindow): Promise<void> {
	// Nothing per-window yet
}

async function onMainWindowUnload(_win: _ZoteroTypes.MainWindow): Promise<void> {
	// Nothing per-window yet
}

async function onShutdown(): Promise<void> {
	unregisterSelectionEntry();
	unregisterAnnotationMenu();
	addon.data.alive = false;
	addon.data.initialized = false;
}

async function onAppShutdown(): Promise<void> {
	unregisterSelectionEntry();
	unregisterAnnotationMenu();
	addon.data.alive = false;
}

/**
 * Preference UI events dispatcher.
 * Called from preferences.xhtml onload:
 *   onload="Zotero.JustEnoughColor.hooks.onPrefsEvent('load', { window })"
 */
async function onPrefsEvent(
	type: string,
	data: { [key: string]: unknown },
): Promise<void> {
	Zotero.debug(`[JEC] onPrefsEvent: ${type}`);
	try {
		switch (type) {
			case "load":
				await registerPrefsScripts(data.window as Window);
				break;
			default:
				return;
		}
	} catch (error) {
		Zotero.logError(error as Error);
		try {
			(data.window as Window).alert(
				`Just Enough Color 设置初始化失败: ${(error as Error).message}`,
			);
		} catch {
			// Ignore alert failures
		}
	}
}

export default {
	onStartup,
	onMainWindowLoad,
	onMainWindowUnload,
	onShutdown,
	onAppShutdown,
	onPrefsEvent,
};
