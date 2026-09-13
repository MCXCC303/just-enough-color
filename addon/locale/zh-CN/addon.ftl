# Just Enough Color — 用户可见文案。
#
# 此处的消息 id 不带前缀。构建时 zotero-plugin-scaffold 会把本文件重命名为
# `jec-addon.ftl`，并给每个 id 加上 `jec-` 前缀；src/utils/locale.ts 中的
# getString() 在查找时会补上同样的前缀，addon/content/preferences.xhtml 则
# 通过 <linkset> 引入该文件，由 Zotero 翻译其中的 data-l10n-id 属性。

addon-name = Just Enough Color

# 选区弹窗中彩色方块的提示文字（用随机莫兰迪色创建标注）
selection-swatch-title = 用随机莫兰迪色创建高亮 / 下划线

# 取色器浮层
picker-title = Just Enough Color 取色器
picker-close = 关闭
picker-group-zotero = Zotero 原生色
picker-group-strong = 鲜艳色
picker-group-light = 浅彩色
picker-group-morandi = 莫兰迪色
picker-group-recent = 最近使用
picker-open-system = 打开系统取色器
picker-apply = 应用

# 标注创建失败时的提示窗口
annotation-not-created = 标注未创建：阅读器当前为只读，或标注保存失败。

# 设置面板
pref-intro = 在 Zotero Reader 中为高亮 / 下划线标注使用任意颜色：
pref-usage-selection = · 选中文本后，点击调色板末尾的彩色方块，即用随机莫兰迪色创建标注；
pref-usage-menu = · 右键点击标注，在 "Just Enough Color" 菜单中可重新选择任意颜色；
pref-usage-check = · 使用自定义颜色的标注，该菜单条目会带选中标记（✔）。
pref-recent-title = 最近使用的自定义颜色
pref-recent-empty = （暂无）
pref-clear-recent = 清空最近颜色

# 错误提示（显示在进度窗口中；$detail 为技术细节）
error-selection-popup = 无法把彩色方块加入选区弹窗：{ $detail }
error-annotation-manager = 阅读器的标注管理器不可用：{ $detail }
error-create-annotation = 无法创建标注：{ $detail }
error-annotation-menu = 无法添加右键菜单项：{ $detail }
error-update-color = 无法修改标注颜色：{ $detail }
