# SSR 和 Next.js 适配指南

## 📋 概述

本指南提供了在服务端渲染（SSR）和 Next.js 环境中使用 React 18.3.1 组件的最佳实践，确保组件在客户端和服务端都能正常工作。

## 🎯 SSR 基础概念

### 1. SSR 挑战和解决方案

#### 主要挑战
- **水合错误** - 客户端和服务端渲染内容不匹配
- **生命周期差异** - 服务端没有 `useEffect` 和 `useLayoutEffect`
- **API 访问限制** - 服务端无法访问浏览器 API
- **数据同步** - 客户端和服务端状态同步

#### 解决方案策略
```tsx
// ✅ 基础 SSR 安全组件
const SSRSafeComponent: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <div>Loading...</div>;
  }
  
  return <ClientOnlyContent />;
};
```

## 🚀 Next.js 集成最佳实践

### 1. Next.js 页面组件

#### 基础页面组件

```tsx
// ✅ pages/index.tsx - 基础页面组件
import React, { useState, useEffect } from 'react';
import { GetStaticProps, GetServerSideProps } from 'next';
import Head from 'next/head';

interface HomePageProps {
  initialData?: any;
  serverTime?: string;
}

const HomePage: React.FC<HomePageProps> = ({ initialData, serverTime }) => {
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [clientTime, setClientTime] = useState<string>('');

  useEffect(() => {
    // 客户端时间获取
    setClientTime(new Date().toISOString());
    
    // 如果没有初始数据，在客户端获取
    if (!initialData) {
      fetchData();
    }
  }, [initialData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Head>
        <title>Next.js SSR Demo</title>
        <meta name="description" content="Next.js SSR 最佳实践演示" />
      </Head>

      <main>
        <h1>Next.js SSR 演示</h1>
        
        <div className="time-info">
          <p>服务端时间: {serverTime || 'N/A'}</p>
          <p>客户端时间: {clientTime || 'N/A'}</p>
        </div>

        <div className="data-section">
          <h2>数据展示</h2>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <pre>{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      </main>
    </div>
  );
};

// 静态生成
export const getStaticProps: GetStaticProps = async () => {
  try {
    // 在构建时获取数据
    const response = await fetch('https://api.example.com/data');
    const initialData = await response.json();
    
    return {
      props: {
        initialData,
        serverTime: new Date().toISOString(),
      },
      revalidate: 60, // 每60秒重新生成
    };
  } catch (error) {
    return {
      props: {
        serverTime: new Date().toISOString(),
      },
    };
  }
};

// 服务端渲染
// export const getServerSideProps: GetServerSideProps = async (context) => {
//   try {
//     const response = await fetch('https://api.example.com/data');
//     const initialData = await response.json();
//     
//     return {
//       props: {
//         initialData,
//         serverTime: new Date().toISOString(),
//       },
//     };
//   } catch (error) {
//     return {
//       props: {
//         serverTime: new Date().toISOString(),
//       },
//     };
//   }
// };

export default HomePage;
```

### 2. 数据获取策略

#### 多种数据获取方式

```tsx
// ✅ lib/data.ts - 数据获取工具
import { GetStaticProps, GetServerSideProps } from 'next';

// 静态生成数据获取
export const getStaticData = async <T>(
  apiUrl: string,
  revalidate?: number
): Promise<{ props: { data: T | null; error?: string } }> => {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    return {
      props: {
        data,
      },
      ...(revalidate && { revalidate }),
    };
  } catch (error) {
    console.error('Static data fetch error:', error);
    return {
      props: {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
};

// 服务端渲染数据获取
export const getServerSideData = async <T>(
  apiUrl: string,
  context?: any
): Promise<{ props: { data: T | null; error?: string } }> => {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    return {
      props: {
        data,
      },
    };
  } catch (error) {
    console.error('Server-side data fetch error:', error);
    return {
      props: {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
};

// 客户端数据获取 Hook
export const useClientData = <T,>(apiUrl: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);

  return { data, loading, error };
};
```

#### 使用示例

```tsx
// ✅ pages/posts/[id].tsx - 动态路由页面
import React from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useClientData } from '@/lib/data';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  publishedAt: string;
}

interface PostPageProps {
  post?: Post;
  error?: string;
}

const PostPage: React.FC<PostPageProps> = ({ post, error }) => {
  const router = useRouter();
  const { id } = router.query;
  
  // 如果静态生成失败，在客户端获取数据
  const { data: clientPost, loading, error: clientError } = useClientData<Post>(
    post ? '' : `/api/posts/${id}`
  );

  const displayPost = post || clientPost;
  const displayError = error || clientError;

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  if (displayError) {
    return (
      <div>
        <h1>错误</h1>
        <p>{displayError}</p>
      </div>
    );
  }

  if (!displayPost) {
    return <div>Post not found</div>;
  }

  return (
    <div>
      <Head>
        <title>{displayPost.title}</title>
        <meta name="description" content={displayPost.content.substring(0, 150)} />
      </Head>

      <article>
        <h1>{displayPost.title}</h1>
        <div className="post-meta">
          <span>作者: {displayPost.author}</span>
          <span>发布时间: {new Date(displayPost.publishedAt).toLocaleDateString()}</span>
        </div>
        <div className="post-content">
          {displayPost.content}
        </div>
      </article>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const response = await fetch('https://api.example.com/posts');
    const posts = await response.json();
    
    const paths = posts.map((post: Post) => ({
      params: { id: post.id },
    }));

    return {
      paths,
      fallback: true, // 启用 ISR
    };
  } catch (error) {
    console.error('Error generating paths:', error);
    return {
      paths: [],
      fallback: true,
    };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const response = await fetch(`https://api.example.com/posts/${params.id}`);
    const post = await response.json();
    
    return {
      props: {
        post,
      },
      revalidate: 60, // 每60秒重新生成
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return {
      props: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
};

export default PostPage;
```

## 🏗️ SSR 安全组件模式

### 1. 客户端专用组件

#### 浏览器 API 访问

```tsx
// ✅ components/BrowserOnly.tsx - 客户端专用组件
import React, { useState, useEffect } from 'react';

interface BrowserOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const BrowserOnly: React.FC<BrowserOnlyProps> = ({ 
  children, 
  fallback = <div>Loading...</div> 
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default BrowserOnly;

// 使用示例
const LocalStorageComponent: React.FC = () => {
  const [storedValue, setStoredValue] = useState<string>('');

  return (
    <BrowserOnly fallback={<div>Loading browser features...</div>}>
      <LocalStorageContent onValueChange={setStoredValue} />
      <div>Stored value: {storedValue}</div>
    </BrowserOnly>
  );
};

const LocalStorageContent: React.FC<{
  onValueChange: (value: string) => void;
}> = ({ onValueChange }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    // 只在客户端执行
    const stored = localStorage.getItem('myValue');
    if (stored) {
      setValue(stored);
      onValueChange(stored);
    }
  }, [onValueChange]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    localStorage.setItem('myValue', newValue);
    onValueChange(newValue);
  };

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Enter value to store"
      />
    </div>
  );
};
```

#### 窗口和文档访问

```tsx
// ✅ hooks/useWindowSize.ts - 窗口大小 Hook
import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

const useWindowSize = (): WindowSize => {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 初始化

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

export default useWindowSize;

// 使用示例
const ResponsiveComponent: React.FC = () => {
  const { width, height } = useWindowSize();

  return (
    <div>
      <h3>窗口尺寸</h3>
      <p>宽度: {width}px</p>
      <p>高度: {height}px</p>
      
      {width < 768 ? (
        <div>移动端视图</div>
      ) : width < 1024 ? (
        <div>平板端视图</div>
      ) : (
        <div>桌面端视图</div>
      )}
    </div>
  );
};
```

### 2. 高级 SSR 安全组件

#### 动态导入组件

```tsx
// ✅ components/DynamicComponent.tsx - 动态导入组件
import dynamic from 'next/dynamic';
import React from 'react';

interface DynamicComponentProps {
  componentName: string;
  props?: Record<string, any>;
  loading?: React.ReactNode;
  error?: React.ReactNode;
}

// 支持的组件映射
const componentMap = {
  Chart: () => import('./Chart'),
  Map: () => import('./Map'),
  Editor: () => import('./Editor'),
};

const DynamicComponent: React.FC<DynamicComponentProps> = ({
  componentName,
  props = {},
  loading = <div>Loading component...</div>,
  error = <div>Failed to load component</div>,
}) => {
  const DynamicComp = dynamic(
    () => {
      const componentLoader = componentMap[componentName as keyof typeof componentMap];
      if (!componentLoader) {
        throw new Error(`Component ${componentName} not found`);
      }
      return componentLoader();
    },
    {
      loading: () => loading,
      ssr: false, // 禁用服务端渲染
    }
  );

  return (
    <div className="dynamic-component">
      <DynamicComp {...props} />
    </div>
  );
};

export default DynamicComponent;

// 使用示例
const PageWithDynamicComponents: React.FC = () => {
  return (
    <div>
      <h1>动态组件演示</h1>
      
      <DynamicComponent
        componentName="Chart"
        props={{ data: [1, 2, 3, 4, 5] }}
      />
      
      <DynamicComponent
        componentName="Map"
        props={{ center: [0, 0], zoom: 10 }}
      />
    </div>
  );
};
```

#### 条件渲染组件

```tsx
// ✅ components/SSRSafe.tsx - SSR 安全的条件渲染组件
import React, { useState, useEffect } from 'react';

interface SSRSafeProps {
  children: React.ReactNode;
  condition?: boolean;
  fallback?: React.ReactNode;
  clientOnly?: boolean;
}

const SSRSafe: React.FC<SSRSafeProps> = ({
  children,
  condition = true,
  fallback = null,
  clientOnly = false,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCanRender(true);
  }, []);

  // 服务端渲染逻辑
  if (!isClient) {
    if (clientOnly) {
      return <>{fallback}</>;
    }
    return condition ? <>{children}</> : <>{fallback}</>;
  }

  // 客户端渲染逻辑
  if (!canRender || !condition) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default SSRSafe;

// 使用示例
const FeatureFlagComponent: React.FC = () => {
  const [featureEnabled, setFeatureEnabled] = useState(false);

  return (
    <div>
      <SSRSafe 
        condition={featureEnabled}
        fallback={<div>功能未启用</div>}
        clientOnly={true}
      >
        <AdvancedFeature />
      </SSRSafe>
      
      <button onClick={() => setFeatureEnabled(!featureEnabled)}>
        {featureEnabled ? '禁用功能' : '启用功能'}
      </button>
    </div>
  );
};
```

## 🔄 数据同步和状态管理

### 1. SSR 友好的状态管理

#### Context Provider 配置

```tsx
// ✅ contexts/AppContext.tsx - SSR 友好的 Context
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppState {
  user: any | null;
  theme: 'light' | 'dark';
  locale: string;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Partial<AppState>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
  initialState?: AppState;
}

const AppProvider: React.FC<AppProviderProps> = ({ 
  children, 
  initialState = {
    user: null,
    theme: 'light',
    locale: 'zh-CN',
  }
}) => {
  const [state, setState] = useState<AppState>(initialState);

  const dispatch = (update: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...update }));
  };

  // 客户端初始化
  useEffect(() => {
    // 从本地存储恢复状态
    const savedTheme = localStorage.getItem('theme');
    const savedLocale = localStorage.getItem('locale');
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      dispatch({ theme: savedTheme });
    }
    
    if (savedLocale) {
      dispatch({ locale: savedLocale });
    }
  }, []);

  // 保存状态到本地存储
  useEffect(() => {
    localStorage.setItem('theme', state.theme);
    localStorage.setItem('locale', state.locale);
  }, [state.theme, state.locale]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export { AppProvider, useAppContext, AppContext };
```

#### Redux 集成

```tsx
// ✅ store/index.ts - SSR 友好的 Redux 配置
import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import rootReducer from './reducers';

// 创建 store
const makeStore = () => configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

// 创建 Redux wrapper
export const wrapper = createWrapper<AppStore>(makeStore, {
  debug: process.env.NODE_ENV === 'development',
});

// 页面中使用 Redux
// import { wrapper } from '@/store';
// import { useAppDispatch, useAppSelector } from '@/hooks/redux';

// export const getServerSideProps = wrapper.getServerSideProps(
//   (store) => async (context) => {
//     // 在服务端预加载数据
//     await store.dispatch(fetchUserData(context.params.id));
//     return {
//       props: {},
//     };
//   }
// );
```

### 2. 水合错误处理

#### 防止水合不匹配

```tsx
// ✅ components/HydrationSafe.tsx - 水合安全组件
import React, { useState, useEffect } from 'react';

interface HydrationSafeProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  suppressHydrationWarning?: boolean;
}

const HydrationSafe: React.FC<HydrationSafeProps> = ({
  children,
  fallback = <div>Loading...</div>,
  suppressHydrationWarning = false,
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{fallback}</>;
  }

  return (
    <div suppressHydrationWarning={suppressHydrationWarning}>
      {children}
    </div>
  );
};

export default HydrationSafe;

// 使用示例
const SafeCounter: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <HydrationSafe suppressHydrationWarning={true}>
      <div>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>
          Increment
        </button>
      </div>
    </HydrationSafe>
  );
};
```

#### 动态内容水合处理

```tsx
// ✅ components/DynamicContent.tsx - 动态内容水合处理
import React, { useState, useEffect } from 'react';

interface DynamicContentProps {
  content: string;
  fallback?: React.ReactNode;
}

const DynamicContent: React.FC<DynamicContentProps> = ({
  content,
  fallback = <div>Loading content...</div>,
}) => {
  const [hydratedContent, setHydratedContent] = useState(content);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // 客户端水合完成后，可以更新动态内容
    setHydratedContent(content);
    setIsHydrated(true);
  }, [content]);

  if (!isHydrated) {
    return <>{fallback}</>;
  }

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: hydratedContent }}
      suppressHydrationWarning={true}
    />
  );
};

export default DynamicContent;
```

## 📱 移动端和 PWA 支持

### 1. 响应式设计

#### 移动端适配

```tsx
// ✅ components/Responsive.tsx - 响应式组件
import React from 'react';
import useWindowSize from '@/hooks/useWindowSize';

interface ResponsiveProps {
  children: React.ReactNode;
  mobile?: React.ReactNode;
  tablet?: React.ReactNode;
  desktop?: React.ReactNode;
}

const Responsive: React.FC<ResponsiveProps> = ({
  children,
  mobile,
  tablet,
  desktop,
}) => {
  const { width } = useWindowSize();

  const getDeviceType = () => {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  const deviceType = getDeviceType();

  return (
    <>
      {mobile && deviceType === 'mobile' && mobile}
      {tablet && deviceType === 'tablet' && tablet}
      {desktop && deviceType === 'desktop' && desktop}
      {children}
    </>
  );
};

export default Responsive;

// 使用示例
const ResponsiveLayout: React.FC = () => {
  return (
    <Responsive
      mobile={<MobileNavigation />}
      tablet={<TabletNavigation />}
      desktop={<DesktopNavigation />}
    >
      <MainContent />
    </Responsive>
  );
};
```

### 2. PWA 配置

#### Service Worker 注册

```tsx
// ✅ components/PWAProvider.tsx - PWA 提供者
import React, { useEffect } from 'react';

const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return <>{children}</>;
};

export default PWAProvider;

// 在 _app.tsx 中使用
// import PWAProvider from '@/components/PWAProvider';

// function MyApp({ Component, pageProps }: AppProps) {
//   return (
//     <PWAProvider>
//       <Component {...pageProps} />
//     </PWAProvider>
//   );
// }
```

## 🚀 性能优化

### 1. 图片优化

#### Next.js 图片组件

```tsx
// ✅ components/OptimizedImage.tsx - 优化图片组件
import React from 'react';
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  layout?: 'fixed' | 'responsive' | 'intrinsic';
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 800,
  height = 600,
  layout = 'responsive',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="optimized-image-container">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        layout={layout}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => setError(true)}
        className={`optimized-image ${isLoading ? 'loading' : ''} ${error ? 'error' : ''}`}
      />
      
      {isLoading && (
        <div className="image-loading-placeholder">
          <div className="loading-spinner" />
        </div>
      )}
      
      {error && (
        <div className="image-error-placeholder">
          <span>图片加载失败</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
```

### 2. 字体优化

#### 字体预加载

```tsx
// ✅ pages/_document.tsx - 字体优化
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* 预加载关键字体 */}
          <link
            rel="preload"
            href="/fonts/custom-font.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
          
          {/* 预连接到字体服务 */}
          <link
            rel="preconnect"
            href="https://fonts.googleapis.com"
            crossOrigin="anonymous"
          />
          
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
```

## 📊 性能优化

### 1. Web Vitals 优化

#### 性能指标收集

```tsx
// ✅ components/WebVitals.tsx - Web Vitals 收集组件
import React, { useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const WebVitals: React.FC = () => {
  useEffect(() => {
    const logMetric = (metric: any) => {
      // 开发环境下记录性能指标
      if (process.env.NODE_ENV === 'development') {
        console.log('Web Vital:', metric);
      }
      
      // 示例：发送到 Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', metric.name, {
          value: Math.round(metric.value),
          metric_rating: metric.rating,
        });
      }
    };

    // 监控核心 Web Vitals
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  }, []);

  return null; // 这个组件不渲染任何内容
};

export default PerformanceMonitor;

// 在 _app.tsx 中使用
// import PerformanceMonitor from '@/components/PerformanceMonitor';

// function MyApp({ Component, pageProps }: AppProps) {
//   return (
//     <>
//       <PerformanceMonitor />
//       <Component {...pageProps} />
//     </>
//   );
// }
```

### 2. 错误监控

#### Sentry 集成

```tsx
// ✅ utils/sentry.ts - Sentry 配置
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

export const captureException = (error: Error, context?: any) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};
```

## 🎯 最佳实践总结

### 1. 关键原则

1. **数据获取策略** - 根据场景选择 SSG、SSR 或 CSR
2. **水合安全** - 确保客户端和服务端渲染内容一致
3. **性能优化** - 利用 Next.js 的优化特性
4. **错误处理** - 完善的错误边界和监控
5. **移动端适配** - 响应式设计和 PWA 支持

### 2. 检查清单

- [ ] 使用正确的数据获取策略（SSG/SSR/CSR）
- [ ] 处理浏览器 API 的客户端专用逻辑
- [ ] 防止水合不匹配错误
- [ ] 优化图片和字体加载
- [ ] 实现性能优化
- [ ] 配置错误监控
- [ ] 支持移动端和 PWA
- [ ] 实现响应式设计

通过遵循这些最佳实践，你可以构建出高性能、用户友好的 Next.js 应用。

---

*最后更新：2024年*