# 🔄 结构化转换模板

> 这个模板用于将收集箱中的非结构化内容转换为标准化的格式，确保知识库的内容格式一致且易于使用。

## 🎯 转换目标

### 主要目标
- **标准化格式**：统一所有文件的格式和结构
- **添加元数据**：为每个文件添加必要的元信息
- **优化内容**：提升内容的可读性和实用性
- **增强可发现性**：通过标准化结构提高搜索效率

### 转换标准
| 元素 | 要求 | 示例 |
|------|------|------|
| **文件摘要** | 100-200字的内容概述 | 描述文件的主要内容和用途 |
| **目录索引** | 自动生成的导航结构 | 带锚链接的目录结构 |
| **标准化命名** | 统一的命名格式 | [prefix]-[topic]-[subtopic]-[tags]-[date].md |
| **代码示例** | 格式化的代码块 | 带语法高亮的代码示例 |
| **使用说明** | 清晰的使用指导 | 步骤化的使用说明 |

## 📋 标准文件结构

### 基础模板
```markdown
## 📋 文件摘要

[100-200字的内容摘要，描述文件的主要功能、用途和适用场景]

## 📑 目录索引

- [📋 文件摘要](#-文件摘要)
- [🎯 主要内容](#主要内容)
- [🔧 技术实现](#技术实现)
- [📊 使用示例](#使用示例)
- [🎯 最佳实践](#最佳实践)
- [🔄 相关资源](#相关资源)

---

## 🎯 主要内容

[主要内容和功能描述]

## 🔧 技术实现

### 核心代码
```typescript
// 主要实现代码
const example = () => {
  // 代码实现
};
```

### 关键特性
- **特性1**：描述特性1的具体内容
- **特性2**：描述特性2的具体内容
- **特性3**：描述特性3的具体内容

## 📊 使用示例

### 基本用法
```typescript
// 基本使用示例
const result = example();
console.log(result);
```

### 高级用法
```typescript
// 高级使用示例
const advancedResult = example({
  option1: 'value1',
  option2: 'value2'
});
```

## 🎯 最佳实践

### 使用建议
1. **建议1**：详细的使用建议
2. **建议2**：具体的最佳实践
3. **建议3**：需要注意的事项

### 常见问题
**Q**: 常见问题1？
**A**: 详细的问题解答

**Q**: 常见问题2？
**A**: 详细的问题解答

## 🔄 相关资源

- **相关文档**：[相关文档链接]
- **参考资源**：[参考资源链接]
- **扩展阅读**：[扩展阅读链接]

---

*文件总结和附加信息*
```

## 🔄 转换流程

### 1. 内容分析
```typescript
interface ContentAnalysis {
  type: 'code' | 'template' | 'guide' | 'reference';
  category: 'frontend' | 'backend' | 'testing' | 'architecture' | 'devops';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  structure: 'complete' | 'partial' | 'fragment';
  quality: 'high' | 'medium' | 'low';
}

function analyzeContent(content: string): ContentAnalysis {
  return {
    type: detectContentType(content),
    category: detectCategory(content),
    complexity: assessComplexity(content),
    structure: assessStructure(content),
    quality: assessQuality(content)
  };
}
```

### 2. 文件摘要生成
```typescript
function generateSummary(content: string, analysis: ContentAnalysis): string {
  const wordCount = content.split(' ').length;
  const keyFeatures = extractKeyFeatures(content);
  const useCases = identifyUseCases(content);
  
  let summary = `本文档是${analysis.category}领域的${analysis.type}资源`;
  
  if (analysis.complexity === 'beginner') {
    summary += '，适合初学者学习和使用';
  } else if (analysis.complexity === 'intermediate') {
    summary += '，适合有一定经验的开发者参考';
  } else {
    summary += '，适合资深开发者深入研究';
  }
  
  summary += `。主要包含${keyFeatures.join('、')}等${analysis.type === 'code' ? '功能' : '内容'}`;
  
  if (useCases.length > 0) {
    summary += `，适用于${useCases.join('、')}等场景`;
  }
  
  summary += `。文档字数约${wordCount}字，提供完整的使用指南和代码示例。`;
  
  return summary;
}
```

### 3. 目录索引生成
```typescript
function generateTOC(content: string): string {
  const sections = extractSections(content);
  let toc = '## 📑 目录索引\n\n';
  
  for (const section of sections) {
    const anchor = generateAnchor(section.title);
    toc += `- [${section.title}](#${anchor})\n`;
    
    if (section.subsections.length > 0) {
      for (const subsection of section.subsections) {
        const subAnchor = generateAnchor(subsection);
        toc += `  - [${subsection}](#${subAnchor})\n`;
      }
    }
  }
  
  return toc;
}

function generateAnchor(title: string): string {
  return title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
```

### 4. 代码标准化
```typescript
function standardizeCode(content: string): string {
  return content
    // 标准化代码块
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'typescript';
      const formattedCode = formatCode(code, language);
      return `\`\`\`${language}\n${formattedCode}\`\`\``;
    })
    // 添加行号
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const lines = code.split('\n');
      const numberedLines = lines.map((line, index) => {
        const lineNumber = (index + 1).toString().padStart(2, ' ');
        return `${lineNumber}  ${line}`;
      }).join('\n');
      return `\`\`\`${lang || 'typescript'}\n${numberedLines}\`\`\``;
    });
}

function formatCode(code: string, language: string): string {
  // 根据语言格式化代码
  switch (language) {
    case 'typescript':
    case 'javascript':
      return formatJavaScript(code);
    case 'python':
      return formatPython(code);
    case 'sql':
      return formatSQL(code);
    default:
      return code.trim();
  }
}
```

## 📝 转换示例

### 示例1：React组件转换
**原始内容**：
```jsx
import React from 'react';

function UserProfile({ user, onUpdate }) {
  return (
    <div className="user-profile">
      <img src={user.avatar} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={() => onUpdate(user)}>
        Edit Profile
      </button>
    </div>
  );
}

export default UserProfile;
```

**转换后**：
```markdown
## 📋 文件摘要

本文档是一个React用户资料展示组件，提供了用户头像、姓名、邮箱的展示功能，并支持编辑操作。组件采用函数式组件实现，具有良好的可复用性和可维护性。适合需要用户信息展示的Web应用项目使用。

## 📑 目录索引

- [📋 文件摘要](#-文件摘要)
- [🎯 组件概述](#组件概述)
- [🔧 技术实现](#技术实现)
- [📊 使用示例](#使用示例)
- [🎯 最佳实践](#最佳实践)
- [🔄 相关资源](#相关资源)

---

## 🎯 组件概述

UserProfile组件是一个用于展示用户基本信息的React组件，包含用户头像、姓名、邮箱显示和编辑功能。

### 主要特性
- **头像显示**：支持用户头像展示
- **信息展示**：显示用户姓名和邮箱
- **编辑功能**：提供编辑按钮触发更新操作
- **响应式设计**：适配不同屏幕尺寸

## 🔧 技术实现

### 核心代码
```typescript
01  import React from 'react';
02  
03  interface UserProfileProps {
04    user: {
05      avatar: string;
06      name: string;
07      email: string;
08    };
09    onUpdate: (user: any) => void;
10  }
11  
12  const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
13    return (
14      <div className="user-profile">
15        <img src={user.avatar} alt={user.name} />
16        <h2>{user.name}</h2>
17        <p>{user.email}</p>
18        <button onClick={() => onUpdate(user)}>
19          Edit Profile
20        </button>
21      </div>
22    );
23  };
24  
25  export default UserProfile;
```

### 样式定义
```css
.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
}

.user-profile img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 16px;
}

.user-profile button {
  margin-top: 12px;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
```

## 📊 使用示例

### 基本用法
```typescript
import UserProfile from './UserProfile';

function App() {
  const user = {
    avatar: 'https://example.com/avatar.jpg',
    name: 'John Doe',
    email: 'john@example.com'
  };

  const handleUpdate = (user) => {
    console.log('Updating user:', user);
  };

  return (
    <div>
      <UserProfile user={user} onUpdate={handleUpdate} />
    </div>
  );
}
```

### 高级用法
```typescript
import UserProfile from './UserProfile';

function UserManagement() {
  const [users, setUsers] = useState([]);
  
  const handleUserUpdate = (updatedUser) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
    );
  };

  return (
    <div>
      {users.map(user => (
        <UserProfile 
          key={user.id} 
          user={user} 
          onUpdate={handleUserUpdate} 
        />
      ))}
    </div>
  );
}
```

## 🎯 最佳实践

### 使用建议
1. **数据验证**：在使用前确保user对象包含必需的字段
2. **错误处理**：添加头像加载失败的处理逻辑
3. **无障碍访问**：为img标签添加适当的alt属性
4. **性能优化**：对于大量用户列表，考虑虚拟滚动

### 常见问题
**Q**: 如何处理头像加载失败的情况？
**A**: 可以添加onError事件处理，显示默认头像

**Q**: 组件是否支持主题切换？
**A**: 可以通过CSS变量或props传递主题配置

## 🔄 相关资源

- **React文档**：[React官方文档](https://reactjs.org/)
- **组件设计**：[React组件设计模式](https://reactpatterns.com/)
- **样式解决方案**：[CSS Modules](https://css-modules.github.io/)

---

*这是一个标准化的React组件模板，提供了完整的组件实现和使用指南。*
```

## 🛠️ 自动化转换脚本

### 批量转换脚本
```bash
#!/bin/bash
# batch-convert.sh

echo "🔄 开始批量转换内容..."

COLLECTION_BOX="collection-box"
UNSORTED="$COLLECTION_BOX/unsorted"
PROCESSED="$COLLECTION_BOX/processed-logs"
TEMPLATES="$COLLECTION_BOX/templates"

# 创建处理结果目录
mkdir -p "$PROCESSED"
mkdir -p "$PROCESSED/success"
mkdir -p "$PROCESSED/failed"

# 处理未分类内容
process_file() {
    local file="$1"
    local filename=$(basename "$file")
    local extension="${filename##*.}"
    
    echo "📄 处理文件: $filename"
    
    # 跳过非markdown文件
    if [[ "$extension" != "md" && "$extension" != "txt" ]]; then
        echo "⚠️  跳过非markdown文件: $filename"
        return 1
    fi
    
    # 分析文件类型和内容
    local analysis=$(analyze-content.sh "$file")
    local category=$(echo "$analysis" | jq -r '.category')
    local complexity=$(echo "$analysis" | jq -r '.complexity')
    
    # 生成标准化文件名
    local new_name=$(generate-filename.sh "$filename" "$category" "$complexity")
    local target_path="$COLLECTION_BOX/pending-categorization/$category/$new_name"
    
    # 执行转换
    if convert-content.sh "$file" "$target_path"; then
        echo "✅ 转换成功: $new_name"
        mv "$file" "$PROCESSED/success/"
        return 0
    else
        echo "❌ 转换失败: $filename"
        mv "$file" "$PROCESSED/failed/"
        return 1
    fi
}

# 批量处理
for subdir in snippets templates prompts resources; do
    target_dir="$UNSORTED/$subdir"
    if [ -d "$target_dir" ]; then
        echo "📁 处理 $subdir 目录..."
        
        for file in "$target_dir"/*; do
            if [ -f "$file" ]; then
                process_file "$file"
            fi
        done
    fi
done

echo "✅ 批量转换完成"
```

### 内容分析脚本
```bash
#!/bin/bash
# analyze-content.sh

FILE="$1"

if [ ! -f "$FILE" ]; then
    echo "错误：文件不存在: $FILE"
    exit 1
fi

# 分析文件内容
content=$(cat "$FILE")

# 检测内容类型
if echo "$content" | grep -q "import\|function\|class\|const\|let\|var"; then
    type="code"
elif echo "$content" | grep -q "template\|guide\|tutorial\|how to"; then
    type="guide"
elif echo "$content" | grep -q "config\|settings\|yaml\|json"; then
    type="config"
else
    type="resource"
fi

# 检测技术领域
if echo "$content" | grep -q "react\|vue\|angular\|jsx\|tsx"; then
    category="frontend"
elif echo "$content" | grep -q "api\|database\|server\|express\|django"; then
    category="backend"
elif echo "$content" | grep -q "test\|jest\|cypress\|mock"; then
    category="testing"
elif echo "$content" | grep -q "architecture\|design.*pattern\|microservice"; then
    category="architecture"
elif echo "$content" | grep -q "docker\|kubernetes\|ci/cd\|deploy"; then
    category="devops"
else
    category="general"
fi

# 评估复杂度
lines=$(echo "$content" | wc -l)
if [ $lines -lt 50 ]; then
    complexity="beginner"
elif [ $lines -lt 200 ]; then
    complexity="intermediate"
else
    complexity="advanced"
fi

# 输出JSON格式的分析结果
cat << EOF
{
    "type": "$type",
    "category": "$category",
    "complexity": "$complexity",
    "lines": $lines,
    "filename": "$(basename "$FILE")"
}
EOF
```

---

*这个结构化转换模板确保收集箱中的内容能够转换为标准化的格式，提升知识库的整体质量和一致性。* 🔄✨