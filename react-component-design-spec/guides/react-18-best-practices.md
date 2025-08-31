# React 18 最佳实践指南

## 📋 概述

本指南基于 React 18.3.1 版本，提供了在实际项目中使用 React 18 新特性的最佳实践。

## 🚀 并发特性 (Concurrent Features)

### 1. useTransition - 优化非紧急更新

#### 适用场景
- 大数据列表过滤
- 搜索输入处理
- 复杂计算渲染
- 动画和过渡效果

#### 最佳实践示例

```tsx
// ✅ 最佳实践：大数据过滤组件
const DataFilter: React.FC<{ data: Item[] }> = ({ data }) => {
  const [filter, setFilter] = useState('');
  const [isPending, startTransition] = useTransition();
  
  // 使用 useMemo 缓存过滤结果
  const filteredData = useMemo(() => {
    if (!filter) return data;
    
    return data.filter(item => 
      item.name.toLowerCase().includes(filter.toLowerCase()) ||
      item.category.toLowerCase().includes(filter.toLowerCase())
    );
  }, [data, filter]);
  
  const handleFilterChange = (value: string) => {
    // 将过滤操作标记为非紧急更新
    startTransition(() => {
      setFilter(value);
    });
  };
  
  return (
    <div className="data-filter">
      <div className="filter-header">
        <input
          type="text"
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value)}
          placeholder="搜索数据..."
          className="filter-input"
        />
        {isPending && (
          <span className="filter-loading">
            <Spinner size="sm" />
            正在过滤...
          </span>
        )}
      </div>
      
      <div className="filter-results">
        <DataList 
          data={filteredData} 
          isLoading={isPending}
        />
      </div>
    </div>
  );
};
```

#### 性能优化技巧

```tsx
// ✅ 优化：结合 useMemo 和 useTransition
const OptimizedSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  
  // 延迟查询值以提升性能
  const deferredQuery = useDeferredValue(query);
  
  // 执行昂贵的搜索操作
  const searchResults = useMemo(() => {
    if (!deferredQuery.trim()) return [];
    
    // 模拟昂贵的搜索操作
    return performExpensiveSearch(deferredQuery);
  }, [deferredQuery]);
  
  const handleSearch = (value: string) => {
    setQuery(value);
    startTransition(() => {
      // 这里可以放置额外的非紧急更新
    });
  };
  
  return (
    <div className="search-container">
      <SearchInput
        value={query}
        onChange={handleSearch}
        isLoading={isPending}
      />
      <SearchResults 
        results={searchResults} 
        isStale={query !== deferredQuery}
      />
    </div>
  );
};
```

### 2. useDeferredValue - 延迟状态更新

#### 适用场景
- 搜索输入处理
- 实时表单验证
- 频繁的状态更新
- 防抖操作

#### 最佳实践示例

```tsx
// ✅ 最佳实践：实时搜索组件
const LiveSearch: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const deferredValue = useDeferredValue(inputValue);
  const [isPending, startTransition] = useTransition();
  
  // 使用延迟值执行搜索
  const searchResults = useMemo(() => {
    return searchAPI(deferredValue);
  }, [deferredValue]);
  
  const handleChange = (value: string) => {
    setInputValue(value);
    // 标记为非紧急更新
    startTransition(() => {
      // 这里可以放置其他非紧急更新
    });
  };
  
  const isStale = inputValue !== deferredValue;
  
  return (
    <div className="live-search">
      <SearchInput
        value={inputValue}
        onChange={handleChange}
        isLoading={isPending}
      />
      {isPending && <div className="search-loading">搜索中...</div>}
      <SearchResults 
        results={searchResults} 
        isStale={isStale}
      />
    </div>
  );
};
```

### 3. 自动批处理 (Automatic Batching)

#### React 18 的自动批处理特性

```tsx
// ✅ React 18 会自动批处理这些状态更新
const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  
  const loadUserData = async (userId: string) => {
    setLoading(true);
    
    // 这些 API 调用
    const [userData, userPosts] = await Promise.all([
      fetchUser(userId),
      fetchUserPosts(userId)
    ]);
    
    // React 18 会自动批处理这些状态更新
    setUser(userData);
    setPosts(userPosts);
    setLoading(false);
  };
  
  return (
    <div>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <UserInfo user={user} />
          <PostList posts={posts} />
        </>
      )}
    </div>
  );
};
```

#### 在事件处理程序中的批处理

```tsx
// ✅ 事件处理程序中的自动批处理
const FormComponent: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    preferences: {}
  });
  
  const handleFieldChange = (field: string, value: string) => {
    // 这些更新会被自动批处理
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = async () => {
    try {
      await submitForm(formData);
      // 成功提交后的状态更新也会被批处理
      setFormData({ username: '', email: '', preferences: {} });
      showSuccessMessage();
    } catch (error) {
      showErrorMessage(error.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label="用户名"
        value={formData.username}
        onChange={(value) => handleFieldChange('username', value)}
      />
      <FormField
        label="邮箱"
        value={formData.email}
        onChange={(value) => handleFieldChange('email', value)}
      />
    </form>
  );
};
```

## 🎯 Suspense 和数据获取

### 1. Suspense 基础使用

#### 基本 Suspense 组件

```tsx
// ✅ 基本的 Suspense 使用
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  return (
    <Suspense fallback={<UserProfileSkeleton />}>
      <UserProfileContent userId={userId} />
    </Suspense>
  );
};

// 异步组件
const UserProfileContent: React.FC<{ userId: string }> = async ({ userId }) => {
  const user = await fetchUser(userId);
  const posts = await fetchUserPosts(userId);
  
  return (
    <div className="user-profile">
      <UserInfo user={user} />
      <UserPosts posts={posts} />
    </div>
  );
};
```

#### 多个 Suspense 边界

```tsx
// ✅ 多个 Suspense 边界提供更好的用户体验
const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeader />
      </Suspense>
      
      <div className="dashboard-content">
        <Suspense fallback={<MainContentSkeleton />}>
          <DashboardMain />
        </Suspense>
        
        <Suspense fallback={<SidebarSkeleton />}>
          <DashboardSidebar />
        </Suspense>
      </div>
    </div>
  );
};
```

### 2. Suspense 友好的数据获取

#### 创建自定义数据获取 Hook

```tsx
// ✅ 支持 Suspense 的数据获取 Hook
const useSuspenseFetch = <T,>(
  url: string,
  options?: RequestInit
): T => {
  const [data, setData] = useState<T | null>(null);
  const [promise, setPromise] = useState<Promise<T> | null>(null);
  
  if (!promise) {
    const fetchPromise = fetch(url, options)
      .then(res => res.json())
      .then(data => {
        setData(data);
        return data;
      });
    
    setPromise(fetchPromise);
    throw fetchPromise; // 抛出 Promise 让 Suspense 捕获
  }
  
  if (!data) {
    throw promise; // 继续抛出直到数据准备好
  }
  
  return data;
};

// 使用示例
const UserData: React.FC<{ userId: string }> = ({ userId }) => {
  const user = useSuspenseFetch<User>(`/api/users/${userId}`);
  
  return (
    <div className="user-data">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};
```

#### 错误边界与 Suspense

```tsx
// ✅ 结合错误边界的 Suspense
const ErrorBoundarySuspense: React.FC<{
  fallback: React.ReactNode;
  errorFallback: React.ReactNode;
  children: React.ReactNode;
}> = ({ fallback, errorFallback, children }) => {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// 使用示例
const SafeUserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  return (
    <ErrorBoundarySuspense
      fallback={<UserProfileSkeleton />}
      errorFallback={<UserProfileError />}
    >
      <UserProfileContent userId={userId} />
    </ErrorBoundarySuspense>
  );
};
```

### 3. SuspenseList 协调多个 Suspense

```tsx
// ✅ 使用 SuspenseList 协调多个 Suspense
const CommentSection: React.FC<{ postId: string }> = ({ postId }) => {
  return (
    <SuspenseList revealOrder="forwards" tail="hidden">
      <Suspense fallback={<CommentHeaderSkeleton />}>
        <CommentHeader postId={postId} />
      </Suspense>
      
      <Suspense fallback={<CommentListSkeleton />}>
        <CommentList postId={postId} />
      </Suspense>
      
      <Suspense fallback={<CommentFormSkeleton />}>
        <CommentForm postId={postId} />
      </Suspense>
    </SuspenseList>
  );
};
```

## 🔧 新的 Hooks 最佳实践

### 1. useId - 生成唯一ID

#### 基础使用

```tsx
// ✅ 使用 useId 生成可访问性ID
const FormField: React.FC<{
  label: string;
  error?: string;
  children: React.ReactElement;
}> = ({ label, error, children }) => {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  
  return (
    <div className="form-field">
      <label 
        htmlFor={id}
        className="form-field__label"
      >
        {label}
      </label>
      
      {React.cloneElement(children, {
        id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': errorId,
      })}
      
      {error && (
        <div 
          id={errorId}
          className="form-field__error"
        >
          {error}
        </div>
      )}
    </div>
  );
};
```

#### 复杂组件中的使用

```tsx
// ✅ 复杂组件中的 useId 使用
const Accordion: React.FC<{
  items: Array<{ title: string; content: React.ReactNode }>;
}> = ({ items }) => {
  const accordionId = useId();
  
  return (
    <div className="accordion" role="tablist">
      {items.map((item, index) => {
        const itemId = `${accordionId}-${index}`;
        const panelId = `${itemId}-panel`;
        
        return (
          <AccordionItem
            key={index}
            id={itemId}
            panelId={panelId}
            title={item.title}
          >
            {item.content}
          </AccordionItem>
        );
      })}
    </div>
  );
};
```

### 2. useSyncExternalStore - 订阅外部状态

#### 基础实现

```tsx
// ✅ 订阅外部 store
const useExternalStore = <T,>(
  store: {
    getSnapshot: () => T;
    subscribe: (callback: () => void) => () => void;
  }
): T => {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
};

// 使用示例：订阅 Redux store
const useReduxSelector = <T,>(selector: (state: RootState) => T): T => {
  const store = useReduxStore();
  
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getInitialState())
  );
};
```

#### 实际应用示例

```tsx
// ✅ 订阅浏览器 API
const useOnlineStatus = (): boolean => {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    () => navigator.onLine,
    () => true // 默认值
  );
};

const OnlineStatus: React.FC = () => {
  const isOnline = useOnlineStatus();
  
  return (
    <div className={`online-status ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? '🟢 在线' : '🔴 离线'}
    </div>
  );
};
```

#### 订阅自定义事件

```tsx
// ✅ 订阅自定义事件系统
const useEventSubscription = <T,>(
  eventName: string,
  initialValue: T
): T => {
  const [state, setState] = useState(initialValue);
  
  return useSyncExternalStore(
    (callback) => {
      const handler = (event: CustomEvent<T>) => {
        setState(event.detail);
        callback();
      };
      
      window.addEventListener(eventName, handler as EventListener);
      return () => {
        window.removeEventListener(eventName, handler as EventListener);
      };
    },
    () => state,
    () => initialValue
  );
};

// 使用示例
const useNotificationCount = (): number => {
  return useEventSubscription('notification-update', 0);
};
```

## 🏗️ Strict Mode 最佳实践

### 1. 双重渲染兼容

#### 确保组件纯净性

```tsx
// ✅ 在 Strict Mode 下正常工作的组件
const DataComponent: React.FC<{ dataSource: string }> = ({ dataSource }) => {
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(dataSource);
        const result = await response.json();
        
        // 检查组件是否仍然挂载
        if (isMounted) {
          setData(result);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Fetch error:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [dataSource]);
  
  if (loading) return <Spinner />;
  
  return (
    <DataList data={data} />
  );
};
```

#### 避免副作用

```tsx
// ✅ 避免在渲染期间产生副作用
const SafeComponent: React.FC<{ items: Item[] }> = ({ items }) => {
  // ❌ 错误：在渲染期间修改外部状态
  // useEffect(() => {
  //   externalStore.updateItems(items);
  // }, [items]);
  
  // ✅ 正确：在 useEffect 中处理副作用
  useEffect(() => {
    if (items.length > 0) {
      externalStore.updateItems(items);
    }
  }, [items]);
  
  return (
    <div>
      {items.map(item => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
};
```

### 2. 正确的清理函数

#### 网络请求清理

```tsx
// ✅ 正确清理网络请求
const UserDataProvider: React.FC<{ userId: string }> = ({ userId }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const abortController = useRef<AbortController | null>(null);
  
  useEffect(() => {
    abortController.current = new AbortController();
    
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          signal: abortController.current.signal
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching user data:', error);
        }
      }
    };
    
    fetchUserData();
    
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [userId]);
  
  if (!userData) {
    return <div>Loading user data...</div>;
  }
  
  return (
    <UserProfile user={userData} />
  );
};
```

#### 定时器清理

```tsx
// ✅ 正确清理定时器
const TimerComponent: React.FC = () => {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCount(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return (
    <div>
      <p>Timer: {count}s</p>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
};
```

### 3. 订阅和事件监听清理

#### 事件监听器清理

```tsx
// ✅ 正确清理事件监听器
const KeyboardShortcuts: React.FC = () => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 处理键盘快捷键
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  const handleSave = () => {
    // 保存逻辑
    console.log('Saving...');
  };
  
  return (
    <div>
      <p>Press Ctrl+S to save</p>
    </div>
  );
};
```

## 🌐 客户端和服务端渲染兼容

### 1. 水合错误处理

#### 基础水合安全组件

```tsx
// ✅ 处理水合不匹配问题
const HydrationSafeComponent: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <div className="loading-skeleton">Loading...</div>;
  }
  
  return (
    <div>
      <ClientOnlyContent />
    </div>
  );
};
```

#### 高级水合安全组件

```tsx
// ✅ 高级水合安全组件，支持服务端渲染
const SSRSafeComponent: React.FC<{
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ fallback = <div>Loading...</div>, children }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// 使用示例
const BrowserSpecificFeature: React.FC = () => {
  return (
    <SSRSafeComponent fallback={<div>Checking browser...</div>}>
      <div>
        <p>Browser: {navigator.userAgent}</p>
        <p>Screen: {window.screen.width}x{window.screen.height}</p>
      </div>
    </SSRSafeComponent>
  );
};
```

### 2. 客户端特定逻辑

#### 使用 useEffect 处理客户端逻辑

```tsx
// ✅ 将客户端特定逻辑放在 useEffect 中
const ClientSideFeature: React.FC = () => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [screenSize, setScreenSize] = useState<ScreenSize | null>(null);
  
  useEffect(() => {
    // 只在客户端执行
    setBrowserInfo({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
    });
    
    setScreenSize({
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
    });
    
    // 添加窗口大小变化监听
    const handleResize = () => {
      setScreenSize({
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  if (!browserInfo || !screenSize) {
    return <div>Detecting environment...</div>;
  }
  
  return (
    <div className="browser-info">
      <h3>Browser Information</h3>
      <p>User Agent: {browserInfo.userAgent}</p>
      <p>Language: {browserInfo.language}</p>
      <p>Platform: {browserInfo.platform}</p>
      
      <h3>Screen Information</h3>
      <p>Screen Size: {screenSize.width}x{screenSize.height}</p>
      <p>Available Size: {screenSize.availWidth}x{screenSize.availHeight}</p>
    </div>
  );
};
```

#### 本地存储处理

```tsx
// ✅ 安全的本地存储处理
const useLocalStorage = <T,>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);
  
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  return [storedValue, setValue];
};

// 使用示例
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={`theme-${theme}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
```

## 🚀 性能优化

### 1. 使用 React DevTools Profiler

#### 性能分析组件

```tsx
// ✅ 使用 Profiler 监控组件性能
const ProfilerWrapper: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const handleRender = (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    // 记录性能数据
    console.log(`Component ${id} ${phase}:`, {
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
    });
    
    // 可以将数据发送到分析服务
    if (actualDuration > 16) { // 超过一帧的时间
      console.warn(`Component ${id} took ${actualDuration}ms to render`);
    }
  };
  
  return (
    <React.Profiler id={id} onRender={handleRender}>
      {children}
    </React.Profiler>
  );
};

// 使用示例
const OptimizedComponent: React.FC = () => {
  return (
    <ProfilerWrapper id="OptimizedComponent">
      <ExpensiveComponent />
    </ProfilerWrapper>
  );
};
```

### 2. 自定义性能 Hook

```tsx
// ✅ 性能优化 Hook
const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const lastRenderTime = useRef<number>(0);
  
  useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();
    
    if (lastRenderTime.current > 0) {
      const renderTime = now - lastRenderTime.current;
      renderTimes.current.push(renderTime);
      
      // 保持最近10次的渲染时间
      if (renderTimes.current.length > 10) {
        renderTimes.current.shift();
      }
      
      // 计算平均渲染时间
      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      
      console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms (avg: ${avgRenderTime.toFixed(2)}ms)`);
    }
    
    lastRenderTime.current = now;
  });
  
  return {
    renderCount: renderCount.current,
    averageRenderTime: renderTimes.current.length > 0 
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length 
      : 0,
  };
};

// 使用示例
const MonitoredComponent: React.FC = () => {
  const performance = usePerformanceMonitor('MonitoredComponent');
  
  return (
    <div>
      <p>Render count: {performance.renderCount}</p>
      <p>Avg render time: {performance.averageRenderTime.toFixed(2)}ms</p>
    </div>
  );
};
```

## 🎯 总结

React 18 引入了许多强大的新特性，正确使用这些特性可以显著提升应用性能和用户体验。关键要点：

1. **useTransition** - 用于优化非紧急状态更新
2. **useDeferredValue** - 用于延迟昂贵的计算
3. **Suspense** - 用于优雅的数据获取和代码分割
4. **自动批处理** - 提升渲染性能
5. **新的 Hooks** - 提供更好的开发体验
6. **Strict Mode** - 确保组件质量和兼容性

通过遵循这些最佳实践，你可以充分利用 React 18 的强大功能，构建高性能、用户友好的 React 应用。

---

*最后更新：2024年*