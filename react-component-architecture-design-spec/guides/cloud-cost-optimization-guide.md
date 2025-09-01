# ☁️ 云服务成本优化指南

> **在保证性能和可靠性的前提下，最大化降低云服务成本**

## 📋 概述

本指南提供全面的云服务成本优化策略，帮助团队在AWS、阿里云等主流云平台上构建成本效益最优的架构，实现30-70%的成本节省。

## 🎯 成本优化原则

1. **按需付费**: 只为实际使用的资源付费
2. **弹性伸缩**: 根据负载动态调整资源
3. **预留折扣**: 利用长期承诺获得折扣
4. **资源复用**: 最大化资源利用率
5. **持续优化**: 定期审查和优化成本

## 💰 成本分析和监控

### 1. 成本可视化Dashboard

```typescript
// cost-monitoring/dashboard.ts
export class CostDashboard {
  async generateReport(): Promise<CostReport> {
    const services = await this.getServiceCosts();
    const trends = await this.analyzeTrends();
    const recommendations = await this.getRecommendations();
    
    return {
      totalCost: this.calculateTotal(services),
      breakdown: {
        compute: services.ec2 + services.lambda,
        storage: services.s3 + services.ebs,
        network: services.cloudfront + services.dataTransfer,
        database: services.rds + services.dynamodb,
        other: services.other,
      },
      trends: {
        daily: trends.daily,
        weekly: trends.weekly,
        monthly: trends.monthly,
        forecast: this.forecastCost(trends),
      },
      recommendations,
      savings: this.calculatePotentialSavings(recommendations),
    };
  }

  // 成本异常检测
  async detectAnomalies(): Promise<CostAnomaly[]> {
    const baseline = await this.getBaseline();
    const current = await this.getCurrentCost();
    
    const anomalies: CostAnomaly[] = [];
    
    // 检测异常增长
    if (current.daily > baseline.daily * 1.5) {
      anomalies.push({
        type: 'SPIKE',
        service: this.findSpikeSource(current, baseline),
        increase: ((current.daily - baseline.daily) / baseline.daily) * 100,
        recommendation: '检查是否有资源泄露或异常流量',
      });
    }
    
    return anomalies;
  }
}
```

### 2. 成本标签策略

```yaml
# terraform/tags.tf
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    Team        = var.team_name
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
    CreatedAt   = timestamp()
  }
  
  # 成本分配标签
  cost_tags = {
    BusinessUnit = var.business_unit
    Application  = var.application_name
    Owner        = var.owner_email
    AutoShutdown = var.auto_shutdown_enabled
  }
}

# 应用到所有资源
resource "aws_instance" "app" {
  # ... 其他配置
  
  tags = merge(
    local.common_tags,
    local.cost_tags,
    {
      Name = "app-server-${var.environment}"
      Type = "application"
    }
  )
}
```

## 🖥️ 计算资源优化

### 1. EC2实例优化

```typescript
// optimization/ec2-optimizer.ts
export class EC2Optimizer {
  // 实例类型优化
  async rightSizeInstances(): Promise<RightSizingRecommendation[]> {
    const instances = await this.getInstances();
    const recommendations: RightSizingRecommendation[] = [];
    
    for (const instance of instances) {
      const metrics = await this.getInstanceMetrics(instance.id);
      
      // CPU利用率低于20%
      if (metrics.avgCpuUtilization < 20) {
        recommendations.push({
          instanceId: instance.id,
          currentType: instance.type,
          recommendedType: this.getSmallerInstance(instance.type),
          estimatedSavings: this.calculateSavings(instance),
          reason: 'CPU利用率低',
        });
      }
      
      // 内存使用率低于30%
      if (metrics.avgMemoryUtilization < 30) {
        recommendations.push({
          instanceId: instance.id,
          currentType: instance.type,
          recommendedType: this.getLowerMemoryInstance(instance.type),
          estimatedSavings: this.calculateMemorySavings(instance),
          reason: '内存使用率低',
        });
      }
    }
    
    return recommendations;
  }

  // Spot实例策略
  async implementSpotStrategy(): Promise<SpotStrategy> {
    return {
      // 无状态服务使用Spot
      statelessServices: {
        enabled: true,
        maxPrice: '0.05', // 最高出价
        instanceTypes: ['t3.medium', 't3.large'],
        availabilityZones: ['us-east-1a', 'us-east-1b'],
        fallbackToOnDemand: true,
      },
      
      // 批处理任务使用Spot
      batchJobs: {
        enabled: true,
        spotFleetConfig: {
          targetCapacity: 10,
          allocationStrategy: 'lowestPrice',
          instancePools: 3,
        },
      },
      
      // 开发环境全部使用Spot
      development: {
        enabled: true,
        spotPercentage: 100,
        interruptionBehavior: 'terminate',
      },
    };
  }

  // 预留实例管理
  async manageReservedInstances(): Promise<ReservedInstancePlan> {
    const usage = await this.analyzeUsagePattern();
    
    return {
      // 稳定负载购买3年期RI
      baselineCapacity: {
        term: '3-year',
        paymentOption: 'all-upfront', // 全预付最省钱
        instanceCount: usage.baseline,
        estimatedSavings: usage.baseline * 0.72, // 约72%折扣
      },
      
      // 可预测负载购买1年期RI
      predictableCapacity: {
        term: '1-year',
        paymentOption: 'partial-upfront',
        instanceCount: usage.predictable,
        estimatedSavings: usage.predictable * 0.42, // 约42%折扣
      },
      
      // 弹性负载使用按需实例
      elasticCapacity: {
        useOnDemand: true,
        useSavingsPlans: true,
        coverageTarget: 0.7, // 70%覆盖率
      },
    };
  }
}
```

### 2. Lambda优化

```typescript
// optimization/lambda-optimizer.ts
export class LambdaOptimizer {
  // 内存优化
  async optimizeMemory(): Promise<MemoryOptimization[]> {
    const functions = await this.getFunctions();
    const optimizations: MemoryOptimization[] = [];
    
    for (const func of functions) {
      const invocations = await this.getInvocations(func.name);
      
      // 分析内存使用
      const memoryStats = this.analyzeMemoryUsage(invocations);
      
      // 推荐最优内存配置
      const optimalMemory = this.findOptimalMemory(
        memoryStats,
        func.timeout,
        func.averageDuration
      );
      
      if (optimalMemory !== func.memory) {
        optimizations.push({
          functionName: func.name,
          currentMemory: func.memory,
          recommendedMemory: optimalMemory,
          estimatedCostReduction: this.calculateCostReduction(func, optimalMemory),
          performanceImpact: this.assessPerformanceImpact(func, optimalMemory),
        });
      }
    }
    
    return optimizations;
  }

  // 冷启动优化
  async reduceColdStarts(): Promise<ColdStartOptimization> {
    return {
      // 预留并发
      provisionedConcurrency: {
        enabled: true,
        functions: ['critical-api', 'user-auth'],
        concurrency: 5,
        schedule: {
          // 工作时间增加并发
          weekday: { start: '08:00', end: '20:00', concurrency: 10 },
          // 周末减少并发
          weekend: { concurrency: 2 },
        },
      },
      
      // 定期预热
      warming: {
        enabled: true,
        interval: '5 minutes',
        concurrent: 3,
      },
      
      // 使用ARM架构（Graviton2）
      architecture: {
        useArm: true, // ARM比x86便宜20%
        functions: ['data-processing', 'image-resize'],
      },
    };
  }
}
```

### 3. 容器服务优化

```yaml
# k8s/cost-optimization.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: production
spec:
  hard:
    requests.cpu: "100"
    requests.memory: 200Gi
    limits.cpu: "200"
    limits.memory: 400Gi

---
# Cluster Autoscaler配置
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
spec:
  template:
    spec:
      containers:
      - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.21.0
        name: cluster-autoscaler
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste  # 最小浪费策略
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/my-cluster
        - --scale-down-enabled=true
        - --scale-down-unneeded-time=10m
        - --scale-down-utilization-threshold=0.5

---
# Vertical Pod Autoscaler
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: app-vpa
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: app
  updatePolicy:
    updateMode: "Auto"  # 自动更新Pod资源
  resourcePolicy:
    containerPolicies:
    - containerName: app
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 2
        memory: 2Gi
```

## 💾 存储优化

### 1. S3存储优化

```typescript
// optimization/s3-optimizer.ts
export class S3Optimizer {
  // 生命周期策略
  async setupLifecyclePolicies(): Promise<void> {
    const policies: S3LifecyclePolicy[] = [
      {
        id: 'archive-old-logs',
        rules: [
          {
            // 30天后转到IA
            transition: {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
          },
          {
            // 90天后转到Glacier
            transition: {
              days: 90,
              storageClass: 'GLACIER',
            },
          },
          {
            // 365天后删除
            expiration: {
              days: 365,
            },
          },
        ],
      },
      {
        id: 'clean-temp-files',
        prefix: 'temp/',
        rules: [
          {
            // 7天后删除临时文件
            expiration: {
              days: 7,
            },
          },
        ],
      },
      {
        id: 'intelligent-tiering',
        rules: [
          {
            // 使用智能分层
            transition: {
              days: 0,
              storageClass: 'INTELLIGENT_TIERING',
            },
          },
        ],
      },
    ];

    for (const policy of policies) {
      await this.applyLifecyclePolicy(policy);
    }
  }

  // 存储类别优化
  async optimizeStorageClasses(): Promise<StorageOptimization[]> {
    const buckets = await this.getBuckets();
    const optimizations: StorageOptimization[] = [];
    
    for (const bucket of buckets) {
      const analysis = await this.analyzeAccessPattern(bucket);
      
      if (analysis.accessFrequency === 'rare') {
        optimizations.push({
          bucket: bucket.name,
          currentClass: 'STANDARD',
          recommendedClass: 'STANDARD_IA',
          estimatedSavings: analysis.size * 0.5, // 约50%成本节省
        });
      }
      
      if (analysis.accessFrequency === 'archive') {
        optimizations.push({
          bucket: bucket.name,
          currentClass: 'STANDARD',
          recommendedClass: 'GLACIER',
          estimatedSavings: analysis.size * 0.9, // 约90%成本节省
        });
      }
    }
    
    return optimizations;
  }
}
```

### 2. 数据库优化

```typescript
// optimization/database-optimizer.ts
export class DatabaseOptimizer {
  // RDS优化
  async optimizeRDS(): Promise<RDSOptimization> {
    return {
      // 使用Aurora Serverless v2
      auroraServerless: {
        enabled: true,
        minCapacity: 0.5, // 最小0.5 ACU
        maxCapacity: 4,   // 最大4 ACU
        autoPause: {
          enabled: true,
          pauseAfter: 300, // 5分钟无活动后暂停
        },
      },
      
      // 读写分离
      readReplicas: {
        enabled: true,
        count: 2,
        crossAZ: false, // 同AZ节省数据传输费用
      },
      
      // 备份优化
      backup: {
        retentionPeriod: 7, // 只保留7天备份
        backupWindow: '03:00-04:00', // 低峰期备份
        skipFinalSnapshot: false,
      },
      
      // 存储优化
      storage: {
        type: 'gp3', // 使用gp3比gp2便宜20%
        allocated: 100,
        autoScaling: {
          enabled: true,
          maxAllocated: 200,
        },
      },
    };
  }

  // DynamoDB优化
  async optimizeDynamoDB(): Promise<DynamoDBOptimization> {
    return {
      // 按需计费模式
      billingMode: 'PAY_PER_REQUEST',
      
      // 自动扩缩容
      autoScaling: {
        read: {
          min: 5,
          max: 100,
          targetUtilization: 70,
        },
        write: {
          min: 5,
          max: 100,
          targetUtilization: 70,
        },
      },
      
      // 全局表优化
      globalTables: {
        regions: ['us-east-1', 'eu-west-1'],
        consistentRead: false, // 最终一致性节省成本
      },
      
      // TTL清理过期数据
      ttl: {
        enabled: true,
        attributeName: 'expiresAt',
      },
    };
  }
}
```

## 🌐 网络和CDN优化

### 1. CloudFront优化

```typescript
// optimization/cdn-optimizer.ts
export class CDNOptimizer {
  async optimizeCDN(): Promise<CDNConfiguration> {
    return {
      // 价格类别优化
      priceClass: 'PriceClass_100', // 只使用便宜的边缘节点
      
      // 缓存策略
      cacheBehaviors: {
        // 静态资源长期缓存
        static: {
          pathPattern: '/static/*',
          ttl: {
            default: 86400 * 365, // 1年
            max: 86400 * 365,
          },
          compress: true,
        },
        
        // API短期缓存
        api: {
          pathPattern: '/api/*',
          ttl: {
            default: 60,
            max: 300,
          },
          cachePolicy: 'Managed-CachingOptimized',
        },
      },
      
      // 源站优化
      origins: {
        // 使用S3作为源站
        s3: {
          domainName: 's3.amazonaws.com',
          originAccessIdentity: true,
          connectionAttempts: 2,
          connectionTimeout: 5,
        },
        
        // 自定义源站
        custom: {
          domainName: 'api.example.com',
          originProtocolPolicy: 'https-only',
          originKeepaliveTimeout: 60,
          originReadTimeout: 30,
        },
      },
      
      // 压缩设置
      compression: {
        enabled: true,
        formats: ['gzip', 'br'],
      },
    };
  }

  // 智能路由
  async setupIntelligentRouting(): Promise<void> {
    // 根据用户地理位置路由到最近的源站
    const geoRoutingPolicy = {
      'US': 'us-east-1',
      'EU': 'eu-west-1',
      'ASIA': 'ap-southeast-1',
      'DEFAULT': 'us-east-1',
    };
    
    // 根据成本路由
    const costRoutingPolicy = {
      preferLowerCost: true,
      acceptableLatency: 100, // 100ms内选择成本最低的
    };
  }
}
```

## 📊 成本报告和预算

### 1. 自动化成本报告

```typescript
// reporting/cost-reporter.ts
export class CostReporter {
  async generateWeeklyReport(): Promise<string> {
    const data = await this.collectCostData();
    
    return `
# 📊 云服务成本周报

## 总览
- **本周总成本**: $${data.total.toFixed(2)}
- **环比变化**: ${data.change > 0 ? '↑' : '↓'} ${Math.abs(data.change)}%
- **预算使用率**: ${data.budgetUsage}%

## 服务成本排行
${data.services.map((s, i) => 
  `${i + 1}. ${s.name}: $${s.cost.toFixed(2)} (${s.percentage}%)`
).join('\n')}

## 成本异常
${data.anomalies.map(a => 
  `⚠️ ${a.service}: 成本增长 ${a.increase}%`
).join('\n')}

## 优化建议
${data.recommendations.map((r, i) => 
  `${i + 1}. ${r.action}: 预计节省 $${r.savings}/月`
).join('\n')}

## 下周预测
- **预计成本**: $${data.forecast.toFixed(2)}
- **预算剩余**: $${data.budgetRemaining.toFixed(2)}
    `;
  }

  // 预算告警
  async setupBudgetAlerts(): Promise<void> {
    const budgets = [
      {
        name: 'monthly-total',
        amount: 10000,
        alerts: [
          { threshold: 80, action: 'email' },
          { threshold: 90, action: 'slack' },
          { threshold: 100, action: 'pager' },
        ],
      },
      {
        name: 'compute-budget',
        amount: 5000,
        filter: { service: 'EC2' },
        alerts: [
          { threshold: 75, action: 'email' },
        ],
      },
    ];

    for (const budget of budgets) {
      await this.createBudget(budget);
    }
  }
}
```

## 🎯 成本优化检查清单

### 计算资源
- [ ] 使用Spot实例（节省70-90%）
- [ ] 购买预留实例（节省30-70%）
- [ ] 实施自动扩缩容
- [ ] 关闭非生产环境（夜间/周末）
- [ ] 使用ARM架构（节省20%）
- [ ] 容器资源限制设置

### 存储优化
- [ ] S3生命周期策略
- [ ] 智能分层存储
- [ ] 删除未使用的快照
- [ ] 压缩和去重
- [ ] 跨区域复制优化

### 数据库优化
- [ ] 使用Serverless数据库
- [ ] 读写分离架构
- [ ] 自动暂停开发数据库
- [ ] 优化备份策略
- [ ] 使用缓存减少查询

### 网络优化
- [ ] CDN缓存策略
- [ ] 减少跨区域传输
- [ ] NAT网关优化
- [ ] VPC端点使用
- [ ] 数据压缩传输

### 监控和治理
- [ ] 成本标签策略
- [ ] 预算告警设置
- [ ] 定期成本审查
- [ ] 自动化优化脚本
- [ ] FinOps文化建设

---

**记住：云成本优化是持续的过程，每月可节省30-70%的成本！** 💰