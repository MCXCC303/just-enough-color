# Just Enough Color

在 Zotero Reader 中为高亮 / 下划线标注使用任意颜色。

## 功能

- 选中文本后，8 色调色板末尾会出现一个彩色方块，点击可打开任意颜色选择器（彩虹预设、Zotero 8 色、最近使用、原生取色器、hex 输入）
- 自定义颜色的标注与普通标注表现完全一致：可添加评论、标签，显示页码，右键切换为任意其他颜色
- 右键点击标注，菜单中的 `just-enough-color` 条目始终可用（色块显示标注当前颜色）；标注已是自定义颜色时该条目带 ✔ 选中标记
- 最近使用的自定义颜色会记录，可在设置面板查看 / 清空

## 开发

```bash
npm install        # 安装依赖
npm run typecheck  # TypeScript 类型检查
npm run build      # 构建插件到 build/just-enough-color.xpi
npm start          # 启动 Zotero 调试（需设置 ZOTERO_PLUGIN_ZOTERO_BIN_PATH）
```

### 目录结构

```
addon/                     # 插件静态资源（manifest、bootstrap、设置面板）
src/
├── index.ts / addon.ts    # 入口与插件实例
├── hooks.ts               # 生命周期钩子
├── modules/
│   ├── reader/            # Reader 集成
│   │   ├── common.ts      # 事件注册、颜色工具、跨边界克隆、错误报告
│   │   ├── selection-entry.ts  # 调色板彩色方块入口（renderTextSelectionPopup）
│   │   ├── annotation-menu.ts  # 标注右键菜单条目（createAnnotationContextMenu）
│   │   ├── color-picker.ts     # 任意颜色选择器浮层
│   │   └── prefs.ts            # 最近使用颜色持久化
│   └── preferences/       # 设置面板逻辑
└── utils/                 # 工具（prefs、ztoolkit）
```

## 实现原理

Zotero 标注的 `color` 字段是任意字符串，reader 渲染、弹窗、侧边栏均直接使用该值，因此自定义颜色可直接走原生标注管线（`_annotationManager.addAnnotation / updateAnnotations`），无需改动 reader 内部逻辑。插件通过官方扩展点 `Zotero.Reader.registerEventListener` 注入 UI：

- `renderTextSelectionPopup` —— 在选中文本弹窗的调色板中追加彩色方块入口
- `createAnnotationContextMenu` —— 在标注右键菜单中添加 just-enough-color 条目

跨 chrome/content 边界调用 iframe 内部方法时，参数需用 `Components.utils.cloneInto` 显式克隆（见 `common.ts::cloneIntoFrame`），否则 content 侧无法读取参数属性（Chrome Object Wrapper 限制）。

## 许可证

AGPL-3.0-or-later
