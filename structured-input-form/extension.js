const vscode = require("vscode");

/**
 * 输出调试日志
 * @param {string} message 日志消息
 * @param {string} [level='info'] 日志级别
 */
function log(message, level = "info") {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);

  // 获取输出通道
  const channel = vscode.window.createOutputChannel("结构化输入");
  channel.appendLine(logMessage);
}

/**
 * 创建并显示 Webview 面板
 * @param {vscode.ExtensionContext} context
 */
function createWebviewPanel(context) {
  log("创建 Webview 面板");
  // 创建并显示 Webview
  const panel = vscode.window.createWebviewPanel(
    "structuredInputPanel",
    "结构化输入",
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  // 设置 Webview 内容
  panel.webview.html = getWebviewContent();

  // 处理来自 Webview 的消息
  panel.webview.onDidReceiveMessage(
    async (message) => {
      log(`收到 Webview 消息: ${JSON.stringify(message)}`);
      switch (message.command) {
        case "submitForm":
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            const formattedText =
              message.text ||
              `# 背景\n${message.background}\n\n# 诉求\n${message.requirement}\n\n# 预期效果\n${message.expectation}`;
            log(`插入文本到编辑器: ${formattedText}`);
            editor.edit((editBuilder) => {
              editBuilder.insert(editor.selection.active, formattedText);
            });
          }
          break;
      }
    },
    undefined,
    context.subscriptions
  );

  return panel;
}

/**
 * 获取 Webview 的 HTML 内容
 */
function getWebviewContent() {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>结构化输入</title>
      <style>
          body {
              padding: 20px;
              font-family: var(--vscode-font-family);
              color: var(--vscode-foreground);
              background-color: var(--vscode-editor-background);
          }
          .input-container {
              margin-bottom: 15px;
          }
          textarea {
              width: 100%;
              padding: 8px;
              margin-top: 5px;
              background-color: var(--vscode-input-background);
              color: var(--vscode-input-foreground);
              border: 1px solid var(--vscode-input-border);
              border-radius: 2px;
              min-height: 120px;
              font-family: 'Courier New', Courier, monospace;
              line-height: 1.4;
              tab-size: 2;
          }
          .markdown-tips {
              font-size: 12px;
              color: var(--vscode-descriptionForeground);
              margin: 4px 0;
          }
          button {
              background-color: var(--vscode-button-background);
              color: var(--vscode-button-foreground);
              border: none;
              padding: 8px 16px;
              cursor: pointer;
              border-radius: 2px;
              margin-right: 8px;
          }
          button:hover {
              background-color: var(--vscode-button-hoverBackground);
          }
          .trigger-info {
              margin-top: 20px;
              font-size: 12px;
              color: var(--vscode-descriptionForeground);
          }
          .preview-container {
              margin-top: 20px;
              display: none;
          }
          .preview-container.show {
              display: block;
          }
          .preview-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
          }
          .preview-title {
              font-weight: bold;
              color: var(--vscode-editor-foreground);
          }
          .preview-actions {
              display: flex;
              gap: 8px;
          }
          .preview-content {
              background-color: var(--vscode-input-background);
              border: 1px solid var(--vscode-input-border);
              border-radius: 2px;
              padding: 12px;
              margin-bottom: 16px;
              white-space: pre-wrap;
              font-family: 'Courier New', Courier, monospace;
          }
          .preview-edit {
              width: 100%;
              min-height: 200px;
              margin-top: 8px;
              display: none;
              font-family: 'Courier New', Courier, monospace;
              line-height: 1.4;
              tab-size: 2;
          }
          .preview-edit.show {
              display: block;
          }
          @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
          }
          .fade-in {
              animation: fadeIn 0.3s ease-in;
          }
          .loading {
              display: inline-block;
              width: 20px;
              height: 20px;
              border: 2px solid var(--vscode-button-foreground);
              border-radius: 50%;
              border-top-color: transparent;
              animation: spin 1s linear infinite;
              margin-right: 8px;
          }
          @keyframes spin {
              to { transform: rotate(360deg); }
          }
          .button-container {
              display: flex;
              align-items: center;
          }
      </style>
  </head>
  <body>
      <div class="input-container">
          <div>背景：</div>
          <div class="markdown-tips">
              支持 Markdown 格式：
              # 一级标题, ## 二级标题
              **重点**, *斜体*
              - 列表项
              \`代码\`
              表格：| 列1 | 列2 |
          </div>
          <textarea id="background" placeholder="请输入背景信息（支持 Markdown 格式）"></textarea>
      </div>
      <div class="input-container">
          <div>诉求：</div>
          <div class="markdown-tips">支持代码块：\\\`\\\`\\\`language
代码内容
\\\`\\\`\\\`</div>
          <textarea id="requirement" placeholder="请输入诉求信息（支持 Markdown 格式）"></textarea>
      </div>
      <div class="input-container">
          <div>预期效果：</div>
          <div class="markdown-tips">支持任务列表：
- [ ] 待办事项
- [x] 已完成</div>
          <textarea id="expectation" placeholder="请输入预期效果（支持 Markdown 格式）"></textarea>
      </div>
      <div class="button-container">
          <button onclick="generateContent()" id="generateBtn">生成内容</button>
          <div id="loading" style="display: none;">
              <div class="loading"></div>
              <span>生成中...</span>
          </div>
      </div>
      
      <div id="previewContainer" class="preview-container">
          <div class="preview-header">
              <div class="preview-title">生成结果</div>
              <div class="preview-actions">
                  <button onclick="toggleEdit()">编辑</button>
                  <button onclick="copyToClipboard()">复制</button>
                  <button onclick="insertToEditor()">插入编辑器</button>
              </div>
          </div>
          <div id="previewContent" class="preview-content"></div>
          <textarea id="previewEdit" class="preview-edit"></textarea>
      </div>

      <div class="trigger-info">
          <p>快捷方式：</p>
          <ul>
              <li>在编辑器中输入 /29</li>
              <li>使用快捷键 Ctrl+Shift+L</li>
              <li>通过命令面板输入"显示结构化输入表单"</li>
              <li>使用 Tab 键在输入框间切换</li>
              <li>Ctrl+Enter 快速生成内容</li>
          </ul>
      </div>

      <script>
          const vscode = acquireVsCodeApi();
          let isEditing = false;

          function generateContent() {
              const background = document.getElementById('background').value;
              const requirement = document.getElementById('requirement').value;
              const expectation = document.getElementById('expectation').value;

              if (!background && !requirement && !expectation) {
                  return;
              }

              // 显示加载动画
              document.getElementById('loading').style.display = 'flex';
              document.getElementById('generateBtn').disabled = true;

              // 模拟生成延迟
              setTimeout(() => {
                  const formattedText = \`# 背景\\n\${background}\\n\\n# 诉求\\n\${requirement}\\n\\n# 预期效果\\n\${expectation}\`;
                  
                  // 更新预览内容
                  document.getElementById('previewContent').textContent = formattedText;
                  document.getElementById('previewEdit').value = formattedText;
                  
                  // 显示预览容器
                  document.getElementById('previewContainer').classList.add('show', 'fade-in');
                  
                  // 隐藏加载动画
                  document.getElementById('loading').style.display = 'none';
                  document.getElementById('generateBtn').disabled = false;

                  // 发送日志消息
                  vscode.postMessage({
                      command: 'log',
                      message: '内容已生成',
                      content: formattedText
                  });
              }, 500);
          }

          function toggleEdit() {
              const previewContent = document.getElementById('previewContent');
              const previewEdit = document.getElementById('previewEdit');
              isEditing = !isEditing;

              if (isEditing) {
                  previewContent.style.display = 'none';
                  previewEdit.classList.add('show');
                  previewEdit.focus();
              } else {
                  previewContent.textContent = previewEdit.value;
                  previewContent.style.display = 'block';
                  previewEdit.classList.remove('show');
              }
          }

          function copyToClipboard() {
              const text = isEditing ? 
                  document.getElementById('previewEdit').value : 
                  document.getElementById('previewContent').textContent;
              
              navigator.clipboard.writeText(text).then(() => {
                  // 显示复制成功提示
                  const originalText = document.querySelector('.preview-title').textContent;
                  document.querySelector('.preview-title').textContent = '已复制到剪贴板';
                  setTimeout(() => {
                      document.querySelector('.preview-title').textContent = originalText;
                  }, 1500);

                  // 发送日志消息
                  vscode.postMessage({
                      command: 'log',
                      message: '内容已复制到剪贴板'
                  });
              });
          }

          function insertToEditor() {
              const text = isEditing ? 
                  document.getElementById('previewEdit').value : 
                  document.getElementById('previewContent').textContent;
              
              vscode.postMessage({
                  command: 'submitForm',
                  text: text
              });
          }

          // 添加快捷键支持
          document.addEventListener('keydown', function(e) {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  generateContent();
              }
          });

          // 初始化完成后发送日志
          vscode.postMessage({
              command: 'log',
              message: 'Webview 界面已初始化'
          });
      </script>
  </body>
  </html>`;
}

/**
 * 激活扩展
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  log('扩展 "structured-input-form" 已激活');

  let panel = null;

  // 注册显示输入表单的命令
  let disposable = vscode.commands.registerCommand(
    "structured-input-form.showInputForm",
    async function () {
      log("执行显示输入表单命令");
      if (panel) {
        panel.reveal();
        log("重新显示已存在的面板");
      } else {
        panel = createWebviewPanel(context);
        log("创建新的输入表单面板");
        panel.onDidDispose(
          () => {
            log("输入表单面板已关闭");
            panel = null;
          },
          null,
          context.subscriptions
        );
      }
    }
  );

  // 将命令添加到上下文中
  context.subscriptions.push(disposable);

  // 注册文本变更事件监听器用于 /29 触发器
  let lastText = "";
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || event.document !== editor.document) return;

      const position = editor.selection.active;
      const line = event.document.lineAt(position.line);
      const lineText = line.text;

      // 检查是否刚刚输入了 /29
      if (lineText.endsWith("/29") && !lastText.endsWith("/29")) {
        log("检测到 /29 触发器");
        // 删除 /29
        editor
          .edit((editBuilder) => {
            const startPos = new vscode.Position(
              position.line,
              position.character - 3
            );
            const endPos = position;
            editBuilder.delete(new vscode.Range(startPos, endPos));
          })
          .then(() => {
            // 触发表单命令
            log("通过 /29 触发器打开输入表单");
            vscode.commands.executeCommand(
              "structured-input-form.showInputForm"
            );
          });
      }
      lastText = lineText;
    })
  );

  log("扩展初始化完成");
}

/**
 * 停用扩展
 */
function deactivate() {
  log("扩展已停用", "info");
}

module.exports = {
  activate,
  deactivate,
};
