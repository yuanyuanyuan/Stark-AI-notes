# 🚀 生产环境最佳实践指南

> **从开发到生产的全流程优化策略和实践指南**

## 📋 概述

本指南提供React应用在生产环境中的最佳实践，涵盖性能优化、监控告警、错误处理、安全防护、部署策略等关键领域，确保应用在生产环境中稳定、高效、安全运行。

## 🎯 核心原则

### 生产就绪标准
1. **性能达标**: 首屏加载 < 3秒，交互响应 < 100ms
2. **可用性保证**: 99.9% 以上的正常运行时间
3. **安全防护**: 通过安全审计，无已知漏洞
4. **监控完善**: 实时监控，快速定位问题
5. **可维护性**: 日志完整，易于调试和回滚

## ⚡ 性能优化

### 1. 构建优化

```javascript
// webpack.prod.config.js
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  mode: 'production',
  devtool: 'source-map', // 生产环境使用source-map便于调试
  
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // 移除console
            drop_debugger: true, // 移除debugger
            pure_funcs: ['console.log'], // 移除特定函数
          },
          mangle: {
            safari10: true, // 兼容Safari 10
          },
          format: {
            comments: false, // 移除注释
          },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ],
    
    // 代码分割
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
        // 分离大型库
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          priority: 20,
        },
        antd: {
          test: /[\\/]node_modules[\\/]antd[\\/]/,
          name: 'antd',
          priority: 15,
        },
      },
    },
    
    // 运行时chunk
    runtimeChunk: {
      name: 'runtime',
    },
    
    // 模块ID策略
    moduleIds: 'deterministic',
  },
  
  plugins: [
    // Gzip压缩
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240, // 10KB以上才压缩
      minRatio: 0.8,
    }),
    
    // Brotli压缩
    new CompressionPlugin({
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: {
        level: 11,
      },
      threshold: 10240,
      minRatio: 0.8,
      filename: '[path][base].br',
    }),
    
    // Bundle分析（仅在需要时启用）
    process.env.ANALYZE && new BundleAnalyzerPlugin(),
  ].filter(Boolean),
};
```

### 2. 懒加载和代码分割

```typescript
// 路由懒加载
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';

// 懒加载页面组件
const Dashboard = lazy(() => 
  import(/* webpackChunkName: "dashboard" */ './pages/Dashboard')
);

const Customers = lazy(() => 
  import(/* webpackChunkName: "customers" */ './pages/Customers')
);

const Reports = lazy(() => 
  import(/* webpackChunkName: "reports" */ './pages/Reports')
);

// 预加载关键页面
const preloadDashboard = () => {
  import(/* webpackPreload: true */ './pages/Dashboard');
};

// 预取非关键页面
const prefetchReports = () => {
  import(/* webpackPrefetch: true */ './pages/Reports');
};

export function AppRoutes() {
  // 在适当时机触发预加载
  useEffect(() => {
    // 用户登录后预加载Dashboard
    if (isAuthenticated) {
      preloadDashboard();
    }
    
    // 空闲时预取Reports
    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetchReports);
    } else {
      setTimeout(prefetchReports, 1000);
    }
  }, [isAuthenticated]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Suspense>
  );
}
```

### 3. 资源优化

```typescript
// 图片优化
export function OptimizedImage({ src, alt, ...props }: ImageProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <picture>
      {/* WebP格式（更小的文件大小） */}
      <source 
        type="image/webp" 
        srcSet={isIntersecting ? `${src}.webp` : undefined}
      />
      
      {/* AVIF格式（最新的图片格式） */}
      <source 
        type="image/avif" 
        srcSet={isIntersecting ? `${src}.avif` : undefined}
      />
      
      {/* 降级到原始格式 */}
      <img 
        ref={imgRef}
        src={isIntersecting ? src : undefined}
        alt={alt}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </picture>
  );
}

// 字体优化
// index.html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link 
  rel="preload" 
  href="/fonts/custom-font.woff2" 
  as="font" 
  type="font/woff2" 
  crossorigin
>
```

### 4. 缓存策略

```typescript
// Service Worker缓存策略
// service-worker.js
const CACHE_NAME = 'app-v1.0.0';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/offline.html',
];

// 安装Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 缓存策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache First策略：优先使用缓存
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // 检查是否是有效响应
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 克隆响应
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      // 离线降级
      return caches.match('/offline.html');
    })
  );
});

// HTTP缓存头配置
// nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /api {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```

## 📊 监控和告警

### 1. 应用性能监控 (APM)

```typescript
// monitoring/performance.monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();

  initialize() {
    // 监控页面加载性能
    this.observePageLoad();
    
    // 监控资源加载
    this.observeResourceTiming();
    
    // 监控长任务
    this.observeLongTasks();
    
    // 监控FCP、LCP、FID、CLS
    this.observeWebVitals();
  }

  private observePageLoad() {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.recordMetric('page_load', {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        ttfb: perfData.responseStart - perfData.requestStart,
        download: perfData.responseEnd - perfData.responseStart,
        domParse: perfData.domInteractive - perfData.domLoading,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        load: perfData.loadEventEnd - perfData.loadEventStart,
        total: perfData.loadEventEnd - perfData.fetchStart,
      });
    });
  }

  private observeResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          
          this.recordMetric('resource_load', {
            name: resource.name,
            type: this.getResourceType(resource.name),
            duration: resource.duration,
            size: resource.transferSize,
            cached: resource.transferSize === 0,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  private observeLongTasks() {
    if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('long_task', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
          });
          
          // 告警：任务超过50ms
          if (entry.duration > 50) {
            this.sendAlert('Long task detected', {
              duration: entry.duration,
              timestamp: new Date().toISOString(),
            });
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  private observeWebVitals() {
    // First Contentful Paint (FCP)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('fcp', entry.startTime);
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('lcp', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = entry.processingStart - entry.startTime;
        this.recordMetric('fid', fid);
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          this.recordMetric('cls', clsValue);
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private recordMetric(name: string, value: any) {
    this.metrics.set(name, {
      name,
      value,
      timestamp: Date.now(),
    });
    
    // 发送到监控服务
    this.sendToMonitoringService(name, value);
  }

  private sendToMonitoringService(name: string, value: any) {
    // 批量发送，避免频繁请求
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        const metrics = Array.from(this.metrics.values());
        
        fetch('/api/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics }),
        }).catch(console.error);
        
        this.metrics.clear();
        this.batchTimer = null;
      }, 5000);
    }
  }

  private sendAlert(message: string, data: any) {
    // 发送告警
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'warning',
        message,
        data,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(console.error);
  }
}
```

### 2. 错误监控

```typescript
// monitoring/error.monitor.ts
export class ErrorMonitor {
  private errorQueue: ErrorInfo[] = [];
  private maxQueueSize = 50;

  initialize() {
    // 捕获未处理的Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'unhandledrejection',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
      });
      
      // 阻止默认行为
      event.preventDefault();
    });

    // 捕获全局错误
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
      });
    });

    // React Error Boundary集成
    this.setupReactErrorBoundary();
    
    // 网络请求错误
    this.interceptNetworkErrors();
  }

  private captureError(errorInfo: ErrorInfo) {
    // 添加到队列
    this.errorQueue.push(errorInfo);
    
    // 限制队列大小
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
    
    // 错误分级
    const severity = this.calculateSeverity(errorInfo);
    
    // 发送错误报告
    this.reportError(errorInfo, severity);
    
    // 严重错误立即告警
    if (severity === 'critical') {
      this.sendImmediateAlert(errorInfo);
    }
  }

  private calculateSeverity(error: ErrorInfo): 'low' | 'medium' | 'high' | 'critical' {
    // 根据错误类型和内容判断严重程度
    if (error.message?.includes('Cannot read properties of null')) {
      return 'medium';
    }
    
    if (error.message?.includes('Network')) {
      return 'high';
    }
    
    if (error.message?.includes('SecurityError')) {
      return 'critical';
    }
    
    return 'low';
  }

  private reportError(error: ErrorInfo, severity: string) {
    const errorReport = {
      ...error,
      severity,
      browser: this.getBrowserInfo(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      buildVersion: process.env.REACT_APP_VERSION,
    };
    
    // 批量发送错误报告
    this.batchSendErrors(errorReport);
  }

  private batchSendErrors(error: any) {
    if (!this.sendTimer) {
      this.sendTimer = setTimeout(() => {
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            errors: this.errorQueue,
            timestamp: Date.now(),
          }),
        }).catch(console.error);
        
        this.errorQueue = [];
        this.sendTimer = null;
      }, 3000);
    }
  }

  private setupReactErrorBoundary() {
    // React错误边界组件
    class ErrorBoundary extends React.Component {
      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        errorMonitor.captureError({
          type: 'react-error',
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: Date.now(),
        });
      }
      
      render() {
        if (this.state.hasError) {
          return <ErrorFallback />;
        }
        return this.props.children;
      }
    }
  }

  private interceptNetworkErrors() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.captureError({
            type: 'network',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0].toString(),
            timestamp: Date.now(),
          });
        }
        
        return response;
      } catch (error) {
        this.captureError({
          type: 'network',
          message: error.message,
          url: args[0].toString(),
          timestamp: Date.now(),
        });
        throw error;
      }
    };
  }
}
```

## 🔒 安全防护

### 1. 安全配置

```typescript
// security/security.config.ts
export class SecurityConfig {
  static setupSecurityHeaders() {
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.example.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.example.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
    
    // 设置安全头
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;
    document.head.appendChild(meta);
  }

  static sanitizeInput(input: string): string {
    // XSS防护
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  static validateURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      // 只允许特定协议
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  static setupCSRFProtection() {
    // 获取CSRF Token
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    // 添加到所有请求
    const originalFetch = window.fetch;
    window.fetch = (url, options = {}) => {
      if (token) {
        options.headers = {
          ...options.headers,
          'X-CSRF-Token': token,
        };
      }
      return originalFetch(url, options);
    };
  }
}

// 敏感数据加密
export class DataEncryption {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  static async encrypt(data: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = this.encoder.encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  static async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return this.decoder.decode(decrypted);
  }

  static async generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }
}
```

### 2. 认证和授权

```typescript
// security/auth.guard.ts
export class AuthGuard {
  private static TOKEN_KEY = 'auth_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';
  private static TOKEN_EXPIRY_KEY = 'token_expiry';

  static async validateToken(): Promise<boolean> {
    const token = this.getToken();
    
    if (!token) {
      return false;
    }
    
    // 检查token是否过期
    if (this.isTokenExpired()) {
      // 尝试刷新token
      return await this.refreshToken();
    }
    
    // 验证token签名
    return await this.verifyTokenSignature(token);
  }

  static isTokenExpired(): boolean {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    
    return Date.now() > parseInt(expiry);
  }

  static async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      return false;
    }
    
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken, data.expiresIn);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    return false;
  }

  static setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(
      this.TOKEN_EXPIRY_KEY,
      (Date.now() + expiresIn * 1000).toString()
    );
  }

  static clearTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private static async verifyTokenSignature(token: string): Promise<boolean> {
    // JWT验证逻辑
    try {
      const [header, payload, signature] = token.split('.');
      // 验证签名...
      return true;
    } catch {
      return false;
    }
  }
}

// 权限控制
export class PermissionGuard {
  private static permissions: Set<string> = new Set();

  static loadPermissions(permissions: string[]) {
    this.permissions = new Set(permissions);
  }

  static hasPermission(permission: string): boolean {
    return this.permissions.has(permission);
  }

  static hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.permissions.has(p));
  }

  static hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.permissions.has(p));
  }
}

// React组件权限控制
export function ProtectedRoute({ 
  children, 
  permission,
  fallback = <Navigate to="/unauthorized" />
}: ProtectedRouteProps) {
  const hasPermission = PermissionGuard.hasPermission(permission);
  
  if (!hasPermission) {
    return fallback;
  }
  
  return <>{children}</>;
}
```

## 🚨 错误处理和降级

### 1. 全局错误处理

```typescript
// error-handling/global-error-handler.ts
export class GlobalErrorHandler {
  private static errorHandlers = new Map<string, ErrorHandler>();
  
  static registerHandler(type: string, handler: ErrorHandler) {
    this.errorHandlers.set(type, handler);
  }
  
  static async handleError(error: Error, context?: any): Promise<void> {
    // 错误分类
    const errorType = this.classifyError(error);
    
    // 获取对应的处理器
    const handler = this.errorHandlers.get(errorType) || this.defaultHandler;
    
    // 处理错误
    await handler(error, context);
    
    // 记录错误
    this.logError(error, errorType, context);
  }
  
  private static classifyError(error: Error): string {
    if (error.name === 'NetworkError') return 'network';
    if (error.name === 'ValidationError') return 'validation';
    if (error.name === 'AuthenticationError') return 'auth';
    if (error.name === 'PermissionError') return 'permission';
    return 'unknown';
  }
  
  private static defaultHandler: ErrorHandler = async (error, context) => {
    // 默认错误处理
    console.error('Unhandled error:', error, context);
    
    // 显示用户友好的错误信息
    showErrorNotification({
      title: '操作失败',
      message: '抱歉，出现了一些问题。请稍后重试。',
      duration: 5000,
    });
  };
  
  private static logError(error: Error, type: string, context?: any) {
    // 发送到日志服务
    Logger.error({
      type,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }
}

// 注册特定错误处理器
GlobalErrorHandler.registerHandler('network', async (error) => {
  // 网络错误处理
  if (navigator.onLine) {
    showErrorNotification({
      title: '网络错误',
      message: '服务器连接失败，请检查网络设置。',
    });
  } else {
    showErrorNotification({
      title: '离线状态',
      message: '您当前处于离线状态，请连接网络后重试。',
    });
  }
});

GlobalErrorHandler.registerHandler('auth', async (error) => {
  // 认证错误处理
  AuthGuard.clearTokens();
  window.location.href = '/login';
});
```

### 2. 服务降级

```typescript
// degradation/service-degradation.ts
export class ServiceDegradation {
  private static degradationRules = new Map<string, DegradationRule>();
  private static circuitBreakers = new Map<string, CircuitBreaker>();
  
  static registerRule(service: string, rule: DegradationRule) {
    this.degradationRules.set(service, rule);
    this.circuitBreakers.set(service, new CircuitBreaker(rule));
  }
  
  static async callService<T>(
    service: string,
    fn: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    const breaker = this.circuitBreakers.get(service);
    
    if (!breaker) {
      return fn();
    }
    
    // 检查熔断器状态
    if (breaker.isOpen()) {
      // 服务降级
      if (fallback) {
        return fallback();
      }
      throw new Error(`Service ${service} is currently unavailable`);
    }
    
    try {
      const result = await fn();
      breaker.recordSuccess();
      return result;
    } catch (error) {
      breaker.recordFailure();
      
      // 降级处理
      if (fallback) {
        return fallback();
      }
      
      throw error;
    }
  }
}

// 熔断器实现
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(private rule: DegradationRule) {}
  
  isOpen(): boolean {
    if (this.state === 'open') {
      // 检查是否应该尝试恢复
      if (Date.now() - this.lastFailureTime > this.rule.recoveryTimeout) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }
  
  recordSuccess() {
    if (this.state === 'half-open') {
      this.state = 'closed';
    }
    this.failures = 0;
  }
  
  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.rule.failureThreshold) {
      this.state = 'open';
    }
  }
}

// 使用示例
ServiceDegradation.registerRule('userApi', {
  failureThreshold: 5,
  recoveryTimeout: 30000, // 30秒
});

// API调用with降级
const users = await ServiceDegradation.callService(
  'userApi',
  () => fetchUsers(),
  () => getCachedUsers() // 降级方案：使用缓存
);
```

## 📈 日志和审计

### 1. 结构化日志

```typescript
// logging/structured-logger.ts
export class StructuredLogger {
  private static logBuffer: LogEntry[] = [];
  private static maxBufferSize = 100;
  private static flushInterval = 5000;
  
  static {
    // 定期刷新日志
    setInterval(() => this.flush(), this.flushInterval);
    
    // 页面卸载时刷新
    window.addEventListener('beforeunload', () => this.flush());
  }
  
  static log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      buildVersion: process.env.REACT_APP_VERSION,
      environment: process.env.NODE_ENV,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    
    // 添加到缓冲区
    this.logBuffer.push(entry);
    
    // 开发环境输出到控制台
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level}]`, message, data);
    }
    
    // 缓冲区满时自动刷新
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }
  
  static debug(message: string, data?: any) {
    this.log('debug', message, data);
  }
  
  static info(message: string, data?: any) {
    this.log('info', message, data);
  }
  
  static warn(message: string, data?: any) {
    this.log('warn', message, data);
  }
  
  static error(message: string, data?: any) {
    this.log('error', message, data);
  }
  
  private static async flush() {
    if (this.logBuffer.length === 0) return;
    
    const logs = [...this.logBuffer];
    this.logBuffer = [];
    
    try {
      // 使用sendBeacon优先，确保页面卸载时日志能发送
      if (navigator.sendBeacon) {
        const blob = new Blob(
          [JSON.stringify({ logs })],
          { type: 'application/json' }
        );
        navigator.sendBeacon('/api/logs', blob);
      } else {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs }),
        });
      }
    } catch (error) {
      console.error('Failed to send logs:', error);
      // 失败的日志重新加入缓冲区
      this.logBuffer.unshift(...logs);
    }
  }
}

// 用户行为审计
export class AuditLogger {
  static logAction(action: AuditAction) {
    StructuredLogger.info('User Action', {
      action: action.type,
      target: action.target,
      oldValue: action.oldValue,
      newValue: action.newValue,
      metadata: action.metadata,
      timestamp: Date.now(),
    });
  }
  
  static logAccess(resource: string, permission: string, granted: boolean) {
    StructuredLogger.info('Access Control', {
      resource,
      permission,
      granted,
      timestamp: Date.now(),
    });
  }
  
  static logDataChange(entity: string, operation: string, data: any) {
    StructuredLogger.info('Data Change', {
      entity,
      operation,
      data: this.sanitizeData(data),
      timestamp: Date.now(),
    });
  }
  
  private static sanitizeData(data: any): any {
    // 移除敏感信息
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'creditCard'];
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}
```

## 🎯 生产环境检查清单

### 性能优化
- [ ] 代码分割和懒加载实现
- [ ] 资源压缩（Gzip/Brotli）
- [ ] 图片优化和懒加载
- [ ] 字体优化和预加载
- [ ] Service Worker缓存策略
- [ ] CDN配置
- [ ] 首屏渲染优化
- [ ] Tree Shaking配置

### 监控告警
- [ ] APM工具集成
- [ ] 错误监控配置
- [ ] 性能指标监控
- [ ] 自定义指标追踪
- [ ] 告警规则设置
- [ ] 日志收集配置
- [ ] 用户行为分析

### 安全防护
- [ ] HTTPS强制启用
- [ ] CSP策略配置
- [ ] XSS防护
- [ ] CSRF防护
- [ ] 敏感数据加密
- [ ] 安全headers设置
- [ ] 依赖漏洞扫描
- [ ] 代码安全审计

### 稳定性保障
- [ ] 错误边界设置
- [ ] 服务降级方案
- [ ] 熔断器配置
- [ ] 重试机制
- [ ] 超时设置
- [ ] 离线支持
- [ ] 优雅降级
- [ ] 回滚方案

### 运维支持
- [ ] 健康检查接口
- [ ] 版本信息暴露
- [ ] 配置热更新
- [ ] 灰度发布支持
- [ ] A/B测试框架
- [ ] 特性开关
- [ ] 数据备份策略
- [ ] 灾难恢复计划

---

**记住：生产环境的稳定性和用户体验是应用成功的关键！** 🚀