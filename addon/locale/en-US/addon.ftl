# Just Enough Color — user-visible strings.
#
# Ids are written unprefixed here. During the build zotero-plugin-scaffold
# renames this file to `jec-addon.ftl` and prefixes every id with `jec-`;
# getString() in src/utils/locale.ts adds the same prefix when a message is
# looked up from JavaScript, and addon/content/preferences.xhtml pulls the file
# in through a <linkset> so Zotero can translate its data-l10n-id attributes.

addon-name = Just Enough Color

# Tooltip of the rainbow swatch in the text-selection popup (it creates an
# annotation with a random Morandi color)
selection-swatch-title = Highlight/underline with a random Morandi color

# Tooltip of the swatch when a fixed palette is configured (it creates an
# annotation with the next color of that palette)
selection-swatch-title-palette = Highlight/underline with the next color of your fixed palette

# Color picker overlay
picker-title = Just Enough Color Picker
picker-close = Close
picker-group-custom = My Palette
picker-palette-add = Add this color to the palette
picker-palette-remove = Remove from the palette
picker-group-zotero = Zotero Color
picker-group-strong = Strong Color
picker-group-light = Light Color
picker-group-morandi = Morandi Color
picker-group-recent = Recently Used
picker-open-system = Open the system color picker
picker-apply = Apply

# Shown in a progress window when an annotation could not be created
annotation-not-created = Annotation not created: the reader is read-only or the annotation could not be saved.

# Preferences pane
pref-intro = Use any color for highlights and underlines in the Zotero reader:
pref-palette-title = Fixed palette
pref-palette-empty = (none yet)
pref-palette-add = Add
pref-palette-clear = Clear
pref-palette-remove = Remove
pref-palette-move-up = Move earlier
pref-palette-move-down = Move later
pref-palette-added = Added to the palette.
pref-palette-cleared = The palette was cleared.
pref-palette-invalid = Invalid color - use a hex value like #8ab380.
pref-palette-duplicate = This color is already in the palette, or the palette is full.
pref-recent-title = Recently used custom colors
pref-recent-empty = (none yet)
pref-clear-recent = Clear recent colors

# Errors, shown in a progress window; $detail is the technical message
error-selection-popup = Could not add the color swatch to the selection popup: { $detail }
error-annotation-manager = The reader's annotation manager is unavailable: { $detail }
error-create-annotation = Could not create the annotation: { $detail }
error-annotation-menu = Could not add the context-menu entry: { $detail }
error-update-color = Could not change the annotation color: { $detail }
