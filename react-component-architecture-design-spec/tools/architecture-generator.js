# 🏗️ 组件架构生成器

> **智能生成React组件架构，支持多种应用类型**

## 🚀 功能特性

- 🎯 **智能架构生成**: 根据项目需求自动生成组件架构
- 📁 **完整目录结构**: 自动创建标准化的目录结构
- 🎨 **多种架构模式**: 支持分层架构、功能域架构、模块化架构
- 📊 **架构文档生成**: 自动生成架构设计文档
- 🔧 **交互式配置**: 通过问答形式收集项目需求
- 📋 **检查清单集成**: 自动生成架构检查清单

## 📦 安装和运行

### 前置要求
- Node.js 16+
- npm 或 yarn

### 运行生成器
```bash
# 进入架构设计规范目录
cd react-component-architecture-design-spec

# 运行架构生成器
node tools/architecture-generator.js
```

## 🎯 使用示例

### 基础使用
```bash
$ node tools/architecture-generator.js

🏗️ React组件架构生成器
========================

项目名称 (MyProject): CRM系统
项目中文名称 (CRM系统): 客户关系管理系统
项目描述 (客户关系管理系统): 管理客户信息和跟进记录的系统

选择项目类型:
1. SaaS应用
2. 管理系统
3. 电商系统
4. 博客系统
5. 社交应用
6. 其他
请选择 (输入数字): 2

主要功能 (逗号分隔): 客户管理,跟进记录,数据报表,用户管理
目标用户 (销售团队,中小企业): 销售人员和中小企业
预计页面数量 (5): 5
团队规模 (3人): 3人

选择架构模式:
1. 分层架构 (推荐)
2. 功能域架构
3. 模块化架构
请选择 (输入数字): 1

是否生成示例代码？ (y/n): y
是否生成检查清单？ (y/n): y
是否生成架构文档？ (y/n): y

📋 配置摘要:
项目名称: CRM系统
项目类型: 管理系统
架构模式: 分层架构
主要功能: 客户管理,跟进记录,数据报表,用户管理
团队规模: 3人
页面数量: 5
生成示例代码: 是
生成检查清单: 是
生成架构文档: 是

确认生成架构？ (y/n): y

✅ 创建目录: architecture-crm-system
✅ 生成目录结构: architecture-crm-system/structure.json
✅ 生成架构文档: architecture-crm-system/architecture.md
✅ 生成检查清单: architecture-crm-system/checklist.md
✅ 生成示例代码: architecture-crm-system/examples/
✅ 生成组件模板: architecture-crm-system/templates/

🎉 架构生成完成!
📁 架构文件: architecture-crm-system/
```

### 高级使用
```bash
# 使用配置文件
node tools/architecture-generator.js --config config.json

# 直接生成特定类型
node tools/architecture-generator.js --type saas --name "我的SaaS"

# 生成完整文档
node tools/architecture-generator.js --docs --name "电商系统"

# 仅生成检查清单
node tools/architecture-generator.js --checklist --name "博客系统"
```

## 📋 生成的文件结构

```
architecture-[项目名称]/
├── architecture.md              # 架构设计文档
├── structure.json               # 目录结构定义
├── checklist.md                 # 架构检查清单
├── components.json              # 组件列表和定义
├── examples/                    # 示例代码
│   ├── CustomerCard.tsx         # 组件示例
│   ├── DashboardPage.tsx        # 页面示例
│   └── useCustomerData.ts       # Hook示例
├── templates/                   # 组件模板
│   ├── PageComponent.tsx        # 页面组件模板
│   ├── BusinessComponent.tsx     # 业务组件模板
│   └── SharedComponent.tsx       # 共享组件模板
└── guidelines/                  # 开发指南
    ├── development-guide.md     # 开发指南
    ├── naming-conventions.md    # 命名规范
    └── best-practices.md        # 最佳实践
```

## 🎨 支持的项目类型

### 1. SaaS应用
```
特点:
- 多租户支持
- 权限管理
- 订阅和支付
- 数据分析

典型组件:
- Dashboard, Billing, Users, Settings
- Authentication, Authorization
- Analytics, Reporting
- Integrations, API
```

### 2. 管理系统
```
特点:
- CRUD操作
- 数据管理
- 权限控制
- 报表生成

典型组件:
- DataTable, Form, Filter
- UserManagement, RoleManagement
- Dashboard, Statistics
- Export/Import
```

### 3. 电商系统
```
特点:
- 商品展示
- 购物车
- 订单处理
- 支付集成

典型组件:
- ProductCard, ProductList
- ShoppingCart, Checkout
- OrderTracking, Payment
- UserReviews, Recommendations
```

### 4. 博客系统
```
特点:
- 内容管理
- 用户评论
- 搜索功能
- SEO优化

典型组件:
- ArticleCard, ArticleList
- CommentSystem, SearchBar
- TagCloud, CategoryTree
- AuthorProfile, Newsletter
```

### 5. 社交应用
```
特点:
- 实时通信
- 用户互动
- 内容分享
- 推荐算法

典型组件:
- Feed, Post, Comment
- UserProfile, Messaging
- Notifications, Search
- MediaUpload, Stories
```

## 🏗️ 支持的架构模式

### 1. 分层架构
```
src/
├── pages/          # 页面组件
├── components/     # 业务组件
├── shared/         # 共享组件
├── hooks/          # 自定义Hooks
├── services/       # API服务
├── utils/          # 工具函数
└── types/          # 类型定义
```

### 2. 功能域架构
```
src/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── users/
│   └── settings/
├── shared/
│   ├── ui/
│   ├── hooks/
│   └── utils/
└── app/
```

### 3. 模块化架构
```
src/
├── modules/
│   ├── auth-module/
│   ├── user-module/
│   ├── product-module/
│   └── order-module
├── common/
│   ├── ui-components/
│   ├── data-services/
│   └── utilities
└── core/
    ├── app-config/
    ├── routing/
    └── state-management
```

## 📊 生成的架构文档

### 架构文档包含
- 项目概述和目标
- 架构设计原则
- 组件分层和分类
- 数据流设计
- 技术选型建议
- 性能考虑
- 扩展性设计
- 开发指南

### 组件定义包含
- 组件名称和职责
- Props接口定义
- 事件处理设计
- 状态管理方案
- 性能优化建议
- 测试策略

### 检查清单包含
- 架构设计检查点
- 组件设计检查点
- 性能检查点
- 可维护性检查点
- 最佳实践检查点

## 🔧 配置选项

### 命令行参数
```bash
--config, -c     # 使用配置文件
--type, -t       # 项目类型 (saas, admin, ecommerce, blog, social)
--name, -n       # 项目名称
--output, -o     # 输出目录
--docs           # 生成完整文档
--checklist      # 生成检查清单
--examples       # 生成示例代码
--templates      # 生成模板
--interactive    # 交互模式 (默认)
```

### 配置文件格式
```json
{
  "project": {
    "name": "CRM系统",
    "description": "客户关系管理系统",
    "type": "admin",
    "teamSize": 3,
    "pageCount": 5
  },
  "features": [
    "客户管理",
    "跟进记录", 
    "数据报表",
    "用户管理"
  ],
  "users": "销售人员和中小企业",
  "architecture": {
    "pattern": "layered",
    "includeExamples": true,
    "includeChecklist": true,
    "includeDocumentation": true
  },
  "technical": {
    "framework": "react",
    "stateManagement": "context",
    "styling": "tailwind",
    "testing": "jest"
  }
}
```

## 🎯 最佳实践

### 架构设计最佳实践
1. **先理解需求**: 充分理解业务需求和技术需求
2. **选择合适模式**: 根据项目特点选择合适的架构模式
3. **考虑扩展性**: 设计时要考虑未来的功能扩展
4. **保持简单**: 避免过度设计，保持架构简单清晰
5. **团队协作**: 考虑团队成员的技能和协作方式

### 使用生成器最佳实践
1. **交互式使用**: 第一次使用建议使用交互模式
2. **定制配置**: 根据项目特点调整生成的配置
3. **版本控制**: 将生成的架构文档纳入版本控制
4. **团队评审**: 生成后与团队一起评审架构设计
5. **持续改进**: 根据实际开发情况持续优化架构

## 🚀 扩展开发

### 自定义架构模板
```javascript
// 在生成器中添加新的项目类型
const projectTypes = {
  custom: {
    name: '自定义项目',
    components: ['CustomComponent1', 'CustomComponent2'],
    structure: 'custom-structure-template',
    patterns: ['layered', 'modular']
  }
};
```

### 自定义生成逻辑
```javascript
// 添加自定义的生成逻辑
function generateCustomArchitecture(config) {
  // 自定义生成逻辑
  return {
    structure: customStructure,
    components: customComponents,
    documentation: customDocumentation
  };
}
```

---

## 📞 反馈和支持

如果在使用过程中遇到问题或有改进建议，请：

1. 查看生成的架构文档中的常见问题
2. 检查项目的配置是否正确
3. 参考最佳实践指南
4. 提交Issue或Pull Request

---

**记住：架构生成器是工具，最终的架构设计还需要你的专业判断和团队协作！** 🛠️