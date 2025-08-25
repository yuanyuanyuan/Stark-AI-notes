# MCP TypeScript SDK 接入和使用文档

## 概述

Model Context Protocol (MCP) TypeScript SDK 是 Anthropic 官方提供的 TypeScript 实现，用于构建符合 MCP 标准的服务器和客户端。MCP 允许应用程序以标准化方式为 LLM 提供上下文，将上下文提供与实际 LLM 交互分离。

### 核心特性

- **完整协议实现**: 支持所有 MCP 协议消息和生命周期事件
- **多传输协议**: 支持 stdio、Streamable HTTP、SSE、WebSocket
- **认证集成**: 支持 OAuth 2.0 和 bearer token 认证
- **高级功能**: 会话管理、采样、资源链接等
- **TypeScript 优先**: 完整的类型安全和现代 TypeScript 支持

## 安装要求

### 环境要求
- Node.js v18.x 或更高版本
- TypeScript 4.9+ (推荐)
- npm 或 yarn 包管理器

### 安装命令

```bash
npm install @modelcontextprotocol/sdk
```

### 依赖项

主要依赖包：
- `zod`: 用于输入验证和模式定义
- `express`: HTTP 服务器支持
- `cors`: CORS 中间件支持
- `eventsource`: Server-Sent Events 支持
- `ws`: WebSocket 支持

## 快速开始

### 创建简单的 MCP 服务器

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 创建 MCP 服务器实例
const server = new McpServer({
  name: "demo-server",
  version: "1.0.0"
});

// 注册工具 - 加法计算器
server.registerTool("add",
  {
    title: "加法工具",
    description: "两个数字相加",
    inputSchema: { a: z.number(), b: z.number() }
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

// 注册动态资源 - 问候语生成器
server.registerResource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  { 
    title: "问候语资源",
    description: "动态问候语生成器"
  },
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `你好, ${name}!`
    }]
  })
);

// 启动 stdio 传输
const transport = new StdioServerTransport();
await server.connect(transport);
```

## 核心概念

### 服务器 (Server)

`McpServer` 是 MCP 协议的核心接口，处理连接管理、协议合规性和消息路由：

```typescript
const server = new McpServer({
  name: "my-app",
  version: "1.0.0"
});
```

### 资源 (Resources)

资源用于向 LLM 暴露数据，类似于 REST API 中的 GET 端点：

```typescript
// 静态资源
server.registerResource(
  "config",
  "config://app",
  {
    title: "应用配置",
    description: "应用配置数据",
    mimeType: "text/plain"
  },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "应用配置内容"
    }]
  })
);

// 动态资源带参数
server.registerResource(
  "user-profile",
  new ResourceTemplate("users://{userId}/profile", { list: undefined }),
  {
    title: "用户资料",
    description: "用户个人信息"
  },
  async (uri, { userId }) => ({
    contents: [{
      uri: uri.href,
      text: `用户 ${userId} 的资料数据`
    }]
  })
);
```

### 工具 (Tools)

工具允许 LLM 通过服务器执行操作，可以执行计算和产生副作用：

```typescript
// 简单工具
server.registerTool(
  "calculate-bmi",
  {
    title: "BMI 计算器",
    description: "计算身体质量指数",
    inputSchema: {
      weightKg: z.number(),
      heightM: z.number()
    }
  },
  async ({ weightKg, heightM }) => ({
    content: [{
      type: "text",
      text: String(weightKg / (heightM * heightM))
    }]
  })
);

// 异步 API 调用工具
server.registerTool(
  "fetch-weather",
  {
    title: "天气查询",
    description: "获取城市天气数据",
    inputSchema: { city: z.string() }
  },
  async ({ city }) => {
    const response = await fetch(`https://api.weather.com/${city}`);
    const data = await response.text();
    return {
      content: [{ type: "text", text: data }]
    };
  }
);
```

### 提示词 (Prompts)

提示词是可重用的模板，帮助 LLM 有效与服务器交互：

```typescript
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";

server.registerPrompt(
  "review-code",
  {
    title: "代码审查",
    description: "审查代码的最佳实践和潜在问题",
    argsSchema: { code: z.string() }
  },
  ({ code }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `请审查以下代码：\n\n${code}`
      }
    }]
  })
);
```

### 自动完成 (Completions)

MCP 支持参数自动完成，帮助用户填写提示词参数和资源模板参数：

```typescript
// 上下文感知的自动完成
server.registerPrompt(
  "team-greeting",
  {
    title: "团队问候",
    description: "为团队成员生成问候语",
    argsSchema: {
      department: completable(z.string(), (value) => {
        return ["engineering", "sales", "marketing", "support"].filter(d => d.startsWith(value));
      }),
      name: completable(z.string(), (value, context) => {
        const department = context?.arguments?.["department"];
        if (department === "engineering") {
          return ["Alice", "Bob", "Charlie"].filter(n => n.startsWith(value));
        }
        return ["Guest"].filter(n => n.startsWith(value));
      })
    }
  },
  ({ department, name }) => ({
    messages: [{
      role: "assistant",
      content: {
        type: "text",
        text: `你好 ${name}, 欢迎加入 ${department} 团队!`
      }
    }]
  })
);
```

## 传输协议

### stdio 传输

适用于命令行工具和直接集成：

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Streamable HTTP 传输

适用于远程服务器，支持会话管理：

```typescript
import express from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const app = express();
app.use(express.json());

// 会话管理
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        transports[sessionId] = transport;
      }
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: '无效的会话 ID' },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});
```

### CORS 配置

对于浏览器客户端，需要配置 CORS：

```typescript
import cors from 'cors';

app.use(cors({
  origin: '*',
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['Content-Type', 'mcp-session-id'],
}));
```

## 高级功能

### 采样 (Sampling)

服务器可以向支持采样的客户端请求 LLM 补全：

```typescript
// 使用 LLM 采样总结文本
mcpServer.registerTool(
  "summarize",
  {
    description: "使用 LLM 总结任何文本",
    inputSchema: { text: z.string().describe("要总结的文本") }
  },
  async ({ text }) => {
    const response = await mcpServer.server.createMessage({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `请简洁地总结以下文本：\n\n${text}`
        }
      }],
      maxTokens: 500,
    });

    return {
      content: [{
        type: "text",
        text: response.content.type === "text" ? response.content.text : "无法生成总结"
      }]
    };
  }
);
```

### 资源链接 (ResourceLinks)

工具可以返回 `ResourceLink` 对象来引用资源而不嵌入完整内容：

```typescript
server.registerTool(
  "list-files",
  {
    title: "文件列表",
    description: "列出项目文件",
    inputSchema: { pattern: z.string() }
  },
  async ({ pattern }) => ({
    content: [
      { type: "text", text: `找到匹配 "${pattern}" 的文件：` },
      {
        type: "resource_link",
        uri: "file:///project/README.md",
        name: "README.md",
        mimeType: "text/markdown",
        description: 'README 文件'
      }
    ]
  })
);
```

## 部署策略

### 单机部署

```typescript
// 简单的 stdio 部署
const server = new McpServer({ name: "my-server", version: "1.0.0" });
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 分布式部署

```typescript
// 使用会话管理的 HTTP 部署
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// 实现会话持久化和状态管理
app.post('/mcp', async (req, res) => {
  // 会话管理和状态恢复逻辑
});
```

### 容器化部署

Dockerfile 示例：

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## 示例应用

### Echo 服务器

简单的回声服务器示例：

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "echo-server",
  version: "1.0.0"
});

server.registerTool("echo",
  {
    title: "回声工具",
    description: "回声输入文本",
    inputSchema: { text: z.string() }
  },
  async ({ text }) => ({
    content: [{ type: "text", text }]
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

### SQLite 浏览器

数据库浏览示例：

```typescript
import sqlite3 from "sqlite3";

server.registerTool("query-sqlite",
  {
    title: "SQLite 查询",
    description: "执行 SQLite 数据库查询",
    inputSchema: { query: z.string() }
  },
  async ({ query }) => {
    const db = new sqlite3.Database("database.db");
    const results = await new Promise((resolve, reject) => {
      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(results, null, 2)
      }]
    };
  }
);
```

## 最佳实践

### 错误处理

```typescript
// 统一的错误处理
server.registerTool("safe-operation",
  { /* 配置 */ },
  async (params) => {
    try {
      // 业务逻辑
      return { content: [{ type: "text", text: "成功" }] };
    } catch (error) {
      return {
        content: [{
          type: "text", 
          text: `错误: ${error.message}`
        }],
        isError: true
      };
    }
  }
);
```

### 性能优化

```typescript
// 使用资源链接避免大文件传输
server.registerTool("get-large-file",
  { /* 配置 */ },
  async () => ({
    content: [{
      type: "resource_link",
      uri: "file:///large/data.json",
      name: "data.json",
      mimeType: "application/json",
      description: '大型数据文件'
    }]
  })
);
```

### 安全考虑

```typescript
// 输入验证和清理
server.registerTool("safe-query",
  {
    inputSchema: {
      input: z.string().max(100).regex(/^[a-zA-Z0-9\s]+$/)
    }
  },
  async ({ input }) => {
    // 安全的处理逻辑
  }
);
```

## 故障排除

### 常见问题

1. **连接问题**: 检查传输协议配置和端口
2. **认证失败**: 验证 OAuth 配置和令牌
3. **性能问题**: 使用资源链接优化大文件传输
4. **会话管理**: 确保会话 ID 正确传递

### 调试模式

```typescript
// 启用详细日志
const server = new McpServer({
  name: "debug-server",
  version: "1.0.0",
  debug: true
});
```

## 扩展和自定义

### 自定义传输协议

```typescript
import { ServerTransport } from "@modelcontextprotocol/sdk/server/transport.js";

class CustomTransport implements ServerTransport {
  // 实现传输接口
}
```

### 插件系统

```typescript
// 模块化插件架构
function createDatabasePlugin(connectionString: string) {
  return {
    name: "database",
    tools: [/* 工具定义 */],
    resources: [/* 资源定义 */]
  };
}
```

## 版本兼容性

### 向后兼容

SDK 保持向后兼容性，旧 API 仍然可用：

```typescript
// 新 API (推荐)
server.registerTool("new-tool", config, handler);

// 旧 API (兼容)
server.tool("old-tool", "description", config, handler);
```

## 资源

- [官方文档](https://modelcontextprotocol.io)
- [GitHub 仓库](https://github.com/modelcontextprotocol/typescript-sdk)
- [示例代码](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/examples)
- [社区支持](https://github.com/modelcontextprotocol/typescript-sdk/discussions)

---

*本文档基于 @modelcontextprotocol/sdk 1.17.4 版本编写*