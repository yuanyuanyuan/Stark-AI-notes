# main.prompt.md - 中央控制中枢

## 🎯 目标

作为整个 AI 开发指令库的中央控制中枢，`main.prompt.md` 负责接收用户指令，协调和调度各个 Agent，并管理整个开发流程。

## ⚙️ 核心功能

1.  **指令接收和解析:**  接收用户的自然语言开发指令，并解析成结构化的任务信息。
2.  **Agent 调度:**  根据任务类型，将任务分配给相应的 Agent (例如 `code_agent.md`, `review_agent.md` 等) 进行处理。
3.  **上下文管理:**  维护开发过程的上下文信息，确保 Agent 之间协同工作，并保持对话的连贯性。
4.  **流程控制:**  控制整个开发流程的执行顺序，例如代码生成 -> 代码审查 -> 测试用例生成 -> 文档生成。
5.  **结果汇总和反馈:**  收集各个 Agent 的执行结果，进行汇总，并以清晰的方式反馈给用户。

## 🧩 模块组成

1.  **指令解析模块:**
    *   **功能:**  接收用户输入的自然语言指令，解析成结构化的任务信息。
    *   **实现思路:**  关键词识别, 实体提取, 意图识别 (NER, 规则匹配, 意图分类模型)。
    *   **输出:**  结构化的任务信息 (JSON 格式)。
        ```json
        {
          "taskType": "create_component",
          "componentName": "Button",
          "parameters": {
            "textColor": "red"
          }
        }
        ```

2.  **Agent 调度逻辑:**
    *   **功能:**  根据任务类型，将任务分配给相应的 Agent 处理。
    *   **实现思路:**  维护任务类型到 Agent 的路由表, 调度器根据路由表分配任务。
    *   **输出:**  将任务信息传递给相应的 Agent。
        ```json
        // 路由表示例
        {
          "create_component": "code_agent.md",
          "review_code": "review_agent.md",
          "generate_test": "test_agent.md",
          "debug_error": "debug_agent.md",
          "generate_doc": "doc_agent.md"
        }
        ```

3.  **上下文管理机制:**
    *   **功能:**  维护开发过程的上下文信息 (任务 ID, 状态, 历史指令, 用户偏好, 项目配置等)。
    *   **实现思路:**  全局上下文对象 (内存/数据库存储), 上下文 ID, 上下文更新, 上下文传递。
    *   **输出:**  维护和更新全局上下文对象。

4.  **输出格式定义:**
    *   **功能:**  定义指令库输出结果的格式，方便用户阅读和理解。
    *   **实现思路:**  Markdown 格式, 结构化输出 (代码块, JSON), 清晰的反馈信息 (状态, 错误, 警告, 建议)。
    *   **输出:**  格式化的输出结果 (Markdown 文本)。

## 📝 使用说明

### 指令处理流程

1. **阶段一：配置生成和确认**
   * 用户输入自然语言指令，例如：`创建 Button 组件`
   * 系统解析指令并生成配置 JSON
   * 展示配置给用户确认或修改
   
2. **阶段二：代码生成**
   * 用户确认配置后，系统调用对应的 agent
   * agent 根据确认的配置生成代码
   * 返回生成的代码给用户

### Agent 调用流程

1. **Agent 位置**
   * 所有 agent 文件位于 `ai-dev-mvp/agents/` 目录下
   * 每个 agent 对应一个 `.md` 文件，例如：
     ```
     ai-dev-mvp/agents/
       ├── code_agent.md    # 代码生成
       ├── review_agent.md  # 代码审查
       ├── test_agent.md    # 测试用例生成
       ├── debug_agent.md   # 错误诊断
       └── doc_agent.md     # 文档生成
     ```

2. **Agent 调用方式**
   * 系统根据任务类型查找对应的 agent 文件
   * 读取 agent 文件内容
   * 将配置 JSON 传递给 agent
   * 等待 agent 执行完成并返回结果
   ```json
   {
     "agentPath": "ai-dev-mvp/agents/code_agent.md",
     "config": {
       "taskType": "create_component",
       "componentName": "Button",
       // ... 其他配置
     }
   }
   ```

3. **Agent 执行结果**
   * 成功：返回生成的代码或执行结果
   * 失败：返回错误信息和错误类型
   ```json
   {
     "status": "success",
     "result": {
       "files": [
         {
           "path": "components/Button/index.tsx",
           "content": "// 生成的代码..."
         },
         {
           "path": "components/Button/index.css",
           "content": "/* 生成的样式... */"
         }
       ]
     }
   }
   ```
   或
   ```json
   {
     "status": "error",
     "error": {
       "type": "VALIDATION_ERROR",
       "message": "缺少必要的配置字段：componentName"
     }
   }
   ```

4. **Agent 间协作**
   * 一个任务可能需要多个 agent 协作
   * 例如：创建组件 -> 代码审查 -> 生成测试
   * 系统会按照预定义的流程顺序调用 agent
   ```json
   {
     "workflow": [
       {
         "agent": "code_agent.md",
         "config": { /* 代码生成配置 */ }
       },
       {
         "agent": "review_agent.md",
         "config": { /* 代码审查配置 */ }
       },
       {
         "agent": "test_agent.md",
         "config": { /* 测试生成配置 */ }
       }
     ]
   }
   ```

### 指令示例

1. **创建组件**
```bash
# 用户输入
创建 Button 组件

# 系统生成配置
{
  "taskType": "create_component",
  "componentName": "Button",
  "framework": "react",
  "language": "typescript",  # 或 "javascript"
  "style": "css-module",
  "parameters": {
    "props": {
      "text": "string",
      "onClick": "() => void",
      "variant": ["primary", "secondary"]
    }
  }
}

# 用户确认后，系统调用 code_agent.md 生成代码
```

2. **修改组件**
```bash
# 用户输入
为 Button 组件添加 size 属性

# 系统生成配置
{
  "taskType": "modify_component",
  "componentName": "Button",
  "modification": {
    "type": "add_prop",
    "prop": {
      "name": "size",
      "type": "string",
      "options": ["small", "medium", "large"],
      "default": "medium"
    }
  }
}

# 用户确认后，系统调用 code_agent.md 修改代码
```

3. **生成测试**
```bash
# 用户输入
为 Button 组件生成测试用例

# 系统生成配置
{
  "taskType": "generate_test",
  "componentName": "Button",
  "testFramework": "jest",
  "testLibrary": "testing-library/react",
  "testCases": [
    "render_with_text",
    "click_handler",
    "variant_styles",
    "size_styles"
  ]
}

# 用户确认后，系统调用 test_agent.md 生成测试代码
```

### 配置确认机制

1. **配置展示**
   * 系统会以格式化的 JSON 形式展示解析后的配置
   * 配置中的每个字段都会有注释说明

2. **用户确认选项**
   * `确认` - 使用当前配置继续
   * `修改` - 修改配置中的特定字段
   * `取消` - 取消当前操作
   * `帮助` - 显示配置字段说明

3. **配置修改**
   * 用户可以直接编辑 JSON 配置
   * 系统会验证修改后的配置是否有效

### 错误处理

1. **配置阶段错误**
   * 指令解析失败
   * 配置验证失败
   * 配置字段缺失

2. **执行阶段错误**
   * Agent 调用失败
   * 代码生成失败
   * 文件操作失败

每种错误都会返回详细的错误信息和可能的解决方案。

### 使用提示

1. **指令建议**
   * 使用清晰、简洁的描述
   * 一次只执行一个操作
   * 指定必要的参数和选项

2. **配置修改建议**
   * 仔细检查生成的配置
   * 确保所有必要字段都已正确设置
   * 参考配置模板和示例

3. **最佳实践**
   * 先确认配置再生成代码
   * 保存常用的配置模板
   * 记录错误和解决方案 