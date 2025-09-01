# 🌐 API层架构设计指南

> **构建高效、可维护、可扩展的API层架构，包括BFF和GraphQL实践**

## 📋 概述

本指南提供完整的API层架构设计方案，涵盖RESTful API、GraphQL、BFF (Backend for Frontend)等模式，帮助团队构建高性能、易维护的API层。

## 🎯 核心理念

### API设计原则
1. **一致性**: 统一的API风格和命名规范
2. **简洁性**: 直观易用的接口设计  
3. **版本化**: 支持API演进和向后兼容
4. **安全性**: 认证、授权、加密传输
5. **可观测性**: 日志、监控、追踪

## 🏗️ API架构模式

### 1. RESTful API架构

```typescript
// services/api/rest-client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export class RESTClient {
  private client: AxiosInstance;
  private requestInterceptors: Map<string, number> = new Map();
  private responseInterceptors: Map<string, number> = new Map();

  constructor(config: APIConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': config.version || 'v1',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
      async (config) => {
        // 添加认证token
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求ID用于追踪
        config.headers['X-Request-ID'] = this.generateRequestId();

        // 添加时间戳防止缓存
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now(),
          };
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        // 记录响应时间
        const duration = Date.now() - response.config.metadata?.startTime;
        this.logMetrics({
          url: response.config.url,
          method: response.config.method,
          status: response.status,
          duration,
        });

        return response;
      },
      async (error) => {
        // 错误处理
        return this.handleError(error);
      }
    );
  }

  // 通用请求方法
  async request<T>(config: AxiosRequestConfig): Promise<APIResponse<T>> {
    config.metadata = { startTime: Date.now() };

    try {
      const response = await this.client.request<T>(config);
      return this.formatResponse(response);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  // GET请求
  async get<T>(url: string, params?: any): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      params,
    });
  }

  // POST请求
  async post<T>(url: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
    });
  }

  // PUT请求
  async put<T>(url: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
    });
  }

  // DELETE请求
  async delete<T>(url: string): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
    });
  }

  // 批量请求
  async batch<T>(requests: BatchRequest[]): Promise<BatchResponse<T>[]> {
    const promises = requests.map(req => 
      this.request(req).catch(err => ({ error: err }))
    );

    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => ({
      id: requests[index].id,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null,
    }));
  }

  // 错误处理
  private async handleError(error: any): Promise<any> {
    if (error.response) {
      // 服务器返回错误
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Token过期，尝试刷新
          const newToken = await this.refreshToken();
          if (newToken) {
            // 重试原请求
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return this.client.request(error.config);
          }
          // 跳转登录
          this.redirectToLogin();
          break;

        case 403:
          throw new ForbiddenError(data.message || '无权访问');

        case 404:
          throw new NotFoundError(data.message || '资源不存在');

        case 429:
          // 限流，等待后重试
          await this.delay(this.getRetryDelay(error.response.headers));
          return this.client.request(error.config);

        case 500:
        case 502:
        case 503:
        case 504:
          // 服务器错误，重试
          if (error.config.retryCount < 3) {
            error.config.retryCount = (error.config.retryCount || 0) + 1;
            await this.delay(1000 * error.config.retryCount);
            return this.client.request(error.config);
          }
          throw new ServerError(data.message || '服务器错误');

        default:
          throw new APIError(data.message || '请求失败', status);
      }
    } else if (error.request) {
      // 网络错误
      throw new NetworkError('网络连接失败');
    } else {
      // 其他错误
      throw error;
    }
  }

  private formatResponse<T>(response: AxiosResponse<T>): APIResponse<T> {
    return {
      success: true,
      data: response.data,
      meta: {
        status: response.status,
        headers: response.headers,
        requestId: response.headers['x-request-id'],
      },
    };
  }

  private formatError(error: any): APIError {
    return {
      success: false,
      error: {
        code: error.code || 'UNKNOWN',
        message: error.message,
        details: error.details,
      },
    };
  }
}
```

### 2. BFF (Backend for Frontend) 架构

```typescript
// bff/bff-service.ts
import { FastifyInstance } from 'fastify';
import { CustomerService, OrderService, ProductService } from './services';

export class BFFService {
  constructor(
    private customerService: CustomerService,
    private orderService: OrderService,
    private productService: ProductService
  ) {}

  // 聚合多个API调用
  async getDashboardData(userId: string): Promise<DashboardData> {
    // 并行调用多个服务
    const [user, orders, recommendations] = await Promise.all([
      this.customerService.getUser(userId),
      this.orderService.getRecentOrders(userId),
      this.productService.getRecommendations(userId),
    ]);

    // 数据聚合和转换
    return {
      user: this.transformUser(user),
      recentOrders: this.transformOrders(orders),
      recommendations: this.transformProducts(recommendations),
      statistics: this.calculateStatistics(orders),
    };
  }

  // Web端特定API
  async getWebCustomerProfile(customerId: string): Promise<WebCustomerProfile> {
    const [customer, orders, activities] = await Promise.all([
      this.customerService.getCustomer(customerId),
      this.orderService.getCustomerOrders(customerId),
      this.customerService.getActivities(customerId),
    ]);

    return {
      ...customer,
      orderHistory: orders.slice(0, 10), // Web端显示10条
      recentActivities: activities.slice(0, 5),
      statistics: this.calculateCustomerStats(customer, orders),
    };
  }

  // 移动端特定API
  async getMobileCustomerProfile(customerId: string): Promise<MobileCustomerProfile> {
    const customer = await this.customerService.getCustomer(customerId);
    const recentOrder = await this.orderService.getLatestOrder(customerId);

    // 移动端返回精简数据
    return {
      id: customer.id,
      name: customer.name,
      avatar: customer.avatar,
      level: customer.level,
      points: customer.points,
      lastOrder: recentOrder ? {
        id: recentOrder.id,
        date: recentOrder.date,
        total: recentOrder.total,
      } : null,
    };
  }

  // 缓存策略
  async getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = await this.cache.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // 获取新数据
    const data = await fetcher();

    // 异步更新缓存
    this.cache.set(key, JSON.stringify(data), ttl).catch(console.error);

    return data;
  }

  // 批量操作优化
  async batchGetCustomers(ids: string[]): Promise<Customer[]> {
    // 使用DataLoader避免N+1问题
    return this.customerLoader.loadMany(ids);
  }

  private transformUser(user: any): any {
    // 数据转换逻辑
    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      // ... 其他转换
    };
  }
}

// BFF路由设置
export function setupBFFRoutes(app: FastifyInstance, bff: BFFService) {
  // Web端路由
  app.register(async (app) => {
    app.get('/web/dashboard', async (request, reply) => {
      const userId = request.user.id;
      const data = await bff.getDashboardData(userId);
      return reply.send(data);
    });

    app.get('/web/customer/:id', async (request, reply) => {
      const { id } = request.params;
      const profile = await bff.getWebCustomerProfile(id);
      return reply.send(profile);
    });
  }, { prefix: '/api/bff' });

  // 移动端路由
  app.register(async (app) => {
    app.get('/mobile/customer/:id', async (request, reply) => {
      const { id } = request.params;
      const profile = await bff.getMobileCustomerProfile(id);
      
      // 移动端响应优化
      reply.header('Cache-Control', 'max-age=60');
      return reply.send(profile);
    });
  }, { prefix: '/api/bff' });
}
```

### 3. GraphQL架构

```typescript
// graphql/schema.ts
import { 
  GraphQLSchema, 
  GraphQLObjectType, 
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull
} from 'graphql';
import DataLoader from 'dataloader';

// Type定义
const CustomerType = new GraphQLObjectType({
  name: 'Customer',
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLString) },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    orders: {
      type: GraphQLList(OrderType),
      resolve: (customer, args, context) => {
        // 使用DataLoader避免N+1问题
        return context.orderLoader.load(customer.id);
      },
    },
    totalSpent: {
      type: GraphQLInt,
      resolve: async (customer, args, context) => {
        const orders = await context.orderLoader.load(customer.id);
        return orders.reduce((sum, order) => sum + order.total, 0);
      },
    },
  }),
});

const OrderType = new GraphQLObjectType({
  name: 'Order',
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLString) },
    customerId: { type: GraphQLString },
    total: { type: GraphQLInt },
    status: { type: GraphQLString },
    items: {
      type: GraphQLList(OrderItemType),
      resolve: (order, args, context) => {
        return context.orderItemLoader.load(order.id);
      },
    },
    customer: {
      type: CustomerType,
      resolve: (order, args, context) => {
        return context.customerLoader.load(order.customerId);
      },
    },
  }),
});

// Query定义
const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    customer: {
      type: CustomerType,
      args: {
        id: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, context) => {
        return context.customerLoader.load(id);
      },
    },
    customers: {
      type: GraphQLList(CustomerType),
      args: {
        limit: { type: GraphQLInt },
        offset: { type: GraphQLInt },
      },
      resolve: async (root, { limit = 10, offset = 0 }, context) => {
        return context.customerService.getCustomers({ limit, offset });
      },
    },
    searchCustomers: {
      type: GraphQLList(CustomerType),
      args: {
        query: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (root, { query }, context) => {
        return context.customerService.search(query);
      },
    },
  },
});

// Mutation定义
const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createCustomer: {
      type: CustomerType,
      args: {
        input: { type: GraphQLNonNull(CustomerInputType) },
      },
      resolve: async (root, { input }, context) => {
        // 权限检查
        if (!context.user.hasPermission('customer:create')) {
          throw new Error('Permission denied');
        }

        // 输入验证
        const validated = await validateCustomerInput(input);

        // 创建客户
        const customer = await context.customerService.create(validated);

        // 清除缓存
        context.customerLoader.clear(customer.id);

        return customer;
      },
    },
    updateCustomer: {
      type: CustomerType,
      args: {
        id: { type: GraphQLNonNull(GraphQLString) },
        input: { type: GraphQLNonNull(CustomerUpdateInputType) },
      },
      resolve: async (root, { id, input }, context) => {
        // 乐观锁检查
        const current = await context.customerLoader.load(id);
        if (current.version !== input.version) {
          throw new Error('Concurrent modification detected');
        }

        const updated = await context.customerService.update(id, input);
        
        // 更新缓存
        context.customerLoader.clear(id);
        context.customerLoader.prime(id, updated);

        return updated;
      },
    },
  },
});

// Subscription定义
const SubscriptionType = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    customerUpdated: {
      type: CustomerType,
      args: {
        customerId: { type: GraphQLString },
      },
      subscribe: async (root, { customerId }, context) => {
        return context.pubsub.asyncIterator(
          customerId ? `customer.${customerId}` : 'customer.*'
        );
      },
    },
    orderCreated: {
      type: OrderType,
      subscribe: (root, args, context) => {
        return context.pubsub.asyncIterator('order.created');
      },
    },
  },
});

// DataLoader设置
export function createDataLoaders(services: Services) {
  return {
    customerLoader: new DataLoader(async (ids: string[]) => {
      const customers = await services.customerService.getByIds(ids);
      const customerMap = new Map(customers.map(c => [c.id, c]));
      return ids.map(id => customerMap.get(id));
    }),

    orderLoader: new DataLoader(async (customerIds: string[]) => {
      const orders = await services.orderService.getByCustomerIds(customerIds);
      const orderMap = new Map<string, Order[]>();
      
      orders.forEach(order => {
        if (!orderMap.has(order.customerId)) {
          orderMap.set(order.customerId, []);
        }
        orderMap.get(order.customerId)!.push(order);
      });
      
      return customerIds.map(id => orderMap.get(id) || []);
    }),
  };
}

// GraphQL中间件
export function createGraphQLMiddleware(schema: GraphQLSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    try {
      // 解析查询
      const { query, variables, operationName } = req.body;

      // 查询复杂度分析
      const complexity = getQueryComplexity(schema, query, variables);
      if (complexity > MAX_QUERY_COMPLEXITY) {
        throw new Error('Query too complex');
      }

      // 查询深度检查
      const depth = getQueryDepth(query);
      if (depth > MAX_QUERY_DEPTH) {
        throw new Error('Query too deep');
      }

      // 执行查询
      const result = await graphql({
        schema,
        source: query,
        variableValues: variables,
        operationName,
        contextValue: {
          user: req.user,
          loaders: createDataLoaders(req.services),
          services: req.services,
          pubsub: req.pubsub,
        },
      });

      // 记录查询性能
      const duration = Date.now() - startTime;
      logGraphQLMetrics({
        query,
        variables,
        operationName,
        duration,
        complexity,
        depth,
        errors: result.errors,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
```

## 🔧 API版本管理

### 1. URL版本化

```typescript
// api/versioning/url-versioning.ts
export class URLVersioning {
  static setupRoutes(app: Express) {
    // v1版本API
    app.use('/api/v1', v1Routes);
    
    // v2版本API
    app.use('/api/v2', v2Routes);
    
    // 最新版本别名
    app.use('/api/latest', v2Routes);
    
    // 版本协商中间件
    app.use('/api', (req, res, next) => {
      const version = this.negotiateVersion(req);
      req.url = `/api/${version}${req.url}`;
      next();
    });
  }

  static negotiateVersion(req: Request): string {
    // 从header获取版本
    const headerVersion = req.headers['x-api-version'];
    if (headerVersion && this.isValidVersion(headerVersion)) {
      return headerVersion;
    }

    // 从查询参数获取版本
    const queryVersion = req.query.v || req.query.version;
    if (queryVersion && this.isValidVersion(queryVersion)) {
      return queryVersion;
    }

    // 默认版本
    return 'v1';
  }
}
```

### 2. Header版本化

```typescript
// api/versioning/header-versioning.ts
export class HeaderVersioning {
  static middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const version = req.headers['api-version'] || 'v1';
      
      // 根据版本选择处理器
      const handler = this.getVersionHandler(version);
      
      if (!handler) {
        return res.status(400).json({
          error: 'Unsupported API version',
          supportedVersions: this.getSupportedVersions(),
        });
      }

      // 注入版本处理器
      req.apiVersion = version;
      req.versionHandler = handler;
      
      next();
    };
  }

  static getVersionHandler(version: string): VersionHandler {
    const handlers = {
      'v1': v1Handler,
      'v2': v2Handler,
      '2024-01-01': dateBasedHandler,
    };
    
    return handlers[version];
  }
}
```

## 📊 API监控和分析

### 1. API性能监控

```typescript
// monitoring/api-monitor.ts
export class APIMonitor {
  private metrics: Map<string, APIMetric> = new Map();

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      const path = this.normalizePath(req.path);

      // 监听响应
      const originalSend = res.send;
      res.send = function(data) {
        const duration = Date.now() - start;
        
        // 记录指标
        this.recordMetric({
          path,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date(),
          size: JSON.stringify(data).length,
        });

        return originalSend.call(this, data);
      }.bind(this);

      next();
    };
  }

  recordMetric(metric: APIMetric) {
    const key = `${metric.method}:${metric.path}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        path: metric.path,
        method: metric.method,
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        errors: 0,
        lastHour: [],
      });
    }

    const stats = this.metrics.get(key)!;
    stats.count++;
    stats.totalDuration += metric.duration;
    stats.averageDuration = stats.totalDuration / stats.count;
    
    if (metric.statusCode >= 400) {
      stats.errors++;
    }

    // 保存最近一小时的数据用于计算百分位
    stats.lastHour.push(metric);
    this.cleanOldMetrics(stats);
    this.calculatePercentiles(stats);

    // 异步发送到监控服务
    this.sendToMonitoringService(metric);
  }

  generateReport(): APIReport {
    const endpoints = Array.from(this.metrics.entries()).map(([key, stats]) => ({
      endpoint: key,
      ...stats,
      errorRate: (stats.errors / stats.count) * 100,
      throughput: stats.count / (Date.now() - stats.firstSeen) * 1000 * 60, // 每分钟请求数
    }));

    return {
      totalRequests: endpoints.reduce((sum, e) => sum + e.count, 0),
      totalErrors: endpoints.reduce((sum, e) => sum + e.errors, 0),
      averageResponseTime: this.calculateOverallAverage(endpoints),
      slowestEndpoints: this.getSlowesEndpoints(endpoints, 5),
      mostFrequent: this.getMostFrequentEndpoints(endpoints, 5),
      errorProne: this.getErrorProneEndpoints(endpoints, 5),
    };
  }
}
```

### 2. API使用分析

```typescript
// analytics/api-analytics.ts
export class APIAnalytics {
  async analyzeUsage(timeRange: TimeRange): Promise<UsageAnalysis> {
    const logs = await this.fetchLogs(timeRange);
    
    return {
      // 用户分析
      uniqueUsers: this.countUniqueUsers(logs),
      userActivity: this.analyzeUserActivity(logs),
      
      // 端点分析
      endpointUsage: this.analyzeEndpointUsage(logs),
      deprecatedAPICalls: this.findDeprecatedAPICalls(logs),
      
      // 错误分析
      errorPatterns: this.analyzeErrorPatterns(logs),
      errorTrends: this.analyzeErrorTrends(logs),
      
      // 性能分析
      performanceTrends: this.analyzePerformanceTrends(logs),
      slowQueries: this.identifySlowQueries(logs),
      
      // 安全分析
      suspiciousActivity: this.detectSuspiciousActivity(logs),
      authenticationFailures: this.analyzeAuthFailures(logs),
    };
  }

  private analyzeEndpointUsage(logs: APILog[]): EndpointUsage[] {
    const usage = new Map<string, EndpointUsage>();
    
    logs.forEach(log => {
      const key = `${log.method} ${log.path}`;
      
      if (!usage.has(key)) {
        usage.set(key, {
          endpoint: key,
          calls: 0,
          uniqueUsers: new Set(),
          averageResponseTime: 0,
          errorRate: 0,
          lastUsed: log.timestamp,
        });
      }
      
      const stats = usage.get(key)!;
      stats.calls++;
      stats.uniqueUsers.add(log.userId);
      stats.lastUsed = log.timestamp;
      
      // 更新平均响应时间
      stats.averageResponseTime = 
        (stats.averageResponseTime * (stats.calls - 1) + log.duration) / stats.calls;
      
      // 更新错误率
      if (log.statusCode >= 400) {
        stats.errorRate = ((stats.errorRate * (stats.calls - 1)) + 1) / stats.calls;
      }
    });
    
    return Array.from(usage.values());
  }
}
```

## 🔒 API安全

### 1. 认证和授权

```typescript
// security/api-auth.ts
export class APIAuth {
  // JWT认证中间件
  static jwtAuth() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const token = this.extractToken(req);
        
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = await this.verifyToken(token);
        
        // 检查token是否被撤销
        if (await this.isTokenRevoked(token)) {
          return res.status(401).json({ error: 'Token revoked' });
        }

        req.user = decoded;
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    };
  }

  // API Key认证
  static apiKeyAuth() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const apiKey = req.headers['x-api-key'] as string;
      
      if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
      }

      const client = await this.validateAPIKey(apiKey);
      
      if (!client) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      // 检查速率限制
      if (await this.isRateLimited(client.id)) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          retryAfter: this.getRetryAfter(client.id),
        });
      }

      req.client = client;
      next();
    };
  }

  // OAuth 2.0认证
  static oauth2() {
    return passport.authenticate('oauth2', { session: false });
  }

  // 权限检查中间件
  static requirePermission(permission: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!this.hasPermission(req.user, permission)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permission,
        });
      }

      next();
    };
  }

  // 作用域检查
  static requireScope(scope: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const userScopes = req.user?.scopes || [];
      
      if (!userScopes.includes(scope)) {
        return res.status(403).json({
          error: 'Insufficient scope',
          required: scope,
          available: userScopes,
        });
      }

      next();
    };
  }
}
```

### 2. 速率限制

```typescript
// security/rate-limiter.ts
export class RateLimiter {
  private limits: Map<string, RateLimit> = new Map();

  middleware(options: RateLimitOptions = {}) {
    const {
      windowMs = 60000, // 1分钟
      max = 100, // 最大请求数
      keyGenerator = (req) => req.ip,
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
    } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
      const key = keyGenerator(req);
      const now = Date.now();

      if (!this.limits.has(key)) {
        this.limits.set(key, {
          count: 0,
          resetTime: now + windowMs,
        });
      }

      const limit = this.limits.get(key)!;

      // 重置窗口
      if (now > limit.resetTime) {
        limit.count = 0;
        limit.resetTime = now + windowMs;
      }

      // 检查限制
      if (limit.count >= max) {
        const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
        
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', new Date(limit.resetTime).toISOString());
        res.setHeader('Retry-After', String(retryAfter));

        return res.status(429).json({
          error: 'Too many requests',
          retryAfter,
        });
      }

      // 增加计数
      limit.count++;

      // 设置响应头
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(max - limit.count));
      res.setHeader('X-RateLimit-Reset', new Date(limit.resetTime).toISOString());

      next();
    };
  }

  // 分级速率限制
  tieredRateLimit() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const tier = req.user?.tier || 'free';
      
      const limits = {
        free: { requests: 100, window: 3600000 }, // 100请求/小时
        basic: { requests: 1000, window: 3600000 }, // 1000请求/小时
        premium: { requests: 10000, window: 3600000 }, // 10000请求/小时
        enterprise: { requests: 100000, window: 3600000 }, // 100000请求/小时
      };

      const limit = limits[tier];
      // 应用相应的限制...
    };
  }
}
```

## 🔄 GraphQL订阅和实时通信

### 1. GraphQL订阅实现

```typescript
// graphql/subscriptions.ts
import { PubSub } from 'graphql-subscriptions';
import { withFilter } from 'graphql-subscriptions';
import { GraphQLSubscriptionType } from 'graphql';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';

// 创建PubSub实例
const pubsub = new PubSub();

// 订阅事件常量
const EVENTS = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
  MESSAGE_SENT: 'MESSAGE_SENT',
  DATA_SYNCED: 'DATA_SYNCED',
};

// 订阅类型定义
const SubscriptionType = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    // 订单状态订阅
    orderStatusChanged: {
      type: OrderType,
      args: {
        orderId: { type: GraphQLString },
        userId: { type: GraphQLString },
      },
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.ORDER_CREATED, EVENTS.ORDER_UPDATED]),
        (payload, variables) => {
          // 过滤逻辑：只推送相关用户的订单
          if (variables.orderId) {
            return payload.order.id === variables.orderId;
          }
          if (variables.userId) {
            return payload.order.userId === variables.userId;
          }
          return true;
        }
      ),
      resolve: (payload) => payload.order,
    },

    // 用户在线状态订阅
    userStatusChanged: {
      type: UserStatusType,
      args: {
        userIds: { type: GraphQLList(GraphQLString) },
      },
      subscribe: withFilter(
        () => pubsub.asyncIterator(EVENTS.USER_STATUS_CHANGED),
        (payload, variables) => {
          if (variables.userIds && variables.userIds.length > 0) {
            return variables.userIds.includes(payload.userId);
          }
          return true;
        }
      ),
    },

    // 实时消息订阅
    messageReceived: {
      type: MessageType,
      args: {
        channelId: { type: GraphQLNonNull(GraphQLString) },
      },
      subscribe: withFilter(
        () => pubsub.asyncIterator(EVENTS.MESSAGE_SENT),
        (payload, variables) => {
          return payload.message.channelId === variables.channelId;
        }
      ),
    },

    // 数据同步订阅
    dataSync: {
      type: DataSyncType,
      args: {
        entityType: { type: GraphQLString },
        entityId: { type: GraphQLString },
      },
      subscribe: () => pubsub.asyncIterator(EVENTS.DATA_SYNCED),
    },
  },
});

// WebSocket服务器设置
export function setupGraphQLSubscriptions(httpServer: any) {
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx, msg, args) => {
        // 认证逻辑
        const token = ctx.connectionParams?.authorization;
        const user = await authenticateWebSocket(token);
        
        if (!user) {
          throw new Error('Unauthorized');
        }

        return {
          user,
          pubsub,
          dataSources: createDataSources(),
        };
      },
      onConnect: async (ctx) => {
        console.log('Client connected:', ctx.connectionParams);
      },
      onDisconnect: async (ctx, code, reason) => {
        console.log('Client disconnected:', code, reason);
      },
      onSubscribe: async (ctx, msg) => {
        // 订阅前的验证
        const { operationName, query, variables } = msg.payload;
        
        // 检查订阅权限
        if (!hasSubscriptionPermission(ctx.user, operationName)) {
          throw new Error('Insufficient permissions for subscription');
        }

        // 记录订阅
        logSubscription({
          user: ctx.user,
          operation: operationName,
          variables,
        });
      },
    },
    wsServer
  );

  return serverCleanup;
}

// 发布事件辅助函数
export class SubscriptionPublisher {
  // 发布订单更新
  static publishOrderUpdate(order: Order) {
    pubsub.publish(EVENTS.ORDER_UPDATED, {
      order,
      timestamp: new Date(),
    });
  }

  // 发布用户状态变化
  static publishUserStatusChange(userId: string, status: string) {
    pubsub.publish(EVENTS.USER_STATUS_CHANGED, {
      userId,
      status,
      timestamp: new Date(),
    });
  }

  // 发布消息
  static publishMessage(message: Message) {
    pubsub.publish(EVENTS.MESSAGE_SENT, {
      message,
      timestamp: new Date(),
    });
  }

  // 批量发布
  static publishBatch(events: Array<{ type: string; payload: any }>) {
    events.forEach(({ type, payload }) => {
      pubsub.publish(type, payload);
    });
  }
}
```

### 2. 实时数据同步

```typescript
// realtime/data-sync.ts
export class RealtimeDataSync {
  private connections: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();
  
  // 客户端连接管理
  handleConnection(ws: WebSocket, userId: string) {
    this.connections.set(userId, ws);
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      this.handleMessage(userId, message);
    });
    
    ws.on('close', () => {
      this.handleDisconnection(userId);
    });
    
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });
    
    // 发送初始同步数据
    this.sendInitialSync(userId);
  }
  
  // 处理客户端消息
  private handleMessage(userId: string, message: any) {
    switch (message.type) {
      case 'SUBSCRIBE':
        this.handleSubscribe(userId, message.payload);
        break;
        
      case 'UNSUBSCRIBE':
        this.handleUnsubscribe(userId, message.payload);
        break;
        
      case 'SYNC_REQUEST':
        this.handleSyncRequest(userId, message.payload);
        break;
        
      case 'OPTIMISTIC_UPDATE':
        this.handleOptimisticUpdate(userId, message.payload);
        break;
        
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }
  
  // 数据变更推送
  async pushDataChange(change: DataChange) {
    const affectedUsers = await this.getAffectedUsers(change);
    
    for (const userId of affectedUsers) {
      const ws = this.connections.get(userId);
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        const payload = await this.prepareChangePayload(change, userId);
        
        ws.send(JSON.stringify({
          type: 'DATA_CHANGE',
          payload,
          timestamp: Date.now(),
        }));
      }
    }
  }
  
  // 冲突解决
  async resolveConflict(localChange: any, serverChange: any): Promise<any> {
    // 基于时间戳的冲突解决
    if (localChange.timestamp > serverChange.timestamp) {
      return this.mergeChanges(serverChange, localChange);
    }
    
    // 基于版本的冲突解决
    if (localChange.version === serverChange.version) {
      return this.mergeChanges(localChange, serverChange);
    }
    
    // 自定义冲突解决策略
    return this.customConflictResolution(localChange, serverChange);
  }
  
  // 离线支持
  async handleOfflineSync(userId: string, offlineChanges: any[]) {
    const conflicts = [];
    const successful = [];
    
    for (const change of offlineChanges) {
      try {
        const result = await this.applyOfflineChange(change);
        successful.push(result);
      } catch (error) {
        if (error.type === 'CONFLICT') {
          conflicts.push({
            change,
            error,
            resolution: await this.suggestResolution(change, error),
          });
        } else {
          throw error;
        }
      }
    }
    
    return {
      successful,
      conflicts,
      syncToken: this.generateSyncToken(userId),
    };
  }
}
```

### 3. 服务器推送事件（SSE）

```typescript
// realtime/server-sent-events.ts
export class ServerSentEvents {
  private clients: Map<string, Response> = new Map();
  
  // SSE端点
  setupSSE(app: Express) {
    app.get('/api/events', this.authenticate, (req, res) => {
      // 设置SSE响应头
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      
      const userId = req.user.id;
      this.clients.set(userId, res);
      
      // 发送初始连接事件
      this.sendEvent(userId, 'connected', {
        message: 'Successfully connected to SSE',
        timestamp: Date.now(),
      });
      
      // 心跳保持连接
      const heartbeat = setInterval(() => {
        res.write(':heartbeat\n\n');
      }, 30000);
      
      // 清理断开的连接
      req.on('close', () => {
        clearInterval(heartbeat);
        this.clients.delete(userId);
      });
    });
  }
  
  // 发送事件到客户端
  sendEvent(userId: string, eventType: string, data: any) {
    const client = this.clients.get(userId);
    
    if (client) {
      const eventData = `event: ${eventType}\ndata: ${JSON.stringify(data)}\nid: ${Date.now()}\n\n`;
      client.write(eventData);
    }
  }
  
  // 广播事件
  broadcast(eventType: string, data: any, filter?: (userId: string) => boolean) {
    this.clients.forEach((client, userId) => {
      if (!filter || filter(userId)) {
        this.sendEvent(userId, eventType, data);
      }
    });
  }
  
  // 分组推送
  sendToGroup(groupId: string, eventType: string, data: any) {
    const groupMembers = this.getGroupMembers(groupId);
    
    groupMembers.forEach(userId => {
      this.sendEvent(userId, eventType, data);
    });
  }
}
```

### 4. WebSocket管理和优化

```typescript
// realtime/websocket-manager.ts
export class WebSocketManager {
  private wss: WebSocketServer;
  private rooms: Map<string, Set<WebSocket>> = new Map();
  private heartbeats: Map<WebSocket, NodeJS.Timeout> = new Map();
  
  constructor(server: any) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
  }
  
  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      // 认证
      const token = this.extractToken(req);
      const user = this.authenticateToken(token);
      
      if (!user) {
        ws.close(1008, 'Unauthorized');
        return;
      }
      
      // 设置心跳
      this.setupHeartbeat(ws);
      
      // 处理消息
      ws.on('message', (data) => {
        this.handleMessage(ws, data, user);
      });
      
      // 处理断开
      ws.on('close', () => {
        this.handleDisconnect(ws, user);
      });
      
      // 错误处理
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }
  
  // 心跳机制
  private setupHeartbeat(ws: WebSocket) {
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(interval);
      }
    }, 30000);
    
    this.heartbeats.set(ws, interval);
    
    ws.on('pong', () => {
      // 客户端响应，连接正常
    });
  }
  
  // 房间管理
  joinRoom(ws: WebSocket, roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId)!.add(ws);
    
    // 通知房间其他成员
    this.broadcastToRoom(roomId, {
      type: 'USER_JOINED',
      roomId,
      timestamp: Date.now(),
    }, ws);
  }
  
  leaveRoom(ws: WebSocket, roomId: string) {
    const room = this.rooms.get(roomId);
    
    if (room) {
      room.delete(ws);
      
      if (room.size === 0) {
        this.rooms.delete(roomId);
      } else {
        // 通知房间其他成员
        this.broadcastToRoom(roomId, {
          type: 'USER_LEFT',
          roomId,
          timestamp: Date.now(),
        });
      }
    }
  }
  
  // 广播消息到房间
  broadcastToRoom(roomId: string, message: any, exclude?: WebSocket) {
    const room = this.rooms.get(roomId);
    
    if (room) {
      const data = JSON.stringify(message);
      
      room.forEach(ws => {
        if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    }
  }
  
  // 消息队列和重试
  private messageQueue: Map<string, any[]> = new Map();
  
  async sendWithRetry(ws: WebSocket, message: any, maxRetries = 3) {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
          return true;
        } else {
          // 加入队列等待重连
          this.queueMessage(ws, message);
          return false;
        }
      } catch (error) {
        retries++;
        await this.delay(Math.pow(2, retries) * 1000); // 指数退避
      }
    }
    
    return false;
  }
  
  // 连接池管理
  getConnectionStats() {
    return {
      totalConnections: this.wss.clients.size,
      rooms: this.rooms.size,
      roomStats: Array.from(this.rooms.entries()).map(([roomId, members]) => ({
        roomId,
        memberCount: members.size,
      })),
    };
  }
}
```

### 5. 实时协作功能

```typescript
// realtime/collaboration.ts
export class RealtimeCollaboration {
  private documents: Map<string, CollaborativeDocument> = new Map();
  private cursors: Map<string, UserCursor> = new Map();
  private selections: Map<string, UserSelection> = new Map();
  
  // 协作编辑
  async handleOperation(docId: string, operation: Operation, userId: string) {
    const doc = this.documents.get(docId);
    
    if (!doc) {
      throw new Error('Document not found');
    }
    
    // 操作转换（OT）
    const transformedOp = await this.transformOperation(operation, doc.pendingOps);
    
    // 应用操作
    doc.applyOperation(transformedOp);
    
    // 广播给其他用户
    this.broadcastOperation(docId, transformedOp, userId);
    
    // 更新版本
    doc.version++;
    
    // 保存到持久化存储
    await this.saveDocument(doc);
    
    return {
      success: true,
      version: doc.version,
      operation: transformedOp,
    };
  }
  
  // 光标同步
  updateCursor(userId: string, docId: string, position: CursorPosition) {
    this.cursors.set(`${userId}:${docId}`, {
      userId,
      docId,
      position,
      color: this.getUserColor(userId),
      timestamp: Date.now(),
    });
    
    // 广播光标位置
    this.broadcastCursor(docId, userId, position);
  }
  
  // 选区同步
  updateSelection(userId: string, docId: string, selection: Selection) {
    this.selections.set(`${userId}:${docId}`, {
      userId,
      docId,
      selection,
      color: this.getUserColor(userId),
      timestamp: Date.now(),
    });
    
    // 广播选区
    this.broadcastSelection(docId, userId, selection);
  }
  
  // 存在感（Presence）
  updatePresence(userId: string, docId: string, status: PresenceStatus) {
    const presence = {
      userId,
      docId,
      status,
      lastSeen: Date.now(),
      cursor: this.cursors.get(`${userId}:${docId}`),
      selection: this.selections.get(`${userId}:${docId}`),
    };
    
    // 广播存在感
    this.broadcastPresence(docId, presence);
  }
  
  // 冲突解决 - CRDT实现
  async mergeCRDT(localState: any, remoteState: any): Promise<any> {
    const merged = {
      ...localState,
      ...remoteState,
    };
    
    // 合并向量时钟
    merged.vectorClock = this.mergeVectorClocks(
      localState.vectorClock,
      remoteState.vectorClock
    );
    
    // 合并操作历史
    merged.operations = this.mergeOperations(
      localState.operations,
      remoteState.operations
    );
    
    return merged;
  }
}
```

## 🎯 最佳实践检查清单

### API设计
- [ ] RESTful规范遵循
- [ ] GraphQL Schema设计合理
- [ ] 统一的错误格式
- [ ] 版本管理策略
- [ ] 分页和过滤支持
- [ ] 批量操作支持
- [ ] 幂等性保证

### 实时通信
- [ ] WebSocket连接管理
- [ ] 心跳机制实现
- [ ] 断线重连策略
- [ ] 消息队列和重试
- [ ] 房间/频道管理
- [ ] 广播优化

### GraphQL订阅
- [ ] 订阅权限控制
- [ ] 过滤器优化
- [ ] 订阅生命周期管理
- [ ] 错误处理机制
- [ ] 性能监控
- [ ] 内存泄漏防护

### 性能优化
- [ ] 响应时间 < 200ms (p95)
- [ ] WebSocket连接复用
- [ ] 数据压缩启用
- [ ] 缓存策略实施
- [ ] N+1查询解决
- [ ] 数据库连接池
- [ ] 异步处理

### 安全防护
- [ ] HTTPS/WSS强制
- [ ] 认证机制完善
- [ ] 授权检查严格
- [ ] 速率限制配置
- [ ] 输入验证完整
- [ ] SQL注入防护
- [ ] WebSocket认证

### 监控告警
- [ ] 性能指标监控
- [ ] 错误率追踪
- [ ] 可用性监控
- [ ] 日志记录完整
- [ ] 告警规则设置
- [ ] 调用链追踪
- [ ] 实时连接监控

---

**记住：优秀的API设计是前后端协作的基础！** 🌐