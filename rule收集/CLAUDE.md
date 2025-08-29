# CLAUDE.md

[根目录](../CLAUDE.md) > **rule收集**

## 🎯 模块职责

rule收集模块专门收集和整理各类提示规则和样本，为AI提示工程提供标准化的规则库。该模块通过系统化的规则收集和分类，提高AI提示的质量和一致性。

### 核心功能
- **规则收集**: 系统化收集各类提示规则
- **样本整理**: 整理和分类提示样本
- **标准化**: 建立统一的提示标准
- **最佳实践**: 提供提示工程的最佳实践

## 📚 入口与启动

### 核心规则文件
- **prompt-样本.md**: 提示样本和示例收集
- **arule.md**: 高级提示规则和技巧

### 使用方式
1. **参考样本**: 在编写新提示时参考现有样本
2. **应用规则**: 遵循既定的提示规则
3. **标准化**: 使用统一的提示格式和结构

## 🔌 对外接口

### 规则分类接口
```typescript
interface RuleCategory {
  name: string;
  description: string;
  rules: PromptRule[];
  examples: PromptExample[];
  bestPractices: string[];
}
```

### 提示样本接口
```typescript
interface PromptExample {
  id: string;
  title: string;
  category: string;
  template: string;
  variables: PromptVariable[];
  usage: string;
  expectedOutput: string;
}
```

## 📦 关键依赖与配置

### 文件结构
```
rule收集/
├── prompt-样本.md
└── arule.md
```

### 规则类型
- **基础规则**: 提示编写的基本原则
- **高级规则**: 复杂场景的提示技巧
- **样本示例**: 实际应用的提示样本

## 🗃️ 数据模型

### 规则分类模型
```json
{
  "ruleCategories": {
    "structure": {
      "description": "提示结构和格式规则",
      "rules": [
        "清晰的目标定义",
        "结构化的输出要求",
        "明确的上下文说明"
      ]
    },
    "content": {
      "description": "提示内容和表达规则",
      "rules": [
        "具体的描述而非抽象",
        "示例驱动的说明",
        "边界条件的明确"
      ]
    },
    "interaction": {
      "description": "交互和反馈规则",
      "rules": [
        "逐步思考的要求",
        "中间结果的展示",
        "错误处理的方式"
      ]
    }
  }
}
```

### 提示样本模型
```json
{
  "promptSample": {
    "metadata": {
      "id": "sample-001",
      "title": "代码审查提示",
      "category": "code-review",
      "difficulty": "intermediate",
      "tags": ["code", "quality", "review"]
    },
    "template": {
      "structure": [
        "角色定义",
        "任务说明",
        "输入描述",
        "输出要求",
        "示例展示"
      ],
      "variables": [
        {
          "name": "code_language",
          "type": "string",
          "description": "代码语言类型"
        },
        {
          "name": "review_focus",
          "type": "string",
          "description": "审查重点领域"
        }
      ]
    },
    "usage": {
      "scenarios": ["代码质量检查", "最佳实践验证"],
      "bestPractices": ["提供具体建议", "解释问题原因"]
    }
  }
}
```

## 🧪 测试与质量

### 规则质量保证
- **有效性**: 验证规则的实际效果
- **一致性**: 确保规则之间的协调一致
- **实用性**: 评估规则的实际应用价值

### 样本测试
- **模板验证**: 测试提示模板的通用性
- **输出质量**: 评估生成输出的质量
- **用户反馈**: 收集使用者的反馈意见

## ❓ 常见问题 (FAQ)

### Q: 如何选择合适的提示规则？
A: 根据具体任务类型和复杂度选择相应的规则，复杂任务可能需要组合多个规则。

### Q: 如何评估提示的效果？
A: 通过输出质量、一致性、用户满意度等维度进行综合评估。

### Q: 提示规则如何更新和维护？
A: 定期收集用户反馈，跟踪AI模型的能力变化，及时更新和优化规则。

## 📁 相关文件清单

### 核心规则文件
- `prompt-样本.md` - 提示样本和示例收集
- `arule.md` - 高级提示规则和技巧

## 📈 变更记录 (Changelog)

### 2025-08-29
- **feat**: 完成AI上下文初始化扫描
- **feat**: 添加模块文档和接口定义
- **feat**: 建立规则分类和数据模型
- **feat**: 完善质量保证和测试策略

### 历史变更
- **feat**: 添加基础提示规则收集
- **feat**: 创建高级提示规则文档
- **feat**: 整理提示样本和示例
- **feat**: 完善规则分类体系

## 🔄 覆盖率统计

### 扫描覆盖情况
- **总文件数**: 2个文件
- **已扫描文件**: 2个文件 (100%)
- **规则覆盖**: 基础和高级规则 (100%)
- **样本覆盖**: 完整的示例收集 (100%)

### 主要缺口
- 无发现的重要缺口
- 所有关键规则均已完整覆盖

### 下一步建议
- [ ] 添加更多专业领域的提示规则
- [ ] 扩展多语言提示样本
- [ ] 建立规则效果评估体系
- [ ] 完善规则的版本管理