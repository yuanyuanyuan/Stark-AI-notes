## 📋 文件摘要

本文档提供了完整的Cloudflare D1数据库测试指南，包含项目结构、配置文件设置、测试代码示例和运行说明。详细介绍了package.json、环境变量类型、wrangler配置、vitest配置、迁移应用脚本、查询测试和路由测试的完整实现，为Cloudflare D1数据库的测试工作提供了系统化的指导方案。

---

## 📑 目录索引

- [项目结构](#项目结构)
- [配置文件内容](#配置文件内容)
- [运行测试](#运行测试)
- [注意事项](#注意事项)

# Cloudflare D1 Testing Guide

## 项目结构

```bash
📁d1
├── migrations/              # 数据库迁移文件
│   ├── 0000_initial.sql    # 初始化表结构
│   └── 0001_admin.sql      # 管理员表结构
├── src/
│   ├── env.d.ts           # 环境变量类型定义
│   ├── index.ts           # 主要实现代码
│   └── tsconfig.json      # TypeScript 配置
├── test/
│   ├── apply-migrations.ts # 迁移脚本
│   ├── env.d.ts           # 测试环境变量定义
│   ├── queries.test.ts    # 数据库查询测试
│   ├── routes.test.ts     # 路由测试
│   └── tsconfig.json      # 测试 TypeScript 配置
├── vitest.config.ts       # Vitest 配置
└── wrangler.toml         # Wrangler 配置
```

## 配置文件内容

### 1. `package.json`

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage",
    "deploy": "wrangler deploy"
  },
  "dependencies": {
    "@cloudflare/workers-types": "^4.0.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "wrangler": "^3.0.0",
    "@cloudflare/vitest-pool-workers": "^0.1.0",
    "typescript": "^5.0.0"
  }
}
```

### 2. `src/env.d.ts`

```typescript
interface Env {
  DB: D1Database;
  TEST_MIGRATIONS?: string; // 用于测试的迁移数据
}
```

### 3. `wrangler.toml`

```toml
name = "d1-test-app"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "test_db"
database_id = "xxxxx"
```

### 4. `vitest.config.ts`

```typescript
import path from "node:path";
import {
  defineWorkersProject,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersProject(async () => {
  // 读取 migrations 目录中的所有迁移文件
  const migrationsPath = path.join(__dirname, "migrations");
  const migrations = await readD1Migrations(migrationsPath);

  return {
    test: {
      setupFiles: ["./test/apply-migrations.ts"],
      poolOptions: {
        workers: {
          singleWorker: true,
          wrangler: {
            configPath: "./wrangler.toml",
            environment: "production",
          },
          miniflare: {
            // 添加测试专用的迁移绑定
            bindings: { TEST_MIGRATIONS: migrations },
          },
        },
      },
    },
  };
});
```

### 5. `test/apply-migrations.ts`

```typescript
import { beforeAll } from "vitest";

beforeAll(async () => {
  const env = getMiniflareBindings();
  if (!env.TEST_MIGRATIONS) return;

  // 应用迁移
  const migrations = JSON.parse(env.TEST_MIGRATIONS);
  for (const migration of migrations) {
    await env.DB.prepare(migration).run();
  }
});
```

### 6. `test/queries.test.ts`

```typescript
import { describe, it, expect, beforeAll } from "vitest";

describe("D1 Queries", () => {
  let env: Env;

  beforeAll(() => {
    env = getMiniflareBindings();
  });

  it("should insert and query data", async () => {
    // 插入测试数据
    await env.DB.prepare(`
      INSERT INTO posts (id, title, content) 
      VALUES (?, ?, ?)
    `).bind("1", "Test Post", "Content").run();

    // 查询测试
    const result = await env.DB.prepare(`
      SELECT * FROM posts WHERE id = ?
    `).bind("1").first();

    expect(result).toEqual({
      id: "1",
      title: "Test Post",
      content: "Content"
    });
  });
});
```

### 7. `test/routes.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { unstable_dev } from "wrangler";
import type { UnstableDevWorker } from "wrangler";

describe("API Routes", () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev("src/index.ts", {
      config: { miniflare: { d1Databases: ["DB"] } }
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it("should handle GET /posts", async () => {
    const response = await worker.fetch("/posts");
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

## 运行测试

```bash
# 运行所有测试
npm test

# 观察模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

## 注意事项

1. 确保在运行测试前已安装所有依赖
2. 测试数据库会在每次测试运行时重新创建
3. 使用 `getMiniflareBindings()` 获取测试环境的绑定
4. 迁移文件按顺序执行