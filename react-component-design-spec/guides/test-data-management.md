# 测试数据生成与管理最佳实践

> 提供完整的测试数据生成、管理和清理解决方案

## 📋 概述

本指南提供了React组件测试中测试数据生成和管理的完整解决方案，包括数据工厂、模拟数据生成器、数据生命周期管理和最佳实践。

## 🏗️ 架构设计

### 核心组件

```
src/
├── test-utils/
│   ├── data-factories/           # 数据工厂
│   │   ├── user-factory.ts
│   │   ├── product-factory.ts
│   │   └── index.ts
│   ├── mock-generators/          # 模拟数据生成器
│   │   ├── data-generator.ts
│   │   ├── faker-config.ts
│   │   └── custom-generators.ts
│   ├── data-managers/           # 数据管理器
│   │   ├── test-data-manager.ts
│   │   ├── database-manager.ts
│   │   └── cache-manager.ts
│   └── fixtures/               # 测试固件数据
│       ├── users.json
│       ├── products.json
│       └── api-responses.json
└── tests/
    ├── __mocks__/              # 模拟数据
    ├── support/                # 测试支持文件
    └── setup/                  # 测试设置
```

## 🏭 数据工厂模式

### 基础数据工厂

```typescript
// test-utils/data-factories/base-factory.ts
export abstract class BaseFactory<T> {
  protected defaults: Partial<T> = {};
  protected overrides: Partial<T> = {};

  constructor(overrides: Partial<T> = {}) {
    this.overrides = overrides;
  }

  abstract generate(): T;

  with(overrides: Partial<T>): this {
    this.overrides = { ...this.overrides, ...overrides };
    return this;
  }

  many(count: number): T[] {
    return Array.from({ length: count }, () => this.generate());
  }

  reset(): this {
    this.overrides = {};
    return this;
  }

  protected applyDefaults(data: T): T {
    return { ...this.defaults, ...data };
  }
}
```

### 用户数据工厂

```typescript
// test-utils/data-factories/user-factory.ts
import { BaseFactory } from './base-factory';

export interface User {
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

export class UserFactory extends BaseFactory<User> {
  protected defaults: Partial<User> = {
    role: 'user',
    isActive: true,
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'zh-CN'
    }
  };

  generate(): User {
    const baseUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '测试用户',
      email: `test_${Date.now()}@example.com`,
      role: 'user',
      avatar: 'https://example.com/avatar.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'zh-CN'
      }
    };

    return this.applyDefaults({ ...baseUser, ...this.overrides });
  }

  // 预定义用户类型
  admin(): this {
    return this.with({
      role: 'admin',
      email: `admin_${Date.now()}@example.com`
    });
  }

  inactive(): this {
    return this.with({ isActive: false });
  }

  withPreferences(preferences: Partial<User['preferences']>): this {
    return this.with({
      preferences: { ...this.defaults.preferences, ...preferences }
    });
  }

  createdDaysAgo(days: number): this {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.with({ createdAt: date, updatedAt: date });
  }
}
```

### 产品数据工厂

```typescript
// test-utils/data-factories/product-factory.ts
import { BaseFactory } from './base-factory';

export interface Product {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export class ProductFactory extends BaseFactory<Product> {
  protected defaults: Partial<Product> = {
    price: 99.99,
    category: 'general',
    tags: [],
    images: [],
    stock: 100,
    rating: 0,
    reviews: []
  };

  generate(): Product {
    const baseProduct: Product = {
      id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '测试产品',
      description: '这是一个测试产品',
      price: 99.99,
      category: 'general',
      tags: ['测试', '产品'],
      images: ['https://example.com/product.jpg'],
      stock: 100,
      rating: 4.5,
      reviews: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.applyDefaults({ ...baseProduct, ...this.overrides });
  }

  // 链式方法
  expensive(): this {
    return this.with({ price: 999.99, category: 'luxury' });
  }

  cheap(): this {
    return this.with({ price: 9.99, category: 'budget' });
  }

  outOfStock(): this {
    return this.with({ stock: 0 });
  }

  withReviews(count: number): this {
    const reviews = Array.from({ length: count }, (_, index) => ({
      id: `review_${Date.now()}_${index}`,
      userId: `user_${Date.now()}_${index}`,
      rating: Math.floor(Math.random() * 5) + 1,
      comment: `评论 ${index + 1}`,
      createdAt: new Date()
    }));
    
    return this.with({ 
      reviews,
      rating: reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0
    });
  }

  inCategory(category: string): this {
    return this.with({ category });
  }
}
```

### 工厂注册中心

```typescript
// test-utils/data-factories/index.ts
import { UserFactory } from './user-factory';
import { ProductFactory } from './product-factory';

export class FactoryRegistry {
  private static instance: FactoryRegistry;
  private factories: Map<string, any> = new Map();

  static getInstance(): FactoryRegistry {
    if (!FactoryRegistry.instance) {
      FactoryRegistry.instance = new FactoryRegistry();
    }
    return FactoryRegistry.instance;
  }

  register<T>(name: string, factory: new () => T): void {
    this.factories.set(name, factory);
  }

  get<T>(name: string): T {
    const FactoryClass = this.factories.get(name);
    if (!FactoryClass) {
      throw new Error(`Factory '${name}' not found`);
    }
    return new FactoryClass();
  }

  user(overrides?: any): UserFactory {
    const factory = this.get<UserFactory>('user');
    return overrides ? factory.with(overrides) : factory;
  }

  product(overrides?: any): ProductFactory {
    const factory = this.get<ProductFactory>('product');
    return overrides ? factory.with(overrides) : factory;
  }
}

// 注册默认工厂
const registry = FactoryRegistry.getInstance();
registry.register('user', UserFactory);
registry.register('product', ProductFactory);

export const factories = FactoryRegistry.getInstance();
```

## 🎲 智能数据生成器

### Faker.js 配置

```typescript
// test-utils/mock-generators/faker-config.ts
import { faker } from '@faker-js/faker';
import { zh_CN } from '@faker-js/faker/locale/zh_CN';

// 设置中文环境
faker.setLocale(zh_CN);

export const fakerConfig = {
  // 用户相关
  user: () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    avatar: faker.image.avatar(),
    bio: faker.person.bio(),
    website: faker.internet.url(),
    
    // 地址信息
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country()
    },
    
    // 公司信息
    company: {
      name: faker.company.name(),
      department: faker.commerce.department(),
      title: faker.person.jobTitle()
    }
  }),

  // 产品相关
  product: () => ({
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price()),
    category: faker.commerce.department(),
    material: faker.commerce.productMaterial(),
    color: faker.color.human(),
    
    // 图片
    images: Array.from({ length: 3 }, () => faker.image.url()),
    
    // 评价
    rating: parseFloat(faker.number.float({ min: 1, max: 5, precision: 0.1 }).toFixed(1))
  }),

  // 日期时间
  date: {
    recent: () => faker.date.recent(),
    soon: () => faker.date.soon(),
    past: () => faker.date.past(),
    future: () => faker.date.future(),
    between: (from: Date, to: Date) => faker.date.between({ from, to }),
    
    // 时间范围
    thisYear: () => faker.date.between({ 
      from: new Date(new Date().getFullYear(), 0, 1), 
      to: new Date() 
    }),
    thisMonth: () => faker.date.between({ 
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), 
      to: new Date() 
    })
  },

  // 文本内容
  text: {
    sentence: () => faker.lorem.sentence(),
    paragraph: () => faker.lorem.paragraph(),
    paragraphs: (count: number) => faker.lorem.paragraphs(count),
    words: (count: number) => faker.lorem.words(count),
    
    // 专业内容
    technical: () => faker.lorem.lines({ min: 3, max: 7 }),
    marketing: () => faker.lorem.paragraphs(2),
    
    // 代码相关
    code: {
      snippet: () => `\`\`\`javascript\n${faker.lorem.lines()}\n\`\`\``,
      commitMessage: () => faker.system.commonFileName(),
      fileName: () => faker.system.fileName()
    }
  },

  // 金融数据
  finance: {
    amount: () => parseFloat(faker.finance.amount()),
    currency: () => faker.finance.currencyCode(),
    accountNumber: () => faker.finance.accountNumber(),
    creditCardNumber: () => faker.finance.creditCardNumber(),
    
    // 交易
    transaction: () => ({
      id: faker.string.uuid(),
      amount: parseFloat(faker.finance.amount()),
      currency: faker.finance.currencyCode(),
      date: faker.date.recent(),
      description: faker.finance.transactionDescription(),
      type: faker.helpers.arrayElement(['income', 'expense', 'transfer'])
    })
  },

  // 网络数据
  internet: {
    url: () => faker.internet.url(),
    domain: () => faker.internet.domainName(),
    ip: () => faker.internet.ip(),
    userAgent: () => faker.internet.userAgent(),
    mac: () => faker.internet.mac(),
    
    // 社交媒体
    username: () => faker.internet.userName(),
    email: () => faker.internet.email(),
    password: () => faker.internet.password()
  }
};
```

### 自定义数据生成器

```typescript
// test-utils/mock-generators/custom-generators.ts
import { faker } from '@faker-js/faker';

export const customGenerators = {
  // 生成符合特定格式的数据
  id: {
    uuid: () => faker.string.uuid(),
    nanoid: () => faker.string.nanoid(),
    custom: (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  // 生成测试用的API响应
  api: {
    success: <T>(data: T) => ({
      success: true,
      data,
      message: '操作成功',
      timestamp: Date.now()
    }),

    error: (message: string, code: number = 400) => ({
      success: false,
      error: {
        code,
        message
      },
      timestamp: Date.now()
    }),

    paginated: <T>(items: T[], page: number = 1, pageSize: number = 10) => ({
      success: true,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total: items.length,
          totalPages: Math.ceil(items.length / pageSize)
        }
      },
      timestamp: Date.now()
    })
  },

  // 生成表单数据
  form: {
    login: () => ({
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 })
    }),

    registration: () => ({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
      confirmPassword: '', // 需要手动设置
      phone: faker.phone.number(),
      agreeToTerms: true
    }),

    profile: () => ({
      name: faker.person.fullName(),
      bio: faker.person.bio(),
      avatar: faker.image.avatar(),
      website: faker.internet.url(),
      location: faker.location.city(),
      company: faker.company.name()
    })
  },

  // 生成测试用的错误对象
  error: {
    validation: (field: string, message: string) => ({
      field,
      message,
      code: 'VALIDATION_ERROR'
    }),

    network: (message: string = '网络连接失败') => ({
      message,
      code: 'NETWORK_ERROR',
      retryable: true
    }),

    auth: (message: string = '认证失败') => ({
      message,
      code: 'AUTH_ERROR',
      redirect: '/login'
    })
  },

  // 生成测试用的文件对象
  file: {
    image: (size: number = 1024) => ({
      name: faker.system.fileName() + '.jpg',
      size,
      type: 'image/jpeg',
      lastModified: Date.now(),
      
      // 模拟文件读取
      arrayBuffer: async () => new ArrayBuffer(size),
      text: async () => faker.lorem.paragraph(),
      slice: (start: number, end: number) => ({
        size: end - start,
        type: 'image/jpeg'
      })
    }),

    document: (size: number = 2048) => ({
      name: faker.system.fileName() + '.pdf',
      size,
      type: 'application/pdf',
      lastModified: Date.now()
    })
  },

  // 生成测试用的地理位置数据
  location: {
    coordinates: () => ({
      lat: parseFloat(faker.location.latitude().toFixed(6)),
      lng: parseFloat(faker.location.longitude().toFixed(6))
    }),

    address: () => ({
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
      coordinates: {
        lat: parseFloat(faker.location.latitude().toFixed(6)),
        lng: parseFloat(faker.location.longitude().toFixed(6))
      }
    }),

    area: (radius: number) => {
      const center = {
        lat: parseFloat(faker.location.latitude().toFixed(6)),
        lng: parseFloat(faker.location.longitude().toFixed(6))
      };
      
      return {
        center,
        radius,
        bounds: {
          north: center.lat + radius / 111,
          south: center.lat - radius / 111,
          east: center.lng + radius / 111,
          west: center.lng - radius / 111
        }
      };
    }
  }
};
```

### 智能数据生成器

```typescript
// test-utils/mock-generators/data-generator.ts
import { fakerConfig } from './faker-config';
import { customGenerators } from './custom-generators';

export class DataGenerator {
  // 生成单个对象
  static generate<T>(template: (faker: typeof fakerConfig) => T): T {
    return template(fakerConfig);
  }

  // 生成数组
  static generateMany<T>(
    template: (faker: typeof fakerConfig) => T,
    count: number
  ): T[] {
    return Array.from({ length: count }, () => this.generate(template));
  }

  // 生成符合特定类型的数据
  static byType<T>(type: string, options?: any): T {
    const generators: Record<string, any> = {
      user: () => fakerConfig.user(),
      product: () => fakerConfig.product(),
      'api.success': (data: any) => customGenerators.api.success(data),
      'api.error': (message: string) => customGenerators.api.error(message),
      'api.paginated': (items: any[]) => customGenerators.api.paginated(items),
      'form.login': () => customGenerators.form.login(),
      'form.registration': () => customGenerators.form.registration(),
      'file.image': (size: number) => customGenerators.file.image(size),
      'location.coordinates': () => customGenerators.location.coordinates(),
      'location.address': () => customGenerators.location.address()
    };

    const generator = generators[type];
    if (!generator) {
      throw new Error(`Unknown data type: ${type}`);
    }

    return generator(options);
  }

  // 生成关联数据
  static generateRelated(templates: Record<string, (faker: typeof fakerConfig) => any>) {
    const result: Record<string, any> = {};
    
    for (const [key, template] of Object.entries(templates)) {
      result[key] = this.generate(template);
    }
    
    return result;
  }

  // 生成树形数据
  static generateTree<T>(
    template: (faker: typeof fakerConfig) => T,
    childrenGenerator: (parent: T) => T[],
    depth: number = 3,
    currentDepth: number = 0
  ): T[] {
    if (currentDepth >= depth) {
      return [];
    }

    const items = this.generateMany(template, Math.floor(Math.random() * 3) + 1);
    
    return items.map(item => ({
      ...item,
      children: this.generateTree(template, childrenGenerator, depth, currentDepth + 1)
    }));
  }

  // 生成时间序列数据
  static generateTimeSeries<T>(
    template: (faker: typeof fakerConfig, date: Date) => T,
    startDate: Date,
    endDate: Date,
    interval: number = 86400000 // 1天
  ): T[] {
    const items: T[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      items.push(this.generate((faker) => template(faker, new Date(current))));
      current.setTime(current.getTime() + interval);
    }
    
    return items;
  }
}
```

## 🗃️ 数据管理器

### 测试数据管理器

```typescript
// test-utils/data-managers/test-data-manager.ts
import { DataGenerator } from '../mock-generators/data-generator';
import { factories } from '../data-factories';

export class TestDataManager {
  private static instance: TestDataManager;
  private dataStore: Map<string, any[]> = new Map();
  private cleanupCallbacks: Set<() => Promise<void>> = new Set();

  static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager();
    }
    return TestDataManager.instance;
  }

  // 存储测试数据
  async store<T>(key: string, data: T[]): Promise<void> {
    this.dataStore.set(key, data);
  }

  // 获取测试数据
  async get<T>(key: string): Promise<T[]> {
    return this.dataStore.get(key) || [];
  }

  // 生成并存储数据
  async generateAndStore<T>(
    key: string,
    generator: () => T[],
    options: { refresh?: boolean } = {}
  ): Promise<T[]> {
    const existingData = this.dataStore.get(key);
    
    if (existingData && !options.refresh) {
      return existingData;
    }

    const data = generator();
    await this.store(key, data);
    return data;
  }

  // 清理数据
  async cleanup(): Promise<void> {
    // 执行所有清理回调
    for (const callback of this.cleanupCallbacks) {
      try {
        await callback();
      } catch (error) {
        console.error('Cleanup callback failed:', error);
      }
    }

    // 清理数据存储
    this.dataStore.clear();
    this.cleanupCallbacks.clear();
  }

  // 注册清理回调
  registerCleanup(callback: () => Promise<void>): void {
    this.cleanupCallbacks.add(callback);
  }

  // 创建测试数据集
  async createTestDataSet(options: {
    users?: number;
    products?: number;
    orders?: number;
    refresh?: boolean;
  } = {}): Promise<{
    users: any[];
    products: any[];
    orders: any[];
  }> {
    const { users = 10, products = 20, orders = 50, refresh = false } = options;

    const [usersData, productsData, ordersData] = await Promise.all([
      this.generateAndStore('users', () => factories.user().many(users), { refresh }),
      this.generateAndStore('products', () => factories.product().many(products), { refresh }),
      this.generateAndStore('orders', () => this.generateOrders(orders, users, products), { refresh })
    ]);

    return {
      users: usersData,
      products: productsData,
      orders: ordersData
    };
  }

  // 生成订单数据
  private generateOrders(count: number, userCount: number, productCount: number): any[] {
    return Array.from({ length: count }, () => ({
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: `user_${Math.floor(Math.random() * userCount) + 1}`,
      productId: `product_${Math.floor(Math.random() * productCount) + 1}`,
      quantity: Math.floor(Math.random() * 5) + 1,
      total: parseFloat((Math.random() * 1000 + 50).toFixed(2)),
      status: fakerConfig.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered']),
      createdAt: fakerConfig.date.recent(),
      updatedAt: fakerConfig.date.recent()
    }));
  }

  // 导出数据到文件
  async exportToFile(key: string, filePath: string): Promise<void> {
    const data = await this.get(key);
    const fs = require('fs').promises;
    const path = require('path');
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  // 从文件导入数据
  async importFromFile(filePath: string, key?: string): Promise<any[]> {
    const fs = require('fs').promises;
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    
    if (key) {
      await this.store(key, data);
    }
    
    return data;
  }
}
```

### 数据库测试管理器

```typescript
// test-utils/data-managers/database-manager.ts
import { TestDataManager } from './test-data-manager';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private testDataManager: TestDataManager;
  private connections: Map<string, any> = new Map();

  constructor() {
    this.testDataManager = TestDataManager.getInstance();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // 创建测试数据库连接
  async createTestConnection(name: string, config: any): Promise<void> {
    // 这里根据具体的数据库类型创建连接
    // 示例使用内存数据库
    const connection = {
      name,
      config,
      data: new Map(),
      
      // 模拟数据库操作
      async insert(table: string, data: any) {
        if (!this.data.has(table)) {
          this.data.set(table, []);
        }
        const tableData = this.data.get(table);
        const record = { id: Math.random().toString(36).substr(2, 9), ...data };
        tableData.push(record);
        return record;
      },

      async find(table: string, query: any = {}) {
        const tableData = this.data.get(table) || [];
        return tableData.filter(record => 
          Object.entries(query).every(([key, value]) => record[key] === value)
        );
      },

      async update(table: string, id: string, data: any) {
        const tableData = this.data.get(table) || [];
        const index = tableData.findIndex(record => record.id === id);
        if (index !== -1) {
          tableData[index] = { ...tableData[index], ...data };
          return tableData[index];
        }
        return null;
      },

      async delete(table: string, id: string) {
        const tableData = this.data.get(table) || [];
        const index = tableData.findIndex(record => record.id === id);
        if (index !== -1) {
          return tableData.splice(index, 1)[0];
        }
        return null;
      },

      async clear() {
        this.data.clear();
      }
    };

    this.connections.set(name, connection);
    
    // 注册清理回调
    this.testDataManager.registerCleanup(async () => {
      await connection.clear();
      this.connections.delete(name);
    });
  }

  // 获取数据库连接
  getConnection(name: string) {
    return this.connections.get(name);
  }

  // 填充测试数据
  async seedTestData(connectionName: string, data: Record<string, any[]>): Promise<void> {
    const connection = this.getConnection(connectionName);
    if (!connection) {
      throw new Error(`Connection '${connectionName}' not found`);
    }

    for (const [table, records] of Object.entries(data)) {
      for (const record of records) {
        await connection.insert(table, record);
      }
    }
  }

  // 创建测试数据快照
  async createSnapshot(connectionName: string): Promise<Record<string, any[]>> {
    const connection = this.getConnection(connectionName);
    if (!connection) {
      throw new Error(`Connection '${connectionName}' not found`);
    }

    const snapshot: Record<string, any[]> = {};
    for (const [table, data] of connection.data) {
      snapshot[table] = [...data];
    }

    return snapshot;
  }

  // 恢复快照
  async restoreSnapshot(connectionName: string, snapshot: Record<string, any[]>): Promise<void> {
    const connection = this.getConnection(connectionName);
    if (!connection) {
      throw new Error(`Connection '${connectionName}' not found`);
    }

    await connection.clear();
    for (const [table, records] of Object.entries(snapshot)) {
      connection.data.set(table, [...records]);
    }
  }
}
```

### 缓存管理器

```typescript
// test-utils/data-managers/cache-manager.ts
export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // 设置缓存
  set(key: string, data: any, ttl: number = 300000): void { // 默认5分钟
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // 获取缓存
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // 删除缓存
  delete(key: string): void {
    this.cache.delete(key);
  }

  // 清空缓存
  clear(): void {
    this.cache.clear();
  }

  // 检查缓存是否存在
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // 获取缓存统计
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      hitRate: this.calculateHitRate()
    };
  }

  private calculateHitRate(): number {
    // 简化的命中率计算
    return 0.85; // 示例值
  }
}
```

## 🧪 测试工具集成

### 测试设置文件

```typescript
// tests/setup/test-setup.ts
import { TestDataManager } from '../../test-utils/data-managers/test-data-manager';
import { DatabaseManager } from '../../test-utils/data-managers/database-manager';

// 全局测试数据管理器
const testDataManager = TestDataManager.getInstance();
const databaseManager = DatabaseManager.getInstance();

// 全局测试钩子
beforeAll(async () => {
  // 创建测试数据库
  await databaseManager.createTestConnection('test', {
    type: 'memory',
    logging: false
  });
});

afterAll(async () => {
  // 清理所有测试数据
  await testDataManager.cleanup();
});

beforeEach(async () => {
  // 每个测试前的设置
});

afterEach(async () => {
  // 每个测试后的清理
});

// 全局测试工具
global.testUtils = {
  dataManager: testDataManager,
  database: databaseManager,
  factories: require('../../test-utils/data-factories'),
  generators: require('../../test-utils/mock-generators/data-generator')
};
```

### 测试助手函数

```typescript
// tests/utils/test-helpers.ts
import { factories } from '../../test-utils/data-factories';
import { DataGenerator } from '../../test-utils/mock-generators/data-generator';
import { customGenerators } from '../../test-utils/mock-generators/custom-generators';

export const testHelpers = {
  // 创建测试用户
  createUser: (overrides = {}) => factories.user(overrides).generate(),

  // 创建多个测试用户
  createUsers: (count: number, overrides = {}) => 
    factories.user(overrides).many(count),

  // 创建测试产品
  createProduct: (overrides = {}) => factories.product(overrides).generate(),

  // 创建测试产品列表
  createProducts: (count: number, overrides = {}) => 
    factories.product(overrides).many(count),

  // 创建测试表单数据
  createFormData: (type: string) => {
    const formGenerators: Record<string, any> = {
      login: customGenerators.form.login,
      registration: customGenerators.form.registration,
      profile: customGenerators.form.profile
    };

    const generator = formGenerators[type];
    if (!generator) {
      throw new Error(`Unknown form type: ${type}`);
    }

    return generator();
  },

  // 创建API响应模拟
  createApiResponse: (type: string, data?: any) => {
    const apiGenerators: Record<string, any> = {
      success: customGenerators.api.success,
      error: customGenerators.api.error,
      paginated: customGenerators.api.paginated
    };

    const generator = apiGenerators[type];
    if (!generator) {
      throw new Error(`Unknown API response type: ${type}`);
    }

    return generator(data);
  },

  // 创建测试错误
  createError: (type: string, message?: string) => {
    const errorGenerators: Record<string, any> = {
      validation: customGenerators.error.validation,
      network: customGenerators.error.network,
      auth: customGenerators.error.auth
    };

    const generator = errorGenerators[type];
    if (!generator) {
      throw new Error(`Unknown error type: ${type}`);
    }

    return generator(message);
  },

  // 创建测试文件
  createTestFile: (type: string, size?: number) => {
    const fileGenerators: Record<string, any> = {
      image: customGenerators.file.image,
      document: customGenerators.file.document
    };

    const generator = fileGenerators[type];
    if (!generator) {
      throw new Error(`Unknown file type: ${type}`);
    }

    return generator(size);
  },

  // 等待异步操作
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // 创建测试延迟
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // 生成随机ID
  generateId: (prefix = 'test') => 
    `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

  // 生成随机字符串
  generateString: (length = 10) => 
    Math.random().toString(36).substring(2, length + 2)
};
```

### 测试固件

```typescript
// tests/fixtures/test-fixtures.ts
import { factories } from '../../test-utils/data-factories';

export const testFixtures = {
  // 用户固件
  users: {
    basic: factories.user().generate(),
    admin: factories.user().admin().generate(),
    inactive: factories.user().inactive().generate(),
    withPreferences: factories.user()
      .withPreferences({ theme: 'dark', notifications: false })
      .generate()
  },

  // 产品固件
  products: {
    basic: factories.product().generate(),
    expensive: factories.product().expensive().generate(),
    cheap: factories.product().cheap().generate(),
    outOfStock: factories.product().outOfStock().generate(),
    withReviews: factories.product().withReviews(5).generate()
  },

  // 表单固件
  forms: {
    login: {
      valid: {
        email: 'test@example.com',
        password: 'password123'
      },
      invalid: {
        email: 'invalid-email',
        password: '123'
      }
    },
    registration: {
      valid: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        phone: '1234567890',
        agreeToTerms: true
      },
      invalid: {
        name: '',
        email: 'invalid-email',
        password: '123',
        confirmPassword: '456',
        phone: '',
        agreeToTerms: false
      }
    }
  },

  // API响应固件
  api: {
    responses: {
      success: {
        success: true,
        data: { id: 1, name: 'Test' },
        message: '操作成功',
        timestamp: Date.now()
      },
      error: {
        success: false,
        error: {
          code: 400,
          message: '请求参数错误'
        },
        timestamp: Date.now()
      },
      paginated: {
        success: true,
        data: {
          items: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' }
          ],
          pagination: {
            page: 1,
            pageSize: 10,
            total: 2,
            totalPages: 1
          }
        },
        timestamp: Date.now()
      }
    }
  }
};
```

## 📝 使用示例

### 基础使用示例

```typescript
// tests/components/UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import { testHelpers } from '../utils/test-helpers';
import { UserProfile } from '../UserProfile';

describe('UserProfile', () => {
  it('should render user profile correctly', () => {
    const user = testHelpers.createUser({
      name: '张三',
      email: 'zhangsan@example.com'
    });

    render(<UserProfile user={user} />);

    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('zhangsan@example.com')).toBeInTheDocument();
  });

  it('should handle admin user', () => {
    const admin = testHelpers.createUser({ role: 'admin' });

    render(<UserProfile user={admin} />);

    expect(screen.getByText('管理员')).toBeInTheDocument();
  });
});
```

### 复杂数据生成示例

```typescript
// tests/components/ProductList.test.tsx
import { render, screen } from '@testing-library/react';
import { factories } from '../../test-utils/data-factories';
import { ProductList } from '../ProductList';

describe('ProductList', () => {
  it('should render product list with reviews', () => {
    const products = factories.product()
      .withReviews(3)
      .many(5);

    render(<ProductList products={products} />);

    expect(screen.getAllByTestId('product-item')).toHaveLength(5);
    expect(screen.getAllByTestId('review')).toHaveLength(15);
  });

  it('should handle out of stock products', () => {
    const products = [
      factories.product().generate(),
      factories.product().outOfStock().generate()
    ];

    render(<ProductList products={products} />);

    expect(screen.getByText('缺货')).toBeInTheDocument();
  });
});
```

### 数据库测试示例

```typescript
// tests/integration/UserService.test.ts
import { UserService } from '../UserService';
import { databaseManager } from '../test-utils/data-managers/database-manager';
import { factories } from '../test-utils/data-factories';

describe('UserService Integration', () => {
  let userService: UserService;

  beforeAll(async () => {
    // 创建测试数据库连接
    await databaseManager.createTestConnection('main', {
      type: 'memory',
      logging: false
    });

    userService = new UserService(databaseManager.getConnection('main'));
  });

  beforeEach(async () => {
    // 填充测试数据
    const users = factories.user().many(10);
    await databaseManager.seedTestData('main', { users });
  });

  afterEach(async () => {
    // 清理测试数据
    const connection = databaseManager.getConnection('main');
    await connection.clear();
  });

  it('should create user successfully', async () => {
    const userData = factories.user().generate();
    
    const user = await userService.createUser(userData);
    
    expect(user).toMatchObject({
      name: userData.name,
      email: userData.email
    });
  });

  it('should find users by role', async () => {
    const adminUsers = await userService.findUsersByRole('admin');
    
    expect(adminUsers.length).toBeGreaterThan(0);
    adminUsers.forEach(user => {
      expect(user.role).toBe('admin');
    });
  });
});
```

## 🎯 最佳实践

### 1. 数据工厂设计原则

```typescript
// ✅ 好的实践
export class UserFactory extends BaseFactory<User> {
  // 使用链式方法
  admin(): this {
    return this.with({ role: 'admin' });
  }

  // 提供预设数据
  withPreferences(preferences: Partial<User['preferences']>): this {
    return this.with({
      preferences: { ...this.defaults.preferences, ...preferences }
    });
  }
}

// ❌ 避免的做法
export class BadUserFactory {
  // 硬编码数据
  generateAdmin() {
    return { role: 'admin', name: 'Admin User' };
  }
  
  // 不支持链式调用
  generateWithPreferences(preferences) {
    return { preferences };
  }
}
```

### 2. 测试数据管理

```typescript
// ✅ 好的实践
describe('UserService', () => {
  let testDataManager: TestDataManager;

  beforeAll(() => {
    testDataManager = TestDataManager.getInstance();
  });

  beforeEach(async () => {
    await testDataManager.createTestDataSet({
      users: 10,
      products: 20
    });
  });

  afterEach(async () => {
    await testDataManager.cleanup();
  });
});

// ❌ 避免的做法
describe('UserService', () => {
  // 直接使用静态数据
  const users = [
    { id: 1, name: 'User 1' },
    { id: 2, name: 'User 2' }
  ];

  it('should handle users', () => {
    // 无法清理数据，可能影响其他测试
  });
});
```

### 3. 性能优化

```typescript
// ✅ 好的实践
describe('PerformanceTest', () => {
  let testDataManager: TestDataManager;

  beforeAll(async () => {
    testDataManager = TestDataManager.getInstance();
    
    // 预生成数据并缓存
    await testDataManager.generateAndStore('large-dataset', () => 
      factories.user().many(1000)
    );
  });

  it('should handle large dataset efficiently', async () => {
    const users = await testDataManager.get('large-dataset');
    // 测试逻辑
  });
});

// ❌ 避免的做法
describe('PerformanceTest', () => {
  it('should handle large dataset', () => {
    // 每次测试都重新生成数据
    const users = factories.user().many(1000);
    // 测试逻辑
  });
});
```

## 🔧 工具配置

### ESLint 配置

```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:testing-library/recommended"
  ],
  "rules": {
    "testing-library/prefer-screen-queries": "error",
    "testing-library/no-debug": "warn",
    "testing-library/no-render-in-setup": "error"
  }
}
```

### Jest 配置

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.ts'],
  moduleNameMapping: {
    '^@/test-utils/(.*)$': '<rootDir>/test-utils/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### TypeScript 配置

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/test-utils/*": ["test-utils/*"],
      "@/tests/*": ["tests/*"]
    }
  },
  "include": [
    "src/**/*",
    "test-utils/**/*",
    "tests/**/*"
  ]
}
```

## 📚 总结

测试数据生成与管理工具提供了：

1. **完整的数据工厂系统** - 支持链式调用和预设数据
2. **智能数据生成器** - 基于Faker.js和自定义生成器
3. **数据生命周期管理** - 自动清理和缓存管理
4. **数据库测试支持** - 内存数据库和数据快照
5. **最佳实践指导** - 性能优化和代码规范

这些工具将显著提高测试开发效率，减少重复代码，并确保测试数据的真实性和一致性。

---

*测试数据生成与管理工具 v1.0 | 完整版规范的一部分*