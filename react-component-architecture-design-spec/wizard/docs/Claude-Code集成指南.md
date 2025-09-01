# React架构向导 - Claude Code集成指南

## 快速开始

### 1. 安装向导

```bash
# 方式1：全局安装
npm install -g react-arch-wizard-mcp

# 方式2：项目本地安装
npm install --save-dev react-arch-wizard-mcp
```

### 2. 配置Claude Code

在项目根目录创建或更新 `.claude/mcp.json`：

```json
{
  "mcpServers": {
    "react-arch-wizard": {
      "command": "npx",
      "args": ["react-arch-wizard-mcp"],
      "env": {
        "WIZARD_DATA_PATH": "./react-component-architecture-design-spec/wizard/data"
      }
    }
  }
}
```

### 3. 重启Claude Code

配置完成后，重启Claude Code以加载MCP服务。

## 使用方法

### 方式1：自然语言触发

直接在对话中描述你的需求：

```
用户：我想创建一个任务管理系统

Claude：我来帮你设计React项目架构。让我启动智能架构向导...
[自动调用 start_wizard]
```

### 方式2：直接调用工具

使用MCP工具名称：

```
用户：使用 mcp__react-arch-wizard__start_wizard 创建一个电商项目

Claude：正在启动架构设计向导...
```

### 方式3：命令式触发

创建自定义命令（可选）：

```
用户：/wizard 创建任务管理系统

Claude：启动架构向导，开始设计任务管理系统...
```

## 完整使用流程示例

### Step 1: 启动向导

```markdown
用户：我想做一个团队协作的任务管理工具

Claude：我来帮你设计React项目架构。让我启动智能架构向导：

[调用 mcp__react-arch-wizard__start_wizard]

🚀 架构设计向导已启动！

**你想做什么类型的任务管理系统？**

1. 🏠 个人任务管理（像Todo List）
2. 👥 团队协作工具（像Trello）
3. 🏢 项目管理平台（像Jira）

请选择或描述你的需求。
```

### Step 2: 回答问题

```markdown
用户：团队协作工具，大概5-10人的小团队用

Claude：[调用 mcp__react-arch-wizard__answer_question]

很好！小团队协作需要灵活性。

**哪些是核心功能？**（可多选）

✅ 任务创建和分配
✅ 实时进度更新
□ 在线支付
✅ 文件上传
□ 数据分析报表
✅ 实时通知

你需要哪些功能？
```

### Step 3: 处理盲点提醒

```markdown
Claude：💡 发现一个你可能没考虑到的点：

**数据持久化方案**

团队协作需要数据共享，你打算如何存储数据？

1. ☁️ 云端存储（推荐）- 支持多设备同步
2. 💾 本地存储 - 仅单机使用
3. 🔄 混合方案 - 离线优先，在线同步

用户：云端存储

Claude：明智的选择！云端存储确保团队数据同步。
```

### Step 4: 验证需求

```markdown
Claude：[调用 mcp__react-arch-wizard__validate_requirements]

✅ 需求验证通过！

**需求摘要：**
- 项目类型：团队协作任务管理
- 团队规模：5-10人
- 核心功能：任务管理、实时更新、文件上传、通知
- 数据方案：云端存储
- 架构建议：模块化架构，支持扩展

准备好生成架构了吗？
```

### Step 5: 生成架构

```markdown
用户：是的，生成架构

Claude：[调用 mcp__react-arch-wizard__generate_architecture]

🎉 架构生成完成！

**架构概览：**
```
src/
├── features/              # 功能模块
│   ├── tasks/            # 任务管理
│   ├── teams/            # 团队管理
│   ├── notifications/    # 通知系统
│   └── files/            # 文件管理
├── shared/               # 共享资源
│   ├── components/       # 通用组件
│   ├── hooks/           # 自定义Hooks
│   └── utils/           # 工具函数
├── core/                # 核心功能
│   ├── api/             # API服务
│   ├── auth/            # 认证
│   └── store/           # 状态管理
└── pages/               # 页面组件
```

**包含组件：** 28个
**技术栈：** React 18, TypeScript, Zustand, TailwindCSS
```

### Step 6: 导出项目

```markdown
用户：导出到 ./my-task-manager

Claude：[调用 mcp__react-arch-wizard__export_project]

✨ 项目已成功导出！

**项目统计：**
- 总文件数：52
- 组件文件：28
- 测试文件：15
- 配置文件：9

**快速开始：**
```bash
cd ./my-task-manager
npm install
npm run dev
```

项目已准备就绪，访问 http://localhost:3000 查看！
```

## 工具详细说明

### start_wizard
启动新的架构设计会话

**参数：**
- `projectName` (必需): 项目名称
- `reset` (可选): 是否重置已存在的会话

**示例：**
```javascript
{
  projectName: "my-app",
  reset: false
}
```

### answer_question
回答向导问题

**参数：**
- `sessionId` (必需): 会话ID
- `answer` (必需): 回答内容

**示例：**
```javascript
{
  sessionId: "session_123",
  answer: "团队协作工具"
}
```

### validate_requirements
验证需求完整性和合理性

**参数：**
- `sessionId` (必需): 会话ID

**返回：**
- 验证结果
- 问题列表
- 改进建议

### generate_architecture
生成架构设计

**参数：**
- `sessionId` (必需): 会话ID
- `confirm` (可选): 是否确认生成

**返回：**
- 架构结构
- 组件列表
- 技术栈建议

### export_project
导出项目代码

**参数：**
- `sessionId` (必需): 会话ID
- `outputPath` (必需): 输出路径
- `includeTests` (可选): 包含测试文件
- `includeExamples` (可选): 包含示例代码

## 高级功能

### 1. 会话管理

```markdown
# 获取当前会话状态
用户：查看当前设计进度

Claude：[调用 get_session_summary]
当前进度：75%
阶段：功能选择
已收集：项目类型、团队规模
待完成：技术偏好、部署方式
```

### 2. 回退和跳过

```markdown
# 返回上一个问题
用户：我想修改之前的选择

Claude：[调用 back_to_previous]
返回到：团队规模选择

# 跳过当前问题
用户：跳过这个问题

Claude：[调用 skip_question]
已跳过，使用默认配置
```

### 3. 查看资源

```markdown
# 查看可用的架构模式
用户：有哪些架构模式可选？

Claude：[读取 wizard://patterns/list]
可用架构模式：
- 模块化架构（推荐用于中大型项目）
- 功能域架构（适合复杂业务）
- 分层架构（传统但稳定）
```

## 自定义配置

### 环境变量

```bash
# 自定义数据路径
WIZARD_DATA_PATH=/custom/path/to/data

# 调试模式
WIZARD_DEBUG=true

# 会话超时时间（分钟）
WIZARD_SESSION_TIMEOUT=60

# 会话持久化设置
WIZARD_AUTO_SAVE=true
WIZARD_SAVE_INTERVAL=30000

# 外部工具启用
WIZARD_ENABLE_CONTEXT7=true
WIZARD_ENABLE_EXA=true
WIZARD_ENABLE_DEEPWIKI=true

# 模板路径
WIZARD_CUSTOM_TEMPLATES=/path/to/templates
```

### 扩展模板

在 `wizard/data/templates/` 添加自定义模板：

```handlebars
// custom-component.hbs
import React from 'react'

export const {{componentName}} = () => {
  return <div>{{content}}</div>
}
```

### 添加规则

在 `wizard/data/rules/` 添加验证规则：

```json
{
  "id": "custom-rule",
  "condition": "features.length > 10",
  "message": "功能过多",
  "severity": "warning"
}
```

## 外部工具集成使用

### 1. Context7 - 获取最新框架文档

```markdown
用户：我想用Next.js 14的App Router

Claude：让我获取Next.js 14的最新文档...
[自动调用 mcp__context7__get-library-docs]

根据最新文档，App Router有以下特性：
- 服务端组件默认
- 嵌套路由和布局
- 流式渲染支持
```

### 2. Exa AI - 智能搜索最佳实践

```markdown
用户：任务管理系统有什么最佳实践？

Claude：让我搜索相关的最佳实践...
[自动调用 mcp__exa__web_search_exa]

找到以下最佳实践：
1. 使用看板视图（Kanban）
2. 实施拖拽功能
3. 添加实时协作
```

### 3. DeepWiki - 深度技术研究

```markdown
用户：我想了解Zustand的架构设计

Claude：让我获取Zustand的深度文档...
[自动调用 mcp__mcp-deepwiki__deepwiki_fetch]

Zustand的核心架构：
- 基于订阅模式
- 使用React hooks
- 轻量级状态管理
```

### 4. 组合使用外部工具

```markdown
Claude：为你的任务管理系统，我将：

1. 从Context7获取React 18文档 ✓
2. 通过Exa搜索任务管理最佳实践 ✓  
3. 从DeepWiki获取状态管理方案 ✓

综合分析后的架构建议：
[基于多源信息的智能推荐]
```

## 模板自定义与管理

### 1. 创建自定义模板

#### 组件模板
```handlebars
// templates/custom/MyComponent.hbs
import React from 'react'
{{#if useTypeScript}}
import type { {{componentName}}Props } from './types'
{{/if}}

export const {{componentName}}{{#if useTypeScript}}: React.FC<{{componentName}}Props>{{/if}} = ({
  {{#each props}}
  {{name}},
  {{/each}}
}) => {
  {{#if customHooks}}
  {{#each customHooks}}
  const {{name}} = {{hook}}()
  {{/each}}
  {{/if}}
  
  return (
    <div className="{{className}}">
      {{content}}
    </div>
  )
}
```

#### 架构模板
```json
// templates/architectures/my-pattern.json
{
  "name": "my-custom-pattern",
  "description": "自定义架构模式",
  "structure": {
    "src/": {
      "domains/": "领域模块",
      "infrastructure/": "基础设施",
      "presentation/": "展示层"
    }
  },
  "rules": [
    "领域模块不能依赖展示层",
    "基础设施为其他层提供服务"
  ]
}
```

### 2. 模板继承与覆盖

```yaml
# templates/extended/TaskComponent.yaml
extends: base/Component
overrides:
  imports:
    - "import { DragDropContext } from 'react-beautiful-dnd'"
  props:
    - name: onDragEnd
      type: function
      required: true
  features:
    - draggable
    - sortable
```

### 3. 模板自进化

向导会自动学习你的使用习惯：

```markdown
# 自动记录的使用模式
patterns:
  - 80%的项目选择了TypeScript
  - 65%使用了Tailwind CSS
  - 90%需要用户认证功能

# 基于模式的优化
optimizations:
  - TypeScript设为默认选项
  - 自动推荐Tailwind CSS
  - 认证模块预置在模板中
```

### 4. 模板导入导出

```bash
# 导出自定义模板
wizard export-templates ./my-templates

# 从URL导入模板包
wizard import-templates https://github.com/user/templates

# 从本地导入
wizard import-templates ./downloaded-templates
```

### 5. 团队模板共享

```json
// .wizard/team-config.json
{
  "templateSources": [
    "file:./team-templates",
    "git:https://github.com/team/templates.git",
    "npm:@company/wizard-templates"
  ],
  "autoSync": true,
  "syncInterval": 86400000
}
```

## 常见问题

### Q: 向导没有响应？
**A:** 检查MCP配置是否正确，重启Claude Code。

### Q: 会话丢失了怎么办？
**A:** 使用相同的项目名称重新启动，会自动恢复。

### Q: 如何自定义架构模式？
**A:** 在 `wizard/data/patterns/` 添加新的模式定义。

### Q: 生成的代码不符合团队规范？
**A:** 修改 `wizard/data/templates/` 中的模板文件。

### Q: 如何调试问题？
**A:** 设置 `WIZARD_DEBUG=true` 查看详细日志。

## 故障排除

### 1. MCP服务启动失败

```bash
# 检查Node版本
node --version  # 需要 >= 18

# 重新安装
npm uninstall -g react-arch-wizard-mcp
npm install -g react-arch-wizard-mcp

# 验证安装
npx react-arch-wizard-mcp --version
```

### 2. 工具调用错误

```markdown
错误：工具未找到

解决：
1. 确认MCP配置正确
2. 重启Claude Code
3. 使用完整工具名：mcp__react-arch-wizard__tool_name
```

### 3. 会话超时

```markdown
错误：会话已过期

解决：
1. 重新启动向导
2. 设置更长的超时时间
3. 定期保存会话状态
```

## 最佳实践

### 1. 需求明确
- 开始前想清楚项目目标
- 准备好团队规模、功能列表
- 考虑技术限制和偏好

### 2. 渐进式回答
- 不确定时选择"其他"并说明
- 利用澄清机会完善需求
- 注意盲点提醒

### 3. 验证和调整
- 生成前先预览
- 验证需求的合理性
- 必要时回退修改

### 4. 导出和定制
- 导出后检查代码结构
- 根据需要调整模板
- 保留架构文档

## 多平台使用指南

### 1. Cursor IDE

```json
// .cursor/mcp.json
{
  "mcpServers": {
    "react-arch-wizard": {
      "command": "npx",
      "args": ["react-arch-wizard-mcp"]
    }
  }
}
```

使用方式：
```
@wizard 创建任务管理系统
```

### 2. VS Code + Continue

安装Continue插件后配置：
```json
// .continue/config.json
{
  "models": [...],
  "mcpServers": {
    "react-arch-wizard": {
      "command": "react-arch-wizard-mcp"
    }
  }
}
```

### 3. OpenAI GPTs

通过适配器使用：
```python
# 安装适配器
pip install mcp-openai-adapter

# 配置Actions
{
  "name": "React Wizard",
  "description": "架构设计助手",
  "server": "http://localhost:3000/mcp-adapter"
}
```

### 4. CLI独立使用

```bash
# 安装CLI工具
npm install -g react-wizard-cli

# 直接使用
wizard init my-project

# 交互模式
wizard interactive

# 使用配置文件
wizard --config ./wizard.config.json
```

### 5. JetBrains IDEs

安装插件：
1. 打开 Settings → Plugins
2. 搜索 "React Arch Wizard"
3. 安装并重启IDE
4. 使用快捷键 `Ctrl+Shift+W` 启动

## 更新日志

### v1.0.0 (2024-12)
- 初始版本发布
- 支持5种项目类型
- 10+核心功能选项
- 基础对话流程
- 支持Claude、Cursor、CLI三个平台

### 计划功能
- v1.1.0: 更多架构模式 + VS Code支持
- v1.2.0: 自定义模板支持 + OpenAI适配
- v1.3.0: 可视化预览 + 全平台支持
- v2.0.0: Web界面

## 获取帮助

- **文档**: [GitHub Wiki](https://github.com/your-org/react-arch-wizard)
- **问题**: [GitHub Issues](https://github.com/your-org/react-arch-wizard/issues)
- **讨论**: [Discord社区](https://discord.gg/react-arch-wizard)
- **邮件**: support@react-arch-wizard.dev

---

*文档版本: 1.0.0*
*最后更新: 2024-12*