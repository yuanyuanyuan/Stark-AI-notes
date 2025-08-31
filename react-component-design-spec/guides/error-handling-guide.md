# React 错误边界和错误处理指南

## 📋 概述

本指南提供了 React 18.3.1 中错误边界和错误处理的最佳实践，帮助开发者构建健壮、可靠的 React 应用。

## 🚨 错误边界 (Error Boundaries)

### 1. 基础错误边界组件

#### React 18 错误边界实现

```tsx
// ✅ 基础错误边界组件
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 调用错误回调
    this.props.onError?.(error, errorInfo);

    // 记录错误到日志服务
    this.logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    
    // 检查是否需要重置错误状态
    if (
      this.state.hasError &&
      ((resetOnPropsChange && prevProps !== this.props) ||
        (resetKeys && resetKeys.some(key => prevProps[key as keyof ErrorBoundaryProps] !== this.props[key as keyof ErrorBoundaryProps])))
    ) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // 发送错误到日志服务
    console.error('Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // 示例：发送到错误追踪服务
    if (typeof window !== 'undefined' && window.onerror) {
      window.onerror(
        error.message,
        errorInfo.componentStack,
        0,
        0,
        error
      );
    }
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return <>{children}</>;
  }
}
```

#### 错误回退组件

```tsx
// ✅ 错误回退组件
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetErrorBoundary,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="error-fallback">
      <div className="error-fallback__content">
        <div className="error-fallback__icon">⚠️</div>
        <h2 className="error-fallback__title">出错了</h2>
        <p className="error-fallback__message">
          抱歉，应用遇到了一个错误。我们已经记录了这个问题。
        </p>
        
        <div className="error-fallback__actions">
          <button
            onClick={resetErrorBoundary}
            className="error-fallback__button error-fallback__button--primary"
          >
            重试
          </button>
          <button
            onClick={() => window.location.reload()}
            className="error-fallback__button error-fallback__button--secondary"
          >
            刷新页面
          </button>
        </div>

        {error && (
          <div className="error-fallback__details">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="error-fallback__toggle"
            >
              {showDetails ? '隐藏' : '显示'}详细信息
            </button>
            
            {showDetails && (
              <div className="error-fallback__info">
                <div className="error-fallback__error">
                  <strong>Error:</strong>
                  <pre>{error.message}</pre>
                </div>
                
                {errorInfo && (
                  <div className="error-fallback__stack">
                    <strong>Component Stack:</strong>
                    <pre>{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
```

### 2. 高级错误边界

#### 带重试机制的错误边界

```tsx
// ✅ 带重试机制的错误边界
interface RetryErrorBoundaryProps extends ErrorBoundaryProps {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (retryCount: number) => void;
}

interface RetryErrorBoundaryState extends ErrorBoundaryState {
  retryCount: number;
}

class RetryErrorBoundary extends React.Component<
  RetryErrorBoundaryProps,
  RetryErrorBoundaryState
> {
  constructor(props: RetryErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000, onRetry } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      onRetry?.(retryCount + 1);
      
      this.setState({
        retryCount: retryCount + 1,
      });

      // 延迟重试
      setTimeout(() => {
        this.resetErrorBoundary();
      }, retryDelay);
    } else {
      // 超过最大重试次数，显示错误页面
      console.error('Max retries reached for error:', this.state.error);
    }
  };

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError) {
      if (fallback) {
        return <>{fallback}</>;
      }

      const canRetry = retryCount < maxRetries;

      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetErrorBoundary={canRetry ? this.handleRetry : this.resetErrorBoundary}
          retryCount={retryCount}
          maxRetries={maxRetries}
          canRetry={canRetry}
        />
      );
    }

    return <>{children}</>;
  }
}
```

#### 异步错误边界

```tsx
// ✅ 异步错误边界，处理 Promise 错误
interface AsyncErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({
  children,
  fallback,
  onError,
}) => {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason);
      setError(error);
      onError?.(error);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <ErrorFallback
        error={error}
        errorInfo={null}
        resetErrorBoundary={() => setError(null)}
      />
    );
  }

  return <>{children}</>;
};
```

### 3. 函数式错误边界 Hook

```tsx
// ✅ 函数式错误边界 Hook
interface UseErrorBoundaryReturn {
  error: Error | null;
  resetError: () => void;
}

const useErrorBoundary = (): UseErrorBoundaryReturn => {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error);
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(new Error(event.reason));
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return { error, resetError };
};

// 使用示例
const ComponentWithErrorBoundary: React.FC = () => {
  const { error, resetError } = useErrorBoundary();

  if (error) {
    return (
      <ErrorFallback
        error={error}
        errorInfo={null}
        resetErrorBoundary={resetError}
      />
    );
  }

  return <NormalComponent />;
};
```

## 🔧 错误处理策略

### 1. 网络错误处理

#### 网络请求错误处理

```tsx
// ✅ 网络请求错误处理 Hook
interface UseFetchOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retry?: number;
  retryDelay?: number;
}

interface UseFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const useFetch = <T,>(
  url: string,
  options: UseFetchOptions<T> = {}
): UseFetchReturn<T> => {
  const { onSuccess, onError, retry = 3, retryDelay = 1000 } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = async (attempt = 1): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      onSuccess?.(result);
      setRetryCount(0);
    } catch (err) {
      const error = err as Error;
      
      if (attempt < retry) {
        // 重试逻辑
        setTimeout(() => {
          fetchData(attempt + 1);
        }, retryDelay * attempt);
        
        setRetryCount(attempt);
      } else {
        setError(error);
        onError?.(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(),
  };
};

// 使用示例
const UserData: React.FC<{ userId: string }> = ({ userId }) => {
  const { data, loading, error, refetch } = useFetch<User>(`/api/users/${userId}`, {
    onSuccess: (data) => {
      console.log('User data loaded:', data);
    },
    onError: (error) => {
      console.error('Failed to load user data:', error);
    },
    retry: 3,
    retryDelay: 1000,
  });

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <ErrorFallback
        error={error}
        errorInfo={null}
        resetErrorBoundary={refetch}
      />
    );
  }

  return (
    <div>
      <h2>{data?.name}</h2>
      <p>{data?.email}</p>
    </div>
  );
};
```

#### 网络状态监控

```tsx
// ✅ 网络状态监控 Hook
interface NetworkStatus {
  online: boolean;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: navigator.onLine,
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
  });

  useEffect(() => {
    const updateOnlineStatus = () => {
      setNetworkStatus(prev => ({
        ...prev,
        online: navigator.onLine,
      }));
    };

    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        setNetworkStatus(prev => ({
          ...prev,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        }));
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
    }

    // 初始更新
    updateConnectionInfo();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  return networkStatus;
};

// 使用示例
const NetworkAwareComponent: React.FC = () => {
  const networkStatus = useNetworkStatus();

  if (!networkStatus.online) {
    return (
      <div className="offline-message">
        <h3>您当前处于离线状态</h3>
        <p>请检查您的网络连接</p>
      </div>
    );
  }

  return (
    <div>
      <p>网络状态: {networkStatus.online ? '在线' : '离线'}</p>
      <p>网络类型: {networkStatus.effectiveType}</p>
      <NormalComponent />
    </div>
  );
};
```

### 2. 异步错误处理

#### Promise 错误处理

```tsx
// ✅ Promise 错误处理 Hook
interface UsePromiseOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
}

interface UsePromiseReturn<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  execute: (promise: Promise<T>) => Promise<T>;
}

const usePromise = <T,>(
  options: UsePromiseOptions<T> = {}
): UsePromiseReturn<T> => {
  const { onSuccess, onError, onFinally } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = async (promise: Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const result = await promise;
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
      onFinally?.();
    }
  };

  return {
    data,
    error,
    loading,
    execute,
  };
};

// 使用示例
const AsyncOperation: React.FC = () => {
  const { data, error, loading, execute } = usePromise<string>({
    onSuccess: (data) => {
      console.log('Operation successful:', data);
    },
    onError: (error) => {
      console.error('Operation failed:', error);
    },
  });

  const handleAsyncClick = async () => {
    try {
      const result = await execute(
        new Promise<string>((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() > 0.5) {
              resolve('Operation completed successfully');
            } else {
              reject(new Error('Operation failed randomly'));
            }
          }, 1000);
        })
      );
      
      console.log('Result:', result);
    } catch (error) {
      // 错误已经在 usePromise 中处理
    }
  };

  return (
    <div>
      <button 
        onClick={handleAsyncClick}
        disabled={loading}
      >
        {loading ? '处理中...' : '执行异步操作'}
      </button>
      
      {error && (
        <div className="error-message">
          错误: {error.message}
        </div>
      )}
      
      {data && (
        <div className="success-message">
          结果: {data}
        </div>
      )}
    </div>
  );
};
```

#### 异步组件错误处理

```tsx
// ✅ 异步组件错误处理
interface AsyncComponentProps {
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

const AsyncComponent: React.FC<AsyncComponentProps> = ({
  loader,
  fallback = <div>Loading...</div>,
  errorFallback = <div>Error loading component</div>,
}) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      try {
        setLoading(true);
        const { default: LoadedComponent } = await loader();
        
        if (isMounted) {
          setComponent(() => LoadedComponent);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setComponent(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [loader]);

  if (loading) {
    return <>{fallback}</>;
  }

  if (error) {
    return <>{errorFallback}</>;
  }

  if (Component) {
    return <Component />;
  }

  return null;
};

// 使用示例
const LazyLoadedComponent: React.FC = () => {
  return (
    <AsyncComponent
      loader={() => import('./HeavyComponent')}
      fallback={<Spinner />}
      errorFallback={<ErrorComponent />}
    />
  );
};
```

### 3. 表单错误处理

#### 表单验证错误处理

```tsx
// ✅ 表单验证错误处理
interface ValidationError {
  field: string;
  message: string;
}

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => ValidationError[];
  onSubmit: (values: T) => Promise<void>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  loading: boolean;
  handleChange: (field: keyof T, value: T[keyof T]) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (event: React.FormEvent) => Promise<void>;
  setFieldError: (field: keyof T, message: string) => void;
  resetForm: () => void;
}

const useForm = <T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> => {
  const { initialValues, validate, onSubmit } = options;
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // 清除该字段的错误
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // 验证单个字段
    if (validate) {
      const validationErrors = validate(values);
      const fieldError = validationErrors.find(err => err.field === field as string);
      
      if (fieldError) {
        setErrors(prev => ({
          ...prev,
          [field as string]: fieldError.message,
        }));
      }
    }
  };

  const validateForm = (): boolean => {
    if (!validate) return true;

    const validationErrors = validate(values);
    const newErrors: Record<string, string> = {};

    validationErrors.forEach(error => {
      newErrors[error.field] = error.message;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // 标记所有字段为 touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setTouched(allTouched);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      // 可以在这里处理表单提交错误
    } finally {
      setLoading(false);
    }
  };

  const setFieldError = (field: keyof T, message: string) => {
    setErrors(prev => ({ ...prev, [field as string]: message }));
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setLoading(false);
  };

  return {
    values,
    errors,
    touched,
    loading,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldError,
    resetForm,
  };
};

// 使用示例
const UserForm: React.FC = () => {
  const { values, errors, touched, loading, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: {
      name: '',
      email: '',
      age: '',
    },
    validate: (values) => {
      const errors: ValidationError[] = [];
      
      if (!values.name) {
        errors.push({ field: 'name', message: '姓名不能为空' });
      }
      
      if (!values.email) {
        errors.push({ field: 'email', message: '邮箱不能为空' });
      } else if (!/\S+@\S+\.\S+/.test(values.email)) {
        errors.push({ field: 'email', message: '邮箱格式不正确' });
      }
      
      if (!values.age) {
        errors.push({ field: 'age', message: '年龄不能为空' });
      } else if (isNaN(Number(values.age)) || Number(values.age) < 0) {
        errors.push({ field: 'age', message: '年龄必须是正数' });
      }
      
      return errors;
    },
    onSubmit: async (values) => {
      // 提交表单
      console.log('Form submitted:', values);
      await submitForm(values);
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>姓名:</label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
        />
        {touched.name && errors.name && (
          <div className="error">{errors.name}</div>
        )}
      </div>
      
      <div>
        <label>邮箱:</label>
        <input
          type="email"
          value={values.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
        />
        {touched.email && errors.email && (
          <div className="error">{errors.email}</div>
        )}
      </div>
      
      <div>
        <label>年龄:</label>
        <input
          type="number"
          value={values.age}
          onChange={(e) => handleChange('age', e.target.value)}
          onBlur={() => handleBlur('age')}
        />
        {touched.age && errors.age && (
          <div className="error">{errors.age}</div>
        )}
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? '提交中...' : '提交'}
      </button>
    </form>
  );
};
```

## 🛡️ 全局错误处理

### 1. 全局错误监听

```tsx
// ✅ 全局错误监听 Hook
interface UseGlobalErrorHandlingOptions {
  onError?: (error: Error) => void;
  onUnhandledRejection?: (error: Error) => void;
}

const useGlobalErrorHandling = (options: UseGlobalErrorHandlingOptions = {}) => {
  const { onError, onUnhandledRejection } = options;

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error || new Error(event.message);
      console.error('Global error:', error);
      onError?.(error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason);
      console.error('Unhandled promise rejection:', error);
      onUnhandledRejection?.(error);
      event.preventDefault();
    };

    // 监听全局错误
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError, onUnhandledRejection]);
};

// 使用示例
const App: React.FC = () => {
  useGlobalErrorHandling({
    onError: (error) => {
      // 发送错误到监控服务
      sendErrorToMonitoringService(error);
    },
    onUnhandledRejection: (error) => {
      // 处理未处理的 Promise 拒绝
      sendErrorToMonitoringService(error);
    },
  });

  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
};
```

### 2. 错误监控集成

```tsx
// ✅ 错误监控集成
interface ErrorMonitoringService {
  captureException: (error: Error, context?: any) => void;
  captureMessage: (message: string, level?: 'info' | 'warning' | 'error') => void;
}

// 示例：Sentry 集成
class SentryErrorMonitoring implements ErrorMonitoringService {
  private dsn: string;

  constructor(dsn: string) {
    this.dsn = dsn;
    this.initialize();
  }

  private initialize() {
    // 这里应该初始化 Sentry
    // Sentry.init({ dsn: this.dsn });
  }

  captureException(error: Error, context?: any) {
    console.log('Sending exception to Sentry:', error);
    // Sentry.captureException(error, { extra: context });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    console.log(`Sending ${level} message to Sentry:`, message);
    // Sentry.captureMessage(message, level);
  }
}

// 使用示例
const ErrorMonitoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [monitoringService] = useState(() => {
    return new SentryErrorMonitoring('your-dsn-here');
  });

  const value = useMemo(() => ({
    service: monitoringService,
    captureError: (error: Error, context?: any) => {
      monitoringService.captureException(error, context);
    },
    captureMessage: (message: string, level?: 'info' | 'warning' | 'error') => {
      monitoringService.captureMessage(message, level);
    },
  }), [monitoringService]);

  return (
    <ErrorMonitoringContext.Provider value={value}>
      {children}
    </ErrorMonitoringContext.Provider>
  );
};

// Hook 用于使用错误监控
const useErrorMonitoring = () => {
  const context = useContext(ErrorMonitoringContext);
  if (!context) {
    throw new Error('useErrorMonitoring must be used within ErrorMonitoringProvider');
  }
  return context;
};
```

## 🎯 错误恢复策略

### 1. 自动恢复机制

```tsx
// ✅ 自动恢复机制 Hook
interface UseAutoRecoveryOptions {
  maxAttempts?: number;
  delay?: number;
  backoffFactor?: number;
  onRecovery?: () => void;
  onFailure?: () => void;
}

const useAutoRecovery = (
  errorCondition: () => boolean,
  recoveryAction: () => Promise<boolean>,
  options: UseAutoRecoveryOptions = {}
) => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoffFactor = 2,
    onRecovery,
    onFailure,
  } = options;

  const [isRecovering, setIsRecovering] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const attemptRecovery = async (attempt: number) => {
      if (!isMounted || attempt > maxAttempts) {
        if (attempt > maxAttempts && isMounted) {
          onFailure?.();
        }
        return;
      }

      setIsRecovering(true);
      setAttemptCount(attempt);

      try {
        const recovered = await recoveryAction();
        
        if (recovered && isMounted) {
          onRecovery?.();
          setAttemptCount(0);
          setLastError(null);
        } else if (isMounted) {
          // 继续重试
          const nextDelay = delay * Math.pow(backoffFactor, attempt - 1);
          timeoutId = setTimeout(() => {
            attemptRecovery(attempt + 1);
          }, nextDelay);
        }
      } catch (error) {
        if (isMounted) {
          setLastError(error as Error);
          const nextDelay = delay * Math.pow(backoffFactor, attempt - 1);
          timeoutId = setTimeout(() => {
            attemptRecovery(attempt + 1);
          }, nextDelay);
        }
      } finally {
        if (isMounted) {
          setIsRecovering(false);
        }
      }
    };

    if (errorCondition()) {
      attemptRecovery(1);
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [errorCondition, recoveryAction, maxAttempts, delay, backoffFactor, onRecovery, onFailure]);

  return {
    isRecovering,
    attemptCount,
    lastError,
    triggerRecovery: () => {
      setAttemptCount(0);
      setLastError(null);
    },
  };
};

// 使用示例
const ConnectionRecovery: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 自动恢复连接
  const { isRecovering, attemptCount, triggerRecovery } = useAutoRecovery(
    () => !isOnline,
    async () => {
      // 尝试重新连接
      try {
        const response = await fetch('/api/health');
        return response.ok;
      } catch {
        return false;
      }
    },
    {
      maxAttempts: 5,
      delay: 2000,
      onRecovery: () => {
        console.log('Connection recovered!');
      },
      onFailure: () => {
        console.log('Failed to recover connection after multiple attempts');
      },
    }
  );

  if (!isOnline) {
    return (
      <div className="connection-error">
        <h3>连接已断开</h3>
        <p>正在尝试重新连接... (尝试 {attemptCount})</p>
        {isRecovering && <Spinner />}
        <button onClick={triggerRecovery}>手动重试</button>
      </div>
    );
  }

  return <div>连接正常</div>;
};
```

### 2. 降级方案

```tsx
// ✅ 降级方案组件
interface FallbackComponentProps {
  error?: Error;
  fallback: React.ReactNode;
  children: React.ReactNode;
}

const FallbackComponent: React.FC<FallbackComponentProps> = ({
  error,
  fallback,
  children,
}) => {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (error) {
      // 延迟显示降级组件，给用户一些时间
      const timer = setTimeout(() => {
        setShowFallback(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  if (error && showFallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// 使用示例
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const { data, error, loading } = useFetch<User>(`/api/users/${userId}`);

  if (loading) {
    return <Spinner />;
  }

  return (
    <FallbackComponent
      error={error || undefined}
      fallback={
        <div className="user-profile-fallback">
          <h3>用户信息暂时无法加载</h3>
          <p>请稍后再试</p>
        </div>
      }
    >
      {data ? (
        <div className="user-profile">
          <h2>{data.name}</h2>
          <p>{data.email}</p>
        </div>
      ) : (
        <div>用户不存在</div>
      )}
    </FallbackComponent>
  );
};
```

## 📊 错误报告和分析

### 1. 错误统计

```tsx
// ✅ 错误统计 Hook
interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByComponent: Record<string, number>;
  recentErrors: Array<{
    error: Error;
    timestamp: number;
    component: string;
  }>;
}

const useErrorStats = () => {
  const [stats, setStats] = useState<ErrorStats>({
    totalErrors: 0,
    errorsByType: {},
    errorsByComponent: {},
    recentErrors: [],
  });

  const addError = useCallback((error: Error, component: string) => {
    setStats(prev => {
      const errorType = error.name || 'Unknown';
      const newTotal = prev.totalErrors + 1;
      
      return {
        totalErrors: newTotal,
        errorsByType: {
          ...prev.errorsByType,
          [errorType]: (prev.errorsByType[errorType] || 0) + 1,
        },
        errorsByComponent: {
          ...prev.errorsByComponent,
          [component]: (prev.errorsByComponent[component] || 0) + 1,
        },
        recentErrors: [
          {
            error,
            timestamp: Date.now(),
            component,
          },
          ...prev.recentErrors.slice(0, 9), // 保留最近10个错误
        ],
      };
    });
  }, []);

  const clearStats = useCallback(() => {
    setStats({
      totalErrors: 0,
      errorsByType: {},
      errorsByComponent: {},
      recentErrors: [],
    });
  }, []);

  return { stats, addError, clearStats };
};

// 使用示例
const ErrorStatsDashboard: React.FC = () => {
  const { stats, clearStats } = useErrorStats();

  return (
    <div className="error-stats">
      <h3>错误统计</h3>
      <div className="error-stats__summary">
        <div className="error-stats__item">
          <span className="error-stats__value">{stats.totalErrors}</span>
          <span className="error-stats__label">总错误数</span>
        </div>
      </div>
      
      <div className="error-stats__breakdown">
        <h4>按类型分类</h4>
        <ul>
          {Object.entries(stats.errorsByType).map(([type, count]) => (
            <li key={type}>
              {type}: {count}
            </li>
          ))}
        </ul>
      </div>
      
      <button onClick={clearStats}>清除统计</button>
    </div>
  );
};
```

## 🎯 总结

React 18 的错误处理机制提供了强大的工具来构建健壮的应用：

1. **错误边界** - 捕获组件树中的错误
2. **全局错误处理** - 监听和处理全局错误
3. **网络错误处理** - 处理网络请求和连接问题
4. **异步错误处理** - 处理 Promise 和异步操作错误
5. **表单错误处理** - 完整的表单验证和错误显示
6. **自动恢复** - 自动重试和恢复机制
7. **降级方案** - 提供备用用户体验
8. **错误监控** - 集成错误监控服务

通过正确实现这些错误处理策略，你可以构建出更加健壮、可靠的 React 应用。

---

*最后更新：2024年*