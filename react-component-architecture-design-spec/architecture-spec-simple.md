# React 组件架构设计规范（简化版）

> **快速架构设计，适用于小型项目和快速原型**

## 🎯 简化版 vs 完整版

| 特性 | 简化版 | 完整版 |
|------|--------|--------|
| 学习曲线 | 1-2天 | 1-2周 |
| 适用项目 | 小型项目、MVP | 企业级应用 |
| 文档复杂度 | 基础概念 | 详细规范 |
| 工具支持 | 基础工具 | 完整工具链 |
| 团队规模 | 1-3人 | 3+人 |

## 🚀 5分钟架构设计流程

### 第一步：需求分析（5分钟）
```
我的项目：
- 产品类型：[如：任务管理工具]
- 主要功能：1. [功能1] 2. [功能2] 3. [功能3]
- 用户角色：[如：管理员、普通用户]
- 页面数量：[大概需要几个页面]
```

### 第二步：页面识别（10分钟）
列出所有需要的页面：
```
1. 首页/仪表板
2. 登录/注册页
3. 主功能页面1
4. 主功能页面2
5. 设置页面
```

### 第三步：组件分类（15分钟）
将功能归类为组件：
```
基础组件：
- Button, Input, Card, Modal

业务组件：
- TaskCard, UserList, DataTable

页面组件：
- Dashboard, LoginPage, SettingsPage
```

### 第四步：架构草图（20分钟）
画出简单的组件关系：
```
DashboardPage
├── Header
├── Sidebar
├── TaskList
│   ├── TaskCard
│   └── TaskForm
└── StatsCard
```

## 📋 快速模板

### 模板1：基础Web应用架构
```
src/
├── pages/              # 页面组件
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   └── Settings.tsx
├── components/         # 业务组件
│   ├── TaskList.tsx
│   ├── UserCard.tsx
│   └── DataTable.tsx
├── shared/            # 共享组件
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Modal.tsx
├── hooks/             # 自定义Hooks
├── utils/             # 工具函数
└── types/             # 类型定义
```

### 模板2：管理系统架构
```
src/
├── pages/
│   ├── Dashboard.tsx
│   ├── Users.tsx
│   ├── Reports.tsx
│   └── Settings.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   ├── data/
│   │   ├── UserTable.tsx
│   │   ├── ReportChart.tsx
│   │   └── FilterBar.tsx
│   └── forms/
│       ├── UserForm.tsx
│       └── SettingsForm.tsx
├── shared/ui/         # 基础UI组件
└── lib/              # 工具库
```

### 模板3：SaaS应用架构
```
src/
├── app/              # Next.js App Router
│   ├── (dashboard)/
│   ├── (auth)/
│   └── api/
├── components/
│   ├── auth/         # 认证组件
│   ├── billing/      # 支付组件
│   ├── dashboard/    # 仪表板组件
│   └── shared/       # 共享组件
├── features/         # 功能模块
│   ├── auth/
│   ├── billing/
│   └── dashboard/
└── lib/              # 工具库
```

## 🎯 组件识别方法

### 功能识别法
列出所有功能，然后转换为组件：
```
功能：用户登录 → 组件：LoginForm
功能：显示任务列表 → 组件：TaskList
功能：创建任务 → 组件：TaskForm
功能：显示用户信息 → 组件：UserCard
```

### 页面识别法
为每个页面设计组件结构：
```
页面：仪表板
├── Header (导航)
├── Sidebar (菜单)
├── StatsCard (统计)
├── RecentTasks (最近任务)
└── QuickActions (快捷操作)
```

### 数据识别法
根据数据实体设计组件：
```
数据：用户 → 组件：UserCard, UserList, UserForm
数据：任务 → 组件：TaskCard, TaskList, TaskForm
数据：订单 → 组件：OrderCard, OrderTable, OrderDetails
```

## 🏗️ 常见架构模式

### 模式1：页面组件 + 共享组件
```
特点：简单直接，适合小型项目
适用：个人博客、展示网站、简单工具
```

### 模式2：功能模块化
```
特点：按功能组织，便于维护
适用：管理系统、CRUD应用
```

### 模式3：分层架构
```
特点：清晰的层次结构
适用：中型应用、团队协作
```

## 📝 快速检查清单

### 架构设计检查
- [ ] 是否列出了所有需要的页面？
- [ ] 是否识别了核心业务组件？
- [ ] 是否有共享的基础组件？
- [ ] 组件关系是否清晰？
- [ ] 是否考虑了复用性？

### 组件设计检查
- [ ] 组件职责是否单一？
- [ ] 组件命名是否规范？
- [ ] 组件层级是否合理？
- [ ] 是否考虑了客户端/服务端组件？
- [ ] 数据流向是否清晰？

## 🤖 AI对话模板

### 模板1：快速架构设计
```
我想开发一个[产品类型]，需要先设计组件架构。

项目需求：
- 主要功能：1. [功能1] 2. [功能2] 3. [功能3]
- 目标用户：[用户描述]
- 页面需求：[列出主要页面]

请帮我：
1. 设计整体组件架构
2. 列出需要的组件
3. 说明组件间关系
4. 推荐目录结构

使用React组件架构设计规范的简化版。
```

### 模板2：特定页面架构
```
请帮我设计[页面名称]的组件架构：

页面功能：[描述页面功能]
包含内容：[列出页面内容]
用户交互：[描述交互需求]

请设计：
1. 页面级组件结构
2. 需要哪些子组件
3. 组件间的数据流
4. 建议的实现方式
```

### 模板3：组件重构
```
我有一个现有的组件，需要重构架构：

当前问题：[描述问题]
组件代码：[贴出代码]
使用场景：[描述使用场景]

请帮我：
1. 分析当前架构问题
2. 设计新的组件架构
3. 拆分组件的建议
4. 保持功能不变的改进方案
```

## 📚 快速示例

### 示例1：任务管理工具架构
```
页面：
- Login (登录页)
- Dashboard (仪表板)
- Tasks (任务管理)
- Settings (设置)

核心组件：
- TaskCard (任务卡片)
- TaskList (任务列表)
- TaskForm (任务表单)
- UserCard (用户卡片)
- StatsCard (统计卡片)

目录结构：
src/
├── pages/
├── components/
│   ├── task/
│   ├── user/
│   └── layout/
├── shared/
└── lib/
```

### 示例2：博客系统架构
```
页面：
- Home (首页)
- Article (文章页)
- Admin (管理后台)
- Profile (用户资料)

核心组件：
- ArticleCard (文章卡片)
- CommentList (评论列表)
- TagList (标签列表)
- SearchBar (搜索栏)
- Editor (编辑器)

目录结构：
src/
├── pages/
├── components/
│   ├── article/
│   ├── comment/
│   └── admin/
├── shared/
└── lib/
```

## 🚀 下一步

架构设计完成后，使用 [React组件设计规范](../react-component-design-spec/) 进行具体的组件开发：

1. 选择一个组件开始实现
2. 使用组件设计规范的模板
3. 按照规范进行编码和测试
4. 逐步完成所有组件

---

**简化版架构设计让你快速开始，先建立整体架构，再进行细节实现！** 🏗️