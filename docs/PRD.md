# InstaSharpen - MVP PRD (产品需求文档)

## 1. 产品概述

**产品名称:** InstaSharpen
**Slogan:** "Fix Blurry Photos & Upscale to 4K Instantly"
**核心价值:** 免费在线AI图片放大工具，一键增强，无需注册。

---

## 2. 核心功能

### 2.1 首屏 Hero 区域

| 组件 | 规格说明 |
|------|----------|
| **主标题** | H1: "InstaSharpen - Fix Blurry Photos & Upscale to 4K Instantly" (SEO优化) |
| **副标题** | "Free Online AI Image Upscaler. Remove JPEG Artifacts, Unblur Images to 4K, and Enhance Photo Resolution Instantly." |
| **上传区域** | 居中对齐的拖拽上传组件。支持 JPG/PNG，最大 10MB |

### 2.2 引擎选择器

| 模式 | 描述 | 标签 |
|------|------|------|
| **Standard Upscale** | 2倍放大，快速处理 | - |
| **Pro Enhance** | 4倍放大 + 极致清晰度 | "Recommended" |
| **Face Restore** | 专用于老照片/人脸模糊 | - |

### 2.3 结果展示

- **Before/After 对比滑块** - 拖动对比原图与放大后效果
- 显示分辨率信息: "Original (500x500)" → "Upscaled (2000x2000)"
- **下载按钮** - "Download High-Quality Image" (无需登录)

### 2.4 积分系统

- **头部积分显示** - 胶囊UI显示 "Credits: 3" 带图标
- **定价弹窗** - 点击打开定价选项 (如 $4.99 获得 20 积分)

---

## 3. 设计规范

| 方面 | 规格说明 |
|------|----------|
| **主题** | 深色模式 (深灰/黑色背景) |
| **主色调** | 电光蓝 (#007AFF) 或 鲜艳紫 |
| **响应式** | 移动端 + 桌面端优化 |
| **语言** | 英文 |
| **图标** | lucide-react |
| **动画** | framer-motion |

---

## 4. 技术架构

### 4.1 技术栈
```
前端: Next.js 15 + React 19 + TypeScript
UI: Tailwind CSS + shadcn/ui
图标: lucide-react
动画: framer-motion
状态管理: React hooks (useState, useContext)
```

### 4.2 项目结构
```
insta-sharpen/
├── app/
│   ├── layout.tsx          # 根布局和 providers
│   ├── page.tsx            # 首页 (主应用)
│   ├── globals.css         # 全局样式
│   └── api/                # API 路由 (未来)
├── components/
│   ├── ui/                 # shadcn/ui 组件
│   ├── Hero.tsx            # Hero 区域
│   ├── UploadArea.tsx      # 拖拽上传
│   ├── EngineSelector.tsx  # 处理模式选择
│   ├── ComparisonSlider.tsx # 对比滑块
│   ├── Header.tsx          # 头部含积分
│   └── PricingModal.tsx    # 定价弹窗
├── lib/
│   └── utils.ts            # 工具函数
├── types/
│   └── index.ts            # TypeScript 类型
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## 5. 组件详细设计

### 5.1 Header 组件 (`components/Header.tsx`)
```typescript
功能:
- Logo: "InstaSharpen" (粗体)
- 积分显示: 胶囊UI "Credits: 3"
- 点击触发 PricingModal
```

### 5.2 Hero 组件 (`components/Hero.tsx`)
```typescript
功能:
- H1 主标题 (SEO 优化)
- 副标题段落
```

### 5.3 UploadArea 组件 (`components/UploadArea.tsx`)
```typescript
功能:
- 拖拽上传区域
- 文件输入 (JPG/PNG, 最大 10MB)
- 预览上传的图片
- 加载状态与进度条
```

### 5.4 EngineSelector 组件 (`components/EngineSelector.tsx`)
```typescript
功能:
- Tab/Radio 组选择 3 种模式
- "Recommended" 徽章在 Pro Enhance
- 选择的视觉反馈
```

### 5.5 ComparisonSlider 组件 (`components/ComparisonSlider.tsx`)
```typescript
功能:
- 并排对比视图
- 可拖动滑块手柄
- Before (左) / After (右) 标签
- 分辨率显示
```

### 5.6 PricingModal 组件 (`components/PricingModal.tsx`)
```typescript
功能:
- 模态框遮罩
- 定价卡片 (如 $4.99 / 20 积分)
- 关闭按钮
```

---

## 6. 页面状态管理

```typescript
app/page.tsx 状态:
- uploadedImage: File | null        // 上传的图片
- selectedEngine: 'standard' | 'pro' | 'face'  // 选中的引擎
- processedImage: string | null     // 处理后的图片URL
- isProcessing: boolean             // 处理中状态
- credits: number                   // 积分数量
- showPricing: boolean              // 显示定价弹窗
```

---

## 7. 验收检查清单

- [ ] 深色模式主题正确应用
- [ ] 上传区域接受 JPG/PNG (最大 10MB)
- [ ] 三种引擎模式可选择
- [ ] "Recommended" 徽章显示在 Pro Enhance
- [ ] 对比滑块流畅工作
- [ ] 下载按钮触发下载
- [ ] 积分显示在头部可见
- [ ] 点击积分打开定价弹窗
- [ ] 移动端和桌面端响应式
- [ ] 所有动画流畅 (framer-motion)

---

## 8. 后续集成阶段

- [ ] API 集成实现真实图片处理
- [ ] 积分系统后端
- [ ] 支付集成
- [ ] 用户认证系统

---

*文档版本: 1.0*
*最后更新: 2026-03-03*
