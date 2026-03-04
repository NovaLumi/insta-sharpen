# InstaSharpen.ai - MVP PRD (产品需求文档)

## 1. 产品概述

**产品名称:** InstaSharpen.ai
**Slogan:** "Upscale Photos up to 8K Resolution"
**核心价值:** 专业级AI图片放大工具，基于好莱坞级 Topaz AI Engine，支持最高8K分辨率。

---

## 2. 核心功能

### 2.1 Hero & Upload Section

| 组件 | 规格说明 |
|------|----------|
| **主标题** | H1: "InstaSharpen - Upscale Photos up to 8K Resolution" |
| **副标题** | "Fix blurry images and recover details with the Hollywood-grade Topaz AI Engine." |
| **上传区域** | 大型现代拖拽上传组件。支持 JPG/PNG，最大 10MB |

### 2.2 Control Panel (放大倍数选择器)

位置：上传图片预览下方，Enhance按钮上方

| 选项 | 描述 | 积分消耗 |
|------|------|----------|
| **2x (HD)** | Fast | 1 Credit |
| **4x (4K)** | Recommended (默认) | 2 Credits |
| **8x (Ultra)** | Maximum Detail | 4 Credits |

组件样式：Segmented Control (Radio Group style)
激活状态颜色：Neon Blue

### 2.3 Action & Results

- **Magic Button:** "✨ Enhance Image (Topaz)"
- **Cost Display:** 动态显示积分消耗，根据选择的放大倍数更新
- **Comparison Slider:** 使用 react-compare-slider 实现 Original vs Upscaled 对比
- **分辨率信息显示:** "Original (500×500)" → "Upscaled (2000×2000)"
- **Download Button:** "Download High-Quality Image" (无需登录)

### 2.4 积分系统

- **头部积分显示** - 胶囊UI显示 "Credits: 3" 带图标
- **定价弹窗** - 点击打开定价选项 (如 $4.99 获得 20 积分)

---

## 3. 设计规范

| 方面 | 规格说明 |
|------|----------|
| **主题** | 深色模式 (Premium Black/Dark Gray) |
| **主色调** | Neon Blue (激活状态) |
| **响应式** | 移动端 + 桌面端优化 |
| **语言** | 英文 |
| **图标** | lucide-react |
| **动画** | framer-motion |
| **对比组件** | react-compare-slider |

---

## 4. 技术架构

### 4.1 技术栈
```
前端: Next.js 15 + React 19 + TypeScript
UI: Tailwind CSS + shadcn/ui
图标: lucide-react
动画: framer-motion
对比滑块: react-compare-slider
认证: Better Auth
数据库: Supabase
状态管理: React hooks (useState, useContext)
```

### 4.2 项目结构
```
insta-sharpen/
├── app/
│   ├── layout.tsx          # 根布局和 providers
│   ├── page.tsx            # 首页 (主应用)
│   ├── globals.css         # 全局样式
│   └── api/                # API 路由
│       └── auth/[...next]/ # Better Auth 路由
├── components/
│   ├── ui/                 # shadcn/ui 组件
│   ├── Hero.tsx            # Hero 区域
│   ├── UploadArea.tsx      # 拖拽上传
│   ├── UpscaleSelector.tsx # 放大倍数选择器
│   ├── ComparisonSlider.tsx # 对比滑块
│   ├── Header.tsx          # 头部含积分
│   └── PricingModal.tsx    # 定价弹窗
├── lib/
│   ├── utils.ts            # 工具函数
│   ├── auth.ts             # Better Auth 配置
│   └── supabase.ts         # Supabase 客户端
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
- H1 主标题: "InstaSharpen - Upscale Photos up to 8K Resolution"
- 副标题: "Fix blurry images and recover details with the Hollywood-grade Topaz AI Engine."
```

### 5.3 UploadArea 组件 (`components/UploadArea.tsx`)
```typescript
功能:
- 大型现代拖拽上传区域
- 文件输入 (JPG/PNG, 最大 10MB)
- 预览上传的图片
- 加载状态与进度条
```

### 5.4 UpscaleSelector 组件 (`components/UpscaleSelector.tsx`)
```typescript
功能:
- Segmented Control 样式选择器
- 3个选项: 2x (HD), 4x (4K), 8x (Ultra)
- "Recommended" 标签在 4x 选项
- Neon Blue 激活状态
- 选择的视觉反馈 (framer-motion 动画)
```

### 5.5 ComparisonSlider 组件 (`components/ComparisonSlider.tsx`)
```typescript
功能:
- 使用 react-compare-slider 库
- Original vs Upscaled 对比视图
- 可拖动滑块手柄
- 分辨率信息显示
- Download 和 New Image 按钮
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
- uploadedImage: File | null              // 上传的图片
- imagePreview: string | null             // 图片预览URL
- selectedFactor: '2x' | '4x' | '8x'      // 放大倍数 (默认 '4x')
- processedImage: string | null           // 处理后的图片URL
- isProcessing: boolean                   // 处理中状态
- credits: number                         // 积分数量
- showPricing: boolean                    // 显示定价弹窗
- imageDimensions: { width, height }      // 图片原始尺寸

积分消耗:
- 2x: 1 Credit
- 4x: 2 Credits
- 8x: 4 Credits
```

---

## 7. API 集成 (待定)

```typescript
// 待集成 API 端点
POST /api/upscale
Body: {
  image: File,
  factor: '2x' | '4x' | '8x'
}
Response: {
  upscaledImageUrl: string,
  originalWidth: number,
  originalHeight: number,
  upscaledWidth: number,
  upscaledHeight: number
}
```

---

## 8. 验收检查清单

- [ ] 深色模式主题正确应用 (Premium Black/Dark Gray)
- [ ] 上传区域接受 JPG/PNG (最大 10MB)
- [ ] 放大倍数选择器 (2x/4x/8x) 正常工作
- [ ] "Recommended" 标签显示在 4x 选项
- [ ] Neon Blue 激活状态颜色
- [ ] 动态积分消耗显示正确
- [ ] react-compare-slider 对比滑块流畅工作
- [ ] 分辨率信息正确显示
- [ ] 下载按钮触发下载
- [ ] 积分显示在头部可见
- [ ] 点击积分打开定价弹窗
- [ ] 移动端和桌面端响应式
- [ ] 所有动画流畅 (framer-motion)

---

## 9. 后续集成阶段

- [ ] Topaz API 集成实现真实图片处理
- [ ] 积分系统后端 (Supabase)
- [ ] 支付集成 (Stripe)
- [ ] 用户认证系统 (Better Auth)

---

*文档版本: 2.0*
*最后更新: 2026-03-03*
