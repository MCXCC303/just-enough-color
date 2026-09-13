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

# Color picker overlay
picker-title = Just Enough Color Picker
picker-close = Close
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
pref-usage-selection = · Select text, then click the rainbow swatch at the end of the color palette to annotate with a random Morandi color;
pref-usage-menu = · Right-click an annotation and choose "Just Enough Color" to re-color it with any color;
pref-usage-check = · Annotations that use a custom color show a check mark (✔) on that menu item.
pref-recent-title = Recently used custom colors
pref-recent-empty = (none yet)
pref-clear-recent = Clear recent colors

# Errors, shown in a progress window; $detail is the technical message
error-selection-popup = Could not add the color swatch to the selection popup: { $detail }
error-annotation-manager = The reader's annotation manager is unavailable: { $detail }
error-create-annotation = Could not create the annotation: { $detail }
error-annotation-menu = Could not add the context-menu entry: { $detail }
error-update-color = Could not change the annotation color: { $detail }
