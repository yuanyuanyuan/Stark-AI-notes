# React 组件设计规范

> 基于 React 18.3.1 和 Next.js App Router 的客户端与服务端组件开发最佳实践

## 📋 概述

本项目提供了一套完整的 React 组件设计规范和开发工具，专门针对客户端组件和服务端组件的分离开发，帮助开发者快速构建高质量、可维护的 React 应用。

## ✨ 核心特性

- 🎯 **分离架构**: 明确区分客户端和服务端组件的使用场景
- 🔧 **完整工具链**: 包含代码生成器、验证规则、检查清单
- 📚 **丰富模板**: 提供客户端和服务端组件的完整模板
- 🧪 **测试驱动**: 内置完整的测试策略和模板
- ♿ **无障碍支持**: 完整的可访问性指南和实现
- 🚀 **现代架构**: 基于 Next.js App Router 和 React 18.3.1

## 🚀 快速开始

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 生成新组件

使用交互式命令行工具生成新组件：

```bash
# 方式1: 交互式模式
node tools/component-generator.js

# 方式2: 添加到 package.json 脚本
npm run generate:component
```

### 验证组件质量

```bash
# 验证组件目录
node tools/validation-rules.js validate src/components/YourComponent

# 检查单个文件
node tools/validation-rules.js check src/components/YourComponent/YourComponent.tsx

# 生成验证报告
node tools/validation-rules.js report src/components/YourComponent

# 列出所有验证规则
node tools/validation-rules.js list-rules
```

## 📁 项目结构

```
react-component-design-spec/
├── client-component-spec.md            # 客户端组件规范文档
├── server-component-spec.md            # 服务端组件规范文档
├── templates/                          # 代码模板目录
│   ├── client-component-template.tsx   # 客户端组件模板
│   ├── server-component-template.tsx   # 服务端组件模板
│   ├── component-test-template.tsx     # 测试代码模板
│   └── component-types-template.ts     # 类型定义模板
├── examples/                           # 示例组件目录
│   ├── client-component-example.tsx    # 客户端组件示例
│   ├── server-component-example.tsx    # 服务端组件示例
│   └── hybrid-usage-example.tsx        # 混合使用示例
├── checklists/                         # 检查清单目录
│   ├── design-checklist.md             # 设计检查清单
│   ├── code-review-checklist.md        # 代码评审检查清单
│   └── testing-checklist.md            # 测试检查清单
├── tools/                             # 自动化工具目录
│   ├── component-generator.js          # 组件生成器
│   └── validation-rules.js             # 验证规则工具
└── README.md                          # 项目说明文档
```

## 🎯 核心设计原则

### 客户端组件原则

- **交互性**: 处理用户交互、事件响应、状态管理
- **浏览器API**: 可以使用浏览器原生API和DOM操作
- **Hooks支持**: 完整的React Hooks支持（useState, useEffect等）
- **实时更新**: 支持实时状态更新和重新渲染
- **'use client'指令**: 必须在文件顶部声明

### 服务端组件原则

- **服务端渲染**: 在服务器端渲染，零客户端JavaScript
- **数据获取**: 直接访问数据库和API，无CORS限制
- **SEO优化**: 对搜索引擎友好的HTML输出
- **安全敏感**: 适合处理敏感数据和逻辑
- **异步支持**: 支持async/await数据获取

### 组件分类

**客户端组件类型:**
- **交互组件**: Button、Input、Form等需要用户交互的组件
- **状态组件**: 包含复杂状态管理的组件
- **事件处理**: 需要处理DOM事件的组件
- **动画组件**: 需要浏览器API的动画效果

**服务端组件类型:**
- **展示组件**: 静态内容展示、数据表格
- **布局组件**: 页面布局、导航结构
- **数据获取**: 数据库查询、API调用
- **SEO组件**: 元数据、结构化数据

## 📝 使用指南

### 1. 设计阶段

使用 [`design-checklist.md`](checklists/design-checklist.md) 确保组件设计质量：

```bash
# 查看设计检查清单
cat checklists/design-checklist.md
```

**重要决策点:**
- 选择客户端组件还是服务端组件
- 确定组件边界和职责划分
- 设计props接口和数据流

### 2. 开发阶段

根据组件类型选择相应的规范和模板：

**客户端组件开发:**
```bash
# 参考客户端组件规范
cat client-component-spec.md

# 使用客户端组件模板
cp templates/client-component-template.tsx src/components/YourComponent.tsx
```

**服务端组件开发:**
```bash
# 参考服务端组件规范
cat server-component-spec.md

# 使用服务端组件模板
cp templates/server-component-template.tsx src/components/YourComponent.tsx
```

使用代码生成器创建新组件：
```bash
# 启动组件生成器
node tools/component-generator.js

# 按照提示选择组件类型和配置
# - 组件名称
# - 客户端或服务端组件
# - 技术栈选择
# - 测试需求
```

### 3. 测试阶段

使用 [`testing-checklist.md`](checklists/testing-checklist.md) 确保测试覆盖率：

```bash
# 查看测试检查清单
cat checklists/testing-checklist.md
```

### 4. 代码评审

使用 [`code-review-checklist.md`](checklists/code-review-checklist.md) 进行代码评审：

```bash
# 查看代码评审检查清单
cat checklists/code-review-checklist.md
```

### 5. 质量验证

使用验证工具检查组件质量：

```bash
# 验证组件
node tools/validation-rules.js validate src/components/YourComponent

# 生成报告
node tools/validation-rules.js report src/components/YourComponent
```

## 🔧 组件生成器

### 功能特性

- 🎯 **交互式配置**: 通过问答形式收集组件配置
- 📁 **自动创建目录**: 自动创建组件目录结构
- 📄 **多文件生成**: 同时生成组件、测试、类型文件
- 🎨 **样式选择**: 支持 Styled Components、CSS Modules、Tailwind
- 🧪 **测试集成**: 自动生成测试文件
- 📋 **配置灵活**: 支持多种组件类型和技术栈

### 使用示例

```bash
$ node tools/component-generator.js

🚀 React组件生成器
==================

组件名称 (英文，PascalCase) (MyComponent): UserProfile
组件中文名称 (UserProfile): 用户资料
组件描述 (用户资料组件): 用户资料展示和编辑组件

选择组件类型
1. 基础组件
2. 表单组件
3. 复杂组件
4. 容器组件
5. 布局组件
请选择 (输入数字): 3

组件输出目录 (src/components): src/components
是否创建测试文件？ (y/n): y
是否创建类型定义文件？ (y/n): y
是否包含示例代码？ (y/n): y
使用TypeScript？ (y/n): y
使用Styled Components？ (y/n): n
使用Tailwind CSS？ (y/n): y
作者姓名 (Developer): Claude

📋 配置摘要:
组件名称: UserProfile
组件类型: 复杂组件
输出目录: src/components
创建测试: 是
创建类型: 是
TypeScript: 是
Tailwind CSS: 是

确认生成组件？ (y/n): y

✅ 创建目录: src/components/user-profile
✅ 创建文件: src/components/user-profile/UserProfile.tsx
✅ 创建文件: src/components/user-profile/UserProfile.test.tsx
✅ 创建文件: src/components/user-profile/UserProfile.types.ts
✅ 创建文件: src/components/user-profile/index.ts
✅ 创建文件: src/components/user-profile/example.tsx

✅ 组件生成完成!
📁 组件位置: src/components/user-profile

🎉 组件创建成功!

📝 使用方法:
import { UserProfile } from 'src/components/user-profile';
```

## 🔍 验证规则工具

### 验证类别

1. **命名规则**: 组件名称、文件名、Props 命名规范
2. **TypeScript 规则**: 类型定义、接口设计规范
3. **React Hooks 规则**: Hooks 使用规范
4. **性能优化规则**: React.memo、useMemo、useCallback 使用
5. **可访问性规则**: ARIA 属性、键盘导航支持
6. **代码结构规则**: 文件组织、函数长度限制
7. **安全规则**: XSS 防护、输入验证
8. **测试规则**: 测试覆盖率、测试质量

### 使用示例

```bash
# 验证组件
$ node tools/validation-rules.js validate src/components/UserProfile

🔍 组件验证报告
==================

📁 组件路径: src/components/UserProfile
📊 验证结果: 92% (23/25)

⚠️  警告 (2):
  - structure.fileLength: 文件长度不应超过500行
  - performance.useMemoForArrays: 多次数组操作应该使用useMemo优化

✅ 验证通过，但有一些需要改进的地方
📄 报告已保存到: src/components/UserProfile/validation-report.md
```

## 📚 模板说明

### 客户端组件模板 (`templates/client-component-template.tsx`)

包含完整的客户端组件结构：
- TypeScript 类型定义
- React Hooks 使用（useState, useEffect, useCallback等）
- 事件处理和状态管理
- 样式处理和主题系统
- 错误边界和可访问性支持
- 'use client' 指令

### 服务端组件模板 (`templates/server-component-template.tsx`)

包含完整的服务端组件结构：
- TypeScript 类型定义
- 异步数据获取和处理
- 服务端渲染优化
- 缓存策略和SEO优化
- 零客户端JavaScript
- 数据库和API集成

### 测试模板 (`templates/component-test-template.tsx`)

包含全面的测试覆盖：
- 单元测试
- 集成测试
- 事件测试
- 状态测试
- 性能测试
- 可访问性测试

### 类型定义模板 (`templates/component-types-template.ts`)

包含完整的类型定义：
- Props 接口
- 事件处理器类型
- 组件状态类型
- 工具类型
- 类型守卫

## 🎨 示例组件

### 基础组件示例 (`examples/basic-component-example.tsx`)

展示基础组件的最佳实践：
- Button 组件实现
- Props 设计
- 事件处理
- 样式变体
- 可访问性支持

### 表单组件示例 (`examples/form-component-example.tsx`)

展示表单组件的实现：
- 表单验证
- 错误处理
- 字段管理
- 提交处理
- 状态同步

### 复杂组件示例 (`examples/complex-component-example.tsx`)

展示复杂组件的实现：
- 数据表格组件
- 排序和过滤
- 分页功能
- 性能优化
- 事件处理

## 📋 检查清单

### 设计检查清单

确保组件设计质量的完整检查清单：
- 需求分析
- 架构设计
- UI/UX 设计
- 技术实现
- 性能考虑
- 安全性考虑

### 代码评审检查清单

确保代码质量的评审标准：
- 代码结构
- React 最佳实践
- 性能优化
- 可访问性
- 测试质量
- 安全性

### 测试检查清单

确保测试覆盖率的完整清单：
- 单元测试
- 集成测试
- 端到端测试
- 性能测试
- 安全测试
- 可用性测试

## 🛠️ 技术栈

### 核心技术
- **React**: 18.3.1
- **Next.js**: 14.x (App Router)
- **TypeScript**: 5.x
- **Testing Library**: @testing-library/react
- **Vitest**: 测试运行器

### 客户端组件技术
- **React Hooks**: useState, useEffect, useCallback, useMemo
- **状态管理**: React Context, useReducer
- **浏览器API**: DOM操作、事件监听、本地存储
- **CSS方案**: Styled Components, Tailwind CSS, CSS Modules

### 服务端组件技术
- **Async/Await**: 异步数据获取
- **缓存策略**: React Cache, Next.js Cache
- **数据库集成**: Prisma, Drizzle, 直接数据库访问
- **API集成**: 服务端API调用，无CORS限制

### 开发工具
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Husky**: Git hooks管理
- **TypeScript**: 类型检查

## 📝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- React 团队提供的优秀框架
- TypeScript 团队提供的类型系统
- Testing Library 提供的测试工具
- 社区贡献的最佳实践和经验

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 Issue
- 发送邮件
- 参与讨论

---

*最后更新：2024年*