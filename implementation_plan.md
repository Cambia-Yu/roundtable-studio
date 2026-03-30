# Roundtable Web UI：极致视效与极简架构重构计划 (The "Linear/Claude" Aesthetic)

非常感谢您的直白反馈和截图，我完全理解了您对“前端设计艺术”的诉求。
之前的样貌过度使用了粗糙的毛玻璃和渐变色，导致界面像一个廉价的仪表盘（Dashboard），而不是一个沉浸式、极简的高端 AI 工具。事实证明，脱离框架（React等）绝不是设计丑陋的借口。我们完全可以用 Vanilla CSS 还原顶级 SaaS 产品（如 Claude 自身、ChatGPT、Linear）的极致审美。

为了达到您可以拿去作为商业级产品的水平，我为您准备了彻头彻尾的 UI/UX 重绘方案。我们将**抛弃所有花哨但低廉的霓虹特效**，转而采用世界上最顶级的极简暗黑设计语言 (Minimalist Premium Dark Mode)。

## User Review Required

> [!WARNING]
> 一切以“高级感”和“专注内容”为核心。以下是我规划的对标 `Claude 3 Web 端 / Linear` 的纯 CSS 原生实现方案。
> 请确认以下对标风格是否是您想要的终极形态：

### 关键审美基准 (Design Benchmarks)
1. **纯粹的暗色调 (Pure Neutral Dark)**:
   - 抛离紫/蓝底色。背景将采用深邃的 `#09090B` (Zinc-950) 或 `#000000`。
   - 侧边栏为极暗灰 `#18181B`，实现极简的层级分割，无需阴影或宽边框。
   - 所有边框变为 `#27272A` (极细的 1px 亮线)。
2. **极简排版 (Refined Typography)**:
   - 字体全面缩小且变得紧凑，正文为 `14px / 15px`，`line-height: 1.6`。辅助文字为 `12px` 且颜色弱化为深灰色 `#A1A1AA`。
   - 不再有喧宾夺主的巨大标题。
3. **去拟物化的大区块 (Flatten the Chunks)**:
   - 删掉侧边栏那个巨大且毫无意义的粉蓝渐变“新建”按钮！替换为细长、优雅的 `+ New Chat` 轮廓线或极薄的灰色按钮。
   - 聊天气泡（Bubbles）去掉厚重的黑背景和圆角，回归 Claude/GPT 式的**无边框平铺文本排版**。发送者头像贴左，对话内容靠右延展。
4. **精细的输入框 (Elegant Floating Input)**:
   - 聊天输入区域改为悬浮在主屏幕底端中部的内联自适应框 (类似 Claude)，而非横跨整个底部的巨大黑色色块。加上轻微的悬浮阴影（Dropshadow）。
5. **右侧辅助区收缩 (Subtle Tools Panel)**:
   - 将右侧的拓扑图面板边框弱化，颜色统一。让连线和发光点成为唯一的视觉焦点，背景纯黑。

## Proposed Changes

---

### [Component: CSS Design System]

#### [MODIFY] [styles.css](file:///d:/Develop/claudecode/ljg-%E5%9C%86%E6%A1%8C/public/styles.css)
- 彻底摧毁现有文件内容。
- 定义全新的 Design Tokens：引入以 Neutral / Zinc 系为主的黑灰色调。
- 重置 Flex 布局排版，令中央聊天区域强制最大宽度（例如 `max-width: 800px; margin: 0 auto;`），其余空间留白。
- 重写聊天流（`.msg`, `.bubble`, `.av`），实现扁平、优雅的垂直流列表布局。
- 移除复杂的动画，只保留极为克制的 `FadeIn` 与 `transform` 动画。

### [Component: HTML DOM Structure]

#### [MODIFY] [index.html](file:///d:/Develop/claudecode/ljg-%E5%9C%86%E6%A1%8C/public/index.html)
- 调整 Navbar 和 Sidebar DOM 结构，剔除多余的 Wrappers 和装饰性元素（如 ambient, grid-overlay）。
- 重新编排图标，使用极简的 SVG Icon（直接硬编码进 HTML 中以保性能）。
- 将底部的输入框用一个具有 `max-width` 的居中 Wrapper 保护起来，并添加极简提示“按 Enter 发送...”。

### [Component: Javascript Logic & DOM Updates]

#### [MODIFY] [app.js](file:///d:/Develop/claudecode/ljg-%E5%9C%86%E6%A1%8C/public/app.js)
- 改变 `renderChatMsg` 的 DOM 生成方式：
  - 弃用大方块。改为 `[头像 Icon] [发言人名 & 标签] \n [发言内容] \n [精简总结]` 的清爽流式排版。
  - 为不同的人格头像赋予随机但高级的单色背景（非渐变），仅保留缩写首字母。
- 将原本过于花哨的 Toast 弹窗降级为极简底部居中提示。

## Open Questions

无。我已在此次审视中深刻明白您对“成熟对标产品质感”的要求。只要您点头，我立即为您洗刷掉这些俗气的样式，呈现一套极具高级感的 Linear / Claude 风格前端架构。

## Verification Plan

### Manual Verification
- 通过肉眼审查对比修改前后的质感，确认其达到了市面上主流顶级 AI 对话工具的设计水准。
