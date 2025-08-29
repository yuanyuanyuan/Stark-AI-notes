# 📊 内容分析模板

> 这个模板用于标准化分析收集箱中的内容，帮助浮浮酱进行智能归类和结构化处理。

## 🎯 分析目标

### 主要目标
- **识别内容类型**：确定是代码片段、模板、提示词还是其他资源
- **分析技术领域**：识别属于前端、后端、测试、架构还是DevOps
- **评估内容质量**：判断完整度、准确性和实用性
- **生成分类建议**：提供最适合的分类位置和处理方式

### 分析维度
| 维度 | 分析重点 | 输出 |
|------|----------|------|
| **内容类型** | 格式、结构、用途 | 代码/模板/提示词/资源 |
| **技术栈** | 涉及技术、框架、工具 | React/Node.js/Python等 |
| **复杂度** | 技术难度、实现复杂度 | 入门/中级/高级 |
| **完整度** | 内容完整性、可用性 | 片段/模板/完整文档 |
| **分类建议** | 最适合的分类目录 | by-expertise/xxx |

## 📋 分析流程

### 1. 内容识别
```bash
# 步骤1：识别文件类型
identify_file_type() {
  case "$1" in
    *.js|*.ts|*.jsx|*.tsx) echo "代码片段" ;;
    *.md|*.txt) echo "文档/模板" ;;
    *.json|*.yaml|*.yml) echo "配置文件" ;;
    *) echo "其他资源" ;;
  esac
}

# 步骤2：分析技术栈
analyze_tech_stack() {
  # 分析代码中的技术栈
  grep -E "import|require|from" "$1" | head -10
}

# 步骤3：评估复杂度
assess_complexity() {
  # 分析代码复杂度
  lines=$(wc -l < "$1")
  functions=$(grep -c "function\|=>\|class" "$1")
  
  if [ $lines -lt 50 ] && [ $functions -lt 5 ]; then
    echo "入门"
  elif [ $lines -lt 200 ] && [ $functions -lt 20 ]; then
    echo "中级"
  else
    echo "高级"
  fi
}
```

### 2. 内容分析
#### 代码片段分析
```typescript
// 分析示例：React组件
interface CodeAnalysis {
  type: 'component' | 'hook' | 'utility' | 'test';
  framework: 'react' | 'vue' | 'angular' | 'vanilla';
  features: string[];
  dependencies: string[];
  complexity: 'simple' | 'medium' | 'complex';
  useCases: string[];
}

function analyzeReactCode(code: string): CodeAnalysis {
  return {
    type: detectComponentType(code),
    framework: 'react',
    features: extractFeatures(code),
    dependencies: extractDependencies(code),
    complexity: assessComplexity(code),
    useCases: identifyUseCases(code)
  };
}
```

#### 文档模板分析
```typescript
interface DocumentAnalysis {
  type: 'template' | 'guide' | 'reference' | 'prompt';
  category: 'frontend' | 'backend' | 'testing' | 'architecture' | 'devops';
  structure: 'complete' | 'partial' | 'outline';
  quality: 'high' | 'medium' | 'low';
  targetAudience: 'beginner' | 'intermediate' | 'advanced';
}

function analyzeDocument(content: string): DocumentAnalysis {
  return {
    type: detectDocumentType(content),
    category: detectCategory(content),
    structure: assessStructure(content),
    quality: assessQuality(content),
    targetAudience: detectAudience(content)
  };
}
```

### 3. 分类建议生成
```typescript
interface CategorizationSuggestion {
  recommendedPath: string;
  confidence: number;
  reasoning: string;
  alternatives: string[];
  processingNeeded: boolean;
}

function generateSuggestion(analysis: any): CategorizationSuggestion {
  const { type, category, complexity } = analysis;
  
  // 基于分析结果生成建议
  const path = generatePath(type, category, complexity);
  const confidence = calculateConfidence(analysis);
  const reasoning = generateReasoning(analysis);
  const alternatives = generateAlternatives(analysis);
  const processingNeeded = needsProcessing(analysis);
  
  return {
    recommendedPath: path,
    confidence,
    reasoning,
    alternatives,
    processingNeeded
  };
}
```

## 📝 分析报告模板

### 基础信息
```markdown
## 📋 内容分析报告

### 📁 文件信息
- **文件名**: [文件名]
- **文件大小**: [大小]
- **创建时间**: [时间]
- **文件类型**: [类型]

### 🎯 分析结果
- **内容类型**: [代码片段/模板/提示词/资源]
- **技术领域**: [前端/后端/测试/架构/DevOps]
- **技术栈**: [相关技术栈]
- **复杂度**: [入门/中级/高级]
- **完整度**: [片段/模板/完整文档]
```

### 详细分析
```markdown
### 🔍 详细分析

#### 内容识别
- **主要功能**: [描述主要功能]
- **涉及技术**: [列出涉及的技术]
- **使用场景**: [适用的使用场景]

#### 质量评估
- **代码质量**: [高/中/低]
- **文档完整性**: [完整/部分/缺失]
- **实用性**: [高/中/低]
- **最佳实践**: [符合/部分符合/不符合]

#### 分类建议
- **推荐路径**: [推荐的目标路径]
- **置信度**: [高/中/低]
- **建议理由**: [详细的理由说明]
- **备选方案**: [备选的分类方案]
```

### 处理建议
```markdown
### 🛠️ 处理建议

#### 标准化处理
- [ ] 添加文件摘要
- [ ] 生成目录索引
- [ ] 标准化命名
- [ ] 添加标签

#### 内容优化
- [ ] 补充缺失信息
- [ ] 优化代码结构
- [ ] 添加使用说明
- [ ] 验证正确性

#### 迁移计划
- **目标路径**: [最终目标路径]
- **处理步骤**: [具体的处理步骤]
- **注意事项**: [需要注意的事项]
```

## 🔄 批量分析流程

### 1. 扫描未分类内容
```bash
#!/bin/bash
# scan-unsorted.sh

echo "🔍 扫描未分类内容..."

COLLECTION_BOX="collection-box/unsorted"
ANALYSIS_RESULTS="collection-box/analysis-results"

# 创建结果目录
mkdir -p "$ANALYSIS_RESULTS"

# 扫描各个子目录
for subdir in snippets templates prompts resources; do
    echo "📁 处理 $subdir 目录..."
    
    target_dir="$COLLECTION_BOX/$subdir"
    if [ -d "$target_dir" ]; then
        # 分析目录中的文件
        for file in "$target_dir"/*; do
            if [ -f "$file" ]; then
                echo "📄 分析文件: $file"
                # 这里调用分析脚本
                # analyze-content.sh "$file"
            fi
        done
    fi
done

echo "✅ 扫描完成"
```

### 2. 生成分析报告
```bash
#!/bin/bash
# generate-report.sh

echo "📊 生成分析报告..."

ANALYSIS_RESULTS="collection-box/analysis-results"
REPORT_FILE="collection-box/analysis-report.md"

# 生成报告头部
cat > "$REPORT_FILE" << EOF
# 📊 收集箱分析报告

生成时间: $(date '+%Y-%m-%d %H:%M:%S')

## 📈 统计信息

EOF

# 统计文件类型
echo "### 文件类型统计" >> "$REPORT_FILE"
echo "| 类型 | 数量 |" >> "$REPORT_FILE"
echo "|------|------|" >> "$REPORT_FILE"

# 统计技术领域
echo -e "\n### 技术领域统计" >> "$REPORT_FILE"
echo "| 领域 | 数量 |" >> "$REPORT_FILE"
echo "|------|------|" >> "$REPORT_FILE"

# 统计处理状态
echo -e "\n### 处理状态" >> "$REPORT_FILE"
echo "| 状态 | 数量 |" >> "$REPORT_FILE"
echo "|------|------|" >> "$REPORT_FILE"

echo "✅ 报告生成完成: $REPORT_FILE"
```

## 🎯 使用指南

### 触发分析
在 `collection-box/unsorted` 目录中创建 `ANALYZE_REQUEST.txt` 文件：

```txt
请分析这个目录中的所有内容，并提供分类建议

特别关注：
- React相关的代码片段
- 测试模板
- 架构设计文档

优先级：高
```

### 查看分析结果
分析完成后，浮浮酱会：
1. 在 `collection-box/analysis-results` 中生成详细报告
2. 将内容移动到 `pending-categorization` 相应子目录
3. 创建处理建议文件

### 确认处理
检查 `pending-categorization` 中的内容和建议：
- 如果同意建议，创建 `CONFIRM.txt` 文件
- 如果需要修改，直接修改建议文件
- 如果拒绝，创建 `REJECT.txt` 文件

---

*这个分析模板确保收集箱中的内容得到标准化处理，让您的知识库保持高质量和一致性。* 📊✨