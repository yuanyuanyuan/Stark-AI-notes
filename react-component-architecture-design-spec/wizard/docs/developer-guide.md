# React架构向导 - 开发者指南

本指南面向希望理解、扩展或贡献React架构向导项目的开发者。

## 🏗️ 系统架构概览

### 核心组件架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MCP Server    │────│  Wizard Engine   │────│   Generator     │
│   (入口层)       │    │   (核心引擎)      │    │   (代码生成)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Session Manager │    │Intelligence Engine│    │ Template System │
│   (会话管理)     │    │   (智能分析)      │    │   (模板引擎)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Cache Manager  │    │External Tools    │    │Specification    │
│   (缓存系统)     │    │   (外部集成)      │    │   (规范集成)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 数据流设计

```
用户对话 → MCP Server → WizardEngine → IntelligenceEngine
                              │                 │
                              ▼                 ▼
                        SessionManager    ExternalTools
                              │                 │
                              ▼                 ▼
                         数据持久化        外部API调用
                              │                 │
                              └─────────────────┘
                                        │
                                        ▼
                              Generator (架构生成)
                                        │
                                        ▼
                                项目代码输出
```

## 🛠️ 开发环境搭建

### 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **TypeScript**: >= 5.0.0
- **Git**: 最新版本

### 开发工具推荐

- **IDE**: VS Code / Cursor / WebStorm
- **调试**: Node.js Debugger
- **测试**: Vitest (已配置)
- **代码规范**: ESLint + Prettier

### 安装和启动

```bash
# 1. 克隆仓库
git clone <repository-url>
cd react-component-architecture-design-spec/wizard/mcp-server

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 开发模式运行
npm run dev

# 5. 运行测试
npm test

# 6. 代码检查
npm run lint
```

## 📝 代码结构详解

### 目录组织原则

```
src/
├── server.ts                 # MCP服务器入口
├── types/                    # 类型定义
│   ├── index.ts             # 核心类型导出
│   ├── wizard.ts            # 向导相关类型
│   ├── architecture.ts      # 架构相关类型
│   └── external.ts          # 外部工具类型
├── engines/                  # 核心引擎
│   ├── WizardEngine.ts      # 向导主引擎
│   ├── IntelligenceEngine.ts # 智能分析引擎
│   └── Generator.ts         # 代码生成引擎
├── managers/                 # 管理器组件
│   └── SessionManager.ts    # 会话管理
├── integrators/             # 集成器组件
│   ├── ExternalToolsIntegrator.ts  # 外部工具集成
│   └── SpecificationIntegrator.ts  # 规范集成
├── cache/                   # 缓存系统
│   └── CacheManager.ts      # 缓存管理
├── performance/             # 性能监控
│   └── PerformanceMonitor.ts # 性能监控
└── tests/                   # 测试文件
    ├── basic.test.ts        # 基础功能测试
    └── integration.test.ts  # 集成测试
```

### 核心类型系统

#### 向导会话类型

```typescript
interface WizardSession {
  id: string;
  projectName: string;
  stage: WizardStage;
  progress: number;
  requirements: ProjectRequirements;
  history: ConversationHistory[];
  decisions: Decision[];
  architecture?: ArchitectureSpec;
  customTemplates?: CustomTemplate[];
  checkpoints: Checkpoint[];
  createdAt: Date;
  updatedAt: Date;
}

type WizardStage = 
  | 'project_positioning'    // 项目定位
  | 'team_assessment'        // 团队评估  
  | 'feature_collection'     // 功能收集
  | 'blind_spot_detection'   // 盲点检测
  | 'contradiction_resolution' // 矛盾解决
  | 'solution_confirmation'  // 方案确认
  | 'architecture_generation' // 架构生成
  | 'completed'              // 完成
  | 'error';                 // 错误状态
```

#### 项目需求类型

```typescript
interface ProjectRequirements {
  projectType: string;
  teamSize: number;
  features: Feature[];
  constraints: Constraint[];
  preferences: string[];
  technicalLevel: 'beginner' | 'intermediate' | 'advanced';
  timeline?: {
    launch: Date;
    milestones: Milestone[];
  };
}

interface Feature {
  id: string;
  name: string;
  category: 'core' | 'business' | 'infrastructure' | 'nice-to-have';
  description: string;
  estimatedEffort: number; // 人天
  priority: 'must-have' | 'should-have' | 'could-have' | 'nice-to-have';
  dependencies?: string[]; // 依赖的其他功能ID
}
```

#### 架构规范类型

```typescript
interface ArchitectureSpec {
  id: string;
  name: string;
  pattern: string;
  structure: FolderStructure;
  components: ComponentHierarchy;
  dependencies: DependencyGraph;
  technologies: Technology[];
  documentation: DocumentationSpec;
}

interface ComponentHierarchy {
  pages: ComponentSpec[];
  layouts: ComponentSpec[];
  business: ComponentSpec[];
  common: ComponentSpec[];
  base: ComponentSpec[];
}
```

## 🧠 智能分析引擎深入解析

### 分析流程

```typescript
class IntelligenceEngine {
  async analyzeRequirements(session: WizardSession): Promise<AnalysisResult> {
    // 1. 需求完整性分析
    const completeness = await this.checkRequirementsCompleteness(session);
    
    // 2. 盲点检测
    const blindSpots = await this.detectBlindSpots(session);
    
    // 3. 矛盾检测
    const contradictions = await this.detectContradictions(session);
    
    // 4. 风险评估
    const risks = await this.assessProjectRisk(session);
    
    // 5. 生成建议
    const recommendations = await this.generateSmartRecommendations(session);
    
    return {
      completeness,
      blindSpots,
      contradictions,
      risks,
      recommendations
    };
  }
}
```

### 盲点检测算法

```typescript
async detectBlindSpots(session: WizardSession): Promise<BlindSpot[]> {
  const { projectType, features, teamSize } = session.requirements;
  const blindSpots: BlindSpot[] = [];
  
  // 基于项目类型的常见盲点
  const projectTypeBlindSpots = this.getProjectTypeBlindSpots(projectType);
  
  // 基于已有功能推断可能缺失的功能
  const inferredMissingFeatures = this.inferMissingFeatures(features);
  
  // 基于团队规模的治理盲点
  const governanceBlindSpots = this.getGovernanceBlindSpots(teamSize);
  
  // 外部工具增强检测
  const externalBlindSpots = await this.externalTools.detectBlindSpots(session);
  
  return [
    ...projectTypeBlindSpots,
    ...inferredMissingFeatures,
    ...governanceBlindSpots,
    ...externalBlindSpots
  ];
}
```

### 矛盾检测逻辑

```typescript
detectContradictions(session: WizardSession): Contradiction[] {
  const contradictions: Contradiction[] = [];
  
  // 团队规模与工作量矛盾
  if (this.isWorkloadTeamSizeMismatch(session)) {
    contradictions.push({
      type: 'workload_team_mismatch',
      severity: 'high',
      description: '预估工作量与团队规模不匹配',
      suggestion: '考虑调整功能范围或增加团队成员'
    });
  }
  
  // 技术栈与团队经验矛盾
  if (this.isTechStackExperienceMismatch(session)) {
    contradictions.push({
      type: 'tech_experience_mismatch',
      severity: 'medium',
      description: '选择的技术栈与团队经验不符',
      suggestion: '选择团队更熟悉的技术栈或安排技术培训'
    });
  }
  
  return contradictions;
}
```

## 🎨 代码生成引擎详解

### 模板系统架构

```typescript
class Generator {
  private templates: Map<string, string> = new Map();
  private handlebars: typeof Handlebars;
  
  async renderTemplate(
    templateName: string,
    data: Record<string, any>,
    customTemplates?: CustomTemplate[]
  ): Promise<string> {
    // 1. 查找模板（自定义 > 内置）
    const template = this.findTemplate(templateName, customTemplates);
    
    // 2. 处理模板继承
    const processedTemplate = this.processTemplateInheritance(template);
    
    // 3. 编译和渲染
    const compiled = this.handlebars.compile(processedTemplate);
    return compiled(data);
  }
}
```

### 内置模板示例

```handlebars
{{!-- React函数组件模板 --}}
import React from 'react';
{{#if hasStyles}}
import styles from './{{kebabCase name}}.module.css';
{{/if}}

interface {{name}}Props {
{{#each props}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
{{/each}}
}

export const {{name}}: React.FC<{{name}}Props> = ({
{{#each props}}
  {{name}}{{#if defaultValue}} = {{defaultValue}}{{/if}},
{{/each}}
}) => {
  return (
    <div{{#if hasStyles}} className={styles.container}{{/if}}>
      {/* TODO: 实现组件逻辑 */}
      <h1>{{name}}</h1>
    </div>
  );
};

export default {{name}};
```

### 架构生成流程

```typescript
async generateArchitecture(session: WizardSession): Promise<ToolResult> {
  // 1. 确定架构模式
  const pattern = this.determineArchitecturePattern(session);
  
  // 2. 生成文件夹结构
  const structure = this.generateFolderStructure(pattern, session.requirements.projectType);
  
  // 3. 生成组件层次结构
  const components = this.generateComponentHierarchy(session);
  
  // 4. 确定技术栈
  const technologies = this.determineTechnologyStack(session);
  
  // 5. 生成依赖关系图
  const dependencies = this.generateDependencyGraph(components);
  
  // 6. 生成文档规范
  const documentation = this.generateDocumentationSpec(session);
  
  const architecture: ArchitectureSpec = {
    id: `arch_${session.id}_${Date.now()}`,
    name: `${session.projectName} Architecture`,
    pattern,
    structure: {
      ...structure,
      layers: this.extractLayersFromPattern(pattern)
    },
    components,
    dependencies,
    technologies,
    documentation
  };
  
  return { success: true, data: architecture };
}
```

## 🔗 外部工具集成

### 集成架构

```typescript
class ExternalToolsIntegrator {
  private config: ExternalToolConfig;
  private cacheManager: CacheManager;
  private performanceMonitor: PerformanceMonitor;
  
  async getBestPractices(tech: string): Promise<ToolResult> {
    // 1. 检查缓存
    const cached = await this.cacheManager.get('external-tools', 'best-practices', { tech });
    if (cached) return cached;
    
    // 2. 并行调用外部工具
    const results = await Promise.allSettled([
      this.callContext7('get-library-docs', { library: tech }),
      this.callExa('web_search_exa', { 
        query: `${tech} best practices 2024 architecture patterns`,
        numResults: 3 
      })
    ]);
    
    // 3. 聚合结果
    const aggregatedResult = this.aggregateResults(results);
    
    // 4. 缓存结果
    await this.cacheManager.set('external-tools', 'best-practices', aggregatedResult, {
      ttl: 60 * 60 * 1000, // 1小时
      tags: ['tech-docs', tech]
    });
    
    return aggregatedResult;
  }
}
```

### 支持的外部工具

1. **Context7**: 技术文档和最佳实践获取
2. **Exa AI**: 技术趋势搜索和竞品分析  
3. **DeepWiki**: 开源项目架构分析
4. **Spec Workflow**: 规范文档生成

## 🧪 测试策略

### 测试金字塔

```
        ┌─────────────────────┐
        │   E2E Integration   │ ← 少量，覆盖关键路径
        │      Tests          │
        └─────────────────────┘
      ┌───────────────────────────┐
      │    Integration Tests      │ ← 中等数量，测试组件协作
      └───────────────────────────┘
    ┌─────────────────────────────────┐
    │        Unit Tests               │ ← 大量，覆盖业务逻辑
    └─────────────────────────────────┘
```

### 测试文件组织

```
src/tests/
├── basic.test.ts          # 基础功能单元测试
├── integration.test.ts    # 集成测试
├── performance.test.ts    # 性能测试
└── fixtures/              # 测试数据
    ├── sessions.json      # 会话数据
    ├── architectures.json # 架构数据
    └── templates/         # 模板数据
```

### 关键测试场景

```typescript
describe('向导完整流程测试', () => {
  it('应该完成电商项目的完整流程', async () => {
    // 1. 启动向导
    const session = await wizardEngine.startWizard('ecommerce-test');
    
    // 2. 模拟用户对话
    await wizardEngine.processAnswer(session.id, 'ecommerce');
    await wizardEngine.processAnswer(session.id, '10'); // 团队规模
    await wizardEngine.processAnswer(session.id, 'auth,products,cart,payment');
    
    // 3. 验证生成结果
    const architecture = await wizardEngine.generateArchitecture(session.id, true);
    expect(architecture.success).toBe(true);
    expect(architecture.data.pattern).toBeDefined();
    expect(architecture.data.components).toBeDefined();
  });
});
```

## 🚀 部署和运维

### Docker部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY dist/ ./dist/
COPY config/ ./config/
COPY templates/ ./templates/

# 设置用户权限
RUN addgroup -g 1001 -S mcp && adduser -S mcp -u 1001
RUN chown -R mcp:mcp /app
USER mcp

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 监控指标

```typescript
interface PerformanceMetrics {
  // 会话指标
  activeSessionsCount: number;
  averageSessionDuration: number;
  sessionCompletionRate: number;
  
  // 生成指标  
  architectureGenerationTime: number;
  codeGenerationTime: number;
  templateRenderingTime: number;
  
  // 系统指标
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  
  // 外部工具指标
  externalToolResponseTime: number;
  externalToolSuccessRate: number;
}
```

### 日志策略

```typescript
// 结构化日志示例
logger.info('会话创建', {
  sessionId: session.id,
  projectName: session.projectName,
  projectType: session.requirements.projectType,
  teamSize: session.requirements.teamSize,
  timestamp: new Date().toISOString()
});

logger.error('架构生成失败', {
  sessionId: session.id,
  error: error.message,
  stack: error.stack,
  requirements: session.requirements,
  timestamp: new Date().toISOString()
});
```

## 🔧 扩展开发

### 添加新的架构模式

1. **更新规范配置**：
```yaml
# config/specification.yaml
patterns:
  - name: "my-custom-pattern"
    displayName: "自定义架构"
    description: "我的特殊架构模式"
    suitableFor:
      teamSize: { min: 5, max: 15 }
      complexity: "medium"
      projectTypes: ["custom"]
    structure:
      layers: ["custom-layer-1", "custom-layer-2"]
    templates: ["custom-template"]
```

2. **实现生成逻辑**：
```typescript
// src/engines/Generator.ts
private generateCustomPatternComponents(session: WizardSession): ComponentSpec[] {
  // 自定义架构模式的组件生成逻辑
  return [
    {
      id: 'custom-component',
      name: 'CustomComponent',
      type: 'custom',
      description: '自定义组件',
      props: [],
      dependencies: [],
      template: 'custom-template'
    }
  ];
}
```

3. **添加模板**：
```handlebars
{{!-- templates/custom-template.hbs --}}
import React from 'react';

export const {{name}}: React.FC = () => {
  return <div>Custom Component: {{name}}</div>;
};
```

### 添加新的智能分析规则

```typescript
// src/engines/IntelligenceEngine.ts
private async detectCustomBlindSpots(session: WizardSession): Promise<BlindSpot[]> {
  const blindSpots: BlindSpot[] = [];
  
  // 自定义盲点检测逻辑
  if (this.isCustomConditionMet(session)) {
    blindSpots.push({
      id: 'custom-blindspot',
      title: '自定义盲点',
      description: '检测到的自定义问题',
      severity: 'medium',
      suggestion: '建议的解决方案',
      category: 'custom'
    });
  }
  
  return blindSpots;
}
```

## 📋 开发规范

### 代码风格

- **TypeScript**: 严格模式，完整类型注解
- **命名**: PascalCase类名，camelCase变量名
- **文件**: kebab-case文件名，PascalCase组件名
- **注释**: JSDoc格式，中英文混写

### Git工作流

```bash
# 功能分支开发
git checkout -b feature/new-architecture-pattern
git add .
git commit -m "feat: 添加微服务架构模式支持"
git push origin feature/new-architecture-pattern

# 创建PR，经过代码审查后合并
```

### 发版流程

1. **版本号规则**: 遵循语义化版本控制 (SemVer)
2. **变更日志**: 自动生成 CHANGELOG.md
3. **测试覆盖**: 要求 >90% 代码覆盖率
4. **性能基准**: 确保性能不退化

### 文档更新

- **API变更**: 同步更新API文档
- **功能新增**: 更新用户指南和示例
- **架构变更**: 更新架构文档和图表

## ❓ 常见问题

### 开发环境问题

**Q: Node.js版本要求？**
A: 要求Node.js 18+，推荐使用最新LTS版本。

**Q: 如何调试MCP服务器？**
A: 使用VS Code的Node.js调试器，配置launch.json：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug MCP Server",
  "program": "${workspaceFolder}/dist/server.js",
  "env": {
    "NODE_ENV": "development",
    "LOG_LEVEL": "debug"
  }
}
```

### 性能优化

**Q: 如何提升响应速度？**
A: 
1. 启用缓存系统
2. 使用性能监控找到瓶颈
3. 优化外部工具调用频率
4. 考虑使用Redis做分布式缓存

### 扩展开发

**Q: 如何添加新的外部工具集成？**
A: 继承ExternalToolsIntegrator，实现新的工具调用方法：

```typescript
async callNewTool(query: string): Promise<ToolResult> {
  // 实现新工具的调用逻辑
  return { success: true, data: result };
}
```

---

这份开发者指南涵盖了React架构向导的核心架构、开发流程和扩展方法。如需了解更多细节，请查看源代码注释和测试用例。