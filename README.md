# Tailwind Visual Editor

一个轻量级的 Tailwind CSS 可视化编辑器，支持 HTML 页面的导入、可视化编辑和导出。

## 技术栈

- **前端框架**: React 19 + TypeScript
- **状态管理**: Zustand 5
- **构建工具**: Vite 6
- **样式**: Tailwind CSS (CDN)
- **图标**: Lucide React

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

---

## 技术方案

### 核心架构

```
┌─────────────────────────────────────────────────────────┐
│                        App.tsx                          │
├─────────────┬─────────────────────────┬─────────────────┤
│   TopBar    │     EditorCanvas        │ PropertiesPanel │
│  (导入导出)  │      (iframe 画布)       │   (属性面板)     │
└─────┬───────┴───────────┬─────────────┴────────┬────────┘
      │                   │                      │
      └───────────────────┼──────────────────────┘
                          ▼
                ┌─────────────────────┐
                │   Zustand Store     │
                │   (全局状态管理)      │
                └─────────────────────┘
```

### 关键技术决策

#### 1. iframe 隔离渲染

**为什么用 iframe？**

- **样式隔离**: 编辑器 UI 样式与用户内容完全隔离，避免 CSS 冲突
- **完整的文档环境**: 用户的 HTML 可以包含 `<head>` 内容、自定义脚本等
- **真实预览**: 所见即所得，导出后与预览完全一致

**实现方式**:

```typescript
// 通过 doc.write() 注入完整 HTML 文档
const content = `
  <!DOCTYPE html>
  <html>
    <head>
      <script src="https://cdn.tailwindcss.com"></script>
      ${headContent}
      ${editorStyles}  // 选中/悬停的视觉指示器样式
    </head>
    <body class="${bodyClassName}" style="${bodyStyle}">
      ${htmlContent}
    </body>
  </html>
`;
doc.open();
doc.write(content);
doc.close();
```

#### 2. 直接 DOM 操作 (非 React 控制)

**核心洞察**: iframe 内的 DOM 不受 React 管理，我们直接操作原生 DOM。

```typescript
// 选中的元素是原生 HTMLElement 引用
selectedElement: HTMLElement | null;

// 样式修改直接操作 classList
selectedElement.classList.add('bg-blue-500');
selectedElement.classList.remove('p-4');
```

**优势**:
- 无需序列化/反序列化 DOM 结构
- 实时响应，无虚拟 DOM diff 开销
- 元素引用稳定，便于追踪选中状态

#### 3. 事件委托与状态同步

**iframe 内的事件绑定**:

```typescript
// 在 iframe document 上绑定事件
doc.addEventListener('click', handleClick);
doc.addEventListener('dblclick', handleDoubleClick);
doc.addEventListener('mouseover', handleHover);
doc.addEventListener('keydown', handleKeyDown);
```

**状态同步 (useEffect 模式)**:

```typescript
// 多个 effect 分别监听不同状态切片
useEffect(() => {
  // htmlContent 变化 → 重新渲染 iframe
}, [htmlContent, headContent]);

useEffect(() => {
  // bodyClassName 变化 → 同步到 iframe body
  doc.body.className = bodyClassName;
}, [bodyClassName]);

useEffect(() => {
  // selectedElement 变化 → 更新选中样式
  selectedElement?.classList.add('visual-editor-selected');
}, [selectedElement]);
```

---

## 关键实现细节

### 1. 元素选择机制

```
用户点击 iframe 内元素
        ↓
click 事件被捕获 (e.preventDefault 阻止链接跳转)
        ↓
setSelectedElement(e.target as HTMLElement)
        ↓
Zustand 状态更新
        ↓
useEffect 触发 → 添加 .visual-editor-selected 样式
        ↓
PropertiesPanel 重新渲染，显示元素的 class 列表
```

### 2. 文本编辑 (双击进入)

```typescript
const handleDoubleClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;

  // 只有文本类元素才能编辑
  if (isTextElement(target)) {
    target.contentEditable = 'true';
    target.focus();
    setIsEditingText(true);
  }
};

// 可编辑的元素类型
const TEXT_ELEMENTS = [
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'P', 'SPAN', 'A', 'LI', 'BUTTON', 'LABEL',
  'TD', 'TH', 'DIV', 'B', 'I', 'STRONG', 'EM', 'SMALL'
];
```

### 3. 样式类管理

**添加类**:
```typescript
updateSelectedElementStyle(action: 'add' | 'remove', className: string) {
  if (action === 'add') {
    // 支持空格分隔的多个类名
    const classes = className.split(' ').filter(c => c.trim());
    classes.forEach(c => selectedElement.classList.add(c));
  }
}
```

**Body 元素特殊处理**:
```typescript
// Body 的 className 需要同步到 store
if (selectedElement === doc.body) {
  setBodyClassName(selectedElement.className);
}
```

### 4. 视觉指示器

```css
/* 注入到 iframe 的编辑器样式 */
.visual-editor-selected {
  outline: 2px solid #3b82f6 !important;  /* 蓝色实线 */
  outline-offset: 2px;
}

.visual-editor-hovered {
  outline: 1px dashed #60a5fa !important;  /* 蓝色虚线 */
  outline-offset: 2px;
}

[contenteditable="true"] {
  outline: 2px solid #22c55e !important;  /* 绿色实线 */
}
```

### 5. 响应式预览

```typescript
const getContainerStyle = (viewMode: ViewMode) => {
  switch (viewMode) {
    case 'mobile':  return { width: '375px' };
    case 'tablet':  return { width: '768px' };
    case 'desktop': return { width: '100%' };
  }
};
```

### 6. HTML 导入/导出

**导入流程**:
```
HTML 字符串
    ↓ DOMParser
Document 对象
    ↓ 提取各部分
├── headContent    → store.setHeadContent()
├── bodyClassName  → store.setBodyClassName()
├── bodyStyle      → store.setBodyStyle()
└── bodyInnerHTML  → store.setHtmlContent()
    ↓
iframe 重新渲染
```

**导出流程**:
```
iframe.contentDocument
    ↓ cleanHTMLForExport()
移除编辑器专用类和属性
    ↓
组装完整 HTML (含 DOCTYPE、Tailwind CDN)
    ↓
Blob → 下载
```

**清理逻辑**:
```typescript
function cleanHTMLForExport(root: HTMLElement) {
  const clone = root.cloneNode(true) as HTMLElement;

  // 移除编辑器专用类
  clone.querySelectorAll('.visual-editor-selected, .visual-editor-hovered')
    .forEach(el => {
      el.classList.remove('visual-editor-selected', 'visual-editor-hovered');
    });

  // 移除 contenteditable 属性
  clone.querySelectorAll('[contenteditable]')
    .forEach(el => el.removeAttribute('contenteditable'));

  return clone.innerHTML;
}
```

---

## 状态设计

```typescript
interface EditorStore {
  // === 内容状态 ===
  htmlContent: string;      // body 内的 HTML
  headContent: string;      // <head> 内容
  bodyClassName: string;    // <body> 的 class
  bodyStyle: string;        // <body> 的 inline style

  // === 选择状态 ===
  selectedElement: HTMLElement | null;
  isEditingText: boolean;

  // === UI 状态 ===
  viewMode: 'desktop' | 'tablet' | 'mobile';

  // === 操作方法 ===
  setHtmlContent(html: string): void;
  setSelectedElement(el: HTMLElement | null): void;
  updateSelectedElementStyle(action: 'add' | 'remove', className: string): void;
  deleteSelectedElement(): void;
}
```

---

## 数据流图

```
┌──────────────────────────────────────────────────────────────┐
│                        用户交互                               │
│  (点击选择 / 双击编辑 / 输入类名 / 导入导出 / 切换视图)          │
└───────────────────────────┬──────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                     组件事件处理器                             │
│  EditorCanvas: handleClick, handleDoubleClick, handleHover   │
│  PropertiesPanel: handleAddClass, handleRemoveClass          │
│  TopBar: handleImport, handleExport                          │
└───────────────────────────┬──────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                     Zustand Store Actions                    │
│  setSelectedElement / updateSelectedElementStyle / etc.      │
└───────────────────────────┬──────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                     State 更新                               │
│  selectedElement / htmlContent / bodyClassName / viewMode    │
└───────────────────────────┬──────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                     useEffect 同步                           │
│  1. 更新 iframe DOM (className, style, innerHTML)           │
│  2. 更新选中元素的视觉样式                                     │
│  3. 触发 UI 组件重新渲染                                      │
└───────────────────────────┬──────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                     视觉更新                                  │
│  - Tailwind CDN 重新处理类名                                  │
│  - 选中/悬停样式显示                                          │
│  - PropertiesPanel 显示当前元素属性                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 项目结构

```
tailwind-visual-editor/
├── index.html          # 入口 HTML
├── index.tsx           # React 应用入口
├── App.tsx             # 主布局组件
├── store.ts            # Zustand 状态管理
├── types.ts            # TypeScript 类型定义
├── components/
│   ├── TopBar.tsx          # 顶部工具栏 (导入/导出/视图模式)
│   ├── EditorCanvas.tsx    # 编辑画布 (iframe 容器)
│   └── PropertiesPanel.tsx # 属性面板 (类名编辑)
├── utils/
│   └── dom.ts              # DOM 工具函数
├── vite.config.ts      # Vite 配置
└── package.json
```

---

## 设计权衡

| 决策 | 选择 | 理由 |
|------|------|------|
| 渲染隔离 | iframe | 完全隔离样式，支持完整 HTML 文档 |
| DOM 操作 | 直接操作 | 避免序列化开销，实时响应 |
| 状态管理 | Zustand | 轻量、简单、无样板代码 |
| Tailwind 加载 | CDN | 无构建步骤，简化部署 |
| 通信方式 | 直接 DOM 访问 | 同源 iframe，无需 postMessage |

---

## 当前限制

- **无拖拽排序**: 仅支持点击选择和属性编辑
- **无元素创建**: 只能编辑/删除现有元素
- **无撤销/重做**: 操作后无法回退
- **无类名验证**: 不校验 Tailwind 类名是否有效
- **无协作功能**: 单用户本地编辑

---

## 扩展方向

1. **拖拽排序**: 使用 `@dnd-kit` 实现元素拖拽重排
2. **元素面板**: 添加组件库，拖入画布创建元素
3. **历史记录**: 实现 undo/redo 栈
4. **类名智能提示**: 集成 Tailwind IntelliSense
5. **实时协作**: 使用 CRDT 实现多人编辑
