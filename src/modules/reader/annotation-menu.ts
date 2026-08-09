/**
 * Context-menu entries on annotations.
 *
 * Right-clicking a highlighted/underlined annotation opens
 * `createAnnotationContextMenu`. This module adds a single
 * "Just-Enough-Color" item (always shown): its color swatch matches the
 * annotation's current color, it is marked as checked (like the stock color
 * items) when the annotation already has a custom color, and clicking it
 * opens the arbitrary-color picker. Re-coloring goes through the reader's
 * own annotation manager, so the change is immediately reflected everywhere
 * (page rendering, sidebar, annotation popup).
 */

import {
	cloneIntoFrame,
	isCustomColor,
	normalizeColor,
	type ReaderEvent,
	registerReaderListener,
	reportError,
	unregisterReaderListener
} from "./common";
import {openColorPicker} from "./color-picker";

function handleAnnotationContextMenu(event: ReaderEvent): void {
	try {
		const {reader, params, append} = event;
		if (!reader || !params?.ids?.length || !append) {
			return;
		}

		// Current color of the selected annotation(s): only defined for a single
		// annotation, so multi-selection gets no swatch (like the stock menu).
		let currentColor: string | null = null;
		let isCustom = false;
		let readOnly = false;
		try {
			const annotations = (reader._state?.annotations || []).filter(
				(a: any) => params.ids!.includes(a.id),
			);
			if (annotations.length === 1) {
				currentColor = normalizeColor(annotations[0].color);
				isCustom = isCustomColor(annotations[0].color);
			}
			// Mirror the stock menu: any selected annotation being read-only
			// (e.g. others' annotations in a group library) disables the item.
			readOnly = annotations.some((a: any) => a.readOnly);
		} catch {
			// Reader state inaccessible; fall through with no swatch
		}

		// The picker needs the reader iframe document; obtain it lazily on click
		// (the menu is closed by then, but the doc reference stays valid).
		const openPickerForAnnotations = (x?: number, y?: number) => {
			const doc = reader._iframeWindow?.document;
			if (!doc) {
				return;
			}
			openColorPicker({
				doc,
				x,
				y,
				initialColor: currentColor,
				onPick: (color) => {
					Zotero.debug(`[JEC] re-color annotations ${params.ids?.join(",")} -> ${color}`);
					try {
						const internal = reader._internalReader;
						if (!internal?._annotationManager) {
							reportError("annotationManager unavailable", new Error("_internalReader or _annotationManager missing"));
							return;
						}
						// Explicitly clone into the iframe realm (see cloneIntoFrame).
						internal._annotationManager.updateAnnotations(
							cloneIntoFrame(reader, params.ids!.map(id => ({id, color}))),
						);
						Zotero.debug("[JEC] annotation colors updated");
					} catch (e) {
						reportError("update annotation colors failed", e);
					}
				},
			});
		};

		// Just-Enough-Color item - always shown; swatch = annotation color.
		// Marked as checked when the annotation already uses a custom color
		// (like the stock color items): the native menu draws the check mark
		// itself. Clicking the item opens the picker, so no separate palette
		// item is needed.
		append({
			label: "Just Enough Color",
			color: currentColor ?? undefined,
			checked: isCustom,
			disabled: reader._state?.readOnly || readOnly,
			persistent: true,
			onCommand: () => openPickerForAnnotations(params.x, params.y),
		});
	} catch (e) {
		reportError("annotation context menu failed", e);
	}
}

export function registerAnnotationMenu(): void {
	registerReaderListener("createAnnotationContextMenu", handleAnnotationContextMenu);
	ztoolkit.log("[JEC] Annotation context menu registered");
}

export function unregisterAnnotationMenu(): void {
	unregisterReaderListener("createAnnotationContextMenu", handleAnnotationContextMenu);
}
