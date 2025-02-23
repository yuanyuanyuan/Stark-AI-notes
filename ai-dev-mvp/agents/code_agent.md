# agents/code_agent.md - 核心代码生成Agent

## ⚡ 目标

`code_agent.md` 负责根据用户需求和代码模板，生成高质量的 React 代码。

## ⚙️ 核心功能

1.  **代码生成需求理解:**  理解 `main.prompt.md` 传递过来的代码生成需求。
2.  **代码模板选择:**  从 `templates/code_template/` 目录下选择合适的代码模板。
3.  **模板参数填充:**  根据用户需求，动态填充代码模板中的参数。
4.  **代码生成和输出:**  生成最终的 React 代码，并输出给 `main.prompt.md`。
5.  **复杂代码逻辑处理:**  处理状态管理、数据请求、表单处理等复杂代码逻辑 (MVP 暂不重点考虑)。

## 🧩 模块组成

1.  **需求解析模块:**
    *   **功能:**  解析 `main.prompt.md` 传递的任务信息 (JSON)，提取代码生成参数。
    *   **输入:**  结构化的任务信息 (JSON)。
    *   **实现思路:**  JSON 解析, 参数提取, 需求校验。
    *   **输出:**  解析后的任务参数 (字典/对象)。

2.  **模板选择模块:**
    *   **功能:**  根据任务参数，从 `templates/code_template/` 选择合适的代码模板。
    *   **输入:**  解析后的任务参数 (例如 `taskType`, `componentName`)。
    *   **实现思路:**  模板路径构建, 模板文件查找, 模板选择策略, 模板不存在处理。
    *   **输出:**  选定的代码模板文件路径列表。
    *   **模板位置映射:**
        ```json
        {
          "create_component": {
            "baseDir": "../templates/code_template/components",
            "files": {
              "component": "{{componentName}}/index.tsx",
              "style": "{{componentName}}/index.css",
              "test": "../../templates/tests_template/components/{{componentName}}.test.tsx"
            }
          },
          "create_page": {
            "baseDir": "../templates/code_template",
            "files": {
              "page": "page.tsx",
              "style": "index.css"
            }
          },
          "create_hook": {
            "baseDir": "../templates/code_template/hooks",
            "files": {
              "hook": "{{hookName}}.ts",
              "test": "../../templates/tests_template/hooks/{{hookName}}.test.ts"
            }
          }
        }
        ```

3.  **参数填充模块:**
    *   **功能:**  将参数填充到代码模板文件中，生成最终代码。
    *   **输入:**  代码模板文件路径列表, 解析后的任务参数。
    *   **实现思路:**  模板读取, 参数替换 (字符串替换/模板引擎), 代码生成。
    *   **输出:**  填充参数后的代码内容 (字符串)。
    *   **模板参数示例:**
        ```json
        {
          "componentName": "Button",
          "props": {
            "text": {
              "type": "string",
              "required": true
            },
            "onClick": {
              "type": "() => void",
              "required": false
            },
            "variant": {
              "type": "primary | secondary",
              "default": "primary"
            }
          },
          "styles": {
            "primaryButton": {
              "backgroundColor": "#007bff",
              "color": "white"
            },
            "secondaryButton": {
              "backgroundColor": "#6c757d",
              "color": "white"
            }
          }
        }
        ```

4.  **代码生成引擎:**
    *   **功能:**  组织生成的代码，例如创建文件 (MVP 暂不实现)。
    *   **输入:**  填充参数后的代码内容 (字符串)。
    *   **实现思路:**  代码组织, 文件写入 (可选)。
    *   **输出:**  生成的代码 (字符串)。
    *   **输出格式:**
        ```json
        {
          "status": "success",
          "result": {
            "files": [
              {
                "path": "components/Button/index.tsx",
                "content": "// TypeScript React 组件代码...",
                "dependencies": {
                  "react": "^18.0.0",
                  "@types/react": "^18.0.0"
                }
              },
              {
                "path": "components/Button/index.css",
                "content": "/* CSS Module 样式代码... */"
              }
            ]
          }
        }
        ```

5.  **错误处理模块:**
    *   **功能:**  处理 `code_agent.md` 执行过程中的错误，并反馈给 `main.prompt.md`。
    *   **输入:**  各个模块可能抛出的错误信息。
    *   **实现思路:**  错误捕获 (try-catch), 错误分类, 错误信息生成, 错误反馈。
    *   **输出:**  错误信息 (JSON/字符串)。
    *   **错误类型:**
        ```json
        {
          "status": "error",
          "error": {
            "type": "TEMPLATE_NOT_FOUND",
            "message": "找不到组件模板文件",
            "details": {
              "componentName": "Button",
              "templatePath": "../templates/code_template/components/Button/index.tsx"
            },
            "suggestions": [
              "检查组件名称是否正确",
              "确认模板文件是否存在",
              "检查模板目录结构"
            ]
          }
        }
        ```

## 📝 使用说明

`code_agent.md` 由 `main.prompt.md` 调度，接收代码生成任务和相关参数，并返回生成的代码。

### 模板目录结构

```
ai-dev-mvp/
├── agents/
│   └── code_agent.md
└── templates/
    ├── code_template/
    │   ├── components/
    │   │   └── Button/
    │   │       ├── index.tsx
    │   │       └── index.css
    │   ├── hooks/
    │   ├── page.tsx
    │   └── index.css
    └── tests_template/
        └── components/
            └── Button.test.tsx
``` 