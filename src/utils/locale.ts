/**
 * Fluent-based localization for the plugin's own strings.
 *
 * Zotero registers every `<plugin root>/locale/<locale>/*.ftl` file as an
 * in-memory L10nFileSource *before* running the plugin bootstrap's `startup`
 * (see registerLocales() in Zotero's xpcom/plugins.js), falling back to the
 * plugin locale closest to the Zotero UI locale (exact -> same language ->
 * en-US). A resource id such as `jec-addon.ftl` therefore resolves for every
 * Zotero locale.
 *
 * Two consumers share the same FTL file:
 *   - JavaScript (reader UI, progress windows): getString() below, backed by a
 *     plugin-private Localization instance.
 *   - XHTML (addon/content/preferences.xhtml): `data-l10n-id` attributes,
 *     translated by Zotero when it loads the preference pane.
 *
 * Message ids are written unprefixed in the FTL sources; the build renames the
 * file to `jec-addon.ftl` and prefixes every id with the addon ref, which is
 * why getString() namespaces the id before looking it up.
 */

import {config} from "../../package.json";
import type {FluentMessageId} from "../../typings/i10n";

/** Variables referenced from a message as `{ $name }`. */
type FluentArgs = Record<string, string | number | null>;

/** Resource id of the FTL file shipped as `addon/locale/<locale>/addon.ftl`. */
const FTL_RESOURCE = `${config.addonRef}-addon.ftl`;

/**
 * Initialize the plugin's Fluent bundle. Call once from onStartup; plugin FTL
 * files are registered before the bootstrap `startup` method runs, so the
 * resource is already available here.
 */
export function initLocale(): void {
	// Zotero 10 injects `Localization` into the plugin sandbox; older versions
	// do not, so fall back to the chrome window global.
	const LocalizationCtor = (
		typeof Localization !== "undefined"
			? Localization
			: ztoolkit.getGlobal("Localization")
	) as typeof Localization;
	addon.data.locale = {
		current: new LocalizationCtor([FTL_RESOURCE], true),
	};
	Zotero.debug(`[JEC] locale initialized: ${Zotero.locale}`);
}

/** The Fluent id (plugin-namespaced) of a message written in the FTL source. */
function localeID(id: FluentMessageId): string {
	return `${config.addonRef}-${id}`;
}

/**
 * Look up a localized string.
 *
 * @param id Message id as written in `addon/locale/<locale>/addon.ftl`; the
 *           plugin namespace is added automatically.
 * @param options.args Variables for messages containing `{ $name }`.
 * @returns The localized string, or the namespaced id when the message is
 *          missing, so a broken lookup is visible instead of silent.
 */
export function getString(
	id: FluentMessageId,
	options: {args?: FluentArgs} = {},
): string {
	const fullID = localeID(id);
	const message = addon.data.locale?.current.formatMessagesSync([
		{id: fullID, args: options.args},
	])[0];
	if (!message) {
		Zotero.debug(`[JEC] missing Fluent message: ${fullID}`);
		return fullID;
	}
	return message.value ?? fullID;
}
