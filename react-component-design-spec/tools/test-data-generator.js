#!/usr/bin/env node

/**
 * 测试数据生成器
 * 
 * 基于配置快速生成测试数据，支持多种数据类型和格式
 * 
 * @author Claude
 * @created 2024-01-01
 * @updated 2024-01-01
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ==================== 配置常量 ====================

const DATA_TYPES = {
  user: '用户数据',
  product: '产品数据',
  order: '订单数据',
  form: '表单数据',
  api: 'API响应数据',
  file: '文件数据',
  location: '地理位置数据',
  custom: '自定义数据'
};

const OUTPUT_FORMATS = {
  json: 'JSON格式',
  csv: 'CSV格式',
  typescript: 'TypeScript接口',
  fixture: '测试固件',
  seed: '数据库种子数据'
};

const DEFAULT_CONFIG = {
  outputDir: 'tests/__mocks__',
  format: 'json',
  count: 10,
  useFaker: true,
  includeTypes: true,
  includeExamples: true,
  prettyPrint: true
};

// ==================== 数据生成器 ====================

/**
 * 基础数据生成器
 */
class BaseDataGenerator {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.faker = this.setupFaker();
  }

  setupFaker() {
    try {
      const { faker } = require('@faker-js/faker');
      faker.setLocale('zh_CN');
      return faker;
    } catch (error) {
      console.warn('Faker.js not available, using simple generators');
      return null;
    }
  }

  generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateDate(options = {}) {
    const { daysAgo = 30, daysFuture = 0 } = options;
    const start = new Date();
    start.setDate(start.getDate() - daysAgo);
    
    const end = new Date();
    end.setDate(end.getDate() + daysFuture);
    
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  generateEmail(name) {
    const cleanName = name.replace(/\s+/g, '').toLowerCase();
    const domains = ['example.com', 'test.com', 'demo.org'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${cleanName}_${Math.random().toString(36).substr(2, 5)}@${domain}`;
  }

  generatePhone() {
    const prefixes = ['138', '139', '150', '151', '188', '189'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `${prefix}${suffix}`;
  }

  generateName() {
    if (this.faker) {
      return this.faker.person.fullName();
    }
    
    const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
    const givenNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军'];
    
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
    
    return `${surname}${givenName}`;
  }

  generateAddress() {
    if (this.faker) {
      return {
        street: this.faker.location.streetAddress(),
        city: this.faker.location.city(),
        state: this.faker.location.state(),
        zipCode: this.faker.location.zipCode(),
        country: this.faker.location.country()
      };
    }
    
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉'];
    const streets = ['中山路', '人民路', '解放路', '建设路', '文化路', '新华路'];
    
    return {
      street: `${Math.floor(Math.random() * 999) + 1}号${streets[Math.floor(Math.random() * streets.length)]}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      state: '省',
      zipCode: Math.floor(Math.random() * 100000).toString().padStart(6, '0'),
      country: '中国'
    };
  }
}

/**
 * 用户数据生成器
 */
class UserGenerator extends BaseDataGenerator {
  generate(overrides = {}) {
    const name = this.generateName();
    const baseUser = {
      id: this.generateId(),
      name,
      email: this.generateEmail(name),
      phone: this.generatePhone(),
      avatar: `https://example.com/avatar/${Math.random().toString(36).substr(2, 8)}.jpg`,
      role: this.faker ? 
        this.faker.helpers.arrayElement(['user', 'admin', 'moderator']) : 
        'user',
      isActive: Math.random() > 0.2,
      createdAt: this.generateDate({ daysAgo: 365 }),
      updatedAt: new Date(),
      lastLoginAt: this.generateDate({ daysAgo: 30 }),
      preferences: {
        theme: Math.random() > 0.5 ? 'dark' : 'light',
        notifications: Math.random() > 0.3,
        language: 'zh-CN'
      },
      address: this.generateAddress(),
      profile: {
        bio: this.faker ? this.faker.person.bio() : '这是一个用户简介',
        website: this.faker ? this.faker.internet.url() : '',
        company: this.faker ? this.faker.company.name() : '测试公司'
      }
    };

    return { ...baseUser, ...overrides };
  }

  generateMany(count, overrides = {}) {
    return Array.from({ length: count }, () => this.generate(overrides));
  }
}

/**
 * 产品数据生成器
 */
class ProductGenerator extends BaseDataGenerator {
  generate(overrides = {}) {
    const categories = ['电子产品', '服装', '食品', '图书', '家居', '运动', '美妆'];
    const baseProduct = {
      id: this.generateId(),
      name: this.faker ? 
        this.faker.commerce.productName() : 
        `产品${Math.floor(Math.random() * 1000)}`,
      description: this.faker ? 
        this.faker.commerce.productDescription() : 
        '这是一个优质产品',
      price: parseFloat((Math.random() * 1000 + 10).toFixed(2)),
      category: categories[Math.floor(Math.random() * categories.length)],
      tags: this.generateTags(),
      images: this.generateImages(),
      stock: Math.floor(Math.random() * 1000),
      rating: parseFloat((Math.random() * 5).toFixed(1)),
      reviewCount: Math.floor(Math.random() * 1000),
      createdAt: this.generateDate({ daysAgo: 180 }),
      updatedAt: new Date(),
      specifications: this.generateSpecifications(),
      variants: this.generateVariants()
    };

    return { ...baseProduct, ...overrides };
  }

  generateTags() {
    const tagPool = ['热销', '新品', '推荐', '限时', '包邮', '优质', '品牌'];
    const count = Math.floor(Math.random() * 4) + 1;
    const selected = [];
    
    for (let i = 0; i < count; i++) {
      const tag = tagPool[Math.floor(Math.random() * tagPool.length)];
      if (!selected.includes(tag)) {
        selected.push(tag);
      }
    }
    
    return selected;
  }

  generateImages() {
    const count = Math.floor(Math.random() * 4) + 1;
    return Array.from({ length: count }, (_, i) => 
      `https://example.com/product/${Math.random().toString(36).substr(2, 8)}_${i + 1}.jpg`
    );
  }

  generateSpecifications() {
    return {
      weight: `${(Math.random() * 5 + 0.1).toFixed(2)}kg`,
      dimensions: `${Math.floor(Math.random() * 50 + 10)}×${Math.floor(Math.random() * 50 + 10)}×${Math.floor(Math.random() * 20 + 5)}cm`,
      material: this.faker ? this.faker.commerce.productMaterial() : '优质材料',
      origin: '中国',
      warranty: Math.random() > 0.5 ? '1年' : '2年'
    };
  }

  generateVariants() {
    const colors = ['红色', '蓝色', '黑色', '白色', '绿色'];
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    
    return colors.slice(0, Math.floor(Math.random() * 3) + 1).map(color => ({
      color,
      size: sizes[Math.floor(Math.random() * sizes.length)],
      price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
      stock: Math.floor(Math.random() * 100)
    }));
  }

  generateMany(count, overrides = {}) {
    return Array.from({ length: count }, () => this.generate(overrides));
  }
}

/**
 * 订单数据生成器
 */
class OrderGenerator extends BaseDataGenerator {
  generate(overrides = {}) {
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const paymentMethods = ['alipay', 'wechat', 'bank', 'credit'];
    
    const baseOrder = {
      id: this.generateId(),
      orderNumber: `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      userId: `user_${Math.floor(Math.random() * 100) + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      totalAmount: parseFloat((Math.random() * 2000 + 50).toFixed(2)),
      shippingFee: parseFloat((Math.random() * 50).toFixed(2)),
      discountAmount: parseFloat((Math.random() * 100).toFixed(2)),
      items: this.generateOrderItems(),
      shippingAddress: this.generateAddress(),
      billingAddress: this.generateAddress(),
      createdAt: this.generateDate({ daysAgo: 90 }),
      updatedAt: new Date(),
      shippedAt: Math.random() > 0.5 ? this.generateDate({ daysAgo: 30 }) : null,
      deliveredAt: Math.random() > 0.7 ? this.generateDate({ daysAgo: 7 }) : null,
      notes: Math.random() > 0.7 ? '订单备注' : ''
    };

    return { ...baseOrder, ...overrides };
  }

  generateOrderItems() {
    const count = Math.floor(Math.random() * 5) + 1;
    return Array.from({ length: count }, () => ({
      id: this.generateId(),
      productId: `product_${Math.floor(Math.random() * 100) + 1}`,
      productName: `产品${Math.floor(Math.random() * 1000)}`,
      quantity: Math.floor(Math.random() * 5) + 1,
      unitPrice: parseFloat((Math.random() * 500 + 10).toFixed(2)),
      totalPrice: parseFloat((Math.random() * 1000 + 10).toFixed(2)),
      specifications: this.generateSpecifications()
    }));
  }

  generateMany(count, overrides = {}) {
    return Array.from({ length: count }, () => this.generate(overrides));
  }
}

/**
 * 表单数据生成器
 */
class FormGenerator extends BaseDataGenerator {
  generateLoginForm(overrides = {}) {
    const baseForm = {
      email: this.generateEmail('test'),
      password: 'password123',
      rememberMe: Math.random() > 0.5
    };

    return { ...baseForm, ...overrides };
  }

  generateRegistrationForm(overrides = {}) {
    const name = this.generateName();
    const baseForm = {
      name,
      email: this.generateEmail(name),
      password: 'Password123!',
      confirmPassword: 'Password123!',
      phone: this.generatePhone(),
      agreeToTerms: true,
      newsletter: Math.random() > 0.5
    };

    return { ...baseForm, ...overrides };
  }

  generateProfileForm(overrides = {}) {
    const baseForm = {
      name: this.generateName(),
      email: this.generateEmail('user'),
      phone: this.generatePhone(),
      bio: this.faker ? this.faker.person.bio() : '个人简介',
      website: this.faker ? this.faker.internet.url() : '',
      company: this.faker ? this.faker.company.name() : '公司名称',
      position: this.faker ? this.faker.person.jobTitle() : '职位',
      address: this.generateAddress()
    };

    return { ...baseForm, ...overrides };
  }
}

/**
 * API响应数据生成器
 */
class ApiResponseGenerator extends BaseDataGenerator {
  generateSuccessResponse(data, message = '操作成功') {
    return {
      success: true,
      data,
      message,
      code: 200,
      timestamp: Date.now()
    };
  }

  generateErrorResponse(message = '操作失败', code = 400) {
    return {
      success: false,
      error: {
        code,
        message
      },
      timestamp: Date.now()
    };
  }

  generatePaginatedResponse(items, page = 1, pageSize = 10) {
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        items: paginatedItems,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      timestamp: Date.now()
    };
  }
}

/**
 * 文件数据生成器
 */
class FileGenerator extends BaseDataGenerator {
  generateImageFile(overrides = {}) {
    const baseFile = {
      id: this.generateId(),
      name: `image_${Math.random().toString(36).substr(2, 8)}.jpg`,
      type: 'image/jpeg',
      size: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
      url: `https://example.com/images/${Math.random().toString(36).substr(2, 8)}.jpg`,
      thumbnail: `https://example.com/thumbnails/${Math.random().toString(36).substr(2, 8)}.jpg`,
      alt: '图片描述',
      metadata: {
        width: Math.floor(Math.random() * 2000) + 500,
        height: Math.floor(Math.random() * 2000) + 500,
        format: 'JPEG',
        colorSpace: 'RGB'
      },
      uploadedAt: this.generateDate({ daysAgo: 30 })
    };

    return { ...baseFile, ...overrides };
  }

  generateDocumentFile(overrides = {}) {
    const baseFile = {
      id: this.generateId(),
      name: `document_${Math.random().toString(36).substr(2, 8)}.pdf`,
      type: 'application/pdf',
      size: Math.floor(Math.random() * 10000000) + 100000, // 100KB - 10MB
      url: `https://example.com/documents/${Math.random().toString(36).substr(2, 8)}.pdf`,
      pages: Math.floor(Math.random() * 100) + 1,
      title: '文档标题',
      author: this.generateName(),
      createdAt: this.generateDate({ daysAgo: 30 }),
      updatedAt: new Date()
    };

    return { ...baseFile, ...overrides };
  }
}

// ==================== 主生成器类 ====================

class TestDataGenerator {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.generators = {
      user: new UserGenerator(config),
      product: new ProductGenerator(config),
      order: new OrderGenerator(config),
      form: new FormGenerator(config),
      api: new ApiResponseGenerator(config),
      file: new FileGenerator(config)
    };
  }

  generate(type, options = {}) {
    const { count = 1, ...generatorOptions } = options;
    
    if (!this.generators[type]) {
      throw new Error(`Unknown data type: ${type}`);
    }

    const generator = this.generators[type];
    
    if (count === 1) {
      return generator.generate(generatorOptions);
    } else {
      return generator.generateMany(count, generatorOptions);
    }
  }

  generateBatch(types) {
    const result = {};
    
    for (const [type, options] of Object.entries(types)) {
      result[type] = this.generate(type, options);
    }
    
    return result;
  }

  async saveToFile(data, filename, format = 'json') {
    const outputDir = this.config.outputDir;
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, filename);
    let content = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, this.config.prettyPrint ? 2 : 0);
        break;
      
      case 'typescript':
        content = this.generateTypeScriptCode(data, filename);
        break;
      
      case 'fixture':
        content = this.generateFixtureCode(data, filename);
        break;
      
      case 'csv':
        content = this.generateCSV(data);
        break;
      
      case 'seed':
        content = this.generateSeedCode(data, filename);
        break;
      
      default:
        throw new Error(`Unknown format: ${format}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 数据已保存到: ${filePath}`);
    
    return filePath;
  }

  generateTypeScriptCode(data, filename) {
    const typeName = this.toPascalCase(path.basename(filename, '.json'));
    
    let code = `// 自动生成的测试数据\n`;
    code += `// 生成时间: ${new Date().toISOString()}\n\n`;
    
    if (Array.isArray(data) && data.length > 0) {
      code += `export interface ${typeName} {\n`;
      this.generateInterfaceProperties(data[0], code);
      code += `}\n\n`;
      
      code += `export const ${this.toCamelCase(typeName)}: ${typeName}[] = ${JSON.stringify(data, null, 2)};\n`;
    } else {
      code += `export const ${this.toCamelCase(typeName)} = ${JSON.stringify(data, null, 2)};\n`;
    }
    
    return code;
  }

  generateInterfaceProperties(obj, code, indent = 1) {
    const spaces = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      const type = this.inferType(value);
      code += `${spaces}${key}: ${type};\n`;
    }
  }

  inferType(value) {
    if (value === null) return 'null';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'any[]';
    if (typeof value === 'object') return 'any';
    return 'any';
  }

  generateFixtureCode(data, filename) {
    const variableName = this.toCamelCase(path.basename(filename, '.json'));
    
    let code = `// 测试固件数据\n`;
    code += `// 生成时间: ${new Date().toISOString()}\n\n`;
    code += `export const ${variableName} = ${JSON.stringify(data, null, 2)};\n`;
    
    return code;
  }

  generateCSV(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // 处理包含逗号或引号的值
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  generateSeedCode(data, filename) {
    const tableName = this.toSnakeCase(path.basename(filename, '.json'));
    
    let code = `// 数据库种子数据\n`;
    code += `// 生成时间: ${new Date().toISOString()}\n\n`;
    code += `module.exports = {\n`;
    code += `  up: async (queryInterface, Sequelize) => {\n`;
    code += `    return queryInterface.bulkInsert('${tableName}, ${JSON.stringify(data, null, 6)});\n`;
    code += `  },\n\n`;
    code += `  down: async (queryInterface, Sequelize) => {\n`;
    code += `    return queryInterface.bulkDelete('${tableName}, null, {});\n`;
    code += `  }\n`;
    code += `};\n`;
    
    return code;
  }

  toPascalCase(str) {
    return str.replace(/(?:^|\s)\w/g, match => match.toUpperCase()).replace(/\s+/g, '');
  }

  toCamelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) => 
      index === 0 ? match.toLowerCase() : match.toUpperCase()
    ).replace(/\s+/g, '');
  }

  toSnakeCase(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }
}

// ==================== 用户交互 ====================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

function askChoice(question, choices) {
  return new Promise((resolve) => {
    console.log(question);
    choices.forEach((choice, index) => {
      console.log(`${index + 1}. ${choice}`);
    });
    
    rl.question('请选择 (输入数字): ', (answer) => {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < choices.length) {
        resolve(choices[index]);
      } else {
        console.log('无效选择，请重新输入');
        return askChoice(question, choices);
      }
    });
  });
}

function askConfirm(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// ==================== 主要功能 ====================

async function collectConfig() {
  console.log('🎲 测试数据生成器');
  console.log('==================');
  console.log('');
  
  const config = { ...DEFAULT_CONFIG };
  
  // 数据类型
  const dataType = await askChoice(
    '选择数据类型',
    Object.values(DATA_TYPES)
  );
  config.dataType = Object.keys(DATA_TYPES).find(
    key => DATA_TYPES[key] === dataType
  );
  
  // 生成数量
  const count = await askQuestion('生成数量', '10');
  config.count = parseInt(count) || 10;
  
  // 输出格式
  const outputFormat = await askChoice(
    '选择输出格式',
    Object.values(OUTPUT_FORMATS)
  );
  config.format = Object.keys(OUTPUT_FORMATS).find(
    key => OUTPUT_FORMATS[key] === outputFormat
  );
  
  // 输出目录
  config.outputDir = await askQuestion('输出目录', config.outputDir);
  
  // 其他选项
  config.includeTypes = await askConfirm('生成TypeScript类型定义？');
  config.includeExamples = await askConfirm('包含使用示例？');
  
  // 显示配置摘要
  console.log('');
  console.log('📋 配置摘要:');
  console.log(`数据类型: ${dataType}`);
  console.log(`生成数量: ${config.count}`);
  console.log(`输出格式: ${outputFormat}`);
  console.log(`输出目录: ${config.outputDir}`);
  console.log(`TypeScript类型: ${config.includeTypes ? '是' : '否'}`);
  console.log(`使用示例: ${config.includeExamples ? '是' : '否'}`);
  console.log('');
  
  const confirm = await askConfirm('确认生成数据？');
  if (!confirm) {
    console.log('❌ 操作已取消');
    rl.close();
    process.exit(0);
  }
  
  return config;
}

async function generateData(config) {
  const generator = new TestDataGenerator(config);
  
  try {
    console.log('🔄 正在生成数据...');
    
    // 生成数据
    const data = generator.generate(config.dataType, {
      count: config.count
    });
    
    console.log('✅ 数据生成完成');
    
    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${config.dataType}_${timestamp}.${config.format === 'typescript' ? 'ts' : 'json'}`;
    
    // 保存文件
    const filePath = await generator.saveToFile(data, filename, config.format);
    
    // 生成示例代码
    if (config.includeExamples) {
      const exampleFilename = `${config.dataType}_example.ts`;
      const exampleCode = generateExampleCode(config.dataType, filename);
      await generator.saveToFile(exampleCode, exampleFilename, 'typescript');
    }
    
    console.log('');
    console.log('🎉 数据生成成功!');
    console.log(`📁 文件位置: ${filePath}`);
    console.log(`📊 数据数量: ${Array.isArray(data) ? data.length : 1}`);
    
    // 显示数据预览
    if (Array.isArray(data) && data.length > 0) {
      console.log('');
      console.log('📝 数据预览:');
      console.log(JSON.stringify(data[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ 生成数据时出错:', error.message);
    process.exit(1);
  }
}

function generateExampleCode(dataType, filename) {
  const examples = {
    user: `// 用户数据使用示例
import { users } from './${filename}';

// 获取所有用户
const allUsers = users;

// 获取管理员用户
const adminUsers = users.filter(user => user.role === 'admin');

// 获取活跃用户
const activeUsers = users.filter(user => user.isActive);

// 按注册时间排序
const recentUsers = users.sort((a, b) => 
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);

console.log(\`总用户数: \${allUsers.length}\`);
console.log(\`管理员数: \${adminUsers.length}\`);
console.log(\`活跃用户数: \${activeUsers.length}\`);`,

    product: `// 产品数据使用示例
import { products } from './${filename}';

// 获取所有产品
const allProducts = products;

// 按分类筛选
const electronics = products.filter(product => product.category === '电子产品');

// 按价格筛选
const expensiveProducts = products.filter(product => product.price > 500);

// 按评分排序
const topRated = products.sort((a, b) => b.rating - a.rating).slice(0, 10);

console.log(\`总产品数: \${allProducts.length}\`);
console.log(\`电子产品数: \${electronics.length}\`);
console.log(\`高价产品数: \${expensiveProducts.length}\`);`,

    order: `// 订单数据使用示例
import { orders } from './${filename}';

// 获取所有订单
const allOrders = orders;

// 按状态筛选
const pendingOrders = orders.filter(order => order.status === 'pending');

// 计算总销售额
const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

// 按时间统计
const ordersByMonth = {};
orders.forEach(order => {
  const month = new Date(order.createdAt).toISOString().slice(0, 7);
  ordersByMonth[month] = (ordersByMonth[month] || 0) + 1;
});

console.log(\`总订单数: \${allOrders.length}\`);
console.log(\`待处理订单: \${pendingOrders.length}\`);
console.log(\`总销售额: \${totalRevenue.toFixed(2)}\`);
console.log('按月统计:', ordersByMonth);`,

    form: `// 表单数据使用示例
import { loginForms } from './${filename}';

// 测试登录表单验证
function validateLoginForm(formData) {
  const errors = {};
  
  if (!formData.email) {
    errors.email = '邮箱不能为空';
  } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
    errors.email = '邮箱格式不正确';
  }
  
  if (!formData.password) {
    errors.password = '密码不能为空';
  } else if (formData.password.length < 6) {
    errors.password = '密码长度不能少于6位';
  }
  
  return errors;
}

// 测试每个表单
loginForms.forEach((form, index) => {
  const errors = validateLoginForm(form);
  console.log(\`表单 \${index + 1}:\`, errors);
});`
  };
  
  return examples[dataType] || `// ${dataType} 数据使用示例
import { data } from './${filename}';

console.log('生成的数据:', data);`;
}

function showHelp() {
  console.log(`
🎲 测试数据生成器

使用方法:
  node tools/test-data-generator.js

选项:
  -h, --help     显示帮助信息
  -t, --type <type>  数据类型 (user, product, order, form, api, file)
  -c, --count <n>   生成数量
  -f, --format <fmt> 输出格式 (json, csv, typescript, fixture, seed)
  -o, --output <dir> 输出目录

示例:
  node tools/test-data-generator.js              # 交互式模式
  node tools/test-data-generator.js -t user -c 50  # 生成50个用户
  node tools/test-data-generator.js -t product -f csv  # 生成CSV格式的产品数据

支持的数据类型:
  - user: 用户数据
  - product: 产品数据
  - order: 订单数据
  - form: 表单数据
  - api: API响应数据
  - file: 文件数据

支持的输出格式:
  - json: JSON格式
  - csv: CSV格式
  - typescript: TypeScript代码
  - fixture: 测试固件
  - seed: 数据库种子数据
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }
  
  const config = { ...DEFAULT_CONFIG };
  
  const typeIndex = args.findIndex(arg => arg === '-t' || arg === '--type');
  if (typeIndex !== -1) {
    config.dataType = args[typeIndex + 1];
  }
  
  const countIndex = args.findIndex(arg => arg === '-c' || arg === '--count');
  if (countIndex !== -1) {
    config.count = parseInt(args[countIndex + 1]) || 10;
  }
  
  const formatIndex = args.findIndex(arg => arg === '-f' || arg === '--format');
  if (formatIndex !== -1) {
    config.format = args[formatIndex + 1];
  }
  
  const outputIndex = args.findIndex(arg => arg === '-o' || arg === '--output');
  if (outputIndex !== -1) {
    config.outputDir = args[outputIndex + 1];
  }
  
  return config;
}

// ==================== 启动 ====================

if (require.main === module) {
  const args = parseArgs();
  
  if (args.dataType) {
    // 命令行模式
    generateData(args);
  } else {
    // 交互式模式
    collectConfig().then(generateData).finally(() => {
      rl.close();
    });
  }
}

module.exports = {
  TestDataGenerator,
  UserGenerator,
  ProductGenerator,
  OrderGenerator,
  FormGenerator,
  ApiResponseGenerator,
  FileGenerator
};