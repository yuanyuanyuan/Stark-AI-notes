# React架构向导 (React Architecture Wizard)

🏗️ **智能对话式React项目架构生成器** - 通过与AI的自然对话，快速生成专业、规范的React项目架构。

## ✨ 特性亮点

### 🤖 智能对话设计
- **自然语言交互**：像与专家聊天一样设计架构
- **智能需求分析**：自动识别项目需求和技术约束
- **盲点检测**：发现您可能忽略的重要功能
- **矛盾解决**：智能识别并解决需求冲突

### 🏛️ 架构模式支持
- **模块化架构**：适合小到中型团队 (1-10人)
- **功能域架构**：适合中型团队 (5-15人)  
- **分层架构**：适合大型团队 (10-50人)
- **微前端架构**：适合企业级项目
- **领域驱动设计**：适合复杂业务系统

### 🛠️ 全栈代码生成
- **完整项目结构**：从配置到组件的完整代码
- **最佳实践遵循**：基于React官方和社区最佳实践
- **TypeScript支持**：类型安全的现代React开发
- **测试代码生成**：包含完整的单元测试和集成测试
- **文档自动生成**：README、架构文档、组件文档

### 🔗 多平台集成
- **Claude Code**：原生集成，完整功能体验
- **Cursor IDE**：深度集成，智能代码补全
- **VS Code (Continue)**：插件支持，基础功能
- **命令行工具**：自动化和CI/CD集成

## 🚀 快速开始

### 在 Claude Code 中使用（推荐）

1. **安装MCP服务器**：
   ```bash
   cd react-component-architecture-design-spec/wizard/mcp-server
   npm install
   npm run build
   ```

2. **配置Claude Code**：
   ```json
   {
     "mcpServers": {
       "react-arch-wizard": {
         "command": "node",
         "args": ["./dist/server.js"],
         "cwd": "./react-component-architecture-design-spec/wizard/mcp-server"
       }
     }
   }
   ```

3. **开始对话**：
   ```
   我想创建一个电商网站，团队有8个人，需要支持商品管理、用户认证、购物车和支付功能。
   ```

### 在 Cursor IDE 中使用

1. **配置Cursor**：
   将 `deploy/cursor/cursor-config.json` 配置添加到Cursor设置中。

2. **启动对话**：
   ```
   帮我设计一个任务管理应用的React架构
   ```

### 命令行使用

1. **安装CLI工具**：
   ```bash
   npm install -g react-arch-wizard-cli
   ```

2. **交互式创建**：
   ```bash
   react-arch-wizard start my-project --interactive
   ```

3. **批量创建**：
   ```bash
   react-arch-wizard start my-saas --type saas --team-size 10 --batch
   ```

## 💬 对话示例

### 基础对话流程

**🤖 向导**: 你好！我是React架构向导。我可以帮你设计专业的React项目架构。请告诉我你想创建什么类型的项目？

**👤 用户**: 我想创建一个在线教育平台，支持视频课程、作业提交、讨论区等功能。

**🤖 向导**: 很好的项目想法！在线教育平台需要考虑很多方面。让我了解更多细节：

1. 你们的团队规模大概多少人？
2. 预计有多少并发用户？
3. 是否需要支持移动端？

**👤 用户**: 团队大概12个人，预计5000并发用户，需要同时支持PC和移动端。

**🤖 向导**: 基于你的需求，我建议采用**功能域架构**模式。让我检查一下是否遗漏了重要功能：

🔍 **检测到潜在盲点**：
- 用户权限管理（学生、教师、管理员）
- 支付和订阅管理
- 视频CDN集成
- 实时通知系统
- 数据分析和报表

这些功能是否也需要考虑？

### 高级功能展示

**👤 用户**: 对，这些都需要。另外我们团队对GraphQL比较熟悉，希望使用GraphQL。

**🤖 向导**: 很好的技术选择！我已经根据你的需求生成了完整的架构设计。

📊 **架构概览**：
- **架构模式**: 功能域架构
- **技术栈**: React 18 + TypeScript + GraphQL + Apollo Client
- **状态管理**: Apollo Client + React Context
- **样式方案**: Tailwind CSS + Styled Components
- **测试方案**: Jest + React Testing Library + Cypress

🏗️ **项目结构**：
```
src/
├── features/           # 功能域模块
│   ├── auth/          # 认证功能
│   ├── courses/       # 课程管理
│   ├── discussions/   # 讨论区
│   ├── assignments/   # 作业系统
│   └── payments/      # 支付管理
├── shared/            # 共享组件和工具
│   ├── components/    # 通用组件
│   ├── hooks/         # 自定义Hooks
│   └── utils/         # 工具函数
└── core/              # 核心基础设施
    ├── graphql/       # GraphQL配置
    ├── routing/       # 路由配置
    └── store/         # 状态管理
```

是否需要我生成完整的项目代码？

## 🔧 高级配置

### 自定义架构模式

您可以通过修改 `config/specification.yaml` 来自定义架构规范：

```yaml
patterns:
  - name: "custom-pattern"
    displayName: "自定义架构"
    description: "适合特定业务场景的架构模式"
    suitableFor:
      teamSize: 
        min: 5
        max: 20
      complexity: "high"
      projectTypes: ["enterprise", "saas"]
    structure:
      layers: ["presentation", "business", "data", "shared"]
      dependencies:
        - from: "presentation"
          to: "business"
          allowed: true
```

### 自定义代码模板

在 `templates/` 目录下添加您的自定义模板：

```handlebars
{{!-- templates/my-component.hbs --}}
import React from 'react';
import styles from './{{kebabCase name}}.module.css';

interface {{name}}Props {
{{#each props}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
{{/each}}
}

export const {{name}}: React.FC<{{name}}Props> = ({
{{#each props}}
  {{name}},
{{/each}}
}) => {
  return (
    <div className={styles.container}>
      {/* Your component logic */}
    </div>
  );
};
```

## 📈 性能优化

### 缓存配置

向导内置了智能缓存系统，可以显著提升响应速度：

```javascript
// 自动缓存常用技术文档和最佳实践
const cacheConfig = {
  maxMemoryEntries: 500,
  defaultTTL: 30 * 60 * 1000, // 30分钟
  enablePersistentCache: true
};
```

### 并发处理

支持多会话并发处理，单实例可同时处理数十个架构设计请求。

## 🤝 贡献指南

### 开发环境搭建

1. **克隆仓库**：
   ```bash
   git clone https://github.com/your-org/react-architecture-design-spec.git
   cd react-architecture-design-spec/wizard/mcp-server
   ```

2. **安装依赖**：
   ```bash
   npm install
   ```

3. **开发模式运行**：
   ```bash
   npm run dev
   ```

4. **运行测试**：
   ```bash
   npm test
   ```

### 添加新功能

1. **扩展智能分析**：在 `src/engines/IntelligenceEngine.ts` 中添加新的分析规则
2. **添加架构模式**：在 `config/specification.yaml` 中定义新的架构模式
3. **创建新模板**：在 `src/engines/Generator.ts` 中添加新的代码模板

### 提交规范

请遵循 [Conventional Commits](https://conventionalcommits.org/) 规范：

```bash
git commit -m "feat: 添加微前端架构模式支持"
git commit -m "fix: 修复模板渲染中的TypeScript类型问题" 
git commit -m "docs: 更新API文档"
```

## 📚 详细文档

- [🏗️ 架构设计原理](docs/architecture.md)
- [🤖 智能分析引擎](docs/intelligence-engine.md)
- [📝 模板系统详解](docs/template-system.md)
- [🔧 API参考文档](docs/api-reference.md)
- [🚀 部署和运维](docs/deployment.md)
- [❓ 常见问题解答](docs/faq.md)

## 🌟 社区与支持

- **GitHub Issues**: [提交Bug报告或功能请求](https://github.com/your-org/react-architecture-design-spec/issues)
- **讨论区**: [参与社区讨论](https://github.com/your-org/react-architecture-design-spec/discussions)
- **文档贡献**: [改进文档内容](docs/contributing.md)

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

**让React架构设计变得更简单、更智能！** 🚀

通过与AI的自然对话，在几分钟内获得专业级的React项目架构。告别复杂的配置和冗长的文档，让智能向导为您量身定制最适合的技术方案。