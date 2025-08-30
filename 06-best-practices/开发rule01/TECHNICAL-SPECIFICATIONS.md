# [长截图分割工具] - 技术规范文档

> **版本**: [1.0.0]  
> **创建时间**: [2025-08-30]  
> **适用范围**: [长截图分割工具]项目开发团队  
> **技术栈**: [React 19 + TypeScript + Vite 4.5]

## 📋 文档概览

本技术规范文档为[长截图分割工具]项目定义了编码标准、开发流程、质量保证和最佳实践。所有团队成员必须严格遵循本规范以确保代码质量、一致性和可维护性。

---

## 🔧 技术环境规范

### 核心技术栈要求
参考示例:

```typescript
// 必需版本要求
{
  "react": "^19.0.0",           // React 19 - 并发特性和性能优化
  "typescript": "^5.0.0",       // TypeScript 严格模式
  "vite": "^4.5.0",            // Vite 构建工具
  "vitest": "^3.2.0",          // 测试框架
  "@types/react": "^19.0.0"     // React 类型定义
}
```

### 开发环境配置
参考示例:
#### Node.js 版本要求
- **最低版本**: Node.js 16.x
- **推荐版本**: Node.js 18.x 或更高
- **包管理器**: npm 8.x 或更高

#### IDE 配置要求

参考示例:

```json
// .vscode/settings.json (推荐设置)
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/.backup": true,
    "**/node_modules": true,
    "**/dist": true
  }
}
```

---

## 📝 编码规范

### TypeScript 编码标准

#### 类型定义规范

参考示例:

```typescript
// ✅ 正确：详细的接口定义
interface AppState {
  // Worker 相关状态
  worker: Worker | null;
  blobs: Blob[];
  objectUrls: string[];
  
  // 图片处理状态
  originalImage: HTMLImageElement | null;
  imageSlices: ImageSlice[];
  selectedSlices: Set<number>;
  
  // 处理状态
  isProcessing: boolean;
  
  // 元数据
  splitHeight: number;
  fileName: string;
}

// ✅ 正确：联合类型定义
export type AppAction =
  | { type: 'SET_WORKER'; payload: Worker | null }
  | { type: 'ADD_BLOB'; payload: { blob: Blob; index: number } }
  | { type: 'SET_ORIGINAL_IMAGE'; payload: HTMLImageElement | null };

// ❌ 错误：使用 any 类型
interface BadState {
  data: any;  // 避免使用 any
  config: object;  // 避免使用 object
}
```

#### 泛型使用规范

参考示例:
```typescript
// ✅ 正确：泛型约束
interface ApiResponse<T extends Record<string, unknown>> {
  data: T;
  status: number;
  message: string;
}

// ✅ 正确：条件泛型
type WorkerMessage<T extends string> = T extends 'progress' 
  ? { type: T; progress: number }
  : T extends 'chunk'
  ? { type: T; blob: Blob; index: number }
  : { type: T; message: string };

// ❌ 错误：过于宽泛的泛型
interface BadGeneric<T> {  // 缺乏约束
  value: T;
}
```

#### 严格模式配置

```json
// tsconfig.json - 强制严格模式
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### React 组件开发规范

#### 函数组件标准

参考示例:

```typescript
// ✅ 正确：标准函数组件结构
interface ScreenshotSplitterProps {
  className?: string;
  onProcessComplete?: (slices: ImageSlice[]) => void;
  maxFileSize?: number;
}

const ScreenshotSplitter: React.FC<ScreenshotSplitterProps> = ({
  className,
  onProcessComplete,
  maxFileSize = 50 * 1024 * 1024  // 50MB 默认值
}) => {
  // 1. State 定义
  const [appState, dispatch] = useAppState();
  
  // 2. 副作用 Hook
  useEffect(() => {
    // 组件挂载时的初始化逻辑
    return () => {
      // 清理逻辑
    };
  }, []);
  
  // 3. 事件处理函数（使用 useCallback 优化）
  const handleFileSelect = useCallback((file: File) => {
    if (file.size > maxFileSize) {
      console.error('File size exceeds maximum limit');
      return;
    }
    dispatch({ type: 'SET_PROCESSING', payload: true });
  }, [maxFileSize, dispatch]);
  
  // 4. 计算属性（使用 useMemo 优化）
  const processedSlices = useMemo(() => {
    return appState.imageSlices.filter(slice => 
      appState.selectedSlices.has(slice.index)
    );
  }, [appState.imageSlices, appState.selectedSlices]);
  
  // 5. 渲染逻辑
  return (
    <div className={className}>
      {/* 组件内容 */}
    </div>
  );
};

export default ScreenshotSplitter;
```

#### Hook 开发规范

参考示例:

```typescript
// ✅ 正确：自定义 Hook 标准结构
interface UseImageProcessorOptions {
  splitHeight: number;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

interface UseImageProcessorReturn {
  processImage: (file: File) => Promise<void>;
  progress: number;
  isProcessing: boolean;
  error: Error | null;
  cleanup: () => void;
}

export const useImageProcessor = (
  options: UseImageProcessorOptions
): UseImageProcessorReturn => {
  // 1. State 定义
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 2. Refs 用于保存可变值
  const workerRef = useRef<Worker | null>(null);
  
  // 3. 副作用和清理逻辑
  useEffect(() => {
    return () => {
      // 组件卸载时清理 Worker
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);
  
  // 4. 主要功能函数
  const processImage = useCallback(async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      setProgress(0);
      
      // 创建 Worker 实例
      workerRef.current = new Worker('/src/workers/split.worker.js');
      
      // Worker 消息处理
      workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const { type, progress: workerProgress } = event.data;
        
        if (type === 'progress' && workerProgress !== undefined) {
          setProgress(workerProgress);
          options.onProgress?.(workerProgress);
        }
      };
      
      // 发送处理任务
      workerRef.current.postMessage({
        imageData: await file.arrayBuffer(),
        splitHeight: options.splitHeight
      });
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  }, [options]);
  
  // 5. 清理函数
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setProgress(0);
    setIsProcessing(false);
    setError(null);
  }, []);
  
  // 6. 返回接口
  return {
    processImage,
    progress,
    isProcessing,
    error,
    cleanup
  };
};
```

#### 性能优化规范

参考示例:


```typescript
// ✅ 正确：React.memo 优化纯组件
interface ImagePreviewProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

const ImagePreview = React.memo<ImagePreviewProps>(({ 
  src, 
  alt, 
  width, 
  height 
}) => {
  return (
    <img 
      src={src} 
      alt={alt} 
      width={width} 
      height={height}
      loading="lazy"
    />
  );
});

// 为 memo 组件添加显示名称
ImagePreview.displayName = 'ImagePreview';

// ✅ 正确：使用 useCallback 优化事件处理
const ParentComponent: React.FC = () => {
  const [items, setItems] = useState<string[]>([]);
  
  // 使用 useCallback 避免子组件不必要的重渲染
  const handleItemAdd = useCallback((newItem: string) => {
    setItems(prev => [...prev, newItem]);
  }, []);
  
  const handleItemRemove = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  return (
    <div>
      {items.map((item, index) => (
        <ItemComponent 
          key={item} 
          item={item}
          onRemove={handleItemRemove}
        />
      ))}
    </div>
  );
};

// ✅ 正确：使用 useMemo 优化计算属性
const ExpensiveComponent: React.FC<{ data: ComplexData[] }> = ({ data }) => {
  // 复杂计算缓存
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: expensiveCalculation(item)
    }));
  }, [data]);
  
  // 筛选结果缓存
  const filteredData = useMemo(() => {
    return processedData.filter(item => item.processed > 0);
  }, [processedData]);
  
  return (
    <div>
      {filteredData.map(item => (
        <div key={item.id}>{item.processed}</div>
      ))}
    </div>
  );
};
```

### 状态管理规范

#### useReducer 模式

参考示例:

```typescript
// ✅ 正确：清晰的 Action 类型定义
type AppAction =
  | { type: 'SET_WORKER'; payload: Worker | null }
  | { type: 'ADD_BLOB'; payload: { blob: Blob; index: number } }
  | { type: 'SET_ORIGINAL_IMAGE'; payload: HTMLImageElement | null }
  | { type: 'ADD_IMAGE_SLICE'; payload: ImageSlice }
  | { type: 'TOGGLE_SLICE_SELECTION'; payload: number }
  | { type: 'SELECT_ALL_SLICES' }
  | { type: 'DESELECT_ALL_SLICES' }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'CLEANUP_SESSION' };

// ✅ 正确：Reducer 函数实现
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_WORKER':
      return {
        ...state,
        worker: action.payload
      };
      
    case 'ADD_BLOB':
      return {
        ...state,
        blobs: [...state.blobs, action.payload.blob],
        objectUrls: [...state.objectUrls, URL.createObjectURL(action.payload.blob)]
      };
      
    case 'TOGGLE_SLICE_SELECTION':
      const newSelectedSlices = new Set(state.selectedSlices);
      if (newSelectedSlices.has(action.payload)) {
        newSelectedSlices.delete(action.payload);
      } else {
        newSelectedSlices.add(action.payload);
      }
      return {
        ...state,
        selectedSlices: newSelectedSlices
      };
      
    case 'CLEANUP_SESSION':
      // 清理 Object URLs
      state.objectUrls.forEach(url => URL.revokeObjectURL(url));
      
      // 终止 Worker
      if (state.worker) {
        state.worker.terminate();
      }
      
      return {
        ...state,
        worker: null,
        blobs: [],
        objectUrls: [],
        originalImage: null,
        imageSlices: [],
        selectedSlices: new Set(),
        isProcessing: false
      };
      
    default:
      return state;
  }
};

// ✅ 正确：自定义 Hook 封装状态管理
export const useAppState = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // 清理副作用
  useEffect(() => {
    return () => {
      // 组件卸载时清理资源
      dispatch({ type: 'CLEANUP_SESSION' });
    };
  }, []);
  
  return [state, dispatch] as const;
};
```

---

## 🧪 测试规范

### 测试框架配置

#### Vitest 配置标准

参考示例:

```typescript
// vitest.config.ts - 标准配置
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    reporters: ['verbose', 'json'],
    
    // 覆盖率要求
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        },
        // 核心模块更高要求
        'src/utils/seo/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    
    // 并行测试配置
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 2
      }
    }
  }
});
```

### 单元测试规范

#### React 组件测试

参考示例:


```typescript
// ✅ 正确：组件测试结构
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ScreenshotSplitter } from '../ScreenshotSplitter';

describe('ScreenshotSplitter', () => {
  // 1. 测试前置设置
  beforeEach(() => {
    // 模拟 Worker
    global.Worker = vi.fn().mockImplementation(() => ({
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: vi.fn(),
      onerror: vi.fn(),
    }));
    
    // 模拟 URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mocked-url');
    global.URL.revokeObjectURL = vi.fn();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  // 2. 基础渲染测试
  it('renders without crashing', () => {
    render(<ScreenshotSplitter />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
  
  // 3. 交互行为测试
  it('handles file upload correctly', async () => {
    const user = userEvent.setup();
    const mockOnProcessComplete = vi.fn();
    
    render(<ScreenshotSplitter onProcessComplete={mockOnProcessComplete} />);
    
    const fileInput = screen.getByLabelText(/upload image/i);
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    await user.upload(fileInput, file);
    
    expect(fileInput.files[0]).toBe(file);
    expect(fileInput.files).toHaveLength(1);
  });
  
  // 4. 错误状态测试
  it('displays error when file size exceeds limit', async () => {
    const user = userEvent.setup();
    
    render(<ScreenshotSplitter maxFileSize={1024} />); // 1KB limit
    
    const fileInput = screen.getByLabelText(/upload image/i);
    const largeFile = new File(['x'.repeat(2048)], 'large.png', { 
      type: 'image/png' 
    });
    
    await user.upload(fileInput, largeFile);
    
    await waitFor(() => {
      expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument();
    });
  });
  
  // 5. 异步操作测试
  it('shows processing state during image processing', async () => {
    const user = userEvent.setup();
    
    render(<ScreenshotSplitter />);
    
    const fileInput = screen.getByLabelText(/upload image/i);
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    await user.upload(fileInput, file);
    
    // 验证处理状态显示
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

#### Hook 测试

```typescript
// ✅ 正确：自定义 Hook 测试
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useImageProcessor } from '../hooks/useImageProcessor';

describe('useImageProcessor', () => {
  beforeEach(() => {
    global.Worker = vi.fn().mockImplementation(() => ({
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
      onerror: null,
    }));
  });
  
  it('initializes with correct default state', () => {
    const { result } = renderHook(() => 
      useImageProcessor({ splitHeight: 800 })
    );
    
    expect(result.current.progress).toBe(0);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
  });
  
  it('processes image and updates progress', async () => {
    const mockOnProgress = vi.fn();
    
    const { result } = renderHook(() => 
      useImageProcessor({ 
        splitHeight: 800, 
        onProgress: mockOnProgress 
      })
    );
    
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    
    await act(async () => {
      await result.current.processImage(mockFile);
    });
    
    expect(result.current.isProcessing).toBe(true);
    expect(mockOnProgress).toHaveBeenCalled();
  });
  
  it('cleans up resources on unmount', () => {
    const mockWorker = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
      onerror: null,
    };
    
    global.Worker = vi.fn(() => mockWorker);
    
    const { unmount } = renderHook(() => 
      useImageProcessor({ splitHeight: 800 })
    );
    
    unmount();
    
    expect(mockWorker.terminate).toHaveBeenCalled();
  });
});
```

### 集成测试规范

参考示例:

```typescript
// ✅ 正确：集成测试示例
describe('Image Processing Integration', () => {
  it('completes full processing workflow', async () => {
    const user = userEvent.setup();
    
    render(<App />);
    
    // 1. 上传文件
    const fileInput = screen.getByLabelText(/upload/i);
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    await user.upload(fileInput, file);
    
    // 2. 设置分割参数
    const heightInput = screen.getByLabelText(/split height/i);
    await user.clear(heightInput);
    await user.type(heightInput, '800');
    
    // 3. 开始处理
    const processButton = screen.getByRole('button', { name: /process/i });
    await user.click(processButton);
    
    // 4. 等待处理完成
    await waitFor(() => {
      expect(screen.getByText(/processing complete/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // 5. 验证结果
    expect(screen.getByText(/slices generated/i)).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength.greaterThan(0);
  });
});
```

---

## 🔒 错误处理和调试规范

### 错误边界实现

参考示例:

```typescript
// ✅ 正确：错误边界组件
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps, 
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // 错误报告
    this.props.onError?.(error, errorInfo);
    
    // 开发环境下输出详细错误
    if (import.meta.env.DEV) {
      console.group('🚨 React Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }
    
    return this.props.children;
  }
}
```

### 调试工具规范

参考示例:

```typescript
// ✅ 正确：开发环境调试工具
const DEBUG = import.meta.env.DEV;

// 条件调试输出
const debug = {
  log: (message: string, ...args: unknown[]) => {
    if (DEBUG) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: unknown[]) => {
    if (DEBUG) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  },
  
  error: (message: string, error?: Error, ...args: unknown[]) => {
    if (DEBUG) {
      console.group(`🚨 [ERROR] ${message}`);
      if (error) {
        console.error('Error:', error);
        console.error('Stack:', error.stack);
      }
      if (args.length > 0) {
        console.error('Additional info:', ...args);
      }
      console.groupEnd();
    }
  },
  
  time: (label: string) => {
    if (DEBUG) {
      console.time(`⏱️ ${label}`);
    }
  },
  
  timeEnd: (label: string) => {
    if (DEBUG) {
      console.timeEnd(`⏱️ ${label}`);
    }
  }
};

// 生产环境清理
// 生产构建时自动移除所有 console.* 调用
// vite.config.ts 配置移除调试代码
```

### 异步错误处理

```typescript
// ✅ 正确：异步操作错误处理
const useAsyncOperation = <T, E = Error>(
  asyncFn: () => Promise<T>
): {
  data: T | null;
  loading: boolean;
  error: E | null;
  execute: () => Promise<void>;
  reset: () => void;
} => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<E | null>(null);
  
  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await asyncFn();
      setData(result);
    } catch (err) {
      const error = err as E;
      setError(error);
      
      // 错误日志记录
      debug.error('Async operation failed', err as Error);
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);
  
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);
  
  return { data, loading, error, execute, reset };
};
```

---

## 🚀 性能优化规范

### Web Workers 使用规范

参考示例:

```typescript
// ✅ 正确：Web Worker 封装
class ImageProcessorWorker {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingMessages = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();
  
  constructor() {
    this.createWorker();
  }
  
  private createWorker() {
    this.worker = new Worker('/src/workers/split.worker.js', {
      type: 'module'
    });
    
    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { messageId, type, data, error } = event.data;
      
      if (messageId && this.pendingMessages.has(messageId)) {
        const { resolve, reject } = this.pendingMessages.get(messageId)!;
        this.pendingMessages.delete(messageId);
        
        if (error) {
          reject(new Error(error));
        } else {
          resolve(data);
        }
      }
    };
    
    this.worker.onerror = (error) => {
      debug.error('Worker error', error as any);
    };
  }
  
  async processImage(
    imageData: ArrayBuffer, 
    splitHeight: number
  ): Promise<ImageSlice[]> {
    if (!this.worker) {
      throw new Error('Worker not available');
    }
    
    const messageId = ++this.messageId;
    
    return new Promise((resolve, reject) => {
      this.pendingMessages.set(messageId, { resolve, reject });
      
      this.worker!.postMessage({
        messageId,
        type: 'PROCESS_IMAGE',
        imageData,
        splitHeight
      }, [imageData]); // 转移所有权
    });
  }
  
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // 清理待处理的消息
    this.pendingMessages.forEach(({ reject }) => {
      reject(new Error('Worker terminated'));
    });
    this.pendingMessages.clear();
  }
}
```

### 内存管理规范

```typescript
// ✅ 正确：资源清理模式
class ResourceManager {
  private resources: Set<() => void> = new Set();
  
  addCleanupCallback(cleanup: () => void) {
    this.resources.add(cleanup);
  }
  
  cleanup() {
    this.resources.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        debug.error('Resource cleanup failed', error as Error);
      }
    });
    this.resources.clear();
  }
}

// Hook 中使用资源管理器
const useResourceManager = () => {
  const resourceManager = useRef(new ResourceManager());
  
  useEffect(() => {
    return () => {
      resourceManager.current.cleanup();
    };
  }, []);
  
  return resourceManager.current;
};

// 在组件中使用
const ImageProcessor: React.FC = () => {
  const resourceManager = useResourceManager();
  
  useEffect(() => {
    const worker = new Worker('/worker.js');
    resourceManager.addCleanupCallback(() => worker.terminate());
    
    const objectUrls: string[] = [];
    resourceManager.addCleanupCallback(() => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    });
  }, [resourceManager]);
};
```

---

## 📐 代码组织规范

### 目录结构标准

```
src/
├── components/              # React 组件
│   ├── ui/                 # 通用 UI 组件
│   ├── business/           # 业务组件
│   └── layout/             # 布局组件
├── hooks/                  # 自定义 Hooks
│   ├── business/           # 业务逻辑 Hooks
│   ├── ui/                 # UI 相关 Hooks
│   └── utils/              # 工具 Hooks
├── utils/                  # 工具函数
│   ├── image/              # 图片处理
│   ├── seo/                # SEO 相关
│   ├── analytics/          # 分析工具
│   └── helpers/            # 辅助函数
├── types/                  # TypeScript 类型定义
├── constants/              # 常量定义
├── workers/                # Web Workers
├── assets/                 # 静态资源
└── test-setup.ts          # 测试配置
```

### 导入导出规范

参考示例:


```typescript
// ✅ 正确：导入顺序和分组
// 1. React 相关
import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

// 2. 第三方库
import { clsx } from 'clsx';
import { format } from 'date-fns';

// 3. 项目内部模块（绝对路径）
import { Button } from '@/components/ui/Button';
import { useAppState } from '@/hooks/useAppState';

// 4. 相对路径导入（同级或子级）
import { ImageSlice } from './types';
import { processImage } from './utils';

// ✅ 正确：导出规范
// 默认导出：主要组件或函数
export default ScreenshotSplitter;

// 命名导出：工具函数、类型、常量
export { ImageProcessor } from './ImageProcessor';
export type { ImageSlice, ProcessingOptions } from './types';
export const DEFAULT_SPLIT_HEIGHT = 800;

// ✅ 正确：索引文件导出
// src/components/index.ts
export { default as ScreenshotSplitter } from './ScreenshotSplitter';
export { default as FileUploader } from './FileUploader';
export { default as ImagePreview } from './ImagePreview';

// 类型导出
export type { 
  ScreenshotSplitterProps,
  FileUploaderProps,
  ImagePreviewProps 
} from './types';
```

### 命名规范

```typescript
// ✅ 正确：命名约定

// 1. 组件命名：PascalCase
const ScreenshotSplitter: React.FC = () => {};
const FileUploader: React.FC = () => {};

// 2. Hook 命名：camelCase + use 前缀
const useImageProcessor = () => {};
const useAppState = () => {};

// 3. 函数命名：camelCase，动词开头
const processImage = (file: File) => {};
const validateFileType = (file: File) => boolean;

// 4. 变量命名：camelCase
const splitHeight = 800;
const isProcessing = false;
const selectedSlices = new Set<number>();

// 5. 常量命名：SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const SUPPORTED_FORMATS = ['image/png', 'image/jpeg'];
const DEFAULT_CONFIG = {
  splitHeight: 800,
  maxFileSize: MAX_FILE_SIZE
} as const;

// 6. 类型命名：PascalCase
interface AppState {
  // ...
}

type ProcessingStatus = 'idle' | 'processing' | 'complete' | 'error';

// 7. 枚举命名：PascalCase
enum ProcessingStage {
  Idle = 'idle',
  Validating = 'validating',
  Processing = 'processing',
  Complete = 'complete'
}

// 8. 私有属性/方法：下划线前缀
class ImageProcessor {
  private _worker: Worker | null = null;
  private _processImage(data: ArrayBuffer) {}
}
```

---

## 🔧 构建和部署规范

### Vite 配置标准



```typescript
// vite.config.ts - 生产构建配置
export default defineConfig({
  plugins: [
    react(),
    // 生产环境移除 console
    {
      name: 'remove-console',
      transform(code, id) {
        if (process.env.NODE_ENV === 'production') {
          return code.replace(/console\.(log|debug|info|warn|error|assert|dir|dirxml|group|groupEnd|time|timeEnd|profile|profileEnd|count)\(.*?\);?/g, '');
        }
      }
    }
  ],
  
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          workers: ['./src/workers/split.worker.js']
        }
      }
    },
    
    // 资源优化
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    sourcemap: false // 生产环境关闭
  },
  
  define: {
    __DEV__: process.env.NODE_ENV === 'development'
  }
});
```

### 环境变量管理
参考示例:
```typescript
// .env.example - 环境变量模板
VITE_APP_TITLE=长截图分割工具
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=https://api.example.com
VITE_ENABLE_ANALYTICS=true
VITE_GA_TRACKING_ID=GA_MEASUREMENT_ID
VITE_MAX_FILE_SIZE=52428800

// src/config/env.ts - 环境变量类型安全
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_GA_TRACKING_ID: string;
  readonly VITE_MAX_FILE_SIZE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 环境变量验证和默认值
export const env = {
  APP_TITLE: import.meta.env.VITE_APP_TITLE || '长截图分割工具',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  GA_TRACKING_ID: import.meta.env.VITE_GA_TRACKING_ID || '',
  MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '52428800', 10),
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD
} as const;
```

---

## 📊 代码质量检查

### ESLint 配置

```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "rules": {
    // TypeScript 规则
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/prefer-const": "error",
    
    // React 规则
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    
    // 通用规则
    "no-console": "warn",
    "no-debugger": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier 配置

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "jsxBracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

---

## 📚 文档编写规范

### JSDoc 注释标准

```typescript
/**
 * 图片处理器 - 负责长截图分割处理
 * 
 * @example
 * ```typescript
 * const processor = new ImageProcessor({
 *   splitHeight: 800,
 *   maxFileSize: 50 * 1024 * 1024
 * });
 * 
 * const result = await processor.process(file);
 * console.log(`Generated ${result.slices.length} slices`);
 * ```
 */
class ImageProcessor {
  /**
   * 处理图片并生成切片
   * 
   * @param file - 要处理的图片文件
   * @param options - 处理选项
   * @param options.splitHeight - 切片高度，默认 800px
   * @param options.quality - 输出质量 0-1，默认 0.9
   * @returns 包含所有切片的处理结果
   * 
   * @throws {ProcessingError} 当文件格式不支持时抛出
   * @throws {FileSizeError} 当文件大小超出限制时抛出
   * 
   * @since 1.0.0
   */
  async process(
    file: File, 
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    // 实现...
  }
}

// hook jsDOC 注释
/**
 * 图片处理器 - 负责长截图分割处理
 * 
 * @example
 * ```typescript
 * const processor = new ImageProcessor({
 *   splitHeight: 800,
 *   maxFileSize: 50 * 1024 * 1024
 * });
 * 
 * const result = await processor.process(file);
 * console.log(`Generated ${result.slices.length} slices`);
 * ```
 */
const useImageProcessor = () => {
  // 实现...
};

// utils jsDOC 注释
/**
 * 图片处理器 - 负责长截图分割处理
 * 
 * @example
 * ```typescript
 * const processor = new ImageProcessor({
 *   splitHeight: 800,
 *   maxFileSize: 50 * 1024 * 1024
 * });
 * 
 * const result = await processor.process(file);
 * console.log(`Generated ${result.slices.length} slices`);
 * ```
 */
const processImage = (file: File) => {
  // 实现...
};  


```

### README 文档模板

```markdown
# 组件名称

简短描述组件的功能和用途。

## 安装

\`\`\`bash
npm install package-name
\`\`\`

## 基本用法

\`\`\`typescript
import { ComponentName } from 'package-name';

function App() {
  return (
    <ComponentName
      prop1="value1"
      prop2={value2}
    />
  );
}
\`\`\`

## API 参考

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| prop1  | string | - | 属性说明 |
| prop2  | number | 0 | 属性说明 |

### 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| onEvent | (data: EventData) => void | 事件说明 |

## 示例

### 基础示例
[示例代码]

### 高级用法
[示例代码]

## 注意事项

- 重要提醒1
- 重要提醒2

## 更新日志

### v1.0.0
- 初始版本
```

---

## 🔄 Git 工作流规范

### 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 提交类型 (type)
- **feat**: 新功能
- **fix**: Bug 修复
- **docs**: 文档更新
- **style**: 代码格式调整（不影响功能）
- **refactor**: 代码重构
- **test**: 测试相关
- **chore**: 构建过程或辅助工具的变动
- **perf**: 性能优化

#### 示例
```bash
feat(image-processor): add support for WebP format

- Add WebP format validation
- Update worker to handle WebP conversion
- Add WebP format tests

Closes #123
```

### 分支命名规范

```bash
# 功能分支
feature/add-webp-support
feature/seo-optimization

# 修复分支
fix/memory-leak-worker
fix/typescript-errors

# 热修复分支
hotfix/critical-security-patch

# 发布分支
release/v1.2.0
```

---

## ✅ 代码审查清单

### 功能性检查
- [ ] 功能是否按需求实现
- [ ] 边界条件是否处理
- [ ] 错误处理是否完善
- [ ] 性能是否可接受

### 代码质量检查
- [ ] 代码是否遵循项目规范
- [ ] 命名是否清晰易懂
- [ ] 是否有重复代码
- [ ] 是否过度设计

### 安全性检查
- [ ] 输入验证是否充分
- [ ] 是否有潜在的安全漏洞
- [ ] 敏感信息是否正确处理

### 测试完整性
- [ ] 单元测试是否覆盖主要功能
- [ ] 集成测试是否通过
- [ ] 测试用例是否充分

### 文档完整性
- [ ] API 文档是否更新
- [ ] README 是否需要更新
- [ ] 注释是否清晰准确

---

## 📈 持续改进

### 代码度量指标

```typescript
// 代码复杂度监控
interface CodeMetrics {
  cyclomaticComplexity: number;    // 圈复杂度 < 10
  cognitiveComplexity: number;     // 认知复杂度 < 15
  linesOfCode: number;            // 代码行数 < 300/文件
  testCoverage: number;           // 测试覆盖率 > 80%
  technicalDebt: number;          // 技术债务时间
  duplicatedLines: number;        // 重复代码行数 < 3%
}
```

### 性能基准

| 指标 | 目标值 | 监控方式 |
|------|--------|----------|
| 首次内容渲染 (FCP) | < 1.5s | Lighthouse |
| 最大内容渲染 (LCP) | < 2.5s | Web Vitals |
| 首次输入延迟 (FID) | < 100ms | Web Vitals |
| 累积布局偏移 (CLS) | < 0.1 | Web Vitals |
| 包大小 | < 500KB | Bundle Analyzer |

### 代码审查反馈循环

1. **自动检查**: ESLint, TypeScript, 测试
2. **同行审查**: 代码审查清单
3. **自动部署**: CI/CD 流水线验证
4. **监控反馈**: 生产环境指标
5. **持续改进**: 定期回顾和优化

---

## 📞 技术支持

### 问题报告
遇到技术问题时，请提供以下信息：
- 问题描述和复现步骤
- 错误信息和堆栈跟踪
- 环境信息（Node.js、npm 版本等）
- 相关代码片段

### 最佳实践更新
本技术规范文档会定期更新，请关注：
- 新技术栈的引入和升级
- 性能优化的最新实践
- 安全规范的更新
- 工具链的改进

---

**文档版本**: [v1.0.0]  
**最后更新**: [2025-08-30]  
**维护团队**: [长截图分割工具开发团队]  
**审核状态**: 待审核

[*本技术规范文档是长截图分割工具项目开发的基础标准，所有团队成员必须严格遵循。如有疑问或建议，请及时反馈。*]