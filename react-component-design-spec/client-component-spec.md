# React 客户端组件设计规范

> 基于 React 18.3.1 的客户端组件开发最佳实践

## 📋 概述

本规范专门针对 React 客户端组件的设计和开发，提供完整的指导原则、最佳实践和实现模式。客户端组件运行在浏览器环境中，具有完整的交互能力和状态管理功能。

## 🎯 客户端组件特性

### 核心特征

```typescript
// 客户端组件特征标识
'use client';

interface ClientComponentFeatures {
  // 交互能力
  interactivity: true;
  
  // 状态管理
  stateManagement: true;
  
  // 事件处理
  eventHandling: true;
  
  // 生命周期
  lifecycleHooks: true;
  
  // 浏览器 API
  browserAPIs: true;
  
  // DOM 操作
  domManipulation: true;
  
  // 异步操作
  asyncOperations: true;
  
  // 性能优化
  optimization: true;
}
```

### 适用场景

```typescript
// 客户端组件适用场景判断
type ClientComponentUseCase = 
  | 'user_interactions'      // 用户交互（点击、输入、拖拽等）
  | 'form_handling'         // 表单处理和验证
  | 'state_management'      // 复杂状态管理
  | 'real_time_updates'     // 实时数据更新
  | 'animations'            // 动画和过渡效果
  | 'browser_apis'          // 需要访问浏览器 API
  | 'third_party_libs'      // 需要客户端第三方库
  | 'local_storage'         // 需要本地存储
  | 'geolocation'          // 地理位置服务
  | 'camera_mic'           // 摄像头和麦克风访问
  | 'canvas_webgl'          // Canvas/WebGL 图形处理;
```

## 🏗️ 基础组件架构

### 组件基础模板

```typescript
// templates/client-component-template.tsx
'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useId
} from 'react';
import { cn } from '@/lib/utils';

interface ClientComponentProps {
  // 基础属性
  className?: string;
  children?: React.ReactNode;
  
  // 数据属性
  data?: Record<string, any>;
  
  // 事件处理器
  onClick?: (event: React.MouseEvent) => void;
  onChange?: (value: any) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  
  // 状态属性
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  
  // 样式属性
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  
  // 可访问性
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
}

export const ClientComponent: React.FC<ClientComponentProps> = ({
  className,
  children,
  data,
  onClick,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  loading = false,
  error,
  variant = 'default',
  size = 'md',
  ariaLabel,
  ariaDescribedBy,
  role = 'button',
  ...props
}) => {
  // 生成唯一 ID
  const componentId = useId();
  const errorId = error ? `${componentId}-error` : undefined;
  
  // 内部状态
  const [internalState, setInternalState] = useState<any>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Refs
  const elementRef = useRef<HTMLDivElement>(null);
  
  // 计算属性
  const computedClasses = useMemo(() => {
    return cn(
      'client-component',
      `client-component--${variant}`,
      `client-component--${size}`,
      {
        'client-component--disabled': disabled,
        'client-component--loading': loading,
        'client-component--error': !!error,
        'client-component--focused': isFocused,
        'client-component--hovered': isHovered,
      },
      className
    );
  }, [variant, size, disabled, loading, error, isFocused, isHovered, className]);
  
  // 事件处理器
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (disabled || loading) return;
    
    // 阻止事件冒泡（如果需要）
    // event.stopPropagation();
    
    // 执行点击处理
    onClick?.(event);
    
    // 触发触觉反馈（移动端）
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [disabled, loading, onClick]);
  
  const handleChange = useCallback((value: any) => {
    if (disabled || loading) return;
    onChange?.(value);
  }, [disabled, loading, onChange]);
  
  const handleFocus = useCallback((event: React.FocusEvent) => {
    setIsFocused(true);
    onFocus?.(event);
  }, [onFocus]);
  
  const handleBlur = useCallback((event: React.FocusEvent) => {
    setIsFocused(false);
    onBlur?.(event);
  }, [onBlur]);
  
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  
  // 副作用
  useEffect(() => {
    // 组件挂载时的初始化
    console.log('ClientComponent mounted:', componentId);
    
    // 添加全局事件监听器
    const handleGlobalClick = (event: MouseEvent) => {
      // 处理点击外部的情况
      if (elementRef.current && !elementRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    
    return () => {
      // 清理工作
      console.log('ClientComponent unmounted:', componentId);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [componentId]);
  
  // 性能优化：使用 useOptimisticState
  const [optimisticState, setOptimisticState] = useState(false);
  
  const handleOptimisticUpdate = useCallback(async () => {
    // 乐观更新
    setOptimisticState(true);
    
    try {
      // 执行异步操作
      await performAsyncOperation();
    } catch (error) {
      console.error('Optimistic update failed:', error);
    } finally {
      setOptimisticState(false);
    }
  }, []);
  
  // 异步操作模拟
  const performAsyncOperation = async () => {
    return new Promise(resolve => setTimeout(resolve, 1000));
  };
  
  // 渲染
  return (
    <div
      ref={elementRef}
      className={computedClasses}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-state={JSON.stringify(data)}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy || errorId}
      role={role}
      aria-disabled={disabled}
      aria-busy={loading}
      {...props}
    >
      {/* 加载状态 */}
      {loading && (
        <div className="client-component__loading">
          <div className="client-component__spinner" />
          <span className="client-component__loading-text">Loading...</span>
        </div>
      )}
      
      {/* 错误状态 */}
      {error && (
        <div 
          id={errorId}
          className="client-component__error"
          role="alert"
        >
          {error}
        </div>
      )}
      
      {/* 主要内容 */}
      <div className="client-component__content">
        {children}
      </div>
      
      {/* 乐观更新指示器 */}
      {optimisticState && (
        <div className="client-component__optimistic">
          <span className="client-component__optimistic-indicator" />
        </div>
      )}
    </div>
  );
};

// 组件显示名称
ClientComponent.displayName = 'ClientComponent';

// 默认属性
ClientComponent.defaultProps = {
  variant: 'default',
  size: 'md',
  disabled: false,
  loading: false,
};

export default ClientComponent;
```

### 高级客户端组件模式

```typescript
// templates/advanced-client-component.tsx
'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useId,
  useTransition,
  useDeferredValue,
  useOptimistic,
  useActionState
} from 'react';
import { useDebounce, useThrottle, useLocalStorage } from '@/hooks/use-client-features';
import { cn } from '@/lib/utils';

interface AdvancedClientComponentProps {
  // 复杂数据处理
  dataSource: any[];
  onDataSourceChange?: (data: any[]) => void;
  
  // 高级交互
  draggable?: boolean;
  resizable?: boolean;
  sortable?: boolean;
  
  // 动画配置
  animations?: {
    enter?: string;
    exit?: string;
    duration?: number;
  };
  
  // 主题配置
  theme?: 'light' | 'dark' | 'auto';
  
  // 国际化
  locale?: string;
  
  // 高级属性
  virtualized?: boolean;
  infiniteScroll?: boolean;
  
  // 继承基础属性
  className?: string;
  children?: React.ReactNode;
}

export const AdvancedClientComponent: React.FC<AdvancedClientComponentProps> = ({
  dataSource,
  onDataSourceChange,
  draggable = false,
  resizable = false,
  sortable = false,
  animations,
  theme = 'auto',
  locale = 'zh-CN',
  virtualized = false,
  infiniteScroll = false,
  className,
  children
}) => {
  // React 18 并发特性
  const [isPending, startTransition] = useTransition();
  const deferredDataSource = useDeferredValue(dataSource);
  
  // 乐观更新
  const [optimisticData, setOptimisticData] = useOptimistic(
    dataSource,
    (currentData, newData) => [...currentData, ...newData]
  );
  
  // Action State（表单操作）
  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      // 处理表单提交
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: '提交成功' };
    },
    { success: false, message: '' }
  );
  
  // 本地存储
  const [savedState, setSavedState] = useLocalStorage('component-state', {
    theme,
    locale,
    preferences: {}
  });
  
  // 防抖和节流
  const debouncedSearch = useDebounce((searchTerm: string) => {
    startTransition(() => {
      // 执行搜索
      console.log('Searching:', searchTerm);
    });
  }, 300);
  
  const throttledScroll = useThrottle((scrollPosition: number) => {
    // 处理滚动事件
    console.log('Scroll position:', scrollPosition);
  }, 100);
  
  // 复杂状态管理
  const [componentState, setComponentState] = useState({
    selectedItems: new Set<string>(),
    expandedItems: new Set<string>(),
    sortConfig: { key: 'id', direction: 'asc' },
    filterConfig: { search: '', category: 'all' },
    viewMode: 'grid',
    isLoading: false,
    error: null as Error | null
  });
  
  // 拖拽功能
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const dragOverItem = useRef<any>(null);
  
  // 虚拟化计算
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  
  // 动画控制器
  const animationRef = useRef<Animation>();
  
  // 计算属性
  const filteredData = useMemo(() => {
    return deferredDataSource.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(
        componentState.filterConfig.search.toLowerCase()
      );
      const matchesCategory = componentState.filterConfig.category === 'all' ||
        item.category === componentState.filterConfig.category;
      
      return matchesSearch && matchesCategory;
    });
  }, [deferredDataSource, componentState.filterConfig]);
  
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const { key, direction } = componentState.sortConfig;
      const modifier = direction === 'asc' ? 1 : -1;
      return a[key] > b[key] ? modifier : -modifier;
    });
  }, [filteredData, componentState.sortConfig]);
  
  // 事件处理器
  const handleDragStart = useCallback((item: any) => {
    if (!draggable) return;
    
    setDraggedItem(item);
    
    // 设置拖拽图像
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    event?.dataTransfer?.setDragImage(dragImage, 0, 0);
  }, [draggable]);
  
  const handleDragOver = useCallback((event: React.DragEvent, item: any) => {
    event.preventDefault();
    dragOverItem.current = item;
  }, []);
  
  const handleDrop = useCallback((event: React.DragEvent, targetItem: any) => {
    event.preventDefault();
    
    if (!draggedItem || !sortable) return;
    
    // 重新排序逻辑
    const newOrder = [...optimisticData];
    const draggedIndex = newOrder.findIndex(item => item.id === draggedItem.id);
    const targetIndex = newOrder.findIndex(item => item.id === targetItem.id);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedItem);
      
      setOptimisticData(newOrder);
      onDataSourceChange?.(newOrder);
    }
    
    setDraggedItem(null);
  }, [draggedItem, optimisticData, sortable, setOptimisticData, onDataSourceChange]);
  
  const handleVirtualScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    const itemHeight = 50; // 假设每项高度为 50px
    const containerHeight = 400; // 容器高度
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + 5, sortedData.length);
    
    setVisibleRange({ start: startIndex, end: endIndex });
    throttledScroll(scrollTop);
  }, [sortedData.length, throttledScroll]);
  
  // 主题切换
  const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'auto') => {
    startTransition(() => {
      setSavedState(prev => ({ ...prev, theme: newTheme }));
      
      // 应用主题到 document
      if (newTheme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', isDark);
      } else {
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
    });
  }, [setSavedState]);
  
  // 动画处理
  const playAnimation = useCallback(() => {
    if (!animations) return;
    
    const element = document.querySelector('.advanced-component');
    if (!element) return;
    
    animationRef.current = element.animate(
      [
        { transform: 'scale(0.8)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
      ],
      {
        duration: animations.duration || 300,
        easing: 'ease-out'
      }
    );
  }, [animations]);
  
  // 副作用
  useEffect(() => {
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      if (savedState.theme === 'auto') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    
    // 初始化主题
    handleThemeChange(savedState.theme);
    
    // 播放入场动画
    playAnimation();
    
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
      animationRef.current?.cancel();
    };
  }, [savedState.theme, playAnimation]);
  
  // 渲染虚拟化内容
  const renderVirtualizedContent = () => {
    if (!virtualized) {
      return sortedData.map(item => (
        <div key={item.id} className="virtual-item">
          {item.content}
        </div>
      ));
    }
    
    const visibleItems = sortedData.slice(visibleRange.start, visibleRange.end);
    const totalHeight = sortedData.length * 50; // 假设每项高度为 50px
    const offsetY = visibleRange.start * 50;
    
    return (
      <div 
        className="virtual-container"
        style={{ height: `${totalHeight}px`, position: 'relative' }}
        onScroll={handleVirtualScroll}
      >
        <div 
          className="virtual-spacer"
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: `${offsetY}px` 
          }}
        />
        {visibleItems.map(item => (
          <div
            key={item.id}
            className="virtual-item"
            draggable={draggable}
            onDragStart={() => handleDragStart(item)}
            onDragOver={(e) => handleDragOver(e, item)}
            onDrop={(e) => handleDrop(e, item)}
            style={{
              position: 'absolute',
              top: `${visibleItems.indexOf(item) * 50 + offsetY}px`,
              left: 0,
              right: 0,
              height: '50px'
            }}
          >
            {item.content}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className={cn('advanced-client-component', className)}>
      {/* 主题切换器 */}
      <div className="theme-switcher">
        <button onClick={() => handleThemeChange('light')}>☀️</button>
        <button onClick={() => handleThemeChange('dark')}>🌙</button>
        <button onClick={() => handleThemeChange('auto')}>🌗</button>
      </div>
      
      {/* 状态指示器 */}
      {isPending && (
        <div className="loading-indicator">
          正在处理中...
        </div>
      )}
      
      {/* 主要内容 */}
      <div className="component-content">
        {renderVirtualizedContent()}
        {children}
      </div>
      
      {/* 表单状态显示 */}
      {state.message && (
        <div className={`form-message ${state.success ? 'success' : 'error'}`}>
          {state.message}
        </div>
      )}
    </div>
  );
};

AdvancedClientComponent.displayName = 'AdvancedClientComponent';

export default AdvancedClientComponent;
```

## 🎨 客户端组件 Hooks

### 客户端专用 Hooks

```typescript
// hooks/use-client-features.ts
import { useState, useEffect, useCallback, useRef } from 'react';

// 防抖 Hook
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
};

// 节流 Hook
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallRef.current >= delay) {
      callback(...args);
      lastCallRef.current = now;
    }
  }, [callback, delay]) as T;
};

// 本地存储 Hook
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  return [storedValue, setValue];
};

// 会话存储 Hook
export const useSessionStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.sessionStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  return [storedValue, setValue];
};

// 窗口大小 Hook
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return windowSize;
};

// 设备类型 Hook
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };
    
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);
  
  return deviceType;
};

// 在线状态 Hook
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
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
  
  return isOnline;
};

// 地理位置 Hook
export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(false);
  
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, []);
  
  return { location, error, loading, getCurrentLocation };
};

// 网络信息 Hook
export const useNetworkInformation = () => {
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  }>({});
  
  useEffect(() => {
    const connection = (navigator as any).connection;
    
    if (connection) {
      const updateNetworkInfo = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        });
      };
      
      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);
      
      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);
  
  return networkInfo;
};

// 剪贴板 Hook
export const useClipboard = () => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError(null);
      
      // 3秒后重置状态
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      setError('Failed to copy text to clipboard');
      setCopied(false);
    }
  }, []);
  
  return { copied, error, copyToClipboard };
};

// 页面可见性 Hook
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(
    typeof document !== 'undefined' ? !document.hidden : true
  );
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return isVisible;
};

// 长按检测 Hook
export const useLongPress = (
  onLongPress: () => void,
  delay: number = 500
) => {
  const [isLongPress, setIsLongPress] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const startPress = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsLongPress(true);
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);
  
  const cancelPress = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setIsLongPress(false);
    }
  }, []);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return {
    isLongPress,
    onMouseDown: startPress,
    onMouseUp: cancelPress,
    onMouseLeave: cancelPress,
    onTouchStart: startPress,
    onTouchEnd: cancelPress,
  };
};
```

## 🧪 客户端组件测试

### 客户端组件测试模板

```typescript
// __tests__/client-component.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientComponent } from '../ClientComponent';

// Mock 客户端 API
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop: string) => {
      return '';
    },
  }),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator API
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
});

Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
  writable: true,
});

describe('ClientComponent', () => {
  beforeEach(() => {
    // 重置所有 mocks
    jest.clearAllMocks();
    
    // 重置 localStorage
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('基础渲染', () => {
    it('应该正确渲染组件', () => {
      render(<ClientComponent>Test Content</ClientComponent>);
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('应该应用正确的 CSS 类名', () => {
      render(<ClientComponent className="custom-class">Test</ClientComponent>);
      
      const component = screen.getByRole('button');
      expect(component).toHaveClass('client-component');
      expect(component).toHaveClass('custom-class');
    });

    it('应该支持不同的变体和尺寸', () => {
      render(<ClientComponent variant="primary" size="lg">Test</ClientComponent>);
      
      const component = screen.getByRole('button');
      expect(component).toHaveClass('client-component--primary');
      expect(component).toHaveClass('client-component--lg');
    });
  });

  describe('交互功能', () => {
    it('应该处理点击事件', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<ClientComponent onClick={handleClick}>Click Me</ClientComponent>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('应该在禁用状态下不响应点击', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<ClientComponent disabled onClick={handleClick}>Disabled</ClientComponent>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('应该处理焦点事件', async () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      
      render(<ClientComponent onFocus={handleFocus} onBlur={handleBlur}>Focus Test</ClientComponent>);
      
      const button = screen.getByRole('button');
      
      // 模拟焦点事件
      fireEvent.focus(button);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      fireEvent.blur(button);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('应该处理鼠标悬停事件', async () => {
      render(<ClientComponent>Hover Test</ClientComponent>);
      
      const button = screen.getByRole('button');
      
      // 鼠标进入
      fireEvent.mouseEnter(button);
      expect(button).toHaveClass('client-component--hovered');
      
      // 鼠标离开
      fireEvent.mouseLeave(button);
      expect(button).not.toHaveClass('client-component--hovered');
    });
  });

  describe('状态管理', () => {
    it('应该显示加载状态', () => {
      render(<ClientComponent loading>Loading</ClientComponent>);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('client-component--loading');
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('应该显示错误状态', () => {
      const errorMessage = 'Something went wrong';
      render(<ClientComponent error={errorMessage}>Error Test</ClientComponent>);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('client-component--error');
    });

    it('应该管理内部状态', () => {
      const { rerender } = render(<ClientComponent>State Test</ClientComponent>);
      
      // 初始状态
      expect(screen.getByRole('button')).not.toHaveClass('client-component--focused');
      
      // 模拟焦点状态变化
      rerender(<ClientComponent>State Test</ClientComponent>);
      
      // 状态应该被正确管理
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('可访问性', () => {
    it('应该支持可访问性属性', () => {
      render(
        <ClientComponent 
          ariaLabel="Test Button"
          ariaDescribedBy="description"
          role="button"
        >
          Accessible Test
        </ClientComponent>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Test Button');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('应该正确处理键盘导航', async () => {
      const handleClick = jest.fn();
      
      render(<ClientComponent onClick={handleClick}>Keyboard Test</ClientComponent>);
      
      const button = screen.getByRole('button');
      
      // 模拟 Enter 键
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // 模拟空格键
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('副作用和生命周期', () => {
    it('应该在组件挂载时执行初始化', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      render(<ClientComponent>Lifecycle Test</ClientComponent>);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ClientComponent mounted:')
      );
      
      consoleSpy.mockRestore();
    });

    it('应该在组件卸载时执行清理', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const { unmount } = render(<ClientComponent>Lifecycle Test</ClientComponent>);
      
      unmount();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ClientComponent unmounted:')
      );
      
      consoleSpy.mockRestore();
    });

    it('应该处理全局事件监听器', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<ClientComponent>Event Test</ClientComponent>);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('性能优化', () => {
    it('应该使用 memoization 避免不必要的重渲染', () => {
      const { rerender } = render(<ClientComponent>Performance Test</ClientComponent>);
      
      const initialRender = screen.getByRole('button');
      
      // 重新渲染相同属性
      rerender(<ClientComponent>Performance Test</ClientComponent>);
      
      const reRendered = screen.getByRole('button');
      expect(reRendered).toBe(initialRender);
    });

    it('应该正确处理异步操作', async () => {
      render(<ClientComponent>Async Test</ClientComponent>);
      
      // 模拟异步操作完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      // 组件应该仍然正常工作
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    it('应该优雅地处理错误', () => {
      const errorSpy = jest.spyOn(console, 'error');
      
      render(<ClientComponent>Error Handling Test</ClientComponent>);
      
      // 模拟错误情况
      const button = screen.getByRole('button');
      fireEvent.error(button, new Error('Test error'));
      
      expect(errorSpy).toHaveBeenCalled();
      
      errorSpy.mockRestore();
    });
  });

  describe('响应式设计', () => {
    it('应该响应窗口大小变化', () => {
      // Mock window.innerWidth
      const originalInnerWidth = window.innerWidth;
      
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      render(<ClientComponent>Responsive Test</ClientComponent>);
      
      // 修改窗口大小
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      // 触发 resize 事件
      fireEvent(window, new Event('resize'));
      
      // 恢复原始值
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });
  });
});

// 集成测试
describe('ClientComponent Integration', () => {
  it('应该与其他客户端组件正确集成', () => {
    const ParentComponent = () => (
      <div>
        <ClientComponent>Parent</ClientComponent>
        <ClientComponent>Child</ClientComponent>
      </div>
    );
    
    render(<ParentComponent />);
    
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('应该在复杂应用场景中正常工作', async () => {
    const ComplexApp = () => {
      const [count, setCount] = React.useState(0);
      
      return (
        <div>
          <ClientComponent onClick={() => setCount(count + 1)}>
            Count: {count}
          </ClientComponent>
          <ClientComponent disabled>Disabled</ClientComponent>
        </div>
      );
    };
    
    render(<ComplexApp />);
    
    const button = screen.getByText('Count: 0');
    await userEvent.click(button);
    
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });
});
```

## 📋 客户端组件检查清单

### 开发检查清单

- [ ] 添加 `'use client'` 指令
- [ ] 确保组件只使用客户端可用的 API
- [ ] 实现适当的错误边界
- [ ] 添加可访问性支持
- [ ] 实现响应式设计
- [ ] 添加加载状态处理
- [ ] 实现适当的性能优化
- [ ] 添加 TypeScript 类型定义
- [ ] 编写完整的测试用例
- [ ] 添加文档和使用示例

### 性能优化检查清单

- [ ] 使用 React.memo 避免不必要的重渲染
- [ ] 使用 useMemo 优化昂贵计算
- [ ] 使用 useCallback 优化函数传递
- [ ] 实现虚拟化（如果需要）
- [ ] 使用懒加载（如果需要）
- [ ] 优化图片和资源加载
- [ ] 实现防抖和节流
- [ ] 使用 React 18 并发特性

### 安全性检查清单

- [ ] 验证所有用户输入
- [ ] 防止 XSS 攻击
- [ ] 使用 HTTPS 进行网络请求
- [ ] 实现适当的认证和授权
- [ ] 保护敏感数据
- [ ] 使用 CSP 头部

## 🎯 总结

React 客户端组件是构建交互式用户界面的核心。通过遵循本规范，您可以创建：

1. **高性能**：优化的渲染和交互体验
2. **可访问**：符合 WCAG 标准的无障碍设计
3. **响应式**：适配各种设备和屏幕尺寸
4. **可维护**：清晰的代码结构和完整的测试
5. **安全**：防护常见的安全威胁

客户端组件应该专注于用户交互和状态管理，为用户提供流畅的使用体验。

---

*文档版本：1.0.0*  
*最后更新：2024年*