# React 组件设计规范

## 📋 概述

本文档提供了基于 **React 18.3.1** 的组件标准化设计规范，旨在确保组件的高质量、可维护性和一致性。遵循此规范可以快速开发出符合最佳实践的React组件。

### 🎯 版本信息
- **React版本**: 18.3.1 (稳定版)
- **TypeScript**: 5.x
- **Node.js**: >= 16.0.0
- **构建工具**: Vite 4.x / Webpack 5.x

## 🎯 设计原则

### SOLID 原则

#### 1. 单一职责原则 (Single Responsibility)
- 每个组件只负责一个功能
- 组件应该专注于单一的UI或逻辑任务
- 避免组件承担过多职责

**示例：**
```tsx
// ❌ 错误：职责过多
function UserProfile() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 获取用户信息
  useEffect(() => {
    fetchUser();
  }, []);
  
  // 获取用户帖子
  useEffect(() => {
    fetchPosts();
  }, []);
  
  // 渲染用户信息和帖子
  return (
    <div>
      <UserInfo user={user} />
      <PostList posts={posts} />
    </div>
  );
}

// ✅ 正确：职责分离
function UserProfile() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser();
  }, []);
  
  return <UserInfo user={user} />;
}

function UserPosts({ userId }) {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    fetchPosts(userId);
  }, [userId]);
  
  return <PostList posts={posts} />;
}
```

#### 2. 开放封闭原则 (Open/Closed)
- 组件应该对扩展开放，对修改封闭
- 使用组合和配置而不是硬编码
- 通过props和children实现扩展

**示例：**
```tsx
// ✅ 正确：通过props扩展
function Card({ children, header, footer, className }) {
  return (
    <div className={`card ${className}`}>
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

// 使用方式
<Card header={<h3>标题</h3>} footer={<Button>保存</Button>}>
  <p>内容</p>
</Card>
```

#### 3. 里氏替换原则 (Liskov Substitution)
- 子组件应该能够替换父组件
- 保持组件接口的一致性
- 确保组件行为符合预期

#### 4. 接口隔离原则 (Interface Segregation)
- 使用多个小的接口而不是一个大的接口
- Props应该精细化，避免过多可选属性
- 使用组件组合减少props数量

#### 5. 依赖倒置原则 (Dependency Inversion)
- 依赖抽象而不是具体实现
- 使用依赖注入和props传递
- 避免组件内部直接依赖外部服务

### KISS 原则 (Keep It Simple, Stupid)
- 保持组件简单易懂
- 避免过度设计和不必要的复杂性
- 优先选择最直观的解决方案

### DRY 原则 (Don't Repeat Yourself)
- 避免重复代码
- 提取公共逻辑到hooks或工具函数
- 使用组件组合复用UI结构

### YAGNI 原则 (You Ain't Gonna Need It)
- 只实现当前需要的功能
- 避免过早优化和过度设计
- 删除未使用的代码和依赖

## 🏗️ 组件架构

### 组件分类

#### 1. 基础组件 (Base Components)
- 原子级别的UI组件
- 无状态或简单状态
- 高度可复用

**示例：**
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${disabled ? 'disabled' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  );
};
```

#### 2. 复合组件 (Compound Components)
- 由多个基础组件组成
- 提供完整的UI功能
- 内部状态管理

**示例：**
```tsx
interface TabsProps {
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  children: React.ReactNode;
}

const Tabs: React.FC<TabsProps> & {
  Tab: typeof Tab;
} = ({ defaultActiveKey, activeKey, onChange, children }) => {
  const [internalActiveKey, setInternalActiveKey] = useState(defaultActiveKey);
  
  const currentValue = activeKey || internalActiveKey;
  
  const contextValue = {
    activeKey: currentValue,
    onChange: (key: string) => {
      onChange?.(key);
      setInternalActiveKey(key);
    }
  };
  
  return (
    <TabsContext.Provider value={contextValue}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
};

interface TabProps {
  eventKey: string;
  title: string;
  children: React.ReactNode;
}

const Tab: React.FC<TabProps> = ({ eventKey, title, children }) => {
  const { activeKey, onChange } = useTabsContext();
  
  return (
    <div className="tab">
      <button 
        className={`tab-button ${activeKey === eventKey ? 'active' : ''}`}
        onClick={() => onChange(eventKey)}
      >
        {title}
      </button>
      {activeKey === eventKey && (
        <div className="tab-content">{children}</div>
      )}
    </div>
  );
};

Tabs.Tab = Tab;
```

#### 3. 容器组件 (Container Components)
- 负责数据获取和状态管理
- 业务逻辑处理
- 与展示组件分离

**示例：**
```tsx
interface UserListContainerProps {
  apiUrl: string;
  renderItem?: (user: User) => React.ReactNode;
}

const UserListContainer: React.FC<UserListContainerProps> = ({ 
  apiUrl, 
  renderItem 
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [apiUrl]);
  
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <UserList 
      users={users} 
      renderItem={renderItem} 
    />
  );
};
```

#### 4. 页面组件 (Page Components)
- 应用的页面级组件
- 路由配置
- 页面布局

### 组件层次结构
```
Page Components
├── Container Components
│   ├── Compound Components
│   │   ├── Base Components
│   │   └── Base Components
│   └── Compound Components
└── Layout Components
```

## 🔧 Props 设计规范

### Props 命名约定

#### 1. 使用驼峰命名法
```tsx
// ✅ 正确
interface Props {
  userName: string;
  isLoading: boolean;
  onClickHandler: () => void;
}

// ❌ 错误
interface Props {
  user_name: string;
  is_loading: boolean;
  onclick_handler: () => void;
}
```

#### 2. 布尔值props使用is/has前缀
```tsx
// ✅ 正确
interface Props {
  isVisible: boolean;
  hasError: boolean;
  isLoading: boolean;
}

// ❌ 错误
interface Props {
  visible: boolean;
  error: boolean;
  loading: boolean;
}
```

#### 3. 事件处理函数使用on前缀
```tsx
// ✅ 正确
interface Props {
  onClick: () => void;
  onSubmit: (data: FormData) => void;
  onChange: (value: string) => void;
}

// ❌ 错误
interface Props {
  click: () => void;
  submit: (data: FormData) => void;
  change: (value: string) => void;
}
```

#### 4. 回调函数使用handle前缀（内部方法）
```tsx
const Component: React.FC<Props> = ({ onClick }) => {
  const handleClick = () => {
    // 处理逻辑
    onClick();
  };
  
  return <button onClick={handleClick}>Click</button>;
};
```

### Props 类型定义

#### 1. 使用TypeScript接口
```tsx
// ✅ 正确
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
}

// ❌ 错误
const ButtonProps = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  children: PropTypes.node
};
```

#### 2. 明确的类型定义
```tsx
// ✅ 正确
interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  onUserClick: (userId: string) => void;
}

// ❌ 错误
interface UserCardProps {
  user: any;
  onUserClick: Function;
}
```

#### 3. 使用泛型提高复用性
```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <div>
      {items.map(item => (
        <div key={keyExtractor(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
```

### Props 默认值

#### 1. 使用解构赋值设置默认值
```tsx
// ✅ 正确
interface Props {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<Props> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children
}) => {
  return (
    <button className={`btn btn-${variant} btn-${size}`} disabled={disabled}>
      {children}
    </button>
  );
};
```

#### 2. 避免在组件内部设置默认值
```tsx
// ❌ 错误
const Button: React.FC<Props> = ({ variant, size, disabled, children }) => {
  const finalVariant = variant || 'primary';
  const finalSize = size || 'md';
  const finalDisabled = disabled || false;
  
  return (
    <button className={`btn btn-${finalVariant} btn-${finalSize}`} disabled={finalDisabled}>
      {children}
    </button>
  );
};
```

### Props 验证

#### 1. 使用TypeScript进行类型检查
```tsx
interface Props {
  age: number;
  email: string;
}

const Component: React.FC<Props> = ({ age, email }) => {
  // TypeScript会在编译时检查类型
  return <div>{age} - {email}</div>;
};
```

#### 2. 运行时验证（如需要）
```tsx
interface Props {
  age: number;
  email: string;
}

const Component: React.FC<Props> = ({ age, email }) => {
  useEffect(() => {
    if (age < 0) {
      console.warn('Age should be positive');
    }
    if (!email.includes('@')) {
      console.warn('Invalid email format');
    }
  }, [age, email]);
  
  return <div>{age} - {email}</div>;
};
```

## 🎭 事件处理

### 事件命名约定

#### 1. 标准DOM事件
```tsx
// ✅ 正确
interface Props {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}
```

#### 2. 自定义事件
```tsx
// ✅ 正确
interface Props {
  onSearch: (query: string) => void;
  onSelect: (item: ItemType) => void;
  onFilterChange: (filters: FilterType) => void;
}
```

### 事件处理最佳实践

#### 1. 使用useCallback优化性能
```tsx
// ✅ 正确
const Component: React.FC<Props> = ({ onClick }) => {
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    onClick();
  }, [onClick]);
  
  return <button onClick={handleClick}>Click</button>;
};
```

#### 2. 防抖和节流
```tsx
// ✅ 正确
const SearchInput: React.FC<Props> = ({ onSearch }) => {
  const [value, setValue] = useState('');
  
  const debouncedSearch = useMemo(
    () => debounce((query: string) => onSearch(query), 300),
    [onSearch]
  );
  
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setValue(newValue);
    debouncedSearch(newValue);
  };
  
  return <input value={value} onChange={handleChange} />;
};
```

#### 3. 事件冒泡和阻止默认行为
```tsx
// ✅ 正确
const Component: React.FC<Props> = ({ onContainerClick, onItemClick }) => {
  const handleContainerClick = (event: React.MouseEvent) => {
    onContainerClick();
  };
  
  const handleItemClick = (event: React.MouseEvent, item: Item) => {
    event.stopPropagation(); // 阻止事件冒泡
    onItemClick(item);
  };
  
  return (
    <div onClick={handleContainerClick}>
      {items.map(item => (
        <div key={item.id} onClick={(e) => handleItemClick(e, item)}>
          {item.name}
        </div>
      ))}
    </div>
  );
};
```

## 🗃️ 状态管理

### useState 使用规范

#### 1. 状态命名清晰
```tsx
// ✅ 正确
const [isLoading, setIsLoading] = useState(false);
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]);

// ❌ 错误
const [state, setState] = useState({
  loading: false,
  user: null,
  items: []
});
```

#### 2. 状态更新函数
```tsx
// ✅ 正确
const [count, setCount] = useState(0);

const increment = () => {
  setCount(prev => prev + 1);
};

// ❌ 错误
const increment = () => {
  setCount(count + 1);
};
```

#### 3. 复杂状态使用useReducer
```tsx
// ✅ 正确
interface State {
  users: User[];
  loading: boolean;
  error: string | null;
  page: number;
}

type Action = 
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: User[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SET_PAGE'; payload: number };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, users: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    default:
      return state;
  }
};

const Component: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, {
    users: [],
    loading: false,
    error: null,
    page: 1
  });
  
  // 使用state和dispatch
};
```

### Context 使用规范

#### 1. 创建Context
```tsx
// ✅ 正确
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

#### 2. 提供者组件
```tsx
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultTheme);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const value = {
    theme,
    toggleTheme
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 自定义Hooks

#### 1. 命名约定
```tsx
// ✅ 正确
const useLocalStorage = <T>(key: string, initialValue: T) => {
  // 实现
};

const useDebounce = <T>(value: T, delay: number) => {
  // 实现
};

const useFetch = <T>(url: string) => {
  // 实现
};
```

#### 2. 返回值一致性
```tsx
// ✅ 正确
const useFetch = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 实现
  
  return { data, loading, error, refetch: () => {} };
};
```

## 🚀 React 18 最佳实践

### 并发特性 (Concurrent Features)

#### 1. 使用 useTransition 处理非紧急更新
```tsx
// ✅ 正确：使用 useTransition 优化大数据渲染
const [isPending, startTransition] = useTransition();
const [filter, setFilter] = useState('');

const filteredList = useMemo(() => {
  if (!filter) return largeList;
  
  return largeList.filter(item => 
    item.name.toLowerCase().includes(filter.toLowerCase())
  );
}, [largeList, filter]);

const handleFilterChange = (value: string) => {
  // 将过滤操作标记为非紧急更新
  startTransition(() => {
    setFilter(value);
  });
};

// 在UI中显示过渡状态
return (
  <div>
    <input 
      type="text" 
      value={filter}
      onChange={(e) => handleFilterChange(e.target.value)}
      placeholder="搜索..."
    />
    {isPending && <span className="loading">正在筛选...</span>}
    <List items={filteredList} />
  </div>
);
```

#### 2. 使用 useDeferredValue 延迟非紧急值
```tsx
// ✅ 正确：延迟搜索输入以提升性能
const [inputValue, setInputValue] = useState('');
const deferredValue = useDeferredValue(inputValue);

const searchResults = useMemo(() => {
  return performSearch(deferredValue);
}, [deferredValue]);

return (
  <div>
    <input 
      type="text" 
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
    />
    <SearchResults results={searchResults} />
  </div>
);
```

### Suspense 和数据获取

#### 1. 使用 Suspense 组件
```tsx
// ✅ 正确：使用 Suspense 包装异步组件
const UserProfile = ({ userId }: { userId: string }) => {
  return (
    <Suspense fallback={<UserProfileSkeleton />}>
      <UserProfileContent userId={userId} />
    </Suspense>
  );
};

// 异步组件
const UserProfileContent = async ({ userId }: { userId: string }) => {
  const user = await fetchUser(userId);
  const posts = await fetchUserPosts(userId);
  
  return (
    <div>
      <UserInfo user={user} />
      <UserPosts posts={posts} />
    </div>
  );
};
```

#### 2. 创建 Suspense 友好的数据获取
```tsx
// ✅ 正确：创建支持 Suspense 的数据获取 Hook
const useSuspenseFetch = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [promise, setPromise] = useState<Promise<T> | null>(null);
  
  if (!promise) {
    const fetchPromise = fetch(url).then(res => res.json());
    setPromise(fetchPromise);
    throw fetchPromise; // 抛出 Promise 让 Suspense 捕获
  }
  
  promise.then(data => {
    setData(data);
  });
  
  if (!data) {
    throw promise; // 继续抛出直到数据准备好
  }
  
  return data;
};
```

### Strict Mode 最佳实践

#### 1. 双重渲染兼容
```tsx
// ✅ 正确：确保组件在 Strict Mode 下正常工作
const MyComponent = () => {
  const [count, setCount] = useState(0);
  const [data, setData] = useState(null);
  
  // 使用 useEffect 清理副作用
  useEffect(() => {
    const fetchData = async () => {
      const result = await apiCall();
      setData(result);
    };
    
    fetchData();
    
    // 清理函数
    return () => {
      // 清理订阅、定时器等
    };
  }, []);
  
  // 避免在渲染期间产生副作用
  const handleClick = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increment</button>
      {data && <DataDisplay data={data} />}
    </div>
  );
};
```

#### 2. 组件卸载处理
```tsx
// ✅ 正确：正确处理组件卸载
const DataFetcher = ({ url }: { url: string }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const abortController = useRef<AbortController | null>(null);
  
  useEffect(() => {
    abortController.current = new AbortController();
    
    const fetchData = async () => {
      try {
        const response = await fetch(url, {
          signal: abortController.current.signal
        });
        const result = await response.json();
        setData(result);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [url]);
  
  if (loading) return <Spinner />;
  if (!data) return <ErrorDisplay />;
  
  return <DataView data={data} />;
};
```

### 批量更新和自动批处理

#### 1. 利用 React 18 的自动批处理
```tsx
// ✅ 正确：React 18 会自动批处理状态更新
const FormComponent = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  // 这些更新会被自动批处理
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = () => {
    // 提交逻辑
    console.log('Form submitted:', formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <input
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
      />
      <input
        value={formData.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
      />
      <button type="submit">Submit</button>
    </form>
  );
};
```

### 新的 Hooks 最佳实践

#### 1. useId 生成唯一ID
```tsx
// ✅ 正确：使用 useId 生成可访问性ID
const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const id = useId();
  
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {React.cloneElement(children as React.ReactElement, { id })}
    </div>
  );
};

// 使用示例
const LoginForm = () => {
  return (
    <form>
      <FormField label="Username">
        <input type="text" />
      </FormField>
      <FormField label="Password">
        <input type="password" />
      </FormField>
    </form>
  );
};
```

#### 2. useSyncExternalStore 订阅外部状态
```tsx
// ✅ 正确：使用 useSyncExternalStore 订阅外部状态
const useExternalStore = <T,>(
  store: { 
    getSnapshot: () => T; 
    subscribe: (callback: () => void) => () => void 
  }
) => {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
};

// 使用示例：订阅 Redux store
const useReduxStore = <T>(selector: (state: RootState) => T) => {
  const store = useReduxStoreContext();
  
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getInitialState())
  );
};
```

### 客户端和服务端渲染兼容

#### 1. 水合错误处理
```tsx
// ✅ 正确：处理水合不匹配问题
const HydrationSafeComponent = () => {
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

#### 2. 使用 useEffect 处理客户端特定逻辑
```tsx
// ✅ 正确：将客户端特定逻辑放在 useEffect 中
const ClientSideFeature = () => {
  const [browserInfo, setBrowserInfo] = useState(null);
  
  useEffect(() => {
    // 只在客户端执行
    setBrowserInfo({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform
    });
  }, []);
  
  if (!browserInfo) {
    return <div>Detecting browser...</div>;
  }
  
  return (
    <div>
      <p>Browser: {browserInfo.userAgent}</p>
      <p>Language: {browserInfo.language}</p>
      <p>Platform: {browserInfo.platform}</p>
    </div>
  );
};

## 🎨 样式处理

### CSS-in-JS 规范

#### 1. 使用styled-components或emotion
```tsx
// ✅ 正确
import styled from 'styled-components';

const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  
  ${({ variant }) => variant === 'primary' ? `
    background-color: #007bff;
    color: white;
  ` : `
    background-color: #6c757d;
    color: white;
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
```

#### 2. CSS Modules
```tsx
// ✅ 正确
import styles from './Button.module.css';

const Button: React.FC<ButtonProps> = ({ variant, children }) => {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
};
```

### Tailwind CSS 规范

#### 1. 工具类命名
```tsx
// ✅ 正确
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-lg font-semibold text-gray-800">标题</h2>
  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    按钮
  </button>
</div>
```

#### 2. 响应式设计
```tsx
// ✅ 正确
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <div key={item.id} className="p-4 border rounded-lg">
      {item.name}
    </div>
  ))}
</div>
```

## ♿ 可访问性

### ARIA 属性

#### 1. 语义化HTML
```tsx
// ✅ 正确
<button 
  aria-label="关闭"
  onClick={onClose}
>
  <XIcon />
</button>

// ❌ 错误
<div onClick={onClose}>
  <XIcon />
</div>
```

#### 2. 键盘导航
```tsx
// ✅ 正确
const Dropdown: React.FC<DropdownProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        if (focusedIndex >= 0) {
          items[focusedIndex].onClick();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };
  
  return (
    <div onKeyDown={handleKeyDown}>
      {/* 渲染下拉菜单 */}
    </div>
  );
};
```

### 焦点管理

#### 1. 焦点陷阱
```tsx
// ✅ 正确
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0] as HTMLElement;
      firstElement?.focus();
    }
  }, [isOpen]);
  
  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
};
```

## ⚡ 性能优化

### React.memo 使用

#### 1. 适当使用memo
```tsx
// ✅ 正确
const ExpensiveComponent: React.FC<ExpensiveProps> = React.memo(({ data }) => {
  // 复杂的计算或渲染
  return <div>{/* 渲染内容 */}</div>;
});
```

#### 2. 避免过度使用memo
```tsx
// ❌ 错误
const SimpleComponent = React.memo(({ text }) => {
  return <div>{text}</div>;
});
```

### useMemo 和 useCallback

#### 1. useMemo 用于昂贵计算
```tsx
// ✅ 正确
const Component: React.FC<{ items: Item[] }> = ({ items }) => {
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.value - b.value);
  }, [items]);
  
  return <List items={sortedItems} />;
};
```

#### 2. useCallback 用于函数依赖
```tsx
// ✅ 正确
const Component: React.FC<{ onSave: (data: Data) => void }> = ({ onSave }) => {
  const handleSubmit = useCallback((formData: FormData) => {
    const data = processData(formData);
    onSave(data);
  }, [onSave]);
  
  return <Form onSubmit={handleSubmit} />;
};
```

### 虚拟化长列表

#### 1. 使用react-window或react-virtualized
```tsx
// ✅ 正确
import { FixedSizeList as List } from 'react-window';

const VirtualizedList: React.FC<{ items: Item[] }> = ({ items }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );
  
  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={35}
    >
      {Row}
    </List>
  );
};
```

## 🧪 测试规范

### 单元测试

#### 1. 测试文件命名
```tsx
// ✅ 正确
// Button.tsx
// Button.test.tsx
// Button.spec.tsx
```

#### 2. 测试结构
```tsx
// ✅ 正确
describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    const { getByText } = render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('is disabled when disabled prop is true', () => {
    const { getByText } = render(<Button disabled>Click me</Button>);
    expect(getByText('Click me')).toBeDisabled();
  });
});
```

### 集成测试

#### 1. 测试组件交互
```tsx
// ✅ 正确
describe('Form', () => {
  it('submits form with valid data', async () => {
    const handleSubmit = jest.fn();
    const { getByLabelText, getByText } = render(
      <Form onSubmit={handleSubmit} />
    );
    
    fireEvent.change(getByLabelText('Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.click(getByText('Submit'));
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });
  });
});
```

### 测试覆盖率要求

#### 1. 代码覆盖率目标
- 行覆盖率：≥ 90%
- 分支覆盖率：≥ 80%
- 函数覆盖率：≥ 90%
- 语句覆盖率：≥ 90%

#### 2. 测试边界情况
```tsx
// ✅ 正确
describe('ErrorBoundary', () => {
  it('renders error message when child component throws error', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };
    
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(getByText('Something went wrong')).toBeInTheDocument();
  });
  
  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );
    
    expect(getByText('Normal content')).toBeInTheDocument();
  });
});
```

## 📝 文档规范

### 组件文档

#### 1. JSDoc注释
```tsx
// ✅ 正确
/**
 * Button component for user interaction
 * @component
 * @example
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 */
const Button: React.FC<ButtonProps> = ({ 
  variant, 
  size, 
  disabled, 
  loading, 
  onClick, 
  children 
}) => {
  // 实现
};
```

#### 2. Props文档
```tsx
// ✅ 正确
interface ButtonProps {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Button content */
  children: React.ReactNode;
}
```

### Storybook 集成

#### 1. Story文件
```tsx
// ✅ 正确
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};
```

## 🔧 开发工具配置

### ESLint 配置

#### 1. React插件规则
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### Prettier 配置

#### 1. 代码格式化
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

## 📋 检查清单

### 设计检查清单
- [ ] 组件遵循单一职责原则
- [ ] Props类型定义完整且准确
- [ ] 组件接口清晰易懂
- [ ] 使用了适当的组件分类
- [ ] 考虑了可访问性要求
- [ ] 性能优化措施到位

### 代码检查清单
- [ ] 代码遵循ESLint规则
- [ ] TypeScript类型检查通过
- [ ] 组件有适当的文档注释
- [ ] 错误处理完善
- [ ] 边界情况处理
- [ ] 测试覆盖率达标

### 测试检查清单
- [ ] 单元测试覆盖主要功能
- [ ] 集成测试覆盖组件交互
- [ ] 边界情况测试充分
- [ ] 异步操作测试正确
- [ ] 错误场景测试覆盖
- [ ] 测试代码质量良好

## 🎯 总结

遵循本规范可以确保React组件的高质量、可维护性和一致性。规范涵盖了组件设计的各个方面，从基础的Props设计到复杂的性能优化和测试策略。

记住：**规范是为了提高代码质量，而不是限制创造力。在特殊情况下，可以根据具体需求灵活调整。**

---

*最后更新：2024年*