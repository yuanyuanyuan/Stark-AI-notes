#!/usr/bin/env node

/**
 * 测试数据管理器
 * 自动生成、管理和清理测试数据
 */

const fs = require('fs').promises;
const path = require('path');
const { faker } = require('@faker-js/faker');
const { Factory } = require('fishery');

// ==================== 配置 ====================
const CONFIG = {
  dataDir: process.env.TEST_DATA_DIR || './test-data',
  locales: ['zh_CN', 'en_US'],
  formats: ['json', 'csv', 'sql'],
  defaultCount: 10,
  maxCount: 10000,
};

// ==================== 数据工厂定义 ====================

/**
 * 用户数据工厂
 */
class UserFactory extends Factory {
  constructor() {
    super(({ sequence, params, transientParams }) => {
      const locale = transientParams.locale || 'zh_CN';
      faker.setLocale(locale);
      
      return {
        id: sequence,
        username: params.username || faker.internet.userName(),
        email: params.email || faker.internet.email(),
        password: params.password || faker.internet.password(),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        avatar: faker.image.avatar(),
        phone: faker.phone.number(),
        address: {
          street: faker.address.streetAddress(),
          city: faker.address.city(),
          state: faker.address.state(),
          zipCode: faker.address.zipCode(),
          country: faker.address.country(),
        },
        birthDate: faker.date.birthdate(),
        registeredAt: faker.date.past(),
        lastLogin: faker.date.recent(),
        role: faker.helpers.arrayElement(['user', 'admin', 'moderator']),
        status: faker.helpers.arrayElement(['active', 'inactive', 'suspended']),
        preferences: {
          theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
          language: locale,
          notifications: faker.datatype.boolean(),
        },
        metadata: transientParams.metadata || {},
      };
    });
  }
}

/**
 * 产品数据工厂
 */
class ProductFactory extends Factory {
  constructor() {
    super(({ sequence, params, transientParams }) => {
      const locale = transientParams.locale || 'zh_CN';
      faker.setLocale(locale);
      
      return {
        id: sequence,
        sku: params.sku || faker.datatype.uuid(),
        name: params.name || faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        category: faker.commerce.department(),
        price: parseFloat(faker.commerce.price()),
        currency: transientParams.currency || 'USD',
        stock: faker.datatype.number({ min: 0, max: 1000 }),
        images: Array.from({ length: faker.datatype.number({ min: 1, max: 5 }) }, () => ({
          url: faker.image.imageUrl(),
          alt: faker.lorem.words(3),
        })),
        attributes: {
          color: faker.color.human(),
          size: faker.helpers.arrayElement(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
          weight: faker.datatype.float({ min: 0.1, max: 100 }),
          dimensions: {
            length: faker.datatype.float({ min: 1, max: 100 }),
            width: faker.datatype.float({ min: 1, max: 100 }),
            height: faker.datatype.float({ min: 1, max: 100 }),
          },
        },
        tags: faker.helpers.arrayElements(
          ['新品', '热销', '限时优惠', '包邮', '正品保证'],
          faker.datatype.number({ min: 1, max: 3 })
        ),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      };
    });
  }
}

/**
 * 订单数据工厂
 */
class OrderFactory extends Factory {
  constructor() {
    super(({ sequence, params, transientParams }) => {
      const locale = transientParams.locale || 'zh_CN';
      faker.setLocale(locale);
      
      const itemCount = faker.datatype.number({ min: 1, max: 5 });
      const items = Array.from({ length: itemCount }, () => ({
        productId: faker.datatype.number({ min: 1, max: 100 }),
        quantity: faker.datatype.number({ min: 1, max: 10 }),
        price: parseFloat(faker.commerce.price()),
      }));
      
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const tax = subtotal * 0.1;
      const shipping = parseFloat(faker.commerce.price(5, 20));
      
      return {
        id: sequence,
        orderNumber: params.orderNumber || `ORD-${faker.datatype.uuid()}`,
        userId: params.userId || faker.datatype.number({ min: 1, max: 100 }),
        items,
        subtotal,
        tax,
        shipping,
        total: subtotal + tax + shipping,
        status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
        paymentMethod: faker.helpers.arrayElement(['credit_card', 'paypal', 'alipay', 'wechat']),
        shippingAddress: {
          name: faker.name.fullName(),
          street: faker.address.streetAddress(),
          city: faker.address.city(),
          state: faker.address.state(),
          zipCode: faker.address.zipCode(),
          country: faker.address.country(),
        },
        notes: faker.lorem.sentence(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      };
    });
  }
}

// ==================== 数据生成器 ====================

class TestDataGenerator {
  constructor() {
    this.factories = {
      user: new UserFactory(),
      product: new ProductFactory(),
      order: new OrderFactory(),
    };
  }

  /**
   * 生成测试数据
   */
  async generate(type, count = CONFIG.defaultCount, options = {}) {
    if (!this.factories[type]) {
      throw new Error(`Unknown data type: ${type}`);
    }

    if (count > CONFIG.maxCount) {
      throw new Error(`Count exceeds maximum limit: ${CONFIG.maxCount}`);
    }

    const factory = this.factories[type];
    const data = [];

    for (let i = 0; i < count; i++) {
      const item = factory.build({}, { transient: options });
      data.push(item);
    }

    return data;
  }

  /**
   * 生成关联数据
   */
  async generateRelated(scenario, options = {}) {
    const scenarios = {
      'e-commerce': async () => {
        const users = await this.generate('user', 50, options);
        const products = await this.generate('product', 100, options);
        const orders = await this.generate('order', 200, {
          ...options,
          userIds: users.map(u => u.id),
          productIds: products.map(p => p.id),
        });
        
        return { users, products, orders };
      },
      
      'social-media': async () => {
        const users = await this.generate('user', 100, options);
        // 生成好友关系
        const friendships = this.generateFriendships(users);
        // 生成帖子
        const posts = this.generatePosts(users);
        
        return { users, friendships, posts };
      },
      
      'saas': async () => {
        const organizations = this.generateOrganizations(10);
        const users = await this.generate('user', 100, options);
        const projects = this.generateProjects(organizations, users);
        
        return { organizations, users, projects };
      },
    };

    if (!scenarios[scenario]) {
      throw new Error(`Unknown scenario: ${scenario}`);
    }

    return scenarios[scenario]();
  }

  /**
   * 生成好友关系
   */
  generateFriendships(users) {
    const friendships = [];
    const userIds = users.map(u => u.id);
    
    users.forEach(user => {
      const friendCount = faker.datatype.number({ min: 5, max: 30 });
      const friends = faker.helpers.arrayElements(
        userIds.filter(id => id !== user.id),
        friendCount
      );
      
      friends.forEach(friendId => {
        if (!friendships.some(f => 
          (f.userId === user.id && f.friendId === friendId) ||
          (f.userId === friendId && f.friendId === user.id)
        )) {
          friendships.push({
            userId: user.id,
            friendId,
            createdAt: faker.date.past(),
          });
        }
      });
    });
    
    return friendships;
  }

  /**
   * 生成帖子数据
   */
  generatePosts(users, count = 500) {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      userId: faker.helpers.arrayElement(users).id,
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(),
      tags: faker.helpers.arrayElements(
        ['技术', '生活', '娱乐', '新闻', '教育'],
        faker.datatype.number({ min: 1, max: 3 })
      ),
      likes: faker.datatype.number({ min: 0, max: 1000 }),
      comments: faker.datatype.number({ min: 0, max: 100 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    }));
  }

  /**
   * 生成组织数据
   */
  generateOrganizations(count = 10) {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      industry: faker.company.buzzNoun(),
      size: faker.helpers.arrayElement(['1-10', '11-50', '51-200', '201-500', '500+']),
      website: faker.internet.url(),
      createdAt: faker.date.past(),
    }));
  }

  /**
   * 生成项目数据
   */
  generateProjects(organizations, users, count = 50) {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      organizationId: faker.helpers.arrayElement(organizations).id,
      name: faker.commerce.productName(),
      description: faker.lorem.paragraph(),
      ownerId: faker.helpers.arrayElement(users).id,
      members: faker.helpers.arrayElements(users, faker.datatype.number({ min: 3, max: 10 }))
        .map(u => u.id),
      status: faker.helpers.arrayElement(['planning', 'active', 'completed', 'archived']),
      startDate: faker.date.past(),
      endDate: faker.date.future(),
      budget: faker.datatype.number({ min: 10000, max: 1000000 }),
      createdAt: faker.date.past(),
    }));
  }
}

// ==================== 数据导出器 ====================

class DataExporter {
  /**
   * 导出为JSON
   */
  async exportJSON(data, filename) {
    const filePath = path.join(CONFIG.dataDir, `${filename}.json`);
    await fs.mkdir(CONFIG.dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }

  /**
   * 导出为CSV
   */
  async exportCSV(data, filename) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data must be a non-empty array');
    }

    const headers = Object.keys(this.flattenObject(data[0]));
    const rows = data.map(item => {
      const flattened = this.flattenObject(item);
      return headers.map(header => {
        const value = flattened[header];
        // CSV转义
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const filePath = path.join(CONFIG.dataDir, `${filename}.csv`);
    await fs.mkdir(CONFIG.dataDir, { recursive: true });
    await fs.writeFile(filePath, csv);
    return filePath;
  }

  /**
   * 导出为SQL
   */
  async exportSQL(data, tableName, filename) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data must be a non-empty array');
    }

    const statements = [];
    
    // 创建表语句
    const firstItem = data[0];
    const columns = Object.keys(firstItem).map(key => {
      const value = firstItem[key];
      let type = 'VARCHAR(255)';
      
      if (typeof value === 'number') {
        type = Number.isInteger(value) ? 'INT' : 'DECIMAL(10,2)';
      } else if (value instanceof Date) {
        type = 'DATETIME';
      } else if (typeof value === 'boolean') {
        type = 'BOOLEAN';
      } else if (typeof value === 'object') {
        type = 'JSON';
      }
      
      return `  ${key} ${type}`;
    });
    
    statements.push(`CREATE TABLE IF NOT EXISTS ${tableName} (\n${columns.join(',\n')}\n);`);
    
    // 插入数据语句
    data.forEach(item => {
      const values = Object.values(item).map(value => {
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        if (value instanceof Date) return `'${value.toISOString()}'`;
        if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        return value;
      });
      
      statements.push(`INSERT INTO ${tableName} VALUES (${values.join(', ')});`);
    });

    const sql = statements.join('\n\n');
    const filePath = path.join(CONFIG.dataDir, `${filename}.sql`);
    await fs.mkdir(CONFIG.dataDir, { recursive: true });
    await fs.writeFile(filePath, sql);
    return filePath;
  }

  /**
   * 扁平化对象
   */
  flattenObject(obj, prefix = '') {
    const flattened = {};
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;
      
      if (value === null || value === undefined) {
        flattened[newKey] = '';
      } else if (typeof value === 'object' && !(value instanceof Date)) {
        if (Array.isArray(value)) {
          flattened[newKey] = JSON.stringify(value);
        } else {
          Object.assign(flattened, this.flattenObject(value, newKey));
        }
      } else {
        flattened[newKey] = value;
      }
    });
    
    return flattened;
  }
}

// ==================== 数据清理器 ====================

class DataCleaner {
  /**
   * 清理所有测试数据
   */
  async cleanAll() {
    try {
      const files = await fs.readdir(CONFIG.dataDir);
      const testFiles = files.filter(file => 
        file.startsWith('test-') || file.includes('.test.')
      );
      
      for (const file of testFiles) {
        await fs.unlink(path.join(CONFIG.dataDir, file));
      }
      
      console.log(`Cleaned ${testFiles.length} test data files`);
      return testFiles.length;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No test data directory found');
        return 0;
      }
      throw error;
    }
  }

  /**
   * 清理过期数据
   */
  async cleanExpired(days = 7) {
    try {
      const files = await fs.readdir(CONFIG.dataDir);
      const now = Date.now();
      const expireTime = days * 24 * 60 * 60 * 1000;
      let cleanedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(CONFIG.dataDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > expireTime) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }
      
      console.log(`Cleaned ${cleanedCount} expired files`);
      return cleanedCount;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No test data directory found');
        return 0;
      }
      throw error;
    }
  }
}

// ==================== CLI接口 ====================

class TestDataCLI {
  constructor() {
    this.generator = new TestDataGenerator();
    this.exporter = new DataExporter();
    this.cleaner = new DataCleaner();
  }

  /**
   * 解析命令行参数
   */
  parseArgs() {
    const args = process.argv.slice(2);
    const command = args[0];
    const options = {};
    
    for (let i = 1; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        const key = args[i].substring(2);
        const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
        options[key] = value;
      }
    }
    
    return { command, options };
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(`
测试数据管理器 - 自动生成和管理测试数据

使用方法:
  node test-data-manager.js <command> [options]

命令:
  generate <type>    生成测试数据
    --count <n>      数量 (默认: 10)
    --format <fmt>   格式: json|csv|sql (默认: json)
    --locale <loc>   语言: zh_CN|en_US (默认: zh_CN)
    --output <file>  输出文件名
    
  scenario <name>    生成场景数据
    --scenario       场景: e-commerce|social-media|saas
    --format <fmt>   格式: json|csv|sql (默认: json)
    --output <dir>   输出目录
    
  clean              清理测试数据
    --all            清理所有测试数据
    --expired <days> 清理过期数据 (默认: 7天)
    
  list               列出可用的数据类型

示例:
  # 生成100个用户数据
  node test-data-manager.js generate user --count 100 --format json
  
  # 生成电商场景数据
  node test-data-manager.js scenario --scenario e-commerce
  
  # 清理7天前的测试数据
  node test-data-manager.js clean --expired 7
    `);
  }

  /**
   * 运行CLI
   */
  async run() {
    const { command, options } = this.parseArgs();
    
    try {
      switch (command) {
        case 'generate': {
          const type = options.type || process.argv[3];
          if (!type) {
            console.error('Error: Please specify data type');
            this.showHelp();
            process.exit(1);
          }
          
          const count = parseInt(options.count) || CONFIG.defaultCount;
          const format = options.format || 'json';
          const locale = options.locale || 'zh_CN';
          const output = options.output || `test-${type}-${Date.now()}`;
          
          console.log(`Generating ${count} ${type} records...`);
          const data = await this.generator.generate(type, count, { locale });
          
          let filePath;
          switch (format) {
            case 'json':
              filePath = await this.exporter.exportJSON(data, output);
              break;
            case 'csv':
              filePath = await this.exporter.exportCSV(data, output);
              break;
            case 'sql':
              filePath = await this.exporter.exportSQL(data, type, output);
              break;
            default:
              throw new Error(`Unknown format: ${format}`);
          }
          
          console.log(`✅ Data exported to: ${filePath}`);
          break;
        }
        
        case 'scenario': {
          const scenario = options.scenario || 'e-commerce';
          const format = options.format || 'json';
          const outputDir = options.output || `test-${scenario}-${Date.now()}`;
          
          console.log(`Generating ${scenario} scenario data...`);
          const data = await this.generator.generateRelated(scenario);
          
          await fs.mkdir(path.join(CONFIG.dataDir, outputDir), { recursive: true });
          
          for (const [key, value] of Object.entries(data)) {
            const filename = path.join(outputDir, key);
            let filePath;
            
            switch (format) {
              case 'json':
                filePath = await this.exporter.exportJSON(value, filename);
                break;
              case 'csv':
                filePath = await this.exporter.exportCSV(value, filename);
                break;
              case 'sql':
                filePath = await this.exporter.exportSQL(value, key, filename);
                break;
            }
            
            console.log(`✅ ${key} exported to: ${filePath}`);
          }
          break;
        }
        
        case 'clean': {
          if (options.all) {
            const count = await this.cleaner.cleanAll();
            console.log(`✅ Cleaned ${count} files`);
          } else {
            const days = parseInt(options.expired) || 7;
            const count = await this.cleaner.cleanExpired(days);
            console.log(`✅ Cleaned ${count} expired files`);
          }
          break;
        }
        
        case 'list': {
          console.log('Available data types:');
          console.log('  - user');
          console.log('  - product');
          console.log('  - order');
          console.log('\nAvailable scenarios:');
          console.log('  - e-commerce');
          console.log('  - social-media');
          console.log('  - saas');
          break;
        }
        
        default:
          this.showHelp();
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }
}

// ==================== 导出模块 ====================

module.exports = {
  TestDataGenerator,
  DataExporter,
  DataCleaner,
  UserFactory,
  ProductFactory,
  OrderFactory,
};

// ==================== CLI入口 ====================

if (require.main === module) {
  const cli = new TestDataCLI();
  cli.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}