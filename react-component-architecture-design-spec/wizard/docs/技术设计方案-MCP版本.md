# 智能对话式架构生成器 - MCP技术设计方案

## 项目概述

### 背景与目标
基于用户体验分析，现有React组件架构设计规范存在易用性问题。本方案通过MCP（Model Context Protocol）实现智能对话式架构生成器，让用户通过自然语言对话即可完成专业的架构设计。

### 核心优势
- **零AI成本**：利用Claude原生能力，无需额外AI API
- **深度集成**：作为MCP服务直接在Claude Code中使用
- **智能引导**：通过多轮对话帮助用户明确需求
- **即时生成**：快速生成可用的架构代码

## 系统架构

### 整体架构图
```
┌─────────────────────────────────────────┐
│           Claude Code                    │
│  ┌─────────────────────────────────┐    │
│  │     用户对话界面                 │    │
│  └──────────┬──────────────────────┘    │
│             │                            │
│  ┌──────────▼──────────────────────┐    │
│  │     Claude AI Engine            │    │
│  │  (理解、推理、对话管理)          │    │
│  └──────────┬──────────────────────┘    │
│             │                            │
└─────────────┼────────────────────────────┘
              │ MCP Protocol
┌─────────────▼────────────────────────────┐
│      React Arch Wizard MCP Server        │
├───────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │      Tools (工具)                │    │
│  ├─────────────────────────────────┤    │
│  │ • start_wizard                  │    │
│  │ • answer_question               │    │
│  │ • validate_requirements         │    │
│  │ • generate_architecture         │    │
│  │ • export_project               │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │     Resources (资源)            │    │
│  ├─────────────────────────────────┤    │
│  │ • patterns (架构模式)           │    │
│  │ • templates (代码模板)          │    │
│  │ • rules (验证规则)              │    │
│  │ • examples (示例库)             │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │     Core Engines                │    │
│  ├─────────────────────────────────┤    │
│  │ • Session Manager               │    │
│  │ • Wizard Engine                 │    │
│  │ • Intelligence Engine           │    │
│  │ • Code Generator                │    │
│  └─────────────────────────────────┘    │
└───────────────────────────────────────────┘
```

### 核心模块设计

#### 1. MCP服务器 (基于官方SDK)
- **框架**: @modelcontextprotocol/sdk
- **传输**: StdioServerTransport
- **能力**: Tools + Resources

#### 2. 会话管理器 (SessionManager)
- 创建和管理对话会话
- 保存用户需求和决策历史
- 支持会话暂停和恢复
- **本地JSON持久化存储**（自动保存到 `.wizard/sessions/`）
- 会话版本控制和迁移机制
- 跨设备会话同步支持

#### 3. 向导引擎 (WizardEngine)
- 管理对话流程和阶段
- 动态生成问题
- 处理用户回答
- 状态转换逻辑

#### 4. 智能决策引擎 (IntelligenceEngine)
- 需求合理性验证
- 矛盾检测
- 盲点发现
- 架构推荐

#### 5. 代码生成器 (Generator)
- 架构结构生成
- 组件代码生成
- 配置文件生成
- 文档生成

#### 6. 外部工具集成器 (ExternalToolsIntegrator)
- **Context7集成**: 获取最新框架文档和最佳实践
- **搜索引擎集成**: 实时搜索技术解决方案
- **DeepWiki集成**: 获取深度技术知识
- **Exa AI集成**: 智能研究和分析
- **工具链编排**: 自动调用多个工具获取完整信息
- **结果聚合**: 智能整合多源信息

## 对话流程设计

### 对话阶段
```mermaid
graph LR
    A[项目类型] --> B[团队规模]
    B --> C[核心功能]
    C --> D[技术偏好]
    D --> E[盲点检查]
    E --> F[需求确认]
    F --> G[架构生成]
    G --> H[代码导出]
```

### 智能对话策略

#### 1. 渐进式需求探索
- 从宏观到微观
- 从必需到可选
- 从简单到复杂

#### 2. 智能澄清机制
```typescript
// 示例：检测模糊需求
if (answer.includes("大概") || answer.includes("可能")) {
  return {
    type: 'clarification',
    message: '我需要更明确一些，具体是指...',
    options: [...]
  }
}
```

#### 3. 盲点主动提醒
```typescript
// 示例：数据持久化盲点
if (!requirements.has('data-persistence')) {
  return {
    type: 'blind-spot',
    issue: '数据存储方案',
    question: '任务数据如何保存？',
    suggestions: ['云端存储', '本地存储', '混合方案']
  }
}
```

#### 4. 不合理需求拒绝
```typescript
// 示例：团队规模与功能复杂度不匹配
if (teamSize <= 3 && features.length > 20) {
  return {
    type: 'rejection',
    reason: '功能过多可能导致项目失败',
    suggestion: '建议先实现核心的5-8个功能'
  }
}
```

## MCP工具接口定义

### 1. start_wizard
启动架构设计向导
```typescript
{
  name: 'start_wizard',
  description: '启动React架构设计向导',
  inputSchema: {
    type: 'object',
    properties: {
      projectName: { type: 'string' },
      reset: { type: 'boolean', default: false }
    },
    required: ['projectName']
  }
}
```

### 2. answer_question
回答向导问题
```typescript
{
  name: 'answer_question',
  description: '回答向导的问题',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string' },
      answer: { type: 'string' }
    },
    required: ['sessionId', 'answer']
  }
}
```

### 3. validate_requirements
验证需求合理性
```typescript
{
  name: 'validate_requirements',
  description: '验证需求的合理性',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string' }
    },
    required: ['sessionId']
  }
}
```

### 4. generate_architecture
生成架构设计
```typescript
{
  name: 'generate_architecture',
  description: '生成架构设计',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string' },
      confirm: { type: 'boolean', default: false }
    },
    required: ['sessionId']
  }
}
```

### 5. export_project
导出项目代码
```typescript
{
  name: 'export_project',
  description: '导出项目代码到指定目录',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string' },
      outputPath: { type: 'string' },
      includeTests: { type: 'boolean', default: true }
    },
    required: ['sessionId', 'outputPath']
  }
}
```

## 数据模型设计

### 会话模型
```typescript
interface WizardSession {
  id: string
  projectName: string
  stage: WizardStage
  requirements: RequirementModel
  history: ConversationHistory[]
  decisions: Decision[]
  blindSpots: BlindSpot[]
  architecture?: ArchitectureSpec
  components?: ComponentSpec[]
  progress: number
  createdAt: Date
  updatedAt: Date
  // 新增：会话持久化相关
  version: string              // 会话格式版本
  checkpoints: Checkpoint[]    // 会话检查点
  autoSaveEnabled: boolean     // 自动保存开关
  lastSavedAt?: Date          // 最后保存时间
  // 新增：外部工具调用记录
  externalCalls: ExternalToolCall[]
  // 新增：自定义模板
  customTemplates?: CustomTemplate[]
}
```

### 会话持久化设计
```typescript
interface SessionPersistence {
  // 会话存储路径
  storagePath: '.wizard/sessions/'
  
  // 自动保存策略
  autoSave: {
    enabled: true
    interval: 30000  // 30秒自动保存
    onStateChange: true  // 状态变化时保存
  }
  
  // 会话文件格式
  format: {
    type: 'json'
    compressed: false  // 可选压缩
    encrypted: false   // 可选加密
  }
  
  // 版本控制
  versioning: {
    maxVersions: 10  // 保留最近10个版本
    migration: true  // 自动迁移旧版本
  }
}
```

### 需求模型
```typescript
interface RequirementModel {
  projectType: ProjectType
  teamSize: number
  features: Feature[]
  constraints: Constraint[]
  preferences: Preference[]
  technicalLevel: 'beginner' | 'intermediate' | 'advanced'
}
```

### 架构规范模型
```typescript
interface ArchitectureSpec {
  id: string
  name: string
  pattern: ArchitecturePattern
  structure: FolderStructure
  components: ComponentHierarchy
  dependencies: DependencyGraph
  technologies: Technology[]
}
```

## 外部工具集成设计

### 支持的外部MCP工具
```typescript
interface ExternalToolConfig {
  // Context7 - 获取最新库文档
  context7: {
    enabled: true
    tools: ['resolve-library-id', 'get-library-docs']
    usage: '获取React、Next.js等框架最新文档'
  }
  
  // DeepWiki - 深度技术知识
  deepwiki: {
    enabled: true
    tools: ['deepwiki_fetch']
    usage: '获取GitHub仓库的深度技术文档'
  }
  
  // Exa AI - 智能搜索和研究
  exa: {
    enabled: true
    tools: ['web_search_exa', 'company_research_exa', 'deep_researcher_start']
    usage: '搜索最新技术趋势和解决方案'
  }
  
  // Spec Workflow - 规范工作流
  specWorkflow: {
    enabled: true
    tools: ['spec-workflow-guide', 'create-spec-doc']
    usage: '生成标准化的架构规范文档'
  }
}
```

### 工具调用编排
```typescript
interface ToolOrchestration {
  // 场景1：获取技术栈最佳实践
  getBestPractices: async (tech: string) => {
    // 1. 使用Context7获取官方文档
    const docs = await callTool('context7', 'get-library-docs', {library: tech})
    
    // 2. 使用Exa搜索社区最佳实践
    const practices = await callTool('exa', 'web_search_exa', {
      query: `${tech} best practices 2024`
    })
    
    // 3. 聚合结果
    return aggregateResults([docs, practices])
  }
  
  // 场景2：验证架构决策
  validateArchitecture: async (architecture: Architecture) => {
    // 1. 搜索类似架构的成功案例
    const cases = await callTool('exa', 'deep_researcher_start', {
      instructions: `Find successful ${architecture.pattern} implementations`
    })
    
    // 2. 获取相关框架文档
    const frameworks = await Promise.all(
      architecture.techs.map(tech => 
        callTool('context7', 'get-library-docs', {library: tech})
      )
    )
    
    return validateWithExamples(cases, frameworks)
  }
}
```

## 模板自定义与自进化机制

### 自定义模板系统
```typescript
interface CustomTemplateSystem {
  // 模板定义
  templates: {
    builtin: string[]      // 内置模板
    custom: string[]       // 用户自定义
    community: string[]    // 社区贡献
  }
  
  // 模板管理
  management: {
    add: (template: Template) => void
    update: (id: string, template: Template) => void
    remove: (id: string) => void
    import: (url: string) => Promise<Template>
    export: (id: string) => string
  }
  
  // 模板继承
  inheritance: {
    extends: string        // 继承自哪个模板
    overrides: Object      // 覆盖的部分
    merge: boolean         // 是否合并
  }
}
```

### 自进化机制
```typescript
interface SelfEvolution {
  // 使用数据收集
  analytics: {
    templateUsage: Map<string, number>     // 模板使用频率
    userModifications: Modification[]      // 用户修改记录
    successRate: Map<string, number>       // 成功率统计
  }
  
  // 模板优化
  optimization: {
    // 基于使用频率优化默认选项
    updateDefaults: () => void
    
    // 基于修改记录生成新模板
    generateTemplate: (modifications: Modification[]) => Template
    
    // 基于成功率调整推荐顺序
    reorderRecommendations: () => void
  }
  
  // 学习机制
  learning: {
    // 记录用户选择
    recordChoice: (context: Context, choice: Choice) => void
    
    // 分析模式
    analyzePatterns: () => Pattern[]
    
    // 更新规则库
    updateRules: (patterns: Pattern[]) => void
  }
}
```

## 知识库设计

### 架构模式库
```json
{
  "patterns": [
    {
      "id": "modular",
      "name": "模块化架构",
      "applicableFor": ["saas", "enterprise"],
      "teamSize": "5+",
      "complexity": "medium"
    },
    {
      "id": "feature-based",
      "name": "功能域架构",
      "applicableFor": ["ecommerce", "social"],
      "teamSize": "10+",
      "complexity": "high"
    }
  ]
}
```

### 验证规则库
```json
{
  "rules": [
    {
      "id": "team-complexity-match",
      "condition": "teamSize < 5 && features.length > 15",
      "severity": "error",
      "message": "团队规模与功能复杂度不匹配"
    }
  ]
}
```

### 盲点检查清单
```json
{
  "blindSpots": [
    {
      "id": "data-persistence",
      "category": "infrastructure",
      "question": "数据如何存储和备份？",
      "impact": "high"
    },
    {
      "id": "security",
      "category": "security",
      "question": "如何保护用户数据？",
      "impact": "critical"
    }
  ]
}
```

## 代码生成策略

### 生成流程
1. 基于需求选择架构模式
2. 生成文件夹结构
3. 生成组件框架代码
4. 生成配置文件
5. 生成文档和README

### 模板系统
使用Handlebars模板引擎：
```handlebars
// 组件模板示例
import React from 'react'
{{#if hasState}}
import { useState } from 'react'
{{/if}}

interface {{componentName}}Props {
  {{#each props}}
  {{name}}: {{type}}
  {{/each}}
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  {{#each props}}
  {{name}},
  {{/each}}
}) => {
  {{#if hasState}}
  const [state, setState] = useState(initialState)
  {{/if}}
  
  return (
    <div>
      {/* Component implementation */}
    </div>
  )
}
```

## 与现有规范的集成

### 文件结构
```
react-component-architecture-design-spec/
├── wizard/                          # 向导相关文件
│   ├── mcp-server/                 # MCP服务器代码
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── data/                       # 知识库数据
│   │   ├── patterns/
│   │   ├── templates/
│   │   ├── rules/
│   │   └── examples/
│   └── docs/                       # 文档
│       ├── 技术设计方案.md
│       ├── 实施计划.md
│       └── 使用指南.md
```

### 更新策略
1. 在README.md中添加向导入口
2. 在architecture-spec-simple.md顶部添加快速通道
3. 更新AI对话模板以支持向导触发

## 技术栈

### 核心依赖
- **@modelcontextprotocol/sdk**: ^0.5.0
- **typescript**: ^5.3.0
- **zod**: ^3.22.0 (参数验证)
- **handlebars**: ^4.7.8 (模板引擎)
- **fs-extra**: ^11.2.0 (文件操作)

### 开发依赖
- **jest**: ^29.0.0 (测试框架)
- **@types/node**: ^20.0.0

## 性能指标

### 响应时间
- 工具调用: < 100ms
- 问题生成: < 200ms
- 架构生成: < 1s
- 代码导出: < 3s

### 资源占用
- 内存: < 50MB
- CPU: < 5%
- 磁盘: < 10MB (不含生成的代码)

## 安全考虑

### 输入验证
- 使用Zod进行严格的参数验证
- 防止路径遍历攻击
- 限制生成的文件数量和大小

### 会话管理
- 会话超时机制(30分钟)
- 会话隔离
- 敏感信息不存储

## 测试策略

### 单元测试
- 覆盖率目标: > 80%
- 测试所有核心引擎
- 测试工具处理函数

### 集成测试
- 端到端对话流程测试
- 代码生成验证
- MCP协议兼容性测试

### 示例测试用例
```typescript
describe('WizardEngine', () => {
  test('应该正确处理项目类型选择', async () => {
    const session = createSession('test-project')
    const result = engine.processAnswer(session, 'task_management')
    expect(result.type).toBe('continue')
    expect(session.requirements.projectType).toBe('task_management')
  })
  
  test('应该检测团队规模与功能复杂度矛盾', async () => {
    const session = createSession('test-project')
    session.requirements.teamSize = 2
    session.requirements.features = Array(25).fill('feature')
    const validation = engine.validateRequirements(session)
    expect(validation.hasContradictions).toBe(true)
  })
})
```

## 多平台支持设计

### 支持的AI平台
```typescript
interface PlatformSupport {
  // Claude (原生支持)
  claude: {
    type: 'native'
    protocol: 'MCP'
    features: ['full-support']
  }
  
  // OpenAI GPTs
  openai: {
    type: 'adapter'
    protocol: 'MCP-to-Actions'
    adapter: 'openai-mcp-adapter'
    features: ['basic-tools', 'resources-readonly']
  }
  
  // Cursor IDE
  cursor: {
    type: 'native'
    protocol: 'MCP'
    features: ['full-support']
  }
  
  // VS Code + Continue
  vscode: {
    type: 'extension'
    protocol: 'MCP'
    extension: 'continue-mcp'
    features: ['full-support']
  }
  
  // 通用CLI支持
  cli: {
    type: 'standalone'
    protocol: 'MCP'
    command: 'wizard-cli'
    features: ['full-support', 'offline-mode']
  }
}
```

### 平台适配层
```typescript
interface PlatformAdapter {
  // 检测当前平台
  detect(): Platform
  
  // 适配工具调用
  adaptToolCall(tool: string, params: any): AdaptedCall
  
  // 适配资源访问
  adaptResourceAccess(resource: string): AdaptedAccess
  
  // 处理平台特定功能
  handlePlatformSpecific(feature: string): void
}
```

## 部署方案

### NPM包发布
```bash
npm run build
npm publish --access public
```

### 用户安装
```bash
npm install -g react-arch-wizard-mcp
```

### Claude Code配置
```json
{
  "mcpServers": {
    "react-arch-wizard": {
      "command": "react-arch-wizard-mcp"
    }
  }
}
```

## 维护计划

### 版本迭代
- v1.0.0: 基础功能 (第4周)
- v1.1.0: 增加更多架构模式 (第6周)
- v1.2.0: 支持自定义模板 (第8周)
- v2.0.0: 可视化预览 (第12周)

### 更新机制
- 知识库热更新
- 模板在线下载
- 自动版本检查

## 成功指标

### 功能指标
- [x] 支持5种以上项目类型
- [x] 支持10个以上核心功能选项
- [x] 包含20个以上组件模板
- [x] 生成代码可直接运行

### 性能指标
- [x] 对话响应时间 < 500ms
- [x] 完整流程时间 < 5分钟
- [x] 生成代码质量得分 > 85

### 用户体验指标
- [x] 零技术门槛
- [x] 无需阅读文档
- [x] 一次成功率 > 90%

## 风险与缓解

### 技术风险
| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| MCP协议变更 | 高 | 版本锁定，渐进升级 |
| 会话状态丢失 | 中 | 可选持久化存储 |
| 生成代码错误 | 高 | 充分测试，用户预览 |

### 项目风险
| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 需求理解偏差 | 中 | 多轮确认，示例说明 |
| 知识库过时 | 低 | 定期更新，社区贡献 |

---

*本文档版本: 1.0.0*
*更新日期: 2024-12*
*作者: 架构团队*