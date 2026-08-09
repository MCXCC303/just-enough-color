<h1 align="center">Just Enough Color</h1>
<p align="center">
  <b>Colorful highlights & underlines in Zotero</b>
</p>
<p align="center">
  <img src="images/just-enough-color.png" width="720">
</p>
<p align="center">
  <img src="https://img.shields.io/github/v/release/MCXCC303/just-enough-color">
  <img src="https://img.shields.io/badge/Zotero-7.0+-%23CC2936">
  <img src="https://img.shields.io/badge/LICENSE-AGPL--3.0-black">
</p>

---

More color in Zotero reader annotations!

## Installation

1. Build the plugin: `npm install && npm run build`
2. In Zotero: `Tools -> Add-ons -> ⚙️ -> Install Add-on From File…`, choose `build/just-enough-color.xpi`
3. Restart Zotero

> Plugin now available on the [Zotero Chinese plugin store](https://zotero-chinese.com/plugins/) - search "Just Enough
> Color" to install.

## Usage

1. Select text in the reader, select rainbow swatch to pick any color to highlight/underline with.
2. Right-click an existing annotation and choose `Just Enough Color` to re-color it with any color.

## Default Colors

| Type                | Colors                                                                                                                                                                                                                         |
|---------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Zotero Origin Color | `["#ffd400", "#ff6666", "#5fb236", "#2ea8e5", "#a28ae5", "#e56eee", "#f19837", "#aaaaaa"]`                                                                                                                                     |
| Strong Color        | `["#FF0000", "#FF9900", "#CCFF00", "#33FF00", "#00FF66", "#00FFFF", "#0066FF", "#3300FF", "#CC00FF", "#FF0099"]`                                                                                                               |
| Light Color         | `["#E9A5A5", "#E9CEA5", "#DBE9A5", "#B3E9A5", "#A5E9C0", "#A5E9E9", "#A5C0E9", "#B3A5E9", "#DBA5E9", "#E9A5CE"]`                                                                                                               |
| Morandi Color       | `["#B28080", "#B28F80", "#B29E80", "#B2AD80", "#A8B280", "#99B280", "#8AB280", "#80B285", "#80B294", "#80B2A3", "#80B2B2", "#80A3B2", "#8094B2", "#8085B2", "#8A80B2", "#9980B2", "#A880B2", "#B280AD", "#B2809E", "#B2808F"]` |

## Features

- Custom-colored annotations behave exactly like stock ones: comments, tags, page labels and right-click color switching
  all work
    - This also works with other click-on translate plugins
- Recently used custom colors are persisted and can be viewed / cleared in the settings pane

## License

AGPL-3.0-or-later · Copyright © 2026 MCXCC303
