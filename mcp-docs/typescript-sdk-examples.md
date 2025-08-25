# MCP TypeScript SDK 实践示例

## 基础示例

### 1. 简单的 Echo 服务器

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 创建 MCP 服务器
const server = new McpServer({
  name: "echo-server",
  version: "1.0.0"
});

// 注册回声工具
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

// 启动 stdio 传输
const transport = new StdioServerTransport();
await server.connect(transport);
console.log("Echo 服务器已启动...");
```

### 2. 计算器服务器

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "calculator-server",
  version: "1.0.0"
});

// 加法工具
server.registerTool("add",
  {
    title: "加法计算",
    description: "两个数字相加",
    inputSchema: { a: z.number(), b: z.number() }
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: `${a} + ${b} = ${a + b}` }]
  })
);

// 乘法工具
server.registerTool("multiply",
  {
    title: "乘法计算",
    description: "两个数字相乘",
    inputSchema: { a: z.number(), b: z.number() }
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: `${a} × ${b} = ${a * b}` }]
  })
);

// 数学常数资源
server.registerResource(
  "math-constants",
  "math://constants",
  {
    title: "数学常数",
    description: "常用数学常数",
    mimeType: "application/json"
  },
  async () => ({
    contents: [{
      uri: "math://constants",
      text: JSON.stringify({
        pi: 3.141592653589793,
        e: 2.718281828459045,
        goldenRatio: 1.618033988749895
      }, null, 2)
    }]
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

## HTTP 服务器示例

### 3. Streamable HTTP 服务器

```typescript
import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const app = express();
app.use(express.json());

// 会话存储
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// 创建 MCP 服务器
const server = new McpServer({
  name: "http-server",
  version: "1.0.0"
});

// 注册时间工具
server.registerTool("get-time",
  {
    title: "获取时间",
    description: "获取当前服务器时间",
    inputSchema: { format: z.string().optional() }
  },
  async ({ format }) => {
    const now = new Date();
    const timeString = format === "iso" ? now.toISOString() : now.toLocaleString();
    return {
      content: [{ type: "text", text: `当前时间: ${timeString}` }]
    };
  }
);

// MCP 请求处理
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

// 启动服务器
app.listen(3000, () => {
  console.log("MCP HTTP 服务器运行在端口 3000");
});
```

### 4. 带 CORS 的 HTTP 服务器

```typescript
import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const app = express();

// CORS 配置
app.use(cors({
  origin: '*',
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['Content-Type', 'mcp-session-id'],
}));

app.use(express.json());

const server = new McpServer({
  name: "cors-server",
  version: "1.0.0"
});

// 注册天气查询工具
server.registerTool("weather",
  {
    title: "天气查询",
    description: "查询城市天气信息",
    inputSchema: { city: z.string() }
  },
  async ({ city }) => ({
    content: [{
      type: "text", 
      text: `城市 ${city} 的天气信息：晴朗，25°C`
    }]
  })
);

// 简化的无状态处理
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });
  
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(3000);
```

## 高级功能示例

### 5. 采样功能示例

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "sampling-server",
  version: "1.0.0"
});

// 使用 LLM 采样的文本总结工具
server.registerTool("summarize",
  {
    title: "文本总结",
    description: "使用 LLM 总结文本内容",
    inputSchema: { text: z.string().describe("要总结的文本") }
  },
  async ({ text }) => {
    // 通过 MCP 采样调用 LLM
    const response = await server.server.createMessage({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `请用中文简洁地总结以下文本：\n\n${text}`
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

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 6. 资源链接示例

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "resource-link-server",
  version: "1.0.0"
});

// 文件列表工具，返回资源链接而不是完整内容
server.registerTool("list-files",
  {
    title: "文件列表",
    description: "列出项目文件",
    inputSchema: { pattern: z.string().optional() }
  },
  async ({ pattern = "" }) => ({
    content: [
      { type: "text", text: `找到匹配 "${pattern}" 的文件：` },
      {
        type: "resource_link",
        uri: "file:///project/README.md",
        name: "README.md",
        mimeType: "text/markdown",
        description: '项目说明文件'
      },
      {
        type: "resource_link",
        uri: "file:///project/package.json",
        name: "package.json",
        mimeType: "application/json",
        description: '项目配置文件'
      }
    ]
  })
);

// 对应的资源处理器
server.registerResource(
  "project-file",
  "file:///project/{filename}",
  {
    title: "项目文件",
    description: "项目文件内容"
  },
  async (uri, { filename }) => ({
    contents: [{
      uri: uri.href,
      text: `这是文件 ${filename} 的模拟内容...`
    }]
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

## 数据库集成示例

### 7. SQLite 数据库浏览器

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import sqlite3 from "sqlite3";

const server = new McpServer({
  name: "sqlite-browser",
  version: "1.0.0"
});

// SQL 查询工具
server.registerTool("query-sql",
  {
    title: "SQL 查询",
    description: "执行 SQLite 数据库查询",
    inputSchema: { 
      query: z.string().describe("SQL 查询语句"),
      database: z.string().optional().describe("数据库文件路径")
    }
  },
  async ({ query, database = "database.db" }) => {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(database);
      
      db.all(query, (err, rows) => {
        db.close();
        
        if (err) {
          resolve({
            content: [{ type: "text", text: `查询错误: ${err.message}` }],
            isError: true
          });
        } else {
          resolve({
            content: [{
              type: "text",
              text: JSON.stringify(rows, null, 2)
            }]
          });
        }
      });
    });
  }
);

// 数据库结构查看工具
server.registerTool("show-tables",
  {
    title: "显示表结构",
    description: "显示数据库中的所有表",
    inputSchema: { database: z.string().optional() }
  },
  async ({ database = "database.db" }) => {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(database);
      
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        db.close();
        
        if (err) {
          resolve({
            content: [{ type: "text", text: `错误: ${err.message}` }],
            isError: true
          });
        } else {
          const tableList = tables.map((t: any) => `- ${t.name}`).join('\n');
          resolve({
            content: [{
              type: "text",
              text: `数据库中的表：\n${tableList}`
            }]
          });
        }
      });
    });
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 8. 用户认证示例

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "auth-server",
  version: "1.0.0"
});

// 模拟用户数据库
const users = new Map([
  ["user1", { password: "pass1", name: "张三" }],
  ["user2", { password: "pass2", name: "李四" }]
]);

// 用户登录工具
server.registerTool("login",
  {
    title: "用户登录",
    description: "用户登录认证",
    inputSchema: {
      username: z.string(),
      password: z.string()
    }
  },
  async ({ username, password }) => {
    const user = users.get(username);
    
    if (!user || user.password !== password) {
      return {
        content: [{ type: "text", text: "用户名或密码错误" }],
        isError: true
      };
    }
    
    // 生成模拟令牌
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    
    return {
      content: [{
        type: "text",
        text: `登录成功！欢迎 ${user.name}，您的令牌：${token}`
      }]
    };
  }
);

// 用户信息资源
server.registerResource(
  "user-info",
  "user://{username}",
  {
    title: "用户信息",
    description: "用户基本信息"
  },
  async (uri, { username }) => {
    const user = users.get(username);
    
    if (!user) {
      return {
        contents: [{
          uri: uri.href,
          text: "用户不存在"
        }]
      };
    }
    
    return {
      contents: [{
        uri: uri.href,
        text: `用户: ${username}\n姓名: ${user.name}`
      }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

## 部署配置示例

### 9. Docker 部署配置

`Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制 package files
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制构建后的代码
COPY dist/ ./dist/

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "dist/server.js"]
```

`docker-compose.yml`:

```yaml
version: '3.8'

services:
  mcp-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 如果需要数据库
  database:
    image: postgres:13
    environment:
      - POSTGRES_DB=mcp
      - POSTGRES_USER=mcp
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 10. PM2 部署配置

`ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'mcp-server',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## 配置模板

### 11. 环境配置模板

`config/production.ts` (生产环境):

```typescript
import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["production", "development", "test"]),
  PORT: z.number().default(3000),
  MCP_SESSION_TIMEOUT: z.number().default(3600000), // 1小时
  MCP_MAX_SESSIONS: z.number().default(100),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  CORS_ORIGIN: z.string().default("*"),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

export const config: Config = configSchema.parse({
  NODE_ENV: process.env.NODE_ENV || "production",
  PORT: parseInt(process.env.PORT || "3000"),
  MCP_SESSION_TIMEOUT: parseInt(process.env.MCP_SESSION_TIMEOUT || "3600000"),
  MCP_MAX_SESSIONS: parseInt(process.env.MCP_MAX_SESSIONS || "100"),
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
});
```

`config/development.ts` (开发环境):

```typescript
import { config as baseConfig } from "./production";

export const config = {
  ...baseConfig,
  LOG_LEVEL: "debug" as const,
  MCP_SESSION_TIMEOUT: 86400000, // 24小时
  MCP_MAX_SESSIONS: 10,
};
```

### 12. TypeScript 配置模板

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 13. ESLint 配置模板

`.eslintrc.js`:

```javascript
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
};
```

### 14. Prettier 配置模板

`.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf"
}
```

### 15. Package.json 脚本模板

`package.json` 脚本部分:

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/server.js",
    "start:dev": "nodemon dist/server.js",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "docker:build": "docker build -t mcp-server .",
    "docker:run": "docker run -p 3000:3000 mcp-server"
  }
}
```

## 运行说明

### 运行示例

1. **安装依赖**:
   ```bash
   npm install @modelcontextprotocol/sdk zod express cors
   ```

2. **编译 TypeScript**:
   ```bash
   npx tsc
   ```

3. **运行服务器**:
   ```bash
   # stdio 服务器
   node dist/echo-server.js
   
   # HTTP 服务器
   node dist/http-server.js
   ```

4. **测试连接**:
   ```bash
   # 使用 curl 测试 HTTP 服务器
   curl -X POST http://localhost:3000/mcp \
     -H "Content-Type: application/json" \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "initialize",
       "params": {
         "protocolVersion": "2025-03-26",
         "capabilities": {}
       }
     }'
   ```

## 部署指南

### 16. Kubernetes 部署配置

`mcp-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
  labels:
    app: mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      containers:
      - name: mcp-server
        image: mcp-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: MCP_MAX_SESSIONS
          value: "1000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-service
spec:
  selector:
    app: mcp-server
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 17. 健康检查端点实现

`src/health.ts`:

```typescript
import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || 'unknown'
  });
});

router.get('/ready', (req, res) => {
  // 检查数据库连接等依赖项
  const isReady = true; // 替换为实际的健康检查逻辑
  
  if (isReady) {
    res.status(200).json({ status: 'READY' });
  } else {
    res.status(503).json({ status: 'NOT_READY' });
  }
});

export default router;
```

### 18. 监控和日志配置

`src/monitoring.ts`:

```typescript
import express from 'express';
import prometheus from 'prom-client';

// 创建指标
const collectDefaultMetrics = prometheus.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const httpRequestDurationMicroseconds = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 5, 15, 50, 100, 300, 500, 1000, 3000, 5000]
});

const mcpRequestsTotal = new prometheus.Counter({
  name: 'mcp_requests_total',
  help: 'Total number of MCP requests',
  labelNames: ['method', 'status']
});

// 监控中间件
export const monitoringMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration);
    
    if (req.path.startsWith('/mcp')) {
      mcpRequestsTotal.labels(req.method, res.statusCode.toString()).inc();
    }
  });
  
  next();
};

// 指标端点
export const metricsRoute = (req: express.Request, res: express.Response) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
};
```

### 19. 环境变量管理

`.env.example`:

```bash
# 服务器配置
NODE_ENV=development
PORT=3000

# MCP 配置
MCP_SESSION_TIMEOUT=3600000
MCP_MAX_SESSIONS=100
LOG_LEVEL=info

# 数据库配置
DATABASE_URL=postgresql://user:pass@localhost:5432/mcp
REDIS_URL=redis://localhost:6379

# 安全配置
JWT_SECRET=your-secret-key
CORS_ORIGIN=*

# 监控配置
PROMETHEUS_METRICS_ENABLED=true
```

## 最佳实践

### 开发最佳实践

1. **类型安全**: 始终使用 TypeScript 严格模式，避免使用 `any` 类型
2. **错误处理**: 使用统一的错误处理中间件，包含适当的错误分类和日志记录
3. **输入验证**: 对所有用户输入使用 Zod 进行严格验证
4. **资源管理**: 使用资源链接避免大文件传输，实现按需加载
5. **会话管理**: 实现会话超时和清理机制，防止内存泄漏

### 安全最佳实践

1. **输入验证**: 验证所有用户输入，防止注入攻击
2. **认证授权**: 实现适当的认证和授权机制
3. **CORS 配置**: 合理配置 CORS，避免过度宽松的设置
4. **环境变量**: 使用环境变量管理敏感信息，避免硬编码
5. **依赖管理**: 定期更新依赖，修复安全漏洞

### 性能最佳实践

1. **连接池**: 使用数据库连接池和 Redis 连接复用
2. **缓存策略**: 实现适当的缓存机制减少重复计算
3. **资源链接**: 对大文件使用资源链接而不是内联内容
4. **监控指标**: 实现性能监控和告警机制
5. **负载测试**: 定期进行负载测试，识别性能瓶颈

### 部署最佳实践

1. **容器化**: 使用 Docker 进行容器化部署
2. **健康检查**: 实现完善的健康检查机制
3. **滚动更新**: 使用滚动更新策略确保零停机部署
4. **资源限制**: 设置适当的资源限制防止资源耗尽
5. **日志聚合**: 使用集中式日志管理系统

### 监控最佳实践

1. **指标收集**: 收集关键性能指标和业务指标
2. **告警配置**: 设置适当的告警阈值和通知机制
3. **日志分级**: 实现结构化的日志分级和分类
4. **追踪集成**: 集成分布式追踪系统
5. **仪表盘**: 创建监控仪表盘可视化系统状态

这些示例和最佳实践展示了 MCP TypeScript SDK 的核心功能和实际应用场景，可以根据具体需求进行修改和扩展。