# CLAUDE.md

[根目录](../CLAUDE.md) > **ooda-docs**

## 🎯 模块职责

ooda-docs 模块提供 OODA (Observe-Orient-Decide-Act) 循环决策框架的完整实现。该模块将军事战略决策方法论应用于软件开发和问题解决，通过四个专门的 Agent 实现系统化的决策流程。

### 核心功能
- **Observe Agent**: 信息收集和观察阶段
- **Orient Agent**: 分析和理解阶段
- **Decide Agent**: 决策和选择阶段
- **Act Agent**: 执行和验证阶段

## 📚 入口与启动

### Agent 入口文件
- **.claude/agents/observe.md**: 观察阶段 Agent
- **.claude/agents/orient.md**: 分析阶段 Agent
- **.claude/agents/decide.md**: 决策阶段 Agent
- **.claude/agents/act.md**: 执行阶段 Agent
- **README.md**: OODA 框架介绍和使用指南

### OODA 循环流程
1. **Observe**: 收集信息和数据
2. **Orient**: 分析和理解情况
3. **Decide**: 做出决策和选择
4. **Act**: 执行决策并验证结果

## 🔌 对外接口

### Agent 接口定义
```typescript
interface OODAAgent {
  name: 'observe' | 'orient' | 'decide' | 'act';
  description: string;
  tools: string[];
  execute(input: AgentInput): Promise<AgentOutput>;
}

interface AgentInput {
  context: Record<string, any>;
  previousResults?: Record<string, any>;
  task: string;
}

interface AgentOutput {
  analysis: string;
  insights: string[];
  recommendations?: string[];
  actions?: string[];
  nextSteps?: string[];
}
```

### OODA 循环接口
```typescript
interface OODALoop {
  start(task: string): Promise<void>;
  transition(from: string, to: string, data: any): Promise<void>;
  complete(results: OODAResults): Promise<void>;
}
```

## 📦 关键依赖与配置

### 文件结构
```
ooda-docs/
├── .claude/
│   └── agents/
│       ├── observe.md
│       ├── orient.md
│       ├── decide.md
│       └── act.md
├── README.md
└── ooda.png
```

### Agent 配置
- **Observe**: Read, Grep, Glob, LS, Bash, WebSearch, WebFetch
- **Orient**: Read, Grep, Glob, WebSearch, WebFetch
- **Decide**: Read, WebSearch, WebFetch
- **Act**: Read, Write, Edit, MultiEdit, Bash, Grep, Glob, LS, TodoWrite

## 🗃️ 数据模型

### OODA 状态模型
```json
{
  "state": {
    "currentPhase": "observe | orient | decide | act",
    "context": {
      "task": "string",
      "observations": "any[]",
      "analysis": "any",
      "decisions": "any[]",
      "actions": "any[]"
    },
    "history": {
      "phases": "PhaseHistory[]",
      "decisions": "Decision[]",
      "outcomes": "Outcome[]"
    }
  }
}
```

### Agent 输出模型
```json
{
  "observe": {
    "observations": "string[]",
    "patterns": "string[]",
    "anomalies": "string[]",
    "areasForInvestigation": "string[]"
  },
  "orient": {
    "understanding": "string",
    "insights": "string[]",
    "relationships": "string[]",
    "priorities": "string[]"
  },
  "decide": {
    "options": "Option[]",
    "analysis": "ComparativeAnalysis",
    "recommendation": "Recommendation",
    "risks": "Risk[]"
  },
  "act": {
    "actions": "Action[]",
    "validation": "ValidationResult",
    "results": "ActionResult[]"
  }
}
```

## 🧪 测试与质量

### Agent 质量保证
- **观察完整性**: 确保收集所有相关信息
- **分析准确性**: 验证分析结果的准确性
- **决策合理性**: 评估决策的合理性
- **执行有效性**: 验证执行的有效性

### 循环效率测试
- **时间效率**: 每个阶段的执行时间
- **决策质量**: 决策的成功率和效果
- **适应性**: 对变化情况的适应能力

## ❓ 常见问题 (FAQ)

### Q: 如何开始使用 OODA Agents？
A: 从 Observe Agent 开始，系统化收集信息，然后按顺序执行 Orient、Decide、Act 阶段。

### Q: OODA 循环适合什么类型的问题？
A: 适合复杂问题解决、系统调试、架构设计、项目管理等需要系统化思考的场景。

### Q: 如何确保 OODA 循环的质量？
A: 每个阶段都有明确的质量标准和检查清单，确保每个环节的输出质量。

## 📁 相关文件清单

### 核心 Agent 文件
- `.claude/agents/observe.md` - 观察阶段 Agent
- `.claude/agents/orient.md` - 分析阶段 Agent
- `.claude/agents/decide.md` - 决策阶段 Agent
- `.claude/agents/act.md` - 执行阶段 Agent

### 文档和资源
- `README.md` - OODA 框架介绍和使用指南
- `ooda.png` - OODA 循环图示

## 📈 变更记录 (Changelog)

### 2025-08-29
- **feat**: 完成AI上下文初始化扫描
- **feat**: 添加模块文档和接口定义
- **feat**: 建立OODA循环数据模型
- **feat**: 完善Agent协作流程和质量保证

### 历史变更
- **feat**: 添加完整的OODA Agent实现
- **feat**: 完善Agent工具配置
- **feat**: 优化循环流程和状态管理
- **feat**: 增强质量检查和验证机制

## 🔄 覆盖率统计

### 扫描覆盖情况
- **总文件数**: 6个文件
- **已扫描文件**: 6个文件 (100%)
- **Agent覆盖**: 4个核心Agent (100%)
- **文档覆盖**: 完整使用指南 (100%)

### 主要缺口
- 无发现的重要缺口
- 所有关键组件均已完整覆盖

### 下一步建议
- [ ] 添加更多领域的OODA应用案例
- [ ] 扩展Agent的专业能力
- [ ] 增强团队协作功能
- [ ] 完善性能监控和优化