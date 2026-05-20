# 体重管理小程序设计指南

## 品牌定位

- **应用类型**：健康管理工具
- **设计风格**：温暖理性、可信开放、现代简约
- **目标用户**：关注健康和身材管理的人群

## 配色方案

基于公益风设计，温馨舒适：

| 名称 | Tailwind 类名 | 色值 | 用途 |
|------|--------------|------|------|
| 主色 | `text-primary` / `bg-primary` | `#F26B3A` | 行动按钮、强调元素、选中状态 |
| 主色容器 | `bg-primary-container` | `#FDE8DF` | 主色卡片背景 |
| 健康绿 | `text-success` / `bg-success` | `#3C8D6E` | 成功状态、健康指标 |
| 深蓝 | `text-[#12355B]` | `#12355B` | 次要文字、图标 |
| 背景 | `bg-background` | `#F7F4ED` | 页面背景 |
| 表面 | `bg-surface` | `#FAF8F3` | 卡片背景 |
| 容器 | `bg-surface-container` | `#F0EDE6` | 输入框背景 |
| 文字 | `text-on-surface` | `#1E2933` | 主要文字 |
| 次要文字 | `text-on-surface-variant` | `#6B7280` | 辅助文字 |
| 分割线 | `border-outline-variant` | `#E4DED2` | 分割线 |

## 字体规范

使用系统字体，清晰易读：

- **H1 页面大标题**：`text-xl font-bold`
- **H2 卡片标题**：`text-base font-semibold`
- **正文**：`text-sm font-normal`
- **辅助文字**：`text-xs font-normal text-on-surface-variant`

## 间距系统

- **页面边距**：`px-4`
- **卡片内边距**：`p-4`
- **组件间距**：`gap-3` / `gap-4`
- **区块间距**：`gap-6`

## 组件使用原则

### 通用组件（优先使用 `@/components/ui/*`）

- **按钮**：使用 `Button` 组件，主操作用 `variant="default"`（主色），次操作用 `variant="outline"`
- **输入框**：使用 `Input` 组件，外层用 `View` 包裹并设置背景色
- **卡片**：使用 `Card` 组件展示数据块
- **标签**：使用 `Badge` 组件展示状态
- **进度条**：使用 `Progress` 组件展示完成度
- **开关**：使用 `Switch` 组件展示设置项

### 原生组件（仅用于组件库未覆盖的场景）

- `View`：布局容器
- `Text`：文本展示（垂直排列需添加 `block` 类）
- `ScrollView`：滚动容器

## 页面结构

### TabBar 配置

```typescript
{
  color: '#6B7280',
  selectedColor: '#F26B3A',
  backgroundColor: '#FAF8F3',
  list: [
    { pagePath: 'pages/home/index', text: '首页', iconPath: './assets/tabbar/home.png', selectedIconPath: './assets/tabbar/home-active.png' },
    { pagePath: 'pages/checkin/index', text: '打卡', iconPath: './assets/tabbar/plus-circle.png', selectedIconPath: './assets/tabbar/plus-circle-active.png' },
    { pagePath: 'pages/data/index', text: '数据', iconPath: './assets/tabbar/trending-up.png', selectedIconPath: './assets/tabbar/trending-up-active.png' },
    { pagePath: 'pages/stats/index', text: '统计', iconPath: './assets/tabbar/bar-chart.png', selectedIconPath: './assets/tabbar/bar-chart-active.png' },
    { pagePath: 'pages/profile/index', text: '我的', iconPath: './assets/tabbar/user.png', selectedIconPath: './assets/tabbar/user-active.png' }
  ]
}
```

### 页面布局规范

- **一级页**（TabBar 页面）：有底部 TabBar，无返回按钮
- **二级页**（详情/编辑）：有返回按钮，无 TabBar
- Header 高度：`h-14`，使用 `sticky top-0`
- TabBar 高度：`h-14` + 安全区域

## 数据可视化

### 趋势图表

使用简单的 CSS + SVG 实现：

- 折线图：SVG `<polyline>` + 数据点
- 柱状图：CSS flexbox + 高度百分比
- 饼图：SVG `<circle>` + `stroke-dasharray`

### 指标卡片

- 当前值：大字号 + 粗体（`text-2xl font-bold`）
- 目标值/变化：小字号 + 次要颜色
- 状态标签：`Badge` 组件

## 小程序约束

- **包体积**：单个包不超过 2MB，总包不超过 20MB
- **图片策略**：所有图片上传 TOS，代码中使用 URL
- **性能优化**：避免频繁 `setData`，合理使用虚拟列表
- **跨端兼容**：检测平台（`Taro.getEnv()`），H5 降级处理
