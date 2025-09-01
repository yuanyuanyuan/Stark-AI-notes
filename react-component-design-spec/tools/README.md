# 测试数据管理工具包

> 提供完整的测试数据生成、管理和清理解决方案

## 🏗️ 目录结构

```
test-utils/
├── data-factories/           # 数据工厂
│   ├── base-factory.ts
│   ├── user-factory.ts
│   ├── product-factory.ts
│   └── index.ts
├── mock-generators/          # 模拟数据生成器
│   ├── data-generator.ts
│   ├── faker-config.ts
│   └── custom-generators.ts
├── data-managers/           # 数据管理器
│   ├── test-data-manager.ts
│   ├── database-manager.ts
│   └── cache-manager.ts
└── fixtures/               # 测试固件数据
    ├── users.json
    ├── products.json
    └── api-responses.json
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install --save-dev @faker-js/faker
```

### 2. 基础使用

```typescript
// 导入数据工厂
import { factories } from '@/test-utils/data-factories';

// 生成单个用户
const user = factories.user().generate();

// 生成多个用户
const users = factories.user().many(10);

// 链式调用
const admin = factories.user().admin().generate();

// 自定义属性
const customUser = factories.user()
  .with({ name: '张三', email: 'zhangsan@example.com' })
  .generate();
```

### 3. 生成复杂数据

```typescript
// 生成产品数据
const products = factories.product()
  .withReviews(5)
  .many(20);

// 生成订单数据
const orders = factories.order()
  .withStatus('delivered')
  .many(50);
```

## 📦 数据工厂

### 用户数据工厂

```typescript
// 创建用户
const user = factories.user()
  .admin()
  .withPreferences({ theme: 'dark', notifications: false })
  .createdDaysAgo(30)
  .generate();

// 用户数据结构
interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
}
```

### 产品数据工厂

```typescript
// 创建产品
const product = factories.product()
  .expensive()
  .withReviews(10)
  .inCategory('electronics')
  .generate();

// 产品数据结构
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  images: string[];
  stock: number;
  rating: number;
  reviews: Review[];
}
```

## 🎲 智能数据生成器

### 使用 Faker.js

```typescript
import { DataGenerator } from '@/test-utils/mock-generators/data-generator';

// 生成用户数据
const user = DataGenerator.generate((faker) => ({
  name: faker.user.name,
  email: faker.user.email,
  address: faker.user.address
}));

// 生成数组
const users = DataGenerator.generateMany((faker) => ({
  name: faker.user.name,
  email: faker.user.email
}), 10);
```

### 自定义生成器

```typescript
import { customGenerators } from '@/test-utils/mock-generators/custom-generators';

// 生成API响应
const apiResponse = customGenerators.api.success({ id: 1, name: 'Test' });

// 生成表单数据
const formData = customGenerators.form.login();

// 生成错误对象
const error = customGenerators.error.validation('email', '邮箱格式不正确');
```

## 🗃️ 数据管理器

### 测试数据管理器

```typescript
import { TestDataManager } from '@/test-utils/data-managers/test-data-manager';

const dataManager = TestDataManager.getInstance();

// 生成并存储数据
const users = await dataManager.generateAndStore('users', () => 
  factories.user().many(10)
);

// 获取数据
const cachedUsers = await dataManager.get('users');

// 清理数据
await dataManager.cleanup();
```

### 数据库管理器

```typescript
import { DatabaseManager } from '@/test-utils/data-managers/database-manager';

const dbManager = DatabaseManager.getInstance();

// 创建测试数据库连接
await dbManager.createTestConnection('test', {
  type: 'memory',
  logging: false
});

// 填充测试数据
await dbManager.seedTestData('test', {
  users: factories.user().many(10),
  products: factories.product().many(20)
});
```

## 🧪 测试集成

### 测试设置

```typescript
// tests/setup/test-setup.ts
import { TestDataManager } from '@/test-utils/data-managers/test-data-manager';

const dataManager = TestDataManager.getInstance();

beforeAll(async () => {
  // 初始化测试数据
  await dataManager.createTestDataSet({
    users: 10,
    products: 20,
    orders: 50
  });
});

afterAll(async () => {
  // 清理测试数据
  await dataManager.cleanup();
});
```

### 测试用例示例

```typescript
// tests/components/UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import { factories } from '@/test-utils/data-factories';
import { UserProfile } from '@/components/UserProfile';

describe('UserProfile', () => {
  it('should render user profile', () => {
    const user = factories.user()
      .admin()
      .withPreferences({ theme: 'dark' })
      .generate();

    render(<UserProfile user={user} />);

    expect(screen.getByText(user.name)).toBeInTheDocument();
    expect(screen.getByText('管理员')).toBeInTheDocument();
  });

  it('should handle inactive user', () => {
    const user = factories.user().inactive().generate();

    render(<UserProfile user={user} />);

    expect(screen.getByText('已停用')).toBeInTheDocument();
  });
});
```

## 🛠️ 命令行工具

### 使用测试数据生成器

```bash
# 交互式模式
node tools/test-data-generator.js

# 生成用户数据
node tools/test-data-generator.js -t user -c 50

# 生成CSV格式的产品数据
node tools/test-data-generator.js -t product -f csv -c 100

# 生成TypeScript类型定义
node tools/test-data-generator.js -t order -f typescript
```

### 选项说明

- `-t, --type`: 数据类型 (user, product, order, form, api, file)
- `-c, --count`: 生成数量
- `-f, --format`: 输出格式 (json, csv, typescript, fixture, seed)
- `-o, --output`: 输出目录

## 📊 性能优化

### 数据缓存

```typescript
import { CacheManager } from '@/test-utils/data-managers/cache-manager';

const cache = CacheManager.getInstance();

// 设置缓存
cache.set('users', users, 300000); // 5分钟缓存

// 获取缓存
const cachedUsers = cache.get('users');

// 检查缓存
if (cache.has('users')) {
  // 使用缓存数据
}
```

### 批量生成

```typescript
// 生成大量数据时使用分批
const batchSize = 1000;
const total = 10000;
const allUsers = [];

for (let i = 0; i < total; i += batchSize) {
  const batch = factories.user().many(Math.min(batchSize, total - i));
  allUsers.push(...batch);
  
  // 避免内存溢出
  if (i % 3000 === 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

## 🔧 配置选项

### 数据工厂配置

```typescript
// test-utils/config/factory-config.ts
export const factoryConfig = {
  user: {
    defaults: {
      role: 'user',
      isActive: true,
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'zh-CN'
      }
    }
  },
  product: {
    defaults: {
      price: 99.99,
      category: 'general',
      stock: 100,
      rating: 0
    }
  }
};
```

### 生成器配置

```typescript
// test-utils/config/generator-config.ts
export const generatorConfig = {
  locale: 'zh_CN',
  seed: 12345,
  cache: {
    enabled: true,
    ttl: 300000
  },
  output: {
    format: 'json',
    pretty: true,
    includeTypes: true
  }
};
```

## 🎯 最佳实践

### 1. 数据隔离

```typescript
// 每个测试使用独立的数据集
describe('UserService', () => {
  let testDataManager: TestDataManager;

  beforeEach(async () => {
    testDataManager = TestDataManager.getInstance();
    await testDataManager.createTestDataSet({
      users: 10,
      refresh: true
    });
  });

  afterEach(async () => {
    await testDataManager.cleanup();
  });
});
```

### 2. 数据验证

```typescript
// 验证生成的数据
const user = factories.user().generate();

expect(user.id).toBeDefined();
expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
expect(user.role).toBeOneOf(['user', 'admin', 'moderator']);
```

### 3. 性能考虑

```typescript
// 预生成常用数据
beforeAll(async () => {
  const dataManager = TestDataManager.getInstance();
  await dataManager.generateAndStore('common-users', () => 
    factories.user().many(100)
  );
});

// 在测试中重用数据
test('should handle users', async () => {
  const users = await dataManager.get('common-users');
  // 测试逻辑
});
```

## 📈 监控和调试

### 数据统计

```typescript
// 获取数据管理器统计信息
const stats = dataManager.getStats();

console.log('缓存命中率:', stats.cacheHitRate);
console.log('数据集数量:', stats.datasetCount);
console.log('总数据量:', stats.totalRecords);
```

### 调试模式

```typescript
// 启用调试模式
process.env.DEBUG = 'test-data:*';

// 查看详细日志
const dataManager = TestDataManager.getInstance({
  debug: true
});
```

## 🚨 常见问题

### Q: 如何处理循环引用的数据？
A: 使用延迟生成或引用ID：

```typescript
const generateOrder = (userId: string) => ({
  id: generateId(),
  userId,
  products: factories.product().many(3)
});
```

### Q: 如何生成符合特定规则的数据？
A: 创建自定义生成器：

```typescript
const generateChinesePhone = () => {
  const prefixes = ['138', '139', '150', '151', '188', '189'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${prefix}${suffix}`;
};
```

### Q: 如何处理大量数据生成？
A: 使用流式生成和分批处理：

```typescript
async function* generateLargeDataset<T>(generator: () => T, count: number) {
  for (let i = 0; i < count; i++) {
    yield generator();
    
    if (i % 1000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}
```

---

*测试数据管理工具包 v1.0 | 提供完整的测试数据解决方案*