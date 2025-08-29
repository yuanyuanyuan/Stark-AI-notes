# CLAUDE.md

[根目录](../CLAUDE.md) > **代码分析的prompt指令**

## 🎯 模块职责

代码分析的prompt指令模块提供面向不同角色的代码分析提示模板，帮助各类项目参与者快速理解和分析代码结构。该模块通过标准化的分析模板，提高代码分析的效率和准确性。

### 核心功能
- **多角色支持**: 面向业务分析师、实施顾问、开发人员等不同角色
- **结构化分析**: 提供系统化的代码分析框架
- **前后端分离**: 针对前端和后端项目的专门分析模板
- **可视化输出**: 支持Mermaid图表等可视化输出

## 📚 入口与启动

### 角色导向的入口
- **业务功能脉络分析（面向业务分析师）.md**: 业务逻辑和功能流程分析
- **字段依赖分析（面向实施顾问）.md**: 数据字段和依赖关系分析
- **代码架构解析（面向开发人员）.md**: 技术架构和代码结构分析
- **前端项目代码架构解析.md**: 前端专项分析模板
- **后端项目代码架构解析.md**: 后端专项分析模板

### 使用流程
1. **选择角色**: 根据使用者角色选择相应模板
2. **输入代码**: 提供需要分析的代码或项目
3. **获取分析**: AI基于模板生成结构化分析报告
4. **决策支持**: 基于分析结果做出相应决策

## 🔌 对外接口

### 分析模板接口
```typescript
interface AnalysisTemplate {
  targetRole: 'business-analyst' | 'implementation-consultant' | 'developer';
  analysisType: 'business-logic' | 'data-dependency' | 'code-architecture';
  outputFormat: 'markdown' | 'mermaid' | 'json';
  focusAreas: string[];
}
```

### 分析结果接口
```typescript
interface AnalysisResult {
  overview: string;
  architecture: ArchitectureMap;
  dependencies: DependencyGraph;
  recommendations: string[];
  risks: RiskAssessment[];
}
```

## 📦 关键依赖与配置

### 模板文件结构
```
代码分析的prompt指令/
├── 业务功能脉络分析（面向业务分析师）.md
├── 字段依赖分析（面向实施顾问）.md
├── 代码架构解析（面向开发人员）.md
├── 前端项目代码架构解析.md
└── 后端项目代码架构解析.md
```

### 分析维度配置
- **业务维度**: 功能流程、业务规则、用户场景
- **技术维度**: 架构设计、技术栈、依赖关系
- **数据维度**: 数据流、字段依赖、数据模型
- **质量维度**: 代码质量、性能、安全性

## 🗃️ 数据模型

### 代码架构模型
```json
{
  "projectType": "frontend | backend | fullstack",
  "technologyStack": {
    "framework": "React | Vue | Angular | Spring | Django",
    "language": "TypeScript | JavaScript | Python | Java",
    "database": "MySQL | PostgreSQL | MongoDB"
  },
  "architecture": {
    "layers": ["presentation", "business", "data"],
    "patterns": ["MVC", "MVVM", "Microservices"],
    "components": {
      "entryPoints": ["main.tsx", "index.js"],
      "routers": ["router.js", "routes.py"],
      "services": ["api/", "services/"],
      "utils": ["utils/", "helpers/"]
    }
  }
}
```

### 依赖关系模型
```json
{
  "dependencyGraph": {
    "nodes": [
      {
        "id": "componentA",
        "type": "component",
        "dependencies": ["componentB", "serviceX"]
      }
    ],
    "edges": [
      {
        "from": "componentA",
        "to": "componentB",
        "type": "import | call | data-flow"
      }
    ]
  }
}
```

## 🧪 测试与质量

### 分析质量保证
- **模板验证**: 确保每个模板都能产生有意义的分析结果
- **角色适配**: 验证模板输出是否符合目标角色的需求
- **完整性检查**: 确保分析覆盖所有重要维度

### 效果评估
- **用户反馈**: 收集不同角色使用者的反馈
- **分析准确性**: 验证分析结果的准确性
- **实用性评估**: 评估分析结果的实际应用价值

## ❓ 常见问题 (FAQ)

### Q: 如何选择合适的分析模板？
A: 根据使用者的角色和分析目的选择。业务分析师关注功能流程，开发人员关注技术架构，实施顾问关注数据依赖。

### Q: 分析模板是否支持自定义？
A: 可以基于现有模板进行修改，或者根据特定项目需求创建新的分析维度。

### Q: 如何处理大型项目的分析？
A: 建议分模块进行分析，或者使用分层分析的方法，先整体后局部。

## 📁 相关文件清单

### 核心分析模板
- `业务功能脉络分析（面向业务分析师）.md` - 业务逻辑分析模板
- `字段依赖分析（面向实施顾问）.md` - 数据依赖分析模板
- `代码架构解析（面向开发人员）.md` - 技术架构分析模板

### 专项分析模板
- `前端项目代码架构解析.md` - 前端专项分析
- `后端项目代码架构解析.md` - 后端专项分析

## 📈 变更记录 (Changelog)

### 2025-08-29
- **feat**: 完成AI上下文初始化扫描
- **feat**: 添加模块文档和接口定义
- **feat**: 建立多角色分析框架
- **feat**: 完善数据模型和输出格式

### 历史变更
- **feat**: 添加业务分析师角色模板
- **feat**: 添加实施顾问角色模板
- **feat**: 完善开发人员分析模板
- **feat**: 增加前后端专项分析

## 🔄 覆盖率统计

### 扫描覆盖情况
- **总文件数**: 5个文件
- **已扫描文件**: 5个文件 (100%)
- **角色覆盖**: 3个核心角色 (100%)
- **技术覆盖**: 前后端专项分析 (100%)

### 主要缺口
- 无发现的重要缺口
- 所有关键模板均已完整覆盖

### 下一步建议
- [ ] 添加DevOps角色分析模板
- [ ] 扩展移动端分析模板
- [ ] 增加性能分析专项模板
- [ ] 完善安全分析模板