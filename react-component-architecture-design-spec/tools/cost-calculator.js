#!/usr/bin/env node

/**
 * 云服务成本计算器
 * 预估和优化AWS、阿里云等云服务成本
 */

const fs = require('fs').promises;
const path = require('path');

// ==================== 成本配置 ====================

const PRICING = {
  // AWS价格配置
  aws: {
    // EC2实例价格 (按小时)
    ec2: {
      't3.micro': { onDemand: 0.0104, spot: 0.0031, reserved1y: 0.0059, reserved3y: 0.0037 },
      't3.small': { onDemand: 0.0208, spot: 0.0062, reserved1y: 0.0118, reserved3y: 0.0075 },
      't3.medium': { onDemand: 0.0416, spot: 0.0125, reserved1y: 0.0235, reserved3y: 0.0149 },
      't3.large': { onDemand: 0.0832, spot: 0.025, reserved1y: 0.047, reserved3y: 0.0298 },
      'm5.large': { onDemand: 0.096, spot: 0.0288, reserved1y: 0.057, reserved3y: 0.035 },
      'm5.xlarge': { onDemand: 0.192, spot: 0.0576, reserved1y: 0.114, reserved3y: 0.070 },
      'm5.2xlarge': { onDemand: 0.384, spot: 0.1152, reserved1y: 0.228, reserved3y: 0.140 },
      'c5.large': { onDemand: 0.085, spot: 0.0255, reserved1y: 0.051, reserved3y: 0.032 },
      'c5.xlarge': { onDemand: 0.17, spot: 0.051, reserved1y: 0.102, reserved3y: 0.064 },
    },
    
    // Lambda价格
    lambda: {
      request: 0.0000002, // 每请求
      gbSecond: 0.0000166667, // 每GB-秒
      provisionedConcurrency: 0.000004646, // 每GB-秒
    },
    
    // S3存储价格 (按GB/月)
    s3: {
      standard: 0.023,
      standardIA: 0.0125,
      glacier: 0.004,
      glacierDeep: 0.00099,
      intelligentTiering: 0.023,
    },
    
    // RDS价格 (按小时)
    rds: {
      'db.t3.micro': { onDemand: 0.017, reserved1y: 0.011, reserved3y: 0.007 },
      'db.t3.small': { onDemand: 0.034, reserved1y: 0.022, reserved3y: 0.014 },
      'db.t3.medium': { onDemand: 0.068, reserved1y: 0.044, reserved3y: 0.028 },
      'db.m5.large': { onDemand: 0.171, reserved1y: 0.107, reserved3y: 0.067 },
      'db.m5.xlarge': { onDemand: 0.342, reserved1y: 0.214, reserved3y: 0.134 },
    },
    
    // 数据传输价格 (按GB)
    dataTransfer: {
      inbound: 0,
      outbound: {
        first10TB: 0.09,
        next40TB: 0.085,
        next100TB: 0.07,
        above150TB: 0.05,
      },
      interRegion: 0.02,
      interAZ: 0.01,
    },
    
    // CloudFront CDN价格 (按GB)
    cloudfront: {
      northAmerica: 0.085,
      europe: 0.085,
      asia: 0.14,
      southAmerica: 0.25,
    },
  },
  
  // 阿里云价格配置
  aliyun: {
    // ECS实例价格 (按小时)
    ecs: {
      'ecs.t6-c1m1.small': { onDemand: 0.044, spot: 0.013 },
      'ecs.t6-c1m2.large': { onDemand: 0.087, spot: 0.026 },
      'ecs.c6.large': { onDemand: 0.158, spot: 0.047 },
      'ecs.c6.xlarge': { onDemand: 0.316, spot: 0.095 },
      'ecs.g6.large': { onDemand: 0.158, spot: 0.047 },
    },
    
    // 函数计算价格
    fc: {
      request: 0.0000002, // 每请求
      gbSecond: 0.00001667, // 每GB-秒
    },
    
    // OSS存储价格 (按GB/月)
    oss: {
      standard: 0.12,
      ia: 0.08,
      archive: 0.033,
    },
    
    // RDS价格 (按小时)
    rds: {
      'mysql.n1.micro.1': { onDemand: 0.034 },
      'mysql.n2.small.1': { onDemand: 0.071 },
      'mysql.n2.medium.1': { onDemand: 0.142 },
      'mysql.n4.large.1': { onDemand: 0.285 },
    },
  },
};

// ==================== 成本计算器 ====================

class CostCalculator {
  constructor(provider = 'aws') {
    this.provider = provider;
    this.pricing = PRICING[provider];
    
    if (!this.pricing) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * 计算EC2/ECS成本
   */
  calculateCompute(config) {
    const {
      instanceType,
      instanceCount = 1,
      hoursPerMonth = 730,
      purchaseOption = 'onDemand', // onDemand, spot, reserved1y, reserved3y
    } = config;

    const instancePricing = this.provider === 'aws' 
      ? this.pricing.ec2[instanceType]
      : this.pricing.ecs[instanceType];

    if (!instancePricing) {
      throw new Error(`Unknown instance type: ${instanceType}`);
    }

    const hourlyRate = instancePricing[purchaseOption] || instancePricing.onDemand;
    const monthlyCost = hourlyRate * hoursPerMonth * instanceCount;
    const annualCost = monthlyCost * 12;

    // 计算节省
    const onDemandCost = instancePricing.onDemand * hoursPerMonth * instanceCount * 12;
    const savings = onDemandCost - annualCost;
    const savingsPercent = (savings / onDemandCost) * 100;

    return {
      hourly: hourlyRate * instanceCount,
      monthly: monthlyCost,
      annual: annualCost,
      savings: {
        amount: savings,
        percent: savingsPercent.toFixed(1),
      },
    };
  }

  /**
   * 计算Lambda/函数计算成本
   */
  calculateServerless(config) {
    const {
      requestsPerMonth = 1000000,
      averageDuration = 200, // 毫秒
      memorySize = 512, // MB
      provisionedConcurrency = 0,
    } = config;

    const pricing = this.provider === 'aws' ? this.pricing.lambda : this.pricing.fc;

    // 请求成本
    const requestCost = requestsPerMonth * pricing.request;

    // 计算GB-秒
    const gbSeconds = (requestsPerMonth * averageDuration * memorySize) / (1000 * 1024);
    const computeCost = gbSeconds * pricing.gbSecond;

    // 预留并发成本 (仅AWS)
    let provisionedCost = 0;
    if (this.provider === 'aws' && provisionedConcurrency > 0) {
      const provisionedGbHours = provisionedConcurrency * (memorySize / 1024) * 730;
      provisionedCost = provisionedGbHours * pricing.provisionedConcurrency;
    }

    const totalMonthlyCost = requestCost + computeCost + provisionedCost;

    return {
      monthly: {
        requests: requestCost,
        compute: computeCost,
        provisioned: provisionedCost,
        total: totalMonthlyCost,
      },
      annual: totalMonthlyCost * 12,
      perRequest: totalMonthlyCost / requestsPerMonth,
    };
  }

  /**
   * 计算存储成本
   */
  calculateStorage(config) {
    const {
      storageGB = 100,
      storageClass = 'standard',
      requestsPerMonth = 100000,
      dataTransferGB = 10,
    } = config;

    const storagePricing = this.provider === 'aws' ? this.pricing.s3 : this.pricing.oss;
    const storageRate = storagePricing[storageClass] || storagePricing.standard;

    // 存储成本
    const storageCost = storageGB * storageRate;

    // 请求成本 (简化计算)
    const requestCost = requestsPerMonth * 0.0004 / 1000; // GET请求

    // 数据传输成本
    let transferCost = 0;
    if (this.provider === 'aws') {
      if (dataTransferGB <= 10240) {
        transferCost = dataTransferGB * this.pricing.dataTransfer.outbound.first10TB;
      } else if (dataTransferGB <= 51200) {
        transferCost = 10240 * this.pricing.dataTransfer.outbound.first10TB +
                      (dataTransferGB - 10240) * this.pricing.dataTransfer.outbound.next40TB;
      }
    } else {
      transferCost = dataTransferGB * 0.5; // 阿里云简化计算
    }

    const totalMonthlyCost = storageCost + requestCost + transferCost;

    return {
      monthly: {
        storage: storageCost,
        requests: requestCost,
        transfer: transferCost,
        total: totalMonthlyCost,
      },
      annual: totalMonthlyCost * 12,
      perGB: totalMonthlyCost / storageGB,
    };
  }

  /**
   * 计算数据库成本
   */
  calculateDatabase(config) {
    const {
      instanceType,
      storageGB = 100,
      backupGB = 100,
      hoursPerMonth = 730,
      multiAZ = false,
      readReplicas = 0,
    } = config;

    const dbPricing = this.pricing.rds[instanceType];
    if (!dbPricing) {
      throw new Error(`Unknown database instance type: ${instanceType}`);
    }

    // 实例成本
    const instanceCost = dbPricing.onDemand * hoursPerMonth * (multiAZ ? 2 : 1);

    // 存储成本
    const storageCost = storageGB * 0.115; // 通用SSD

    // 备份成本
    const backupCost = backupGB * 0.095;

    // 读副本成本
    const replicaCost = readReplicas * dbPricing.onDemand * hoursPerMonth;

    const totalMonthlyCost = instanceCost + storageCost + backupCost + replicaCost;

    return {
      monthly: {
        instance: instanceCost,
        storage: storageCost,
        backup: backupCost,
        replicas: replicaCost,
        total: totalMonthlyCost,
      },
      annual: totalMonthlyCost * 12,
    };
  }

  /**
   * 计算CDN成本
   */
  calculateCDN(config) {
    const {
      dataTransferGB = 1000,
      requestsPerMonth = 10000000,
      region = 'northAmerica',
    } = config;

    if (this.provider !== 'aws') {
      return { monthly: 0, annual: 0 }; // 简化处理
    }

    const cdnPricing = this.pricing.cloudfront[region];
    
    // 数据传输成本
    const transferCost = dataTransferGB * cdnPricing;
    
    // 请求成本
    const httpRequestCost = requestsPerMonth * 0.0075 / 10000; // HTTP请求
    const httpsRequestCost = requestsPerMonth * 0.01 / 10000; // HTTPS请求
    
    const totalMonthlyCost = transferCost + httpsRequestCost;

    return {
      monthly: {
        transfer: transferCost,
        requests: httpsRequestCost,
        total: totalMonthlyCost,
      },
      annual: totalMonthlyCost * 12,
      perGB: totalMonthlyCost / dataTransferGB,
    };
  }

  /**
   * 计算完整架构成本
   */
  calculateArchitecture(architecture) {
    const results = {
      compute: { monthly: 0, annual: 0 },
      serverless: { monthly: 0, annual: 0 },
      storage: { monthly: 0, annual: 0 },
      database: { monthly: 0, annual: 0 },
      cdn: { monthly: 0, annual: 0 },
      total: { monthly: 0, annual: 0 },
    };

    // 计算各组件成本
    if (architecture.compute) {
      const computeCost = this.calculateCompute(architecture.compute);
      results.compute = {
        monthly: computeCost.monthly,
        annual: computeCost.annual,
        details: computeCost,
      };
    }

    if (architecture.serverless) {
      const serverlessCost = this.calculateServerless(architecture.serverless);
      results.serverless = {
        monthly: serverlessCost.monthly.total,
        annual: serverlessCost.annual,
        details: serverlessCost,
      };
    }

    if (architecture.storage) {
      const storageCost = this.calculateStorage(architecture.storage);
      results.storage = {
        monthly: storageCost.monthly.total,
        annual: storageCost.annual,
        details: storageCost,
      };
    }

    if (architecture.database) {
      const databaseCost = this.calculateDatabase(architecture.database);
      results.database = {
        monthly: databaseCost.monthly.total,
        annual: databaseCost.annual,
        details: databaseCost,
      };
    }

    if (architecture.cdn) {
      const cdnCost = this.calculateCDN(architecture.cdn);
      results.cdn = {
        monthly: cdnCost.monthly.total,
        annual: cdnCost.annual,
        details: cdnCost,
      };
    }

    // 计算总成本
    results.total.monthly = 
      results.compute.monthly +
      results.serverless.monthly +
      results.storage.monthly +
      results.database.monthly +
      results.cdn.monthly;

    results.total.annual = results.total.monthly * 12;

    return results;
  }
}

// ==================== 成本优化器 ====================

class CostOptimizer {
  constructor(calculator) {
    this.calculator = calculator;
  }

  /**
   * 优化计算资源
   */
  optimizeCompute(currentConfig) {
    const recommendations = [];
    const currentCost = this.calculator.calculateCompute(currentConfig);

    // 推荐Spot实例
    if (currentConfig.purchaseOption === 'onDemand') {
      const spotConfig = { ...currentConfig, purchaseOption: 'spot' };
      const spotCost = this.calculator.calculateCompute(spotConfig);
      
      recommendations.push({
        type: 'USE_SPOT_INSTANCES',
        description: '使用Spot实例（适用于无状态服务）',
        currentCost: currentCost.annual,
        optimizedCost: spotCost.annual,
        savings: currentCost.annual - spotCost.annual,
        savingsPercent: ((currentCost.annual - spotCost.annual) / currentCost.annual * 100).toFixed(1),
      });
    }

    // 推荐预留实例
    if (currentConfig.purchaseOption === 'onDemand') {
      const reserved1yConfig = { ...currentConfig, purchaseOption: 'reserved1y' };
      const reserved1yCost = this.calculator.calculateCompute(reserved1yConfig);
      
      recommendations.push({
        type: 'USE_RESERVED_INSTANCES',
        description: '购买1年期预留实例（适用于稳定负载）',
        currentCost: currentCost.annual,
        optimizedCost: reserved1yCost.annual,
        savings: currentCost.annual - reserved1yCost.annual,
        savingsPercent: ((currentCost.annual - reserved1yCost.annual) / currentCost.annual * 100).toFixed(1),
      });
    }

    // 推荐实例大小优化
    if (currentConfig.utilizationPercent && currentConfig.utilizationPercent < 50) {
      const smallerInstance = this.getSmallerInstance(currentConfig.instanceType);
      if (smallerInstance) {
        const optimizedConfig = { ...currentConfig, instanceType: smallerInstance };
        const optimizedCost = this.calculator.calculateCompute(optimizedConfig);
        
        recommendations.push({
          type: 'RIGHT_SIZE_INSTANCE',
          description: `降低实例规格到 ${smallerInstance}（当前利用率低于50%）`,
          currentCost: currentCost.annual,
          optimizedCost: optimizedCost.annual,
          savings: currentCost.annual - optimizedCost.annual,
          savingsPercent: ((currentCost.annual - optimizedCost.annual) / currentCost.annual * 100).toFixed(1),
        });
      }
    }

    return recommendations;
  }

  /**
   * 优化存储成本
   */
  optimizeStorage(currentConfig) {
    const recommendations = [];
    const currentCost = this.calculator.calculateStorage(currentConfig);

    // 推荐智能分层
    if (currentConfig.storageClass === 'standard' && currentConfig.accessPattern === 'infrequent') {
      const iaConfig = { ...currentConfig, storageClass: 'standardIA' };
      const iaCost = this.calculator.calculateStorage(iaConfig);
      
      recommendations.push({
        type: 'USE_INFREQUENT_ACCESS',
        description: '使用低频访问存储类（适用于访问频率低的数据）',
        currentCost: currentCost.annual,
        optimizedCost: iaCost.annual,
        savings: currentCost.annual - iaCost.annual,
        savingsPercent: ((currentCost.annual - iaCost.annual) / currentCost.annual * 100).toFixed(1),
      });
    }

    // 推荐归档存储
    if (currentConfig.storageClass === 'standard' && currentConfig.accessPattern === 'archive') {
      const archiveConfig = { ...currentConfig, storageClass: 'glacier' };
      const archiveCost = this.calculator.calculateStorage(archiveConfig);
      
      recommendations.push({
        type: 'USE_ARCHIVE_STORAGE',
        description: '使用归档存储（适用于长期保存的数据）',
        currentCost: currentCost.annual,
        optimizedCost: archiveCost.annual,
        savings: currentCost.annual - archiveCost.annual,
        savingsPercent: ((currentCost.annual - archiveCost.annual) / currentCost.annual * 100).toFixed(1),
      });
    }

    return recommendations;
  }

  /**
   * 获取更小的实例类型
   */
  getSmallerInstance(instanceType) {
    const sizeMap = {
      '2xlarge': 'xlarge',
      'xlarge': 'large',
      'large': 'medium',
      'medium': 'small',
      'small': 'micro',
    };

    for (const [size, smaller] of Object.entries(sizeMap)) {
      if (instanceType.includes(size)) {
        return instanceType.replace(size, smaller);
      }
    }

    return null;
  }

  /**
   * 生成优化报告
   */
  generateOptimizationReport(architecture) {
    const report = {
      currentCost: this.calculator.calculateArchitecture(architecture),
      recommendations: [],
      totalSavings: 0,
    };

    // 优化各组件
    if (architecture.compute) {
      const computeRecs = this.optimizeCompute(architecture.compute);
      report.recommendations.push(...computeRecs);
    }

    if (architecture.storage) {
      const storageRecs = this.optimizeStorage(architecture.storage);
      report.recommendations.push(...storageRecs);
    }

    // 计算总节省
    report.totalSavings = report.recommendations.reduce((sum, rec) => sum + rec.savings, 0);
    report.savingsPercent = (report.totalSavings / report.currentCost.total.annual * 100).toFixed(1);

    return report;
  }
}

// ==================== 场景预设 ====================

const SCENARIOS = {
  // 初创公司
  startup: {
    description: '初创公司基础架构',
    architecture: {
      compute: {
        instanceType: 't3.small',
        instanceCount: 2,
        hoursPerMonth: 730,
        purchaseOption: 'onDemand',
      },
      serverless: {
        requestsPerMonth: 100000,
        averageDuration: 200,
        memorySize: 512,
      },
      storage: {
        storageGB: 100,
        storageClass: 'standard',
        requestsPerMonth: 50000,
        dataTransferGB: 50,
      },
      database: {
        instanceType: 'db.t3.small',
        storageGB: 100,
        backupGB: 100,
      },
    },
  },

  // 中型企业
  medium: {
    description: '中型企业标准架构',
    architecture: {
      compute: {
        instanceType: 'm5.large',
        instanceCount: 4,
        hoursPerMonth: 730,
        purchaseOption: 'reserved1y',
      },
      serverless: {
        requestsPerMonth: 1000000,
        averageDuration: 150,
        memorySize: 1024,
      },
      storage: {
        storageGB: 1000,
        storageClass: 'standard',
        requestsPerMonth: 500000,
        dataTransferGB: 500,
      },
      database: {
        instanceType: 'db.m5.large',
        storageGB: 500,
        backupGB: 500,
        multiAZ: true,
        readReplicas: 1,
      },
      cdn: {
        dataTransferGB: 5000,
        requestsPerMonth: 50000000,
        region: 'northAmerica',
      },
    },
  },

  // 大型企业
  enterprise: {
    description: '大型企业高可用架构',
    architecture: {
      compute: {
        instanceType: 'm5.2xlarge',
        instanceCount: 10,
        hoursPerMonth: 730,
        purchaseOption: 'reserved3y',
      },
      serverless: {
        requestsPerMonth: 10000000,
        averageDuration: 100,
        memorySize: 2048,
        provisionedConcurrency: 5,
      },
      storage: {
        storageGB: 10000,
        storageClass: 'intelligentTiering',
        requestsPerMonth: 5000000,
        dataTransferGB: 5000,
      },
      database: {
        instanceType: 'db.m5.xlarge',
        storageGB: 2000,
        backupGB: 2000,
        multiAZ: true,
        readReplicas: 3,
      },
      cdn: {
        dataTransferGB: 50000,
        requestsPerMonth: 500000000,
        region: 'northAmerica',
      },
    },
  },
};

// ==================== 报告生成器 ====================

class ReportGenerator {
  /**
   * 生成成本报告
   */
  generateCostReport(results, title = '云服务成本分析报告') {
    const report = [];
    
    report.push(`# ${title}`);
    report.push('');
    report.push(`生成时间: ${new Date().toLocaleString()}`);
    report.push('');
    
    report.push('## 成本概览');
    report.push('');
    report.push(`- **月度总成本**: $${results.total.monthly.toFixed(2)}`);
    report.push(`- **年度总成本**: $${results.total.annual.toFixed(2)}`);
    report.push('');
    
    report.push('## 成本明细');
    report.push('');
    report.push('| 服务类型 | 月度成本 | 年度成本 | 占比 |');
    report.push('|---------|---------|---------|------|');
    
    const components = ['compute', 'serverless', 'storage', 'database', 'cdn'];
    components.forEach(component => {
      if (results[component].monthly > 0) {
        const percent = (results[component].monthly / results.total.monthly * 100).toFixed(1);
        report.push(`| ${this.formatComponentName(component)} | $${results[component].monthly.toFixed(2)} | $${results[component].annual.toFixed(2)} | ${percent}% |`);
      }
    });
    
    report.push('');
    
    // 详细成本
    components.forEach(component => {
      if (results[component].details) {
        report.push(`### ${this.formatComponentName(component)}成本详情`);
        report.push('');
        this.addComponentDetails(report, component, results[component].details);
        report.push('');
      }
    });
    
    return report.join('\n');
  }

  /**
   * 生成优化报告
   */
  generateOptimizationReport(optimizationResults) {
    const report = [];
    
    report.push('# 成本优化建议报告');
    report.push('');
    report.push(`生成时间: ${new Date().toLocaleString()}`);
    report.push('');
    
    report.push('## 优化概览');
    report.push('');
    report.push(`- **当前年度成本**: $${optimizationResults.currentCost.total.annual.toFixed(2)}`);
    report.push(`- **潜在年度节省**: $${optimizationResults.totalSavings.toFixed(2)}`);
    report.push(`- **节省百分比**: ${optimizationResults.savingsPercent}%`);
    report.push('');
    
    if (optimizationResults.recommendations.length > 0) {
      report.push('## 优化建议');
      report.push('');
      
      optimizationResults.recommendations.forEach((rec, index) => {
        report.push(`### ${index + 1}. ${rec.description}`);
        report.push('');
        report.push(`- **优化类型**: ${rec.type}`);
        report.push(`- **当前成本**: $${rec.currentCost.toFixed(2)}/年`);
        report.push(`- **优化后成本**: $${rec.optimizedCost.toFixed(2)}/年`);
        report.push(`- **预计节省**: $${rec.savings.toFixed(2)}/年 (${rec.savingsPercent}%)`);
        report.push('');
      });
    }
    
    report.push('## 实施建议');
    report.push('');
    report.push('1. 优先实施节省比例最高的优化方案');
    report.push('2. 在非生产环境先进行测试验证');
    report.push('3. 制定详细的迁移计划和回滚方案');
    report.push('4. 持续监控优化后的性能和成本');
    report.push('');
    
    return report.join('\n');
  }

  formatComponentName(component) {
    const names = {
      compute: '计算资源',
      serverless: '无服务器',
      storage: '存储',
      database: '数据库',
      cdn: 'CDN',
    };
    return names[component] || component;
  }

  addComponentDetails(report, component, details) {
    if (component === 'compute' && details.savings) {
      report.push(`- 相比按需实例节省: $${details.savings.amount.toFixed(2)}/年 (${details.savings.percent}%)`);
    }
    
    if (component === 'serverless' && details.monthly) {
      report.push(`- 请求成本: $${details.monthly.requests.toFixed(2)}/月`);
      report.push(`- 计算成本: $${details.monthly.compute.toFixed(2)}/月`);
      if (details.monthly.provisioned > 0) {
        report.push(`- 预留并发: $${details.monthly.provisioned.toFixed(2)}/月`);
      }
      report.push(`- 每请求成本: $${details.perRequest.toFixed(6)}`);
    }
    
    if (component === 'storage' && details.monthly) {
      report.push(`- 存储成本: $${details.monthly.storage.toFixed(2)}/月`);
      report.push(`- 请求成本: $${details.monthly.requests.toFixed(2)}/月`);
      report.push(`- 传输成本: $${details.monthly.transfer.toFixed(2)}/月`);
      report.push(`- 每GB成本: $${details.perGB.toFixed(4)}/月`);
    }
    
    if (component === 'database' && details.monthly) {
      report.push(`- 实例成本: $${details.monthly.instance.toFixed(2)}/月`);
      report.push(`- 存储成本: $${details.monthly.storage.toFixed(2)}/月`);
      report.push(`- 备份成本: $${details.monthly.backup.toFixed(2)}/月`);
      if (details.monthly.replicas > 0) {
        report.push(`- 读副本成本: $${details.monthly.replicas.toFixed(2)}/月`);
      }
    }
    
    if (component === 'cdn' && details.monthly) {
      report.push(`- 传输成本: $${details.monthly.transfer.toFixed(2)}/月`);
      report.push(`- 请求成本: $${details.monthly.requests.toFixed(2)}/月`);
      report.push(`- 每GB成本: $${details.perGB.toFixed(4)}`);
    }
  }
}

// ==================== CLI接口 ====================

class CostCalculatorCLI {
  constructor() {
    this.calculator = null;
    this.optimizer = null;
    this.reporter = new ReportGenerator();
  }

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

  showHelp() {
    console.log(`
云服务成本计算器 - 预估和优化云服务成本

使用方法:
  node cost-calculator.js <command> [options]

命令:
  calculate         计算成本
    --provider      云服务商: aws|aliyun (默认: aws)
    --scenario      场景: startup|medium|enterprise
    --config        配置文件路径
    --output        输出文件路径
    
  optimize          优化成本
    --provider      云服务商: aws|aliyun (默认: aws)
    --scenario      场景: startup|medium|enterprise
    --config        配置文件路径
    
  compare           比较方案
    --provider      云服务商: aws|aliyun (默认: aws)
    --scenarios     场景列表(逗号分隔)
    
  estimate          快速估算
    --provider      云服务商: aws|aliyun (默认: aws)
    --type          服务类型: compute|serverless|storage|database|cdn
    --spec          规格配置

示例:
  # 计算初创公司架构成本
  node cost-calculator.js calculate --scenario startup --provider aws
  
  # 优化现有架构
  node cost-calculator.js optimize --config architecture.json
  
  # 比较不同规模架构成本
  node cost-calculator.js compare --scenarios startup,medium,enterprise
    `);
  }

  async run() {
    const { command, options } = this.parseArgs();
    const provider = options.provider || 'aws';
    
    this.calculator = new CostCalculator(provider);
    this.optimizer = new CostOptimizer(this.calculator);
    
    try {
      switch (command) {
        case 'calculate': {
          const scenario = options.scenario || 'startup';
          const architecture = SCENARIOS[scenario]?.architecture;
          
          if (!architecture) {
            console.error(`Unknown scenario: ${scenario}`);
            process.exit(1);
          }
          
          console.log(`\n计算 ${SCENARIOS[scenario].description} 成本...`);
          const results = this.calculator.calculateArchitecture(architecture);
          const report = this.reporter.generateCostReport(results, SCENARIOS[scenario].description);
          
          console.log(report);
          
          if (options.output) {
            await fs.writeFile(options.output, report);
            console.log(`\n报告已保存到: ${options.output}`);
          }
          break;
        }
        
        case 'optimize': {
          const scenario = options.scenario || 'startup';
          const architecture = SCENARIOS[scenario]?.architecture;
          
          if (!architecture) {
            console.error(`Unknown scenario: ${scenario}`);
            process.exit(1);
          }
          
          // 添加利用率信息用于优化
          if (architecture.compute) {
            architecture.compute.utilizationPercent = 30; // 模拟低利用率
          }
          if (architecture.storage) {
            architecture.storage.accessPattern = 'infrequent'; // 模拟低频访问
          }
          
          console.log(`\n优化 ${SCENARIOS[scenario].description}...`);
          const optimizationResults = this.optimizer.generateOptimizationReport(architecture);
          const report = this.reporter.generateOptimizationReport(optimizationResults);
          
          console.log(report);
          break;
        }
        
        case 'compare': {
          const scenarios = (options.scenarios || 'startup,medium,enterprise').split(',');
          console.log('\n架构成本对比\n');
          console.log('| 架构类型 | 月度成本 | 年度成本 |');
          console.log('|---------|---------|---------|');
          
          for (const scenario of scenarios) {
            const architecture = SCENARIOS[scenario]?.architecture;
            if (architecture) {
              const results = this.calculator.calculateArchitecture(architecture);
              console.log(`| ${SCENARIOS[scenario].description} | $${results.total.monthly.toFixed(2)} | $${results.total.annual.toFixed(2)} |`);
            }
          }
          break;
        }
        
        case 'estimate': {
          const type = options.type || 'compute';
          
          if (type === 'compute') {
            const config = {
              instanceType: options.spec || 't3.medium',
              instanceCount: parseInt(options.count) || 1,
              hoursPerMonth: 730,
              purchaseOption: options.purchase || 'onDemand',
            };
            
            const result = this.calculator.calculateCompute(config);
            console.log(`\n计算资源成本估算:`);
            console.log(`- 实例类型: ${config.instanceType}`);
            console.log(`- 实例数量: ${config.instanceCount}`);
            console.log(`- 购买方式: ${config.purchaseOption}`);
            console.log(`- 每小时成本: $${result.hourly.toFixed(4)}`);
            console.log(`- 月度成本: $${result.monthly.toFixed(2)}`);
            console.log(`- 年度成本: $${result.annual.toFixed(2)}`);
            
            if (result.savings.percent > 0) {
              console.log(`- 节省: ${result.savings.percent}%`);
            }
          }
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
  CostCalculator,
  CostOptimizer,
  ReportGenerator,
  PRICING,
  SCENARIOS,
};

// ==================== CLI入口 ====================

if (require.main === module) {
  const cli = new CostCalculatorCLI();
  cli.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}