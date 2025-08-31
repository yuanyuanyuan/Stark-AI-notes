# React 服务端组件设计规范

> 基于 Next.js App Router 的服务端组件开发最佳实践

## 📋 概述

本规范专门针对 React 服务端组件（Server Components）的设计和开发，提供完整的指导原则、最佳实践和实现模式。服务端组件在服务器上渲染，提供更好的性能和安全性。

## 🎯 服务端组件特性

### 核心特征

```typescript
// 服务端组件特征标识（无需 'use server' 指令）
interface ServerComponentFeatures {
  // 服务端渲染
  serverRendering: true;
  
  // 零客户端包大小
  zeroClientBundle: true;
  
  // 直接数据库访问
  directDatabaseAccess: true;
  
  // 文件系统访问
  fileSystemAccess: true;
  
  // 环境变量访问
  environmentAccess: true;
  
  // 安全敏感操作
  securitySensitive: true;
  
  // 自动缓存
  automaticCaching: true;
  
  // 流式渲染
  streaming: true;
  
  // 搜索引擎优化
  seoFriendly: true;
}
```

### 适用场景

```typescript
// 服务端组件适用场景判断
type ServerComponentUseCase = 
  | 'data_fetching'         // 数据获取和处理
  | 'database_operations'   // 数据库操作
  | 'file_operations'        // 文件系统操作
  | 'seo_content'           // SEO 优化内容
  | 'static_content'        // 静态内容展示
  | 'authentication'        // 认证相关逻辑
  | 'authorization'         // 权限检查
  | 'data_processing'       // 数据处理和转换
  | 'api_integration'       // API 集成
  | 'cache_management'      // 缓存管理
  | 'background_tasks'      // 后台任务
  | 'report_generation'     // 报告生成
  | 'data_export'          // 数据导出;
```

## 🏗️ 基础组件架构

### 组件基础模板

```typescript
// templates/server-component-template.tsx
import React from 'react';
import { db } from '@/lib/database';
import { auth } from '@/lib/auth';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface ServerComponentProps {
  // 数据查询参数
  id?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  
  // 缓存配置
  cacheKey?: string;
  cacheTTL?: number;
  revalidate?: number;
  
  // 权限配置
  requiredPermissions?: string[];
  requiredRoles?: string[];
  
  // SEO 配置
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
  
  // 样式和布局
  className?: string;
  children?: React.ReactNode;
}

// 异步服务端组件
export const ServerComponent: React.FC<ServerComponentProps> = async ({
  id,
  filters = {},
  sortBy = 'createdAt',
  sortOrder = 'desc',
  limit = 10,
  offset = 0,
  cacheKey,
  cacheTTL = 3600, // 1小时
  revalidate,
  requiredPermissions = [],
  requiredRoles = [],
  seo,
  className,
  children
}) => {
  try {
    // 1. 权限验证
    await validatePermissions(requiredPermissions, requiredRoles);
    
    // 2. 数据获取（带缓存）
    const data = await fetchDataWithCache({
      id,
      filters,
      sortBy,
      sortOrder,
      limit,
      offset,
      cacheKey,
      cacheTTL,
      revalidate
    });
    
    // 3. SEO 元数据生成
    const seoMetadata = generateSEOMetadata(seo, data);
    
    // 4. 返回渲染结果
    return (
      <div className={cn('server-component', className)}>
        {/* SEO 元数据 */}
        <SEOMetadata metadata={seoMetadata} />
        
        {/* 主要内容 */}
        <div className="server-component__content">
          {data ? (
            <DataRenderer data={data} />
          ) : (
            <EmptyState />
          )}
          
          {children}
        </div>
        
        {/* 分页控件 */}
        {data && data.total > limit && (
          <Pagination 
            current={Math.floor(offset / limit) + 1}
            total={Math.ceil(data.total / limit)}
            baseUrl={generateBaseUrl(filters, sortBy, sortOrder, limit)}
          />
        )}
      </div>
    );
    
  } catch (error) {
    // 错误处理
    logger.error('ServerComponent error:', error);
    
    if (error instanceof PermissionError) {
      return <PermissionErrorComponent />;
    }
    
    if (error instanceof NotFoundError) {
      return <NotFoundErrorComponent />;
    }
    
    return <ServerErrorComponent error={error} />;
  }
};

// 权限验证函数
async function validatePermissions(
  permissions: string[],
  roles: string[]
): Promise<void> {
  const session = await auth();
  
  if (!session) {
    throw new PermissionError('Authentication required');
  }
  
  // 检查角色权限
  if (roles.length > 0 && !roles.some(role => session.user.roles.includes(role))) {
    throw new PermissionError('Insufficient role permissions');
  }
  
  // 检查具体权限
  if (permissions.length > 0) {
    const userPermissions = await getUserPermissions(session.user.id);
    const hasAllPermissions = permissions.every(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      throw new PermissionError('Insufficient permissions');
    }
  }
}

// 数据获取函数（带缓存）
async function fetchDataWithCache(params: {
  id?: string;
  filters: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
  cacheKey?: string;
  cacheTTL: number;
  revalidate?: number;
}): Promise<any> {
  const cacheKey = params.cacheKey || generateCacheKey(params);
  
  // 尝试从缓存获取
  const cachedData = await cache.get(cacheKey);
  if (cachedData) {
    logger.info('Cache hit for key:', cacheKey);
    return cachedData;
  }
  
  logger.info('Cache miss for key:', cacheKey);
  
  // 从数据库获取数据
  const data = await fetchFromDatabase(params);
  
  // 缓存数据
  await cache.set(cacheKey, data, { ttl: params.cacheTTL });
  
  return data;
}

// 数据库查询函数
async function fetchFromDatabase(params: {
  id?: string;
  filters: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}): Promise<any> {
  // 构建查询
  let query = db.table('items').select('*');
  
  // 应用过滤器
  Object.entries(params.filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        query = query.whereIn(key, value);
      } else if (typeof value === 'object') {
        // 处理范围查询等复杂条件
        Object.entries(value).forEach(([operator, val]) => {
          switch (operator) {
            case 'gt':
              query = query.where(key, '>', val);
              break;
            case 'lt':
              query = query.where(key, '<', val);
              break;
            case 'gte':
              query = query.where(key, '>=', val);
              break;
            case 'lte':
              query = query.where(key, '<=', val);
              break;
            case 'like':
              query = query.where(key, 'like', \`%\${val}%\`);
              break;
            default:
              query = query.where(key, val);
          }
        });
      } else {
        query = query.where(key, value);
      }
    }
  });
  
  // 应用排序
  query = query.orderBy(params.sortBy, params.sortOrder);
  
  // 应用分页
  query = query.limit(params.limit).offset(params.offset);
  
  // 执行查询
  const items = await query;
  
  // 获取总数
  const [{ count: total }] = await db.table('items').count();
  
  return {
    items,
    total,
    page: Math.floor(params.offset / params.limit) + 1,
    pageSize: params.limit
  };
}

// 生成缓存键
function generateCacheKey(params: any): string {
  const keyData = {
    id: params.id,
    filters: params.filters,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    limit: params.limit,
    offset: params.offset
  };
  
  return \`server-component:\${JSON.stringify(keyData)}\`;
}

// 生成基础 URL
function generateBaseUrl(
  filters: Record<string, any>,
  sortBy: string,
  sortOrder: string,
  limit: number
): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else {
        params.append(key, value);
      }
    }
  });
  
  params.set('sortBy', sortBy);
  params.set('sortOrder', sortOrder);
  params.set('limit', limit.toString());
  
  return \`?\${params.toString()}\`;
}

// SEO 元数据生成
function generateSEOMetadata(seo: any, data: any): any {
  return {
    title: seo?.title || data?.title || 'Default Title',
    description: seo?.description || data?.description || 'Default description',
    keywords: seo?.keywords || data?.keywords || [],
    ogImage: seo?.ogImage || data?.image || '/default-og-image.jpg',
    // 其他 SEO 元数据
    canonical: data?.canonical,
    robots: data?.robots || 'index, follow',
    openGraph: {
      title: seo?.title || data?.title,
      description: seo?.description || data?.description,
      images: seo?.ogImage ? [{ url: seo.ogImage }] : [],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.title || data?.title,
      description: seo?.description || data?.description,
      images: seo?.ogImage ? [seo.ogImage] : []
    }
  };
}

// 数据渲染组件
const DataRenderer: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="data-renderer">
      {data.items.map((item: any) => (
        <div key={item.id} className="data-item">
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <div className="item-meta">
            <span>创建时间: {new Date(item.createdAt).toLocaleDateString()}</span>
            <span>作者: {item.author}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// SEO 元数据组件
const SEOMetadata: React.FC<{ metadata: any }> = ({ metadata }) => {
  return (
    <>
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <meta name="keywords" content={metadata.keywords.join(', ')} />
      <meta name="robots" content={metadata.robots} />
      
      {/* Open Graph */}
      <meta property="og:title" content={metadata.openGraph.title} />
      <meta property="og:description" content={metadata.openGraph.description} />
      <meta property="og:type" content={metadata.openGraph.type} />
      {metadata.openGraph.images.map((image: string, index: number) => (
        <meta key={index} property="og:image" content={image} />
      ))}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={metadata.twitter.card} />
      <meta name="twitter:title" content={metadata.twitter.title} />
      <meta name="twitter:description" content={metadata.twitter.description} />
      {metadata.twitter.images.map((image: string, index: number) => (
        <meta key={index} name="twitter:image" content={image} />
      ))}
    </>
  );
};

// 分页组件
const Pagination: React.FC<{
  current: number;
  total: number;
  baseUrl: string;
}> = ({ current, total, baseUrl }) => {
  return (
    <div className="pagination">
      {Array.from({ length: total }, (_, i) => i + 1).map(page => (
        <a
          key={page}
          href={\`\${baseUrl}&page=\${page}\`}
          className={\`pagination-link \${page === current ? 'active' : ''}\`}
        >
          {page}
        </a>
      ))}
    </div>
  );
};

// 状态组件
const EmptyState: React.FC = () => (
  <div className="empty-state">
    <p>暂无数据</p>
  </div>
);

const PermissionErrorComponent: React.FC = () => (
  <div className="error-state">
    <h3>权限不足</h3>
    <p>您没有权限访问此内容</p>
  </div>
);

const NotFoundErrorComponent: React.FC = () => (
  <div className="error-state">
    <h3>内容不存在</h3>
    <p>请求的内容不存在或已被删除</p>
  </div>
);

const ServerErrorComponent: React.FC<{ error: Error }> = ({ error }) => (
  <div className="error-state">
    <h3>服务器错误</h3>
    <p>服务器遇到错误，请稍后重试</p>
    <details>
      <summary>错误详情</summary>
      <pre>{error.message}</pre>
    </details>
  </div>
);

// 错误类
class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

// 辅助函数
async function getUserPermissions(userId: string): Promise<string[]> {
  const permissions = await db
    .table('user_permissions')
    .where('user_id', userId)
    .pluck('permission');
  
  return permissions;
}

export default ServerComponent;
```

### 高级服务端组件模式

```typescript
// templates/advanced-server-component.tsx
import React from 'react';
import { db } from '@/lib/database';
import { auth } from '@/lib/auth';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { revalidatePath, revalidateTag } from 'next/cache';
import { unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

interface AdvancedServerComponentProps {
  // 高级查询
  searchQuery?: string;
  advancedFilters?: {
    dateRange?: { start: Date; end: Date };
    categories?: string[];
    tags?: string[];
    status?: string[];
  };
  
  // 数据聚合
  aggregations?: {
    groupBy?: string;
    metrics?: string[];
  };
  
  // 实时数据
  realtime?: boolean;
  subscriptionId?: string;
  
  // 导出功能
  exportFormat?: 'csv' | 'excel' | 'pdf';
  
  // 缓存策略
  cacheStrategy?: 'swr' | 'ssr' | 'isr';
  revalidateTags?: string[];
  
  // 安全配置
  rateLimit?: {
    max: number;
    window: number;
  };
  
  // 监控配置已移除
  // enableMonitoring?: boolean;
  // metricsEndpoint?: string;
  
  // 基础属性
  className?: string;
  children?: React.ReactNode;
}

export const AdvancedServerComponent: React.FC<AdvancedServerComponentProps> = async ({
  searchQuery,
  advancedFilters = {},
  aggregations,
  realtime = false,
  exportFormat,
  cacheStrategy = 'ssr',
  revalidateTags = [],
  rateLimit,
  // enableMonitoring = true,
  // metricsEndpoint,
  className,
  children
}) => {
  const startTime = Date.now();
  
  try {
    // 1. 获取请求上下文
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || '';
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    
    // 2. 速率限制检查
    if (rateLimit) {
      await checkRateLimit(ip, rateLimit);
    }
    
    // 3. 认证和授权
    const session = await auth();
    if (!session) {
      redirect('/login');
    }
    
    // 4. 高级数据获取
    const data = await fetchAdvancedData({
      searchQuery,
      advancedFilters,
      aggregations,
      cacheStrategy,
      revalidateTags,
      userId: session.user.id
    });
    
    // 5. 实时数据订阅
    let realtimeData = null;
    if (realtime) {
      realtimeData = await setupRealtimeSubscription({
        subscriptionId: \`\${session.user.id}-advanced\`,
        filters: advancedFilters
      });
    }
    
    // 6. 性能指标收集（开发环境）
    const endTime = Date.now();
    const performanceMetrics = {
      renderTime: endTime - startTime,
      dataSize: JSON.stringify(data).length,
      cacheHit: false // 将在缓存函数中设置
    };
    
    // 性能监控代码已移除
    // if (enableMonitoring && metricsEndpoint) {
    //   await reportMetrics(metricsEndpoint, performanceMetrics);
    // }
    
    // 7. 导出处理
    if (exportFormat) {
      return handleDataExport(data, exportFormat);
    }
    
    // 8. 返回渲染结果
    return (
      <div className={cn('advanced-server-component', className)}>
        {/* 性能指标显示（开发环境） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="performance-metrics">
            <small>
              渲染时间: {performanceMetrics.renderTime}ms | 
              数据大小: {Math.round(performanceMetrics.dataSize / 1024)}KB
            </small>
          </div>
        )}
        
        {/* 实时数据指示器 */}
        {realtime && (
          <RealtimeIndicator isActive={!!realtimeData} />
        )}
        
        {/* 主要内容 */}
        <div className="advanced-component__content">
          <DataVisualizer 
            data={data} 
            aggregations={aggregations}
            realtimeData={realtimeData}
          />
          
          {children}
        </div>
        
        {/* 导出控件 */}
        <ExportControls 
          availableFormats={['csv', 'excel', 'pdf']}
          onExport={handleExportRequest}
        />
        
        {/* 实时更新区域 */}
        {realtime && (
          <RealtimeUpdates 
            subscriptionId={\`\${session.user.id}-advanced\`}
            onUpdate={handleRealtimeUpdate}
          />
        )}
      </div>
    );
    
  } catch (error) {
    logger.error('AdvancedServerComponent error:', error);
    
    // 错误分类处理
    if (error instanceof RateLimitError) {
      return <RateLimitErrorComponent retryAfter={error.retryAfter} />;
    }
    
    if (error instanceof AuthenticationError) {
      redirect('/login');
    }
    
    if (error instanceof AuthorizationError) {
      return <AuthorizationErrorComponent />;
    }
    
    if (error instanceof ValidationError) {
      return <ValidationErrorComponent errors={error.errors} />;
    }
    
    return <ServerErrorComponent error={error} />;
  }
};

// 高级数据获取函数
async function fetchAdvancedData(params: {
  searchQuery?: string;
  advancedFilters: any;
  aggregations?: any;
  cacheStrategy: string;
  revalidateTags: string[];
  userId: string;
}): Promise<any> {
  // 使用 Next.js 缓存
  const cachedFetch = unstable_cache(
    async (queryParams: any) => {
      logger.info('Fetching advanced data with params:', queryParams);
      
      // 构建复杂查询
      let query = db.table('advanced_data');
      
      // 全文搜索
      if (queryParams.searchQuery) {
        query = query.where('search_vector', '@@', 
          db.raw("plainto_tsquery('english', ?)", [queryParams.searchQuery])
        );
      }
      
      // 高级过滤器
      if (queryParams.advancedFilters.dateRange) {
        const { start, end } = queryParams.advancedFilters.dateRange;
        query = query.whereBetween('created_at', [start, end]);
      }
      
      if (queryParams.advancedFilters.categories?.length > 0) {
        query = query.whereIn('category', queryParams.advancedFilters.categories);
      }
      
      if (queryParams.advancedFilters.tags?.length > 0) {
        query = query.whereIn('id', 
          db.table('item_tags')
            .select('item_id')
            .whereIn('tag_id', 
              db.table('tags')
                .select('id')
                .whereIn('name', queryParams.advancedFilters.tags)
            )
        );
      }
      
      // 执行查询
      const rawData = await query;
      
      // 数据聚合
      let aggregatedData = rawData;
      if (queryParams.aggregations?.groupBy) {
        aggregatedData = await performAggregation(rawData, queryParams.aggregations);
      }
      
      return {
        data: aggregatedData,
        metadata: {
          total: rawData.length,
          filtered: aggregatedData.length,
          timestamp: new Date().toISOString()
        }
      };
    },
    [JSON.stringify(params)],
    {
      tags: params.revalidateTags,
      revalidate: params.cacheStrategy === 'isr' ? 3600 : false
    }
  );
  
  return cachedFetch(params);
}

// 数据聚合函数
async function performAggregation(data: any[], aggregations: any): Promise<any> {
  if (!aggregations.groupBy) {
    return data;
  }
  
  const grouped = data.reduce((acc, item) => {
    const key = item[aggregations.groupBy];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
  
  const result = Object.entries(grouped).map(([key, items]) => {
    const aggregated: any = {
      [aggregations.groupBy]: key,
      count: items.length
    };
    
    // 计算指标
    if (aggregations.metrics) {
      aggregations.metrics.forEach((metric: string) => {
        switch (metric) {
          case 'sum':
            aggregated.sum = items.reduce((sum, item) => sum + (item.value || 0), 0);
            break;
          case 'avg':
            aggregated.avg = items.reduce((sum, item) => sum + (item.value || 0), 0) / items.length;
            break;
          case 'min':
            aggregated.min = Math.min(...items.map(item => item.value || 0));
            break;
          case 'max':
            aggregated.max = Math.max(...items.map(item => item.value || 0));
            break;
        }
      });
    }
    
    return aggregated;
  });
  
  return result;
}

// 实时数据订阅
async function setupRealtimeSubscription(params: {
  subscriptionId: string;
  filters: any;
}): Promise<any> {
  // 这里可以集成 WebSocket 或 Server-Sent Events
  // 返回订阅信息和初始数据
  return {
    subscriptionId: params.subscriptionId,
    status: 'active',
    lastUpdate: new Date().toISOString(),
    initialData: null
  };
}

// 速率限制检查
async function checkRateLimit(ip: string, config: { max: number; window: number }): Promise<void> {
  const key = \`rate-limit:\${ip}\`;
  const current = await cache.get(key) || 0;
  
  if (current >= config.max) {
    throw new RateLimitError('Rate limit exceeded', Math.ceil(config.window / 1000));
  }
  
  await cache.set(key, current + 1, { ttl: config.window / 1000 });
}

// 性能监控函数已移除
// async function reportMetrics(endpoint: string, metrics: any): Promise<void> {
//   try {
//     await fetch(endpoint, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         timestamp: new Date().toISOString(),
//         component: 'AdvancedServerComponent',
//         metrics
//       }),
//     });
//   } catch (error) {
//     logger.error('Failed to report metrics:', error);
//   }
// }

// 数据导出处理
async function handleDataExport(data: any, format: string): Promise<React.ReactNode> {
  switch (format) {
    case 'csv':
      return generateCSVExport(data);
    case 'excel':
      return generateExcelExport(data);
    case 'pdf':
      return generatePDFExport(data);
    default:
      throw new Error('Unsupported export format');
  }
}

// 导出函数
async function generateCSVExport(data: any): Promise<React.ReactNode> {
  // 生成 CSV 文件并返回下载链接
  const csv = convertToCSV(data.data);
  const filename = \`export-\${Date.now()}.csv\`;
  
  return (
    <div className="export-container">
      <a 
        href={\`data:text/csv;charset=utf-8,\${encodeURIComponent(csv)}\`}
        download={filename}
        className="download-link"
      >
        下载 CSV 文件
      </a>
    </div>
  );
}

// 辅助组件
// PerformanceMetrics 组件已内联到主组件中，简化为基本的性能指标显示

const RealtimeIndicator: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <div className={\`realtime-indicator \${isActive ? 'active' : 'inactive'}\`}>
    <div className="indicator-dot" />
    <span>{isActive ? '实时更新中' : '实时更新已停止'}</span>
  </div>
);

// 数据可视化组件
const DataVisualizer: React.FC<{
  data: any;
  aggregations?: any;
  realtimeData?: any;
}> = ({ data, aggregations, realtimeData }) => {
  return (
    <div className="data-visualizer">
      {/* 这里可以集成图表库或自定义可视化 */}
      <div className="data-summary">
        <h3>数据概览</h3>
        <p>总计: {data.metadata.total} 条记录</p>
        <p>筛选后: {data.metadata.filtered} 条记录</p>
      </div>
      
      {/* 数据表格 */}
      <div className="data-table">
        {data.data.map((item: any, index: number) => (
          <div key={index} className="data-row">
            {Object.entries(item).map(([key, value]) => (
              <div key={key} className="data-cell">
                <strong>{key}:</strong> {String(value)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// 导出控件
const ExportControls: React.FC<{
  availableFormats: string[];
  onExport: (format: string) => void;
}> = ({ availableFormats, onExport }) => {
  return (
    <div className="export-controls">
      <h4>导出数据</h4>
      <div className="export-buttons">
        {availableFormats.map(format => (
          <button
            key={format}
            onClick={() => onExport(format)}
            className="export-button"
          >
            导出为 {format.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

// 实时更新组件
const RealtimeUpdates: React.FC<{
  subscriptionId: string;
  onUpdate: (data: any) => void;
}> = ({ subscriptionId, onUpdate }) => {
  // 在实际应用中，这里会使用 WebSocket 或 SSE
  return (
    <div className="realtime-updates">
      <p>实时更新已启用 (订阅ID: {subscriptionId})</p>
    </div>
  );
};

// 错误组件
const RateLimitErrorComponent: React.FC<{ retryAfter: number }> = ({ retryAfter }) => (
  <div className="error-state">
    <h3>请求过于频繁</h3>
    <p>请在 {retryAfter} 秒后重试</p>
  </div>
);

const AuthorizationErrorComponent: React.FC = () => (
  <div className="error-state">
    <h3>访问被拒绝</h3>
    <p>您没有权限访问此资源</p>
  </div>
);

const ValidationErrorComponent: React.FC<{ errors: any[] }> = ({ errors }) => (
  <div className="error-state">
    <h3>数据验证错误</h3>
    <ul>
      {errors.map((error, index) => (
        <li key={index}>{error.message}</li>
      ))}
    </ul>
  </div>
);

// 错误类
class RateLimitError extends Error {
  retryAfter: number;
  
  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

class ValidationError extends Error {
  errors: any[];
  
  constructor(errors: any[]) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// 辅助函数
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // 处理包含逗号或引号的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return \`"\${value.replace(/"/g, '""')}"\`;
      }
      return value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\\n');
}

// 事件处理器
async function handleExportRequest(format: string): Promise<void> {
  // 在实际应用中，这里会触发导出流程
  console.log('Export requested:', format);
}

async function handleRealtimeUpdate(data: any): Promise<void> {
  // 处理实时数据更新
  console.log('Realtime update received:', data);
}

export default AdvancedServerComponent;
```

## 🎨 服务端组件工具函数

### 缓存工具

```typescript
// lib/cache.ts
import { unstable_cache as nextCache } from 'next/cache';
import { revalidatePath, revalidateTag } from 'next/cache';

// 缓存配置
interface CacheConfig {
  ttl?: number;
  tags?: string[];
  revalidate?: number;
}

// 通用缓存函数
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  config: CacheConfig = {}
): Promise<T> {
  const cached = nextCache(
    async () => {
      try {
        const result = await fetchFn();
        return result;
      } catch (error) {
        console.error('Cache fetch error:', error);
        throw error;
      }
    },
    [key],
    {
      tags: config.tags || [],
      revalidate: config.revalidate || config.ttl || 3600
    }
  );
  
  return cached();
}

// 带条件的缓存
export async function conditionalCache<T>(
  key: string,
  condition: () => Promise<boolean>,
  fetchFn: () => Promise<T>,
  config: CacheConfig = {}
): Promise<T> {
  const shouldCache = await condition();
  
  if (!shouldCache) {
    return fetchFn();
  }
  
  return cachedFetch(key, fetchFn, config);
}

// 缓存标签管理
export const CacheTags = {
  USER: (userId: string) => \`user-\${userId}\`,
  POST: (postId: string) => \`post-\${postId}\`,
  CATEGORY: (categoryId: string) => \`category-\${categoryId}\`,
  SEARCH: (query: string) => \`search-\${query}\`,
  DASHBOARD: (userId: string) => \`dashboard-\${userId}\`,
  
  // 批量操作标签
  USERS: 'users',
  POSTS: 'posts',
  CATEGORIES: 'categories',
  
  // 清理函数
  revalidateUser: (userId: string) => revalidateTag(CacheTags.USER(userId)),
  revalidatePost: (postId: string) => revalidateTag(CacheTags.POST(postId)),
  revalidateCategory: (categoryId: string) => revalidateTag(CacheTags.CATEGORY(categoryId)),
  revalidateSearch: (query: string) => revalidateTag(CacheTags.SEARCH(query)),
  revalidateDashboard: (userId: string) => revalidateTag(CacheTags.DASHBOARD(userId)),
  
  // 批量清理
  revalidateAllUsers: () => revalidateTag(CacheTags.USERS),
  revalidateAllPosts: () => revalidateTag(CacheTags.POSTS),
  revalidateAllCategories: () => revalidateTag(CacheTags.CATEGORIES),
};

// 缓存策略
export const CacheStrategies = {
  // SWR (Stale-While-Revalidate)
  SWR: (ttl: number = 60) => ({
    revalidate: ttl,
    tags: []
  }),
  
  // SSR (服务端渲染)
  SSR: () => ({
    revalidate: false,
    tags: []
  }),
  
  // ISR (Incremental Static Regeneration)
  ISR: (revalidate: number = 3600, tags: string[] = []) => ({
    revalidate,
    tags
  }),
  
  // 按需重新验证
  ON_DEMAND: (tags: string[] = []) => ({
    revalidate: false,
    tags
  })
};
```

### 数据库工具

```typescript
// lib/database.ts
import { Pool } from 'pg';
import { cache } from './cache';

// 数据库连接配置
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 查询构建器
class QueryBuilder {
  private table: string;
  private query: any;
  
  constructor(table: string) {
    this.table = table;
    this.query = pool;
  }
  
  select(columns: string = '*') {
    this.query = this.query.select(columns);
    return this;
  }
  
  where(column: string, operator?: any, value?: any) {
    if (value === undefined) {
      this.query = this.query.where(column, operator);
    } else {
      this.query = this.query.where(column, operator, value);
    }
    return this;
  }
  
  whereIn(column: string, values: any[]) {
    this.query = this.query.whereIn(column, values);
    return this;
  }
  
  whereNot(column: string, operator?: any, value?: any) {
    if (value === undefined) {
      this.query = this.query.whereNot(column, operator);
    } else {
      this.query = this.query.whereNot(column, operator, value);
    }
    return this;
  }
  
  whereNull(column: string) {
    this.query = this.query.whereNull(column);
    return this;
  }
  
  whereNotNull(column: string) {
    this.query = this.query.whereNotNull(column);
    return this;
  }
  
  orderBy(column: string, direction: 'asc' | 'desc' = 'asc') {
    this.query = this.query.orderBy(column, direction);
    return this;
  }
  
  groupBy(...columns: string[]) {
    this.query = this.query.groupBy(...columns);
    return this;
  }
  
  limit(limit: number) {
    this.query = this.query.limit(limit);
    return this;
  }
  
  offset(offset: number) {
    this.query = this.query.offset(offset);
    return this;
  }
  
  async first() {
    const result = await this.query;
    return result[0];
  }
  
  async pluck(column: string) {
    const result = await this.query.pluck(column);
    return result;
  }
  
  async count() {
    const result = await this.query.count();
    return result[0].count;
  }
  
  async max(column: string) {
    const result = await this.query.max(column);
    return result[0].max;
  }
  
  async min(column: string) {
    const result = await this.query.min(column);
    return result[0].min;
  }
  
  async avg(column: string) {
    const result = await this.query.avg(column);
    return result[0].avg;
  }
  
  async sum(column: string) {
    const result = await this.query.sum(column);
    return result[0].sum;
  }
  
  async execute() {
    return this.query;
  }
}

// 数据库操作
export const db = {
  table: (table: string) => new QueryBuilder(table),
  
  // 事务处理
  transaction: async (callback: (trx: any) => Promise<any>) => {
    const trx = await pool.connect();
    try {
      await trx.query('BEGIN');
      const result = await callback(trx);
      await trx.query('COMMIT');
      return result;
    } catch (error) {
      await trx.query('ROLLBACK');
      throw error;
    } finally {
      trx.release();
    }
  },
  
  // 原始查询
  raw: (sql: string, params?: any[]) => pool.query(sql, params),
  
  // 健康检查
  health: async () => {
    try {
      await pool.query('SELECT 1');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
};

// 模型基类
export abstract class BaseModel {
  protected table: string;
  protected fillable: string[];
  protected hidden: string[] = [];
  
  constructor(table: string, fillable: string[] = []) {
    this.table = table;
    this.fillable = fillable;
  }
  
  // 创建记录
  async create(data: Record<string, any>): Promise<any> {
    const filteredData = this.filterData(data);
    const [result] = await db.table(this.table).insert(filteredData).returning('*');
    return this.hideAttributes(result);
  }
  
  // 批量创建
  async bulkCreate(dataArray: Record<string, any>[]): Promise<any[]> {
    const filteredData = dataArray.map(item => this.filterData(item));
    const results = await db.table(this.table).insert(filteredData).returning('*');
    return results.map(item => this.hideAttributes(item));
  }
  
  // 查找记录
  async find(id: string | number): Promise<any | null> {
    const result = await db.table(this.table).where('id', id).first();
    return result ? this.hideAttributes(result) : null;
  }
  
  // 查找或创建
  async findOrCreate(where: Record<string, any>, createData: Record<string, any> = {}): Promise<[any, boolean]> {
    let result = await db.table(this.table).where(where).first();
    
    if (result) {
      return [this.hideAttributes(result), false];
    }
    
    const newRecord = await this.create({ ...where, ...createData });
    return [newRecord, true];
  }
  
  // 更新记录
  async update(id: string | number, data: Record<string, any>): Promise<any | null> {
    const filteredData = this.filterData(data);
    const [result] = await db.table(this.table).where('id', id).update(filteredData).returning('*');
    return result ? this.hideAttributes(result) : null;
  }
  
  // 删除记录
  async delete(id: string | number): Promise<boolean> {
    const result = await db.table(this.table).where('id', id).delete();
    return result > 0;
  }
  
  // 查询构建器
  query() {
    return new QueryBuilder(this.table);
  }
  
  // 过滤数据
  private filterData(data: Record<string, any>): Record<string, any> {
    const filtered: Record<string, any> = {};
    
    this.fillable.forEach(key => {
      if (data[key] !== undefined) {
        filtered[key] = data[key];
      }
    });
    
    return filtered;
  }
  
  // 隐藏属性
  private hideAttributes(data: any): any {
    if (!this.hidden.length) return data;
    
    const result = { ...data };
    this.hidden.forEach(key => {
      delete result[key];
    });
    
    return result;
  }
}
```

### 认证工具

```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from './database';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const user = await db.table('users').where('email', credentials.email).first();
        
        if (!user || !user.password) {
          return null;
        }
        
        const isPasswordValid = await compare(credentials.password, user.password);
        
        if (!isPasswordValid) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
};

// 服务端认证检查
export async function getServerSession() {
  const session = await getServerSession(authOptions);
  return session;
}

// 获取当前用户
export async function getCurrentUser() {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    return null;
  }
  
  const user = await db.table('users').where('id', session.user.id).first();
  return user;
}

// 权限检查
export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/auth/signin');
  }
  
  return session;
}

// 角色检查
export async function requireRole(role: string | string[]) {
  const session = await requireAuth();
  
  const roles = Array.isArray(role) ? role : [role];
  
  if (!roles.includes(session.user.role)) {
    redirect('/unauthorized');
  }
  
  return session;
}

// 权限检查
export async function requirePermission(permission: string) {
  const session = await requireAuth();
  
  const hasPermission = await db.table('user_permissions')
    .join('permissions', 'user_permissions.permission_id', 'permissions.id')
    .where('user_permissions.user_id', session.user.id)
    .where('permissions.name', permission)
    .first();
  
  if (!hasPermission) {
    redirect('/unauthorized');
  }
  
  return session;
}
```

## 🧪 服务端组件测试

### 服务端组件测试模板

```typescript
// __tests__/server-component.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServerComponent } from '../ServerComponent';

// Mock 服务端依赖
jest.mock('@/lib/database', () => ({
  db: {
    table: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue([{ count: 10 }])
    }))
  }
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({
    user: {
      id: '1',
      email: 'test@example.com',
      roles: ['user'],
      permissions: ['read']
    }
  })
}));

jest.mock('@/lib/cache', () => ({
  cache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
  unstable_cache: jest.fn((fn) => fn)
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  headers: jest.fn(() => new Map())
}));

describe('ServerComponent', () => {
  const mockData = {
    items: [
      {
        id: '1',
        title: 'Test Item 1',
        description: 'Test description 1',
        createdAt: '2024-01-01T00:00:00Z',
        author: 'Test Author'
      },
      {
        id: '2',
        title: 'Test Item 2',
        description: 'Test description 2',
        createdAt: '2024-01-02T00:00:00Z',
        author: 'Test Author'
      }
    ],
    total: 2,
    page: 1,
    pageSize: 10
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染服务端组件', async () => {
      // Mock 数据库查询
      const { db } = require('@/lib/database');
      db.table.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockData.items)
      });
      
      // Mock 权限检查
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          roles: ['user'],
          permissions: ['read']
        }
      });
      
      // 渲染组件
      const Component = await ServerComponent;
      const { container } = render(<Component />);
      
      expect(container).toBeInTheDocument();
    });

    it('应该应用正确的 CSS 类名', async () => {
      // Mock 数据
      const { db } = require('@/lib/database');
      db.table.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockData.items)
      });
      
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          roles: ['user'],
          permissions: ['read']
        }
      });
      
      const Component = await ServerComponent;
      const { container } = render(<Component className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('server-component');
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('数据获取', () => {
    it('应该正确获取和渲染数据', async () => {
      const { db } = require('@/lib/database');
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockData.items)
      };
      
      db.table.mockReturnValue(mockQuery);
      
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          roles: ['user'],
          permissions: ['read']
        }
      });
      
      const Component = await ServerComponent;
      render(<Component />);
      
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.offset).toHaveBeenCalledWith(0);
    });

    it('应该正确应用过滤器', async () => {
      const { db } = require('@/lib/database');
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockData.items)
      };
      
      db.table.mockReturnValue(mockQuery);
      
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          roles: ['user'],
          permissions: ['read']
        }
      });
      
      const Component = await ServerComponent;
      render(<Component filters={{ category: 'test', status: 'active' }} />);
      
      expect(mockQuery.where).toHaveBeenCalledWith('category', 'test');
      expect(mockQuery.where).toHaveBeenCalledWith('status', 'active');
    });
  });

  describe('权限验证', () => {
    it('应该正确验证用户权限', async () => {
      const { db } = require('@/lib/database');
      db.table.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockData.items)
      });
      
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          roles: ['admin'],
          permissions: ['read', 'write']
        }
      });
      
      const Component = await ServerComponent;
      render(<Component requiredRoles={['admin']} />);
      
      expect(auth).toHaveBeenCalled();
    });

    it('应该处理权限不足的情况', async () => {
      const { db } = require('@/lib/database');
      db.table.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockData.items)
      });
      
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          roles: ['user'],
          permissions: ['read']
        }
      });
      
      const Component = await ServerComponent;
      const { container } = render(<Component requiredRoles={['admin']} />);
      
      expect(container.querySelector('.error-state')).toBeInTheDocument();
      expect(screen.getByText('权限不足')).toBeInTheDocument();
    });
  });

  describe('缓存处理', () => {
    it('应该正确使用缓存', async () => {
      const { db } = require('@/lib/database');
      const { cache } = require('@/lib/cache');
      
      db.table.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockData.items)
      });
      
      // Mock 缓存未命中
      cache.get.mockResolvedValue(null);
      
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          roles: ['user'],
          permissions: ['read']
        }
      });
      
      const Component = await ServerComponent;
      render(<Component cacheKey="test-cache-key" />);
      
      expect(cache.get).toHaveBeenCalledWith('test-cache-key');
      expect(cache.set).toHaveBeenCalledWith(
        'test-cache-key',
        expect.any(Object),
        { ttl: 3600 }
      );
    });

    it('应该使用缓存数据', async () => {
      const { db } = require('@/lib/database');
      const { cache } = require('@/lib/cache');
      
      // Mock 缓存命中
      cache.get.mockResolvedValue(mockData);
      
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          roles: ['user'],
          permissions: ['read']
        }
      });
      
      const Component = await ServerComponent;
      render(<Component cacheKey="test-cache-key" />);
      
      expect(cache.get).toHaveBeenCalledWith('test-cache-key');
      // 数据库查询不应该被调用
      expect(db.table).not.toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该处理数据库错误', async () => {
      const { db } = require('@/lib/database');
      const { logger } = require('@/lib/logger');
      
      db.table.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockRejectedValue(new Error('Database error'))
      });
      
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          roles: ['user'],
          permissions: ['read']
        }
      });
      
      const Component = await ServerComponent;
      const { container } = render(<Component />);
      
      expect(logger.error).toHaveBeenCalledWith(
        'ServerComponent error:',
        expect.any(Error)
      );
      
      expect(container.querySelector('.error-state')).toBeInTheDocument();
    });

    it('应该处理认证错误', async () => {
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue(null);
      
      const Component = await ServerComponent;
      const { container } = render(<Component />);
      
      expect(container.querySelector('.error-state')).toBeInTheDocument();
    });
  });

  describe('SEO 功能', () => {
    it('应该生成正确的 SEO 元数据', async () => {
      const { db } = require('@/lib/database');
      db.table.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockData.items)
      });
      
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          roles: ['user'],
          permissions: ['read']
        }
      });
      
      const seoProps = {
        title: 'Test Page Title',
        description: 'Test page description',
        keywords: ['test', 'page'],
        ogImage: '/test-image.jpg'
      };
      
      const Component = await ServerComponent;
      render(<Component seo={seoProps} />);
      
      // 检查 SEO 元数据是否正确生成
      expect(document.title).toBe('Test Page Title');
    });
  });

  describe('分页功能', () => {
    it('应该正确显示分页控件', async () => {
      const { db } = require('@/lib/database');
      
      // Mock 大量数据
      const largeData = {
        items: Array.from({ length: 25 }, (_, i) => ({
          id: String(i + 1),
          title: \`Item \${i + 1}\`,
          description: \`Description \${i + 1}\`,
          createdAt: '2024-01-01T00:00:00Z',
          author: 'Test Author'
        })),
        total: 25,
        page: 1,
        pageSize: 10
      };
      
      db.table.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(largeData.items)
      });
      
      // Mock 总数查询
      db.table.mockReturnValueOnce({
        count: jest.fn().mockResolvedValue([{ count: 25 }])
      });
      
      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          roles: ['user'],
          permissions: ['read']
        }
      });
      
      const Component = await ServerComponent;
      const { container } = render(<Component limit={10} />);
      
      expect(container.querySelector('.pagination')).toBeInTheDocument();
    });
  });
});

// 集成测试
describe('ServerComponent Integration', () => {
  it('应该与数据库正确集成', async () => {
    // 测试数据库查询集成
    const { db } = require('@/lib/database');
    
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue(mockData.items)
    };
    
    db.table.mockReturnValue(mockQuery);
    
    const { auth } = require('@/lib/auth');
    auth.mockResolvedValue({
      user: {
        id: '1',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read']
      }
    });
    
    const Component = await ServerComponent;
    render(<Component />);
    
    expect(db.table).toHaveBeenCalledWith('items');
  });

  it('应该与认证系统正确集成', async () => {
    const { auth } = require('@/lib/auth');
    
    auth.mockResolvedValue({
      user: {
        id: '1',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read']
      }
    });
    
    const { db } = require('@/lib/database');
    db.table.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue(mockData.items)
    });
    
    const Component = await ServerComponent;
    render(<Component requiredPermissions={['read']} />);
    
    expect(auth).toHaveBeenCalled();
  });
});
```

## 📋 服务端组件检查清单

### 开发检查清单

- [ ] 确保组件在服务器端运行（无需 'use client' 指令）
- [ ] 实现适当的错误处理和边界
- [ ] 添加数据验证和清理
- [ ] 实现缓存策略
- [ ] 添加权限验证
- [ ] 优化数据库查询
- [ ] 添加日志记录
- [ ] 实现适当的分页
- [ ] 添加 SEO 支持
- [ ] 编写完整的测试用例

### 性能优化检查清单

- [ ] 使用 Next.js 缓存机制
- [ ] 实现数据流式传输
- [ ] 优化数据库查询
- [ ] 使用适当的索引
- [ ] 实现增量静态生成
- [ ] 使用 CDN 缓存
- [ ] 优化图片和资源
- [ ] 实现懒加载

### 安全性检查清单

- [ ] 验证所有用户输入
- [ ] 实现适当的认证和授权
- [ ] 防止 SQL 注入
- [ ] 使用 HTTPS
- [ ] 实现速率限制
- [ ] 保护敏感数据
- [ ] 添加 CSRF 保护
- [ ] 实现适当的日志记录

## 🎯 总结

React 服务端组件提供了强大的服务端渲染能力，通过遵循本规范，您可以创建：

1. **高性能**：零客户端包大小，自动缓存，流式渲染
2. **安全**：服务端执行，保护敏感数据和逻辑
3. **SEO 友好**：直接输出 HTML，有利于搜索引擎收录
4. **可维护**：清晰的代码结构，完整的错误处理
5. **可扩展**：支持复杂的业务逻辑和数据处理

服务端组件应该专注于数据获取、处理和展示，为用户提供快速、安全的内容体验。

---

*文档版本：1.0.0*  
*最后更新：2024年*