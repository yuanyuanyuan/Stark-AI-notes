# CLAUDE.md

[根目录](../CLAUDE.md) > **best-particses**

## 🎯 模块职责

best-particses 模块收集和整理软件开发的最佳实践、设计原则和任务规划方法论。该模块为开发者提供系统化的开发指导，帮助团队建立高质量的软件开发标准。

### 核心功能
- **设计原则**: SOLID原则、KISS原则、DRY原则等
- **任务规划**: 系统化的任务拆解和规划方法
- **技术指南**: 特定技术的最佳实践指南
- **代码规范**: 代码注释和组织规范

## 📚 入口与启动

### 主要文档入口
- **软件设计原则.md**: 核心设计原则和最佳实践
- **任务规划.md**: 任务拆解和规划方法论
- **代码注释原则.md**: 代码注释和组织规范
- **cloudflare-vitest/**: Cloudflare + Vitest 集成指南

### 使用方式
1. **参考设计原则**: 在架构设计时参考SOLID等原则
2. **任务规划**: 使用提供的模板进行任务拆解
3. **技术集成**: 参考特定技术的最佳实践

## 🔌 对外接口

### 设计原则接口
```typescript
interface DesignPrinciple {
  name: string;
  description: string;
  benefits: string[];
  examples: string[];
  relatedPrinciples: string[];
}
```

### 任务规划接口
```typescript
interface TaskPlanning {
  taskBreakdown: string[];
  requirements: string[];
  deliverables: string[];
  dependencies: string[];
}
```

## 📦 关键依赖与配置

### 文档结构
```
best-particses/
├── 软件设计原则.md
├── 任务规划.md
├── 代码注释原则.md
└── cloudflare-vitest/
    ├── Cloudflare D1 Testing Guide.md
    ├── Cloudflare Vitest Integration Documentation.md
    └── Cloudflare Workers Vitest 资料库.md
```

### 核心原则依赖关系
- **SOLID原则**: 面向对象设计的5个基本原则
- **KISS原则**: 保持简单的设计哲学
- **DRY原则**: 避免重复代码
- **迪米特法则**: 减少对象间耦合

## 🗃️ 数据模型

### 设计原则模型
```json
{
  "principleName": "单一职责原则",
  "category": "SOLID",
  "description": "一个类/模块/方法仅负责单一功能",
  "benefits": [
    "降低复杂度",
    "提高可维护性",
    "减少变更影响"
  ],
  "implementation": {
    "guidelines": [
      "识别类的核心职责",
      "分离不同的关注点",
      "避免类承担过多责任"
    ]
  }
}
```

### 任务规划模型
```json
{
  "taskType": "功能开发",
  "breakdownStrategy": "数据流向分解",
  "subtasks": [
    {
      "name": "API层转换",
      "deliverables": ["API接口定义", "数据转换函数"],
      "dependencies": ["需求分析"]
    }
  ]
}
```

## 🧪 测试与质量

### 质量保证策略
- **原则遵循检查**: 确保代码符合设计原则
- **任务完整性**: 验证任务拆解的完整性
- **最佳实践应用**: 检查最佳实践的应用情况

### 验证方法
- **代码审查**: 对照设计原则进行审查
- **架构评审**: 验证系统架构的合理性
- **任务评估**: 评估任务规划的完整性

## ❓ 常见问题 (FAQ)

### Q: 如何选择合适的设计原则？
A: 根据项目规模、团队经验和技术栈选择适用的原则。SOLID原则适用于大多数面向对象项目。

### Q: 任务拆解的粒度如何控制？
A: 拆解到每个任务可以在1-2天内完成，并且有明确的交付物。

### Q: 如何在项目中推广最佳实践？
A: 通过代码审查、技术分享和文档培训等方式，逐步在团队中推广。

## 📁 相关文件清单

### 核心文档
- `软件设计原则.md` - SOLID等核心设计原则
- `任务规划.md` - 任务拆解和规划方法论
- `代码注释原则.md` - 代码注释和组织规范

### 技术指南
- `cloudflare-vitest/Cloudflare D1 Testing Guide.md` - D1数据库测试指南
- `cloudflare-vitest/Cloudflare Vitest Integration Documentation.md` - Vitest集成文档
- `cloudflare-vitest/Cloudflare Workers Vitest 资料库.md` - Workers测试资料

## 📈 变更记录 (Changelog)

### 2025-08-29
- **feat**: 完成AI上下文初始化扫描
- **feat**: 添加模块文档和接口定义
- **feat**: 建立设计原则数据模型
- **feat**: 完善任务规划方法论

### 历史变更
- **feat**: 添加SOLID设计原则文档
- **feat**: 集成Cloudflare + Vitest 最佳实践
- **feat**: 完善任务规划方法论
- **feat**: 添加代码注释原则

## 🔄 覆盖率统计

### 扫描覆盖情况
- **总文件数**: 6个文件
- **已扫描文件**: 6个文件 (100%)
- **设计原则**: 完整覆盖SOLID原则 (100%)
- **技术指南**: Cloudflare + Vitest (100%)

### 主要缺口
- 无发现的重要缺口
- 所有关键文档均已完整覆盖

### 下一步建议
- [ ] 添加更多技术栈的最佳实践
- [ ] 扩展微服务架构设计原则
- [ ] 添加性能优化最佳实践
- [ ] 完善安全开发指南