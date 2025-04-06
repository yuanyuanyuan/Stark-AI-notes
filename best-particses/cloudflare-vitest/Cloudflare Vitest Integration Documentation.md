

# Cloudflare Vitest Integration Documentation

This documentation provides an overview of the Cloudflare Vitest Integration, including key concepts, setup, configuration, and usage.

GitHub Copilot: 让我基于所有相关文档，重新整理一个完整的 Cloudflare Workers Vitest 测试最佳实践指南：

# Cloudflare Workers Vitest 测试指南

## 1. 基础配置

```typescript
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    // 启用测试覆盖率报告
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    
    // Workers 特定配置
    poolOptions: {
      workers: {
        // Wrangler 配置
        wrangler: {
          configPath: "./wrangler.toml",
        },
        // Miniflare 配置
        miniflare: {
          // 启用隔离存储
          isolatedStorage: true,
          // 开启 Node.js 兼容模式
          compatibilityFlags: ['nodejs_compat'],
          // 绑定配置
          bindings: {
            MY_KV: {
              kvNamespaces: ['TEST_KV']
            }
          }
        }
      }
    }
  }
});
```

## 2. 项目结构示例

```plaintext
.
├── src/
│   ├── worker.ts         # Worker 源码
│   └── worker.test.ts    # 测试文件
├── wrangler.toml         # Wrangler 配置
├── vitest.config.ts      # Vitest 配置
└── package.json          # 项目配置
```

## 3. Worker 示例代码

```typescript
export interface Env {
  MY_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return new Response('Missing key parameter', { status: 400 });
    }

    const value = await env.MY_KV.get(key);
    return new Response(value || 'Not found', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
```

## 4. 测试示例

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from './worker';

describe('Worker', () => {
  // 在所有测试前准备数据
  beforeAll(async () => {
    await env.MY_KV.put('test-key', 'test-value');
  });

  it('should handle valid request', async () => {
    const ctx = createExecutionContext();
    const request = new Request('http://localhost?key=test-key');
    
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('test-value');
  });

  it('should handle missing key parameter', async () => {
    const ctx = createExecutionContext();
    const request = new Request('http://localhost');
    
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    expect(response.status).toBe(400);
  });
});
```

## 5. 调试配置

```json
{
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest",
      "program": "${workspaceRoot}/node_modules/vitest/vitest.mjs",
      "console": "integratedTerminal",
      "args": ["--inspect=9229", "--no-file-parallelism"]
    }
  ]
}
```

## 6. 最佳实践要点

1. **隔离存储**
   - 使用 `isolatedStorage: true` 确保测试间数据隔离
   - 在 `beforeAll` 中准备测试数据

2. **异步操作处理**
   - 总是使用 `async/await`
   - 使用 `waitOnExecutionContext` 等待异步操作完成

3. **环境变量和绑定**
   - 通过 Miniflare 配置模拟生产环境绑定
   - 使用类型定义确保类型安全

4. **测试覆盖率**
   - 启用覆盖率报告
   - 使用多种报告格式便于分析

5. **调试支持**
   - 配置 VSCode 调试
   - 使用 `--inspect` 启动调试模式

## 7. 已知问题和注意事项

1. WebSocket 测试需要禁用 `isolatedStorage`
2. 动态导入在特定场景下可能不工作
3. Durable Object alarms 需要特别处理
4. 确保消费所有响应体

## 8. 运行测试

```bash
# 运行测试
npm test

# 监听模式
npm run test:watch

# 带覆盖率报告
npm run test:coverage

# 调试模式
npm test -- --inspect
```

