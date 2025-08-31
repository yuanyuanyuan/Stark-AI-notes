# React 组件微前端架构支持

> 基于 React 18.3.1 的微前端架构集成和组件共享方案

## 📋 概述

本指南提供了完整的 React 组件微前端架构支持方案，包括模块联邦、组件共享、状态管理、路由集成等微前端开发的核心技术和最佳实践。

## 🏗️ 微前端架构概述

### 微前端核心概念

```typescript
// microfrontend-types.ts
export interface MicroAppConfig {
  name: string;
  entry: string;
  basePath: string;
  routes: MicroRoute[];
  shared: SharedDependencies;
  styles: string[];
  features: AppFeature[];
}

export interface MicroRoute {
  path: string;
  component: string;
  exact?: boolean;
  sensitive?: boolean;
}

export interface SharedDependencies {
  react: string;
  'react-dom': string;
  'react-router-dom': string;
  [key: string]: string;
}

export interface AppFeature {
  name: string;
  description: string;
  dependencies?: string[];
  api?: string;
}

export interface MicroFrontendContext {
  appConfig: MicroAppConfig;
  container: HTMLElement;
  props: Record<string, any>;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data?: any) => void) => void;
  off: (event: string, callback: (data?: any) => void) => void;
}
```

## 🔧 模块联邦配置

### Webpack 模块联邦配置

```javascript
// webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container;
const packageJson = require('./package.json');

module.exports = {
  mode: 'development',
  devServer: {
    port: 3001,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
            plugins: [
              '@babel/plugin-transform-runtime',
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'app1',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App',
        './components/Button': './src/components/Button',
        './components/Card': './src/components/Card',
        './hooks/useAuth': './src/hooks/useAuth',
        './utils/helpers': './src/utils/helpers',
      },
      shared: {
        ...packageJson.dependencies,
        react: {
          singleton: true,
          requiredVersion: packageJson.dependencies.react,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: packageJson.dependencies['react-dom'],
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: packageJson.dependencies['react-router-dom'],
        },
      },
    }),
  ],
};
```

### 模块联邦类型定义

```typescript
// types/module-federation.d.ts
declare module 'app1/Button' {
  import React from 'react';
  export interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
  }
  const Button: React.FC<ButtonProps>;
  export default Button;
}

declare module 'app1/Card' {
  import React from 'react';
  export interface CardProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
  }
  const Card: React.FC<CardProps>;
  export default Card;
}

// 动态导入类型
declare module '*/remoteEntry.js' {
  const content: any;
  export default content;
}
```

## 🎯 组件共享方案

### 组件共享管理器

```typescript
// shared/ComponentRegistry.ts
export interface ComponentInfo {
  name: string;
  version: string;
  component: React.ComponentType<any>;
  dependencies: string[];
  styles: string[];
  description?: string;
}

export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private components: Map<string, ComponentInfo> = new Map();
  private loadingPromises: Map<string, Promise<ComponentInfo>> = new Map();
  
  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }
  
  // 注册本地组件
  registerComponent(info: ComponentInfo): void {
    this.components.set(info.name, info);
  }
  
  // 注册远程组件
  async registerRemoteComponent(
    remoteName: string,
    moduleName: string,
    remoteUrl: string
  ): Promise<void> {
    const cacheKey = `${remoteName}:${moduleName}`;
    
    if (this.components.has(cacheKey)) {
      return;
    }
    
    if (this.loadingPromises.has(cacheKey)) {
      await this.loadingPromises.get(cacheKey);
      return;
    }
    
    const loadPromise = this.loadRemoteComponent(remoteName, moduleName, remoteUrl);
    this.loadingPromises.set(cacheKey, loadPromise);
    
    try {
      const componentInfo = await loadPromise;
      this.components.set(cacheKey, componentInfo);
    } catch (error) {
      console.error(`Failed to load remote component ${cacheKey}:`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }
  
  private async loadRemoteComponent(
    remoteName: string,
    moduleName: string,
    remoteUrl: string
  ): Promise<ComponentInfo> {
    // 动态加载远程入口
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = remoteUrl;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
    
    // 获取远程容器
    const container = (window as any)[remoteName];
    if (!container) {
      throw new Error(`Remote container ${remoteName} not found`);
    }
    
    // 初始化容器
    await container.init(__webpack_share_scopes__.default);
    
    // 获取组件工厂
    const factory = await container.get(moduleName);
    const Component = factory();
    
    return {
      name: `${remoteName}:${moduleName}`,
      version: '1.0.0',
      component: Component,
      dependencies: [],
      styles: [],
      description: `Remote component from ${remoteName}`
    };
  }
  
  // 获取组件
  getComponent(name: string): React.ComponentType<any> | null {
    const info = this.components.get(name);
    return info?.component || null;
  }
  
  // 检查组件是否存在
  hasComponent(name: string): boolean {
    return this.components.has(name);
  }
  
  // 获取所有组件信息
  getAllComponents(): ComponentInfo[] {
    return Array.from(this.components.values());
  }
  
  // 预加载组件
  async preloadComponents(names: string[]): Promise<void> {
    await Promise.all(names.map(name => {
      if (!this.hasComponent(name)) {
        console.warn(`Component ${name} not found in registry`);
      }
    }));
  }
}

// 全局组件注册表实例
export const componentRegistry = ComponentRegistry.getInstance();
```

### 动态组件加载器

```typescript
// shared/DynamicComponentLoader.tsx
import React, { Suspense } from 'react';
import { componentRegistry } from './ComponentRegistry';

interface DynamicComponentProps {
  name: string;
  remoteName?: string;
  remoteUrl?: string;
  fallback?: React.ReactNode;
  props?: Record<string, any>;
  onLoad?: (component: React.ComponentType<any>) => void;
  onError?: (error: Error) => void;
}

export const DynamicComponentLoader: React.FC<DynamicComponentProps> = ({
  name,
  remoteName,
  remoteUrl,
  fallback = <div>Loading...</div>,
  props = {},
  onLoad,
  onError
}) => {
  const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(false);
  
  React.useEffect(() => {
    const loadComponent = async () => {
      if (!name) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // 首先检查本地注册表
        let component = componentRegistry.getComponent(name);
        
        // 如果没有找到且提供了远程信息，尝试加载远程组件
        if (!component && remoteName && remoteUrl) {
          const moduleName = name.includes('/') ? name : `./${name}`;
          await componentRegistry.registerRemoteComponent(remoteName, moduleName, remoteUrl);
          component = componentRegistry.getComponent(`${remoteName}:${moduleName}`);
        }
        
        if (component) {
          setComponent(() => component);
          onLoad?.(component);
        } else {
          throw new Error(`Component ${name} not found`);
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    };
    
    loadComponent();
  }, [name, remoteName, remoteUrl, onLoad, onError]);
  
  if (error) {
    return (
      <div className="error-boundary">
        <h3>Component Load Error</h3>
        <p>{error.message}</p>
      </div>
    );
  }
  
  if (loading || !Component) {
    return <>{fallback}</>;
  }
  
  return <Component {...props} />;
};

// 高级动态组件加载器
export const AdvancedDynamicComponent: React.FC<DynamicComponentProps> = ({
  name,
  remoteName,
  remoteUrl,
  fallback,
  props,
  onLoad,
  onError
}) => {
  const Component = React.useMemo(() => {
    if (!name) return null;
    
    return React.lazy(async () => {
      try {
        // 首先检查本地注册表
        let component = componentRegistry.getComponent(name);
        
        // 如果没有找到且提供了远程信息，尝试加载远程组件
        if (!component && remoteName && remoteUrl) {
          const moduleName = name.includes('/') ? name : `./${name}`;
          await componentRegistry.registerRemoteComponent(remoteName, moduleName, remoteUrl);
          component = componentRegistry.getComponent(`${remoteName}:${moduleName}`);
        }
        
        if (component) {
          onLoad?.(component);
          return { default: component };
        } else {
          throw new Error(`Component ${name} not found`);
        }
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    });
  }, [name, remoteName, remoteUrl, onLoad, onError]);
  
  if (!Component) {
    return <>{fallback}</>;
  }
  
  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};
```

## 🔄 状态管理集成

### 跨应用状态管理

```typescript
// shared/CrossAppStateManager.ts
export interface AppState {
  [key: string]: any;
}

export interface StateUpdate {
  key: string;
  value: any;
  timestamp: number;
  source: string;
}

export class CrossAppStateManager {
  private static instance: CrossAppStateManager;
  private state: AppState = {};
  private listeners: Map<string, Set<(value: any) => void>> = new Map();
  private middlewares: Array<(update: StateUpdate) => StateUpdate> = [];
  
  static getInstance(): CrossAppStateManager {
    if (!CrossAppStateManager.instance) {
      CrossAppStateManager.instance = new CrossAppStateManager();
    }
    return CrossAppStateManager.instance;
  }
  
  // 设置状态
  setState(key: string, value: any, source: string = 'unknown'): void {
    const update: StateUpdate = {
      key,
      value,
      timestamp: Date.now(),
      source
    };
    
    // 应用中间件
    const finalUpdate = this.middlewares.reduce(
      (acc, middleware) => middleware(acc),
      update
    );
    
    this.state[key] = finalUpdate.value;
    
    // 通知监听器
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(finalUpdate.value));
    }
    
    // 广播状态更新事件
    this.broadcastUpdate(finalUpdate);
  }
  
  // 获取状态
  getState(key: string): any {
    return this.state[key];
  }
  
  // 监听状态变化
  subscribe(key: string, callback: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(callback);
    
    // 返回取消订阅函数
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }
  
  // 添加中间件
  addMiddleware(middleware: (update: StateUpdate) => StateUpdate): void {
    this.middlewares.push(middleware);
  }
  
  // 广播状态更新
  private broadcastUpdate(update: StateUpdate): void {
    // 使用自定义事件进行跨应用通信
    const event = new CustomEvent('cross-app-state-update', {
      detail: update
    });
    window.dispatchEvent(event);
    
    // 使用 postMessage 进行跨 iframe 通信
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'CROSS_APP_STATE_UPDATE',
        payload: update
      }, '*');
    }
  }
  
  // 监听来自其他应用的状态更新
  setupCrossAppListener(): void {
    // 监听自定义事件
    window.addEventListener('cross-app-state-update', (event) => {
      const update = (event as CustomEvent).detail as StateUpdate;
      if (update.source !== this.getCurrentAppSource()) {
        this.setState(update.key, update.value, update.source);
      }
    });
    
    // 监听 postMessage
    window.addEventListener('message', (event) => {
      if (event.data.type === 'CROSS_APP_STATE_UPDATE') {
        const update = event.data.payload as StateUpdate;
        if (update.source !== this.getCurrentAppSource()) {
          this.setState(update.key, update.value, update.source);
        }
      }
    });
  }
  
  private getCurrentAppSource(): string {
    return window.location.pathname;
  }
  
  // 获取完整状态
  getFullState(): AppState {
    return { ...this.state };
  }
  
  // 清除状态
  clearState(key?: string): void {
    if (key) {
      delete this.state[key];
      this.listeners.delete(key);
    } else {
      this.state = {};
      this.listeners.clear();
    }
  }
}

// React Hook 用于跨应用状态管理
export const useCrossAppState = <T>(
  key: string,
  initialValue?: T
): [T, (value: T) => void] => {
  const stateManager = CrossAppStateManager.getInstance();
  const [state, setState] = React.useState<T>(() => {
    const currentValue = stateManager.getState(key);
    return currentValue !== undefined ? currentValue : initialValue;
  });
  
  React.useEffect(() => {
    const unsubscribe = stateManager.subscribe(key, setState);
    return unsubscribe;
  }, [key]);
  
  const setCrossAppState = React.useCallback((value: T) => {
    stateManager.setState(key, value, window.location.pathname);
  }, [key]);
  
  return [state, setCrossAppState];
};

// 共享状态 Context
export const CrossAppStateContext = React.createContext<{
  getState: (key: string) => any;
  setState: (key: string, value: any) => void;
  subscribe: (key: string, callback: (value: any) => void) => () => void;
}>({
  getState: () => undefined,
  setState: () => {},
  subscribe: () => () => {}
});

export const CrossAppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const stateManager = React.useMemo(() => CrossAppStateManager.getInstance(), []);
  
  const value = React.useMemo(() => ({
    getState: stateManager.getState.bind(stateManager),
    setState: stateManager.setState.bind(stateManager),
    subscribe: stateManager.subscribe.bind(stateManager)
  }), [stateManager]);
  
  return (
    <CrossAppStateContext.Provider value={value}>
      {children}
    </CrossAppStateContext.Provider>
  );
};
```

## 🛣️ 路由集成方案

### 微前端路由管理

```typescript
// shared/MicroFrontendRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

interface MicroRouteConfig {
  path: string;
  component: string;
  remoteName?: string;
  remoteUrl?: string;
  exact?: boolean;
  sensitive?: boolean;
  props?: Record<string, any>;
}

interface MicroFrontendRouterProps {
  routes: MicroRouteConfig[];
  basename?: string;
  NotFoundComponent?: React.ComponentType;
  LoadingComponent?: React.ComponentType;
}

export const MicroFrontendRouter: React.FC<MicroFrontendRouterProps> = ({
  routes,
  basename,
  NotFoundComponent = () => <div>404 Not Found</div>,
  LoadingComponent = () => <div>Loading...</div>
}) => {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        {routes.map((route, index) => (
          <Route
            key={index}
            path={route.path}
            exact={route.exact}
            sensitive={route.sensitive}
            element={
              <DynamicRoute
                componentName={route.component}
                remoteName={route.remoteName}
                remoteUrl={route.remoteUrl}
                props={route.props}
                LoadingComponent={LoadingComponent}
              />
            }
          />
        ))}
        <Route path="*" element={<NotFoundComponent />} />
      </Routes>
    </BrowserRouter>
  );
};

interface DynamicRouteProps {
  componentName: string;
  remoteName?: string;
  remoteUrl?: string;
  props?: Record<string, any>;
  LoadingComponent: React.ComponentType;
}

const DynamicRoute: React.FC<DynamicRouteProps> = ({
  componentName,
  remoteName,
  remoteUrl,
  props,
  LoadingComponent
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const routeProps = React.useMemo(() => ({
    location,
    navigate,
    ...props
  }), [location, navigate, props]);
  
  return (
    <DynamicComponentLoader
      name={componentName}
      remoteName={remoteName}
      remoteUrl={remoteUrl}
      fallback={<LoadingComponent />}
      props={routeProps}
    />
  );
};

// 路由事件监听器
export const useRouteEvents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  React.useEffect(() => {
    // 监听路由变化事件
    const handleRouteChange = (event: CustomEvent) => {
      const { path, state } = event.detail;
      navigate(path, { state });
    };
    
    window.addEventListener('micro-frontend-route-change', handleRouteChange as EventListener);
    
    return () => {
      window.removeEventListener('micro-frontend-route-change', handleRouteChange as EventListener);
    };
  }, [navigate]);
  
  // 触发路由变化
  const triggerRouteChange = React.useCallback((path: string, state?: any) => {
    navigate(path, { state });
    
    // 广播路由变化事件
    const event = new CustomEvent('micro-frontend-route-change', {
      detail: { path, state }
    });
    window.dispatchEvent(event);
  }, [navigate]);
  
  return { location, triggerRouteChange };
};

// 路由守卫
export interface RouteGuard {
  canActivate: () => Promise<boolean> | boolean;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<{
  guards: RouteGuard[];
  children: React.ReactNode;
}> = ({ guards, children }) => {
  const [authorized, setAuthorized] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const checkGuards = async () => {
      try {
        for (const guard of guards) {
          const canAccess = await guard.canActivate();
          if (!canAccess) {
            if (guard.fallbackPath) {
              window.location.href = guard.fallbackPath;
            }
            return;
          }
        }
        setAuthorized(true);
      } catch (error) {
        console.error('Route guard error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkGuards();
  }, [guards]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return authorized ? <>{children}</> : null;
};
```

## 🎨 样式隔离方案

### CSS 隔离和主题管理

```typescript
// shared/StyleManager.ts
export interface ThemeConfig {
  name: string;
  variables: Record<string, string>;
  components: Record<string, Record<string, string>>;
}

export class StyleManager {
  private static instance: StyleManager;
  private themes: Map<string, ThemeConfig> = new Map();
  private currentTheme: string = 'default';
  private shadowRoots: Set<ShadowRoot> = new Set();
  
  static getInstance(): StyleManager {
    if (!StyleManager.instance) {
      StyleManager.instance = new StyleManager();
    }
    return StyleManager.instance;
  }
  
  // 注册主题
  registerTheme(theme: ThemeConfig): void {
    this.themes.set(theme.name, theme);
  }
  
  // 切换主题
  setTheme(themeName: string): void {
    if (!this.themes.has(themeName)) {
      throw new Error(`Theme ${themeName} not found`);
    }
    
    this.currentTheme = themeName;
    this.applyTheme();
  }
  
  // 获取当前主题
  getCurrentTheme(): ThemeConfig {
    return this.themes.get(this.currentTheme)!;
  }
  
  // 应用主题
  private applyTheme(): void {
    const theme = this.getCurrentTheme();
    
    // 应用到主文档
    this.applyThemeToDocument(theme);
    
    // 应用到所有 Shadow DOM
    this.shadowRoots.forEach(shadowRoot => {
      this.applyThemeToShadowRoot(shadowRoot, theme);
    });
  }
  
  // 应用主题到文档
  private applyThemeToDocument(theme: ThemeConfig): void {
    const root = document.documentElement;
    
    // 清除现有的 CSS 变量
    root.style.removeProperty('--primary-color');
    root.style.removeProperty('--secondary-color');
    root.style.removeProperty('--background-color');
    root.style.removeProperty('--text-color');
    
    // 设置新的 CSS 变量
    Object.entries(theme.variables).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }
  
  // 应用主题到 Shadow DOM
  private applyThemeToShadowRoot(shadowRoot: ShadowRoot, theme: ThemeConfig): void {
    let styleElement = shadowRoot.querySelector('style[data-theme]') as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.setAttribute('data-theme', 'true');
      shadowRoot.appendChild(styleElement);
    }
    
    // 生成主题样式
    let css = ':host {';
    Object.entries(theme.variables).forEach(([key, value]) => {
      css += `--${key}: ${value};`;
    });
    css += '}';
    
    // 添加组件样式
    Object.entries(theme.components).forEach(([component, styles]) => {
      css += `:host ${component} {`;
      Object.entries(styles).forEach(([property, value]) => {
        css += `${property}: ${value};`;
      });
      css += '}';
    });
    
    styleElement.textContent = css;
  }
  
  // 创建样式隔离的容器
  createIsolatedContainer(
    element: HTMLElement,
    styles: string[] = []
  ): ShadowRoot {
    const shadowRoot = element.attachShadow({ mode: 'open' });
    this.shadowRoots.add(shadowRoot);
    
    // 添加基础样式
    const baseStyles = `
      :host {
        all: initial;
        display: block;
      }
      
      * {
        box-sizing: border-box;
      }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = baseStyles + styles.join('\n');
    shadowRoot.appendChild(styleElement);
    
    // 应用当前主题
    if (this.themes.has(this.currentTheme)) {
      this.applyThemeToShadowRoot(shadowRoot, this.getCurrentTheme());
    }
    
    return shadowRoot;
  }
  
  // 添加作用域样式
  addScopedStyle(shadowRoot: ShadowRoot, css: string): void {
    const styleElement = document.createElement('style');
    styleElement.textContent = css;
    shadowRoot.appendChild(styleElement);
  }
  
  // 移除 Shadow DOM
  removeShadowRoot(shadowRoot: ShadowRoot): void {
    this.shadowRoots.delete(shadowRoot);
  }
}

// 样式隔离的组件包装器
export const StyledComponentWrapper: React.FC<{
  children: React.ReactNode;
  styles?: string[];
  className?: string;
}> = ({ children, styles = [], className }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const styleManager = React.useMemo(() => StyleManager.getInstance(), []);
  
  React.useEffect(() => {
    if (containerRef.current) {
      const shadowRoot = styleManager.createIsolatedContainer(
        containerRef.current,
        styles
      );
      
      // 创建内容容器
      const contentContainer = document.createElement('div');
      if (className) {
        contentContainer.className = className;
      }
      
      shadowRoot.appendChild(contentContainer);
      
      // 渲染 React 子组件到 Shadow DOM
      const root = createRoot(contentContainer);
      root.render(children);
      
      return () => {
        root.unmount();
        styleManager.removeShadowRoot(shadowRoot);
      };
    }
  }, [children, styles, className, styleManager]);
  
  return <div ref={containerRef} />;
};

// 主题提供者
export const ThemeProvider: React.FC<{
  theme: string;
  children: React.ReactNode;
}> = ({ theme, children }) => {
  const styleManager = React.useMemo(() => StyleManager.getInstance(), []);
  
  React.useEffect(() => {
    styleManager.setTheme(theme);
  }, [theme, styleManager]);
  
  return <>{children}</>;
};
```

## 📡 事件通信系统

### 跨应用事件总线

```typescript
// shared/EventBus.ts
export interface EventPayload {
  type: string;
  data?: any;
  source: string;
  timestamp: number;
  id: string;
}

export type EventHandler = (payload: EventPayload) => void;

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private history: EventPayload[] = [];
  private maxHistorySize = 100;
  
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  // 发送事件
  emit(type: string, data?: any, source: string = 'unknown'): void {
    const payload: EventPayload = {
      type,
      data,
      source,
      timestamp: Date.now(),
      id: this.generateEventId()
    };
    
    // 添加到历史记录
    this.addToHistory(payload);
    
    // 触发本地处理器
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Event handler error for ${type}:`, error);
        }
      });
    }
    
    // 广播到其他应用
    this.broadcastEvent(payload);
  }
  
  // 监听事件
  on(type: string, handler: EventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    
    this.handlers.get(type)!.add(handler);
    
    // 返回取消监听函数
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(type);
        }
      }
    };
  }
  
  // 监听一次事件
  once(type: string, handler: EventHandler): () => void {
    const onceHandler: EventHandler = (payload) => {
      handler(payload);
      this.off(type, onceHandler);
    };
    
    return this.on(type, onceHandler);
  }
  
  // 取消监听
  off(type: string, handler: EventHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(type);
      }
    }
  }
  
  // 获取事件历史
  getHistory(type?: string): EventPayload[] {
    if (type) {
      return this.history.filter(event => event.type === type);
    }
    return [...this.history];
  }
  
  // 清除历史
  clearHistory(type?: string): void {
    if (type) {
      this.history = this.history.filter(event => event.type !== type);
    } else {
      this.history = [];
    }
  }
  
  // 添加到历史记录
  private addToHistory(payload: EventPayload): void {
    this.history.push(payload);
    
    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }
  
  // 广播事件到其他应用
  private broadcastEvent(payload: EventPayload): void {
    // 使用 CustomEvent
    const customEvent = new CustomEvent('micro-frontend-event', {
      detail: payload
    });
    window.dispatchEvent(customEvent);
    
    // 使用 postMessage (for iframe)
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'MICRO_FRONTEND_EVENT',
        payload
      }, '*');
    }
    
    // 使用 BroadcastChannel (for same-origin)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('micro-frontend-events');
        channel.postMessage(payload);
        channel.close();
      } catch (error) {
        // BroadcastChannel 可能不被支持
        console.warn('BroadcastChannel not supported:', error);
      }
    }
  }
  
  // 设置跨应用事件监听
  setupCrossAppListener(): void {
    // 监听 CustomEvent
    window.addEventListener('micro-frontend-event', (event) => {
      const payload = (event as CustomEvent).detail as EventPayload;
      if (payload.source !== this.getCurrentSource()) {
        this.emit(payload.type, payload.data, payload.source);
      }
    });
    
    // 监听 postMessage
    window.addEventListener('message', (event) => {
      if (event.data.type === 'MICRO_FRONTEND_EVENT') {
        const payload = event.data.payload as EventPayload;
        if (payload.source !== this.getCurrentSource()) {
          this.emit(payload.type, payload.data, payload.source);
        }
      }
    });
    
    // 监听 BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('micro-frontend-events');
        channel.addEventListener('message', (event) => {
          const payload = event.data as EventPayload;
          if (payload.source !== this.getCurrentSource()) {
            this.emit(payload.type, payload.data, payload.source);
          }
        });
      } catch (error) {
        console.warn('BroadcastChannel not supported:', error);
      }
    }
  }
  
  private getCurrentSource(): string {
    return window.location.pathname;
  }
  
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// React Hook for event bus
export const useEventBus = () => {
  const eventBus = React.useMemo(() => EventBus.getInstance(), []);
  
  const emit = React.useCallback((type: string, data?: any) => {
    eventBus.emit(type, data, window.location.pathname);
  }, [eventBus]);
  
  const on = React.useCallback((type: string, handler: EventHandler) => {
    return eventBus.on(type, handler);
  }, [eventBus]);
  
  const once = React.useCallback((type: string, handler: EventHandler) => {
    return eventBus.once(type, handler);
  }, [eventBus]);
  
  const off = React.useCallback((type: string, handler: EventHandler) => {
    eventBus.off(type, handler);
  }, [eventBus]);
  
  return { emit, on, once, off };
};

// 事件提供者 Context
export const EventBusContext = React.createContext<{
  emit: (type: string, data?: any) => void;
  on: (type: string, handler: EventHandler) => () => void;
  once: (type: string, handler: EventHandler) => () => void;
  off: (type: string, handler: EventHandler) => void;
}>({
  emit: () => {},
  on: () => () => {},
  once: () => () => {},
  off: () => {}
});

export const EventBusProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const eventBus = React.useMemo(() => EventBus.getInstance(), []);
  
  const value = React.useMemo(() => ({
    emit: eventBus.emit.bind(eventBus),
    on: eventBus.on.bind(eventBus),
    once: eventBus.once.bind(eventBus),
    off: eventBus.off.bind(eventBus)
  }), [eventBus]);
  
  return (
    <EventBusContext.Provider value={value}>
      {children}
    </EventBusContext.Provider>
  );
};
```

## 🚀 微前端容器

### 主应用容器组件

```typescript
// containers/MicroFrontendContainer.tsx
import React, { Suspense } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { DynamicComponentLoader } from '../shared/DynamicComponentLoader';
import { StyleManager } from '../shared/StyleManager';
import { EventBus } from '../shared/EventBus';

interface MicroAppConfig {
  name: string;
  entry: string;
  basePath: string;
  routes: Array<{
    path: string;
    component: string;
  }>;
  styles?: string[];
  dependencies?: Record<string, string>;
}

interface MicroFrontendContainerProps {
  config: MicroAppConfig;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType;
  props?: Record<string, any>;
}

export const MicroFrontendContainer: React.FC<MicroFrontendContainerProps> = ({
  config,
  loadingComponent: LoadingComponent = () => <div>Loading...</div>,
  errorComponent: ErrorComponent = () => <div>Error loading application</div>,
  props = {}
}) => {
  const styleManager = React.useMemo(() => StyleManager.getInstance(), []);
  const eventBus = React.useMemo(() => EventBus.getInstance(), []);
  
  React.useEffect(() => {
    // 预加载样式
    if (config.styles) {
      config.styles.forEach(styleUrl => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = styleUrl;
        document.head.appendChild(link);
      });
    }
    
    // 设置跨应用事件监听
    eventBus.setupCrossAppListener();
    
    return () => {
      // 清理资源
      if (config.styles) {
        config.styles.forEach(styleUrl => {
          const links = document.querySelectorAll(`link[href="${styleUrl}"]`);
          links.forEach(link => link.remove());
        });
      }
    };
  }, [config.styles, eventBus]);
  
  return (
    <ErrorBoundary
      fallback={<ErrorComponent />}
      onError={(error, errorInfo) => {
        console.error(`MicroApp ${config.name} error:`, error, errorInfo);
        eventBus.emit('micro-app-error', {
          appName: config.name,
          error: error.message,
          errorInfo
        });
      }}
    >
      <Suspense fallback={<LoadingComponent />}>
        <DynamicComponentLoader
          name={`${config.name}/App`}
          remoteName={config.name}
          remoteUrl={config.entry}
          fallback={<LoadingComponent />}
          props={{
            ...props,
            basePath: config.basePath,
            routes: config.routes,
            microAppName: config.name
          }}
          onLoad={(component) => {
            eventBus.emit('micro-app-loaded', {
              appName: config.name,
              component: component.name || 'App'
            });
          }}
          onError={(error) => {
            eventBus.emit('micro-app-error', {
              appName: config.name,
              error: error.message
            });
          }}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

// 微前端管理器
export class MicroFrontendManager {
  private static instance: MicroFrontendManager;
  private apps: Map<string, MicroAppConfig> = new Map();
  private loadedApps: Set<string> = new Set();
  
  static getInstance(): MicroFrontendManager {
    if (!MicroFrontendManager.instance) {
      MicroFrontendManager.instance = new MicroFrontendManager();
    }
    return MicroFrontendManager.instance;
  }
  
  // 注册微应用
  registerApp(config: MicroAppConfig): void {
    this.apps.set(config.name, config);
  }
  
  // 获取应用配置
  getAppConfig(name: string): MicroAppConfig | undefined {
    return this.apps.get(name);
  }
  
  // 获取所有应用
  getAllApps(): MicroAppConfig[] {
    return Array.from(this.apps.values());
  }
  
  // 加载应用
  async loadApp(name: string): Promise<void> {
    const config = this.apps.get(name);
    if (!config) {
      throw new Error(`App ${name} not found`);
    }
    
    if (this.loadedApps.has(name)) {
      return;
    }
    
    // 预加载应用入口
    await this.loadAppEntry(config.entry);
    this.loadedApps.add(name);
  }
  
  // 卸载应用
  unloadApp(name: string): void {
    this.loadedApps.delete(name);
  }
  
  // 检查应用是否已加载
  isAppLoaded(name: string): boolean {
    return this.loadedApps.has(name);
  }
  
  private async loadAppEntry(entry: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = entry;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}

// 主应用布局
export const MainLayout: React.FC<{
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
}> = ({ children, header, sidebar }) => {
  return (
    <div className="main-layout">
      {header && <header className="main-header">{header}</header>}
      <div className="main-content">
        {sidebar && <aside className="main-sidebar">{sidebar}</aside>}
        <main className="main-body">
          {children}
        </main>
      </div>
    </div>
  );
};
```

## 📋 总结

完整的微前端架构支持提供了：

1. **模块联邦**：通过 Webpack Module Federation 实现组件共享
2. **动态加载**：支持远程组件的动态加载和缓存
3. **状态管理**：跨应用的状态同步和事件通信
4. **路由集成**：统一的路由管理和路由守卫
5. **样式隔离**：CSS 隔离和主题管理
6. **事件通信**：跨应用的事件总线系统
7. **容器管理**：微应用的生命周期管理

这套微前端架构方案为构建大型、可扩展的 React 应用提供了完整的解决方案。

---

*文档版本：1.0.0*  
*最后更新：2024年*