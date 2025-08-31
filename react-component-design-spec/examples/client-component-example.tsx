/**
 * 客户端组件示例 - InteractiveButton
 * 
 * 展示了一个完整的客户端按钮组件实现
 * 包含了状态管理、事件处理、浏览器API交互等客户端特性
 * 
 * @author Claude
 * @created 2024-01-01
 * @updated 2024-01-01
 */

'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';

// ==================== 类型定义 ====================

/** 按钮变体类型 */
export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost';

/** 按钮尺寸类型 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** 按钮Props接口 */
export interface ButtonProps {
  /** 按钮内容 */
  children: React.ReactNode;
  /** 按钮变体 */
  variant?: ButtonVariant;
  /** 按钮尺寸 */
  size?: ButtonSize;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 是否为块级元素 */
  block?: boolean;
  /** 按钮类型 */
  type?: 'button' | 'submit' | 'reset';
  /** 点击事件处理函数 */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** 自定义类名 */
  className?: string;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 图标位置 */
  iconPosition?: 'left' | 'right';
  /** 是否启用涟漪效果 */
  ripple?: boolean;
  /** 点击音效 */
  sound?: boolean;
  /** 按钮点击后的回调 */
  onClickCallback?: () => Promise<void> | void;
  /** 自定义数据属性 */
  [key: string]: any;
}

// ==================== 默认值定义 ====================

const BUTTON_DEFAULTS = {
  variant: 'default' as const,
  size: 'md' as const,
  disabled: false,
  loading: false,
  block: false,
  type: 'button' as const,
  iconPosition: 'left' as const,
  ripple: true,
  sound: false,
} as const;

// ==================== 主组件 ====================

/**
 * InteractiveButton 组件
 * 
 * 一个功能完整的客户端按钮组件，支持多种交互特性
 * 
 * @component
 * @example
 * <InteractiveButton 
 *   variant="primary" 
 *   size="lg" 
 *   onClick={handleClick}
 *   ripple={true}
 * >
 *   Click me
 * </InteractiveButton>
 */
export const InteractiveButton: React.FC<ButtonProps> = React.memo(({
  children,
  variant = BUTTON_DEFAULTS.variant,
  size = BUTTON_DEFAULTS.size,
  disabled = BUTTON_DEFAULTS.disabled,
  loading = BUTTON_DEFAULTS.loading,
  block = BUTTON_DEFAULTS.block,
  type = BUTTON_DEFAULTS.type,
  onClick,
  className,
  icon,
  iconPosition = BUTTON_DEFAULTS.iconPosition,
  ripple = BUTTON_DEFAULTS.ripple,
  sound = BUTTON_DEFAULTS.sound,
  onClickCallback,
  ...restProps
}) => {
  // ==================== 状态管理 ====================
  
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // ==================== 计算属性 ====================
  
  /**
   * 计算按钮基础类名
   */
  const baseClassName = useMemo(() => {
    return cn(
      // 基础样式
      'interactive-btn',
      // 变体样式
      {
        'interactive-btn-default': variant === 'default',
        'interactive-btn-primary': variant === 'primary',
        'interactive-btn-secondary': variant === 'secondary',
        'interactive-btn-outline': variant === 'outline',
        'interactive-btn-ghost': variant === 'ghost',
      },
      // 尺寸样式
      {
        'interactive-btn-sm': size === 'sm',
        'interactive-btn-md': size === 'md',
        'interactive-btn-lg': size === 'lg',
      },
      // 状态样式
      {
        'interactive-btn-disabled': disabled,
        'interactive-btn-loading': loading,
        'interactive-btn-block': block,
        'interactive-btn-pressed': isPressed,
        'interactive-btn-focused': isFocused,
        'interactive-btn-hovered': isHovered,
      },
      // 特性样式
      {
        'interactive-btn-ripple': ripple,
      },
      // 自定义类名
      className
    );
  }, [variant, size, disabled, loading, block, isPressed, isFocused, isHovered, ripple, className]);
  
  /**
   * 计算是否可交互
   */
  const isInteractive = useMemo(() => {
    return !disabled && !loading;
  }, [disabled, loading]);
  
  // ==================== 事件处理 ====================
  
  /**
   * 处理点击事件
   */
  const handleClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isInteractive) {
      event.preventDefault();
      return;
    }
    
    // 防止重复提交
    if (loading) {
      event.preventDefault();
      return;
    }
    
    // 检测双击
    const now = Date.now();
    const timeDiff = now - lastClickTime;
    if (timeDiff < 300) {
      setClickCount(prev => prev + 1);
    } else {
      setClickCount(1);
    }
    setLastClickTime(now);
    
    // 更新按压状态
    setIsPressed(true);
    
    // 播放点击音效
    if (sound && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // 忽略自动播放策略错误
      });
    }
    
    // 创建涟漪效果
    if (ripple && buttonRef.current) {
      createRipple(event);
    }
    
    // 调用外部回调
    onClick?.(event);
    
    // 调用异步回调
    if (onClickCallback) {
      try {
        await onClickCallback();
      } catch (error) {
        console.error('Button callback error:', error);
      }
    }
    
    // 重置按压状态
    setTimeout(() => {
      setIsPressed(false);
    }, 150);
  }, [isInteractive, loading, sound, ripple, onClick, onClickCallback, lastClickTime]);
  
  /**
   * 创建涟漪效果
   */
  const createRipple = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.className = 'interactive-btn-ripple-effect';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }, []);
  
  /**
   * 处理鼠标按下事件
   */
  const handleMouseDown = useCallback(() => {
    if (isInteractive) {
      setIsPressed(true);
    }
  }, [isInteractive]);
  
  /**
   * 处理鼠标抬起事件
   */
  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);
  
  /**
   * 处理鼠标进入事件
   */
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);
  
  /**
   * 处理鼠标离开事件
   */
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);
  
  /**
   * 处理焦点事件
   */
  const handleFocus = useCallback(() => {
    if (isInteractive) {
      setIsFocused(true);
    }
  }, [isInteractive]);
  
  /**
   * 处理失焦事件
   */
  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);
  
  /**
   * 处理键盘事件
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!isInteractive) return;
    
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleClick(event as unknown as React.MouseEvent<HTMLButtonElement>);
        break;
      case 'Escape':
        setIsFocused(false);
        break;
    }
  }, [isInteractive, handleClick]);
  
  // ==================== 渲染逻辑 ====================
  
  /**
   * 渲染按钮内容
   */
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <span className="interactive-btn-spinner" aria-hidden="true" />
          <span className="interactive-btn-loading-text">{children || '加载中...'}</span>
        </>
      );
    }
    
    const iconElement = icon && (
      <span className="interactive-btn-icon" aria-hidden="true">
        {icon}
      </span>
    );
    
    const contentElement = (
      <span className="interactive-btn-content">
        {children}
        {clickCount > 1 && (
          <span className="interactive-btn-click-count">
            ({clickCount})
          </span>
        )}
      </span>
    );
    
    if (iconPosition === 'right') {
      return (
        <>
          {contentElement}
          {iconElement}
        </>
      );
    }
    
    return (
      <>
        {iconElement}
        {contentElement}
      </>
    );
  };
  
  // ==================== 无障碍支持 ====================
  
  const accessibilityProps = {
    'aria-disabled': disabled,
    'aria-busy': loading,
    'aria-label': restProps['aria-label'] || undefined,
    'aria-describedby': restProps['aria-describedby'] || undefined,
    'aria-pressed': isPressed,
  };
  
  // ==================== 主渲染 ====================
  
  return (
    <>
      <button
        ref={buttonRef}
        className={baseClassName}
        type={type}
        disabled={disabled}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        {...accessibilityProps}
        {...restProps}
      >
        {renderContent()}
        
        {/* 焦点指示器 */}
        {isFocused && (
          <span className="interactive-btn-focus-indicator" aria-hidden="true" />
        )}
      </button>
      
      {/* 音效元素 */}
      {sound && (
        <audio
          ref={audioRef}
          preload="auto"
        >
          <source src="/sounds/click.mp3" type="audio/mpeg" />
          <source src="/sounds/click.ogg" type="audio/ogg" />
        </audio>
      )}
    </>
  );
});

// ==================== 组件显示名称 ====================

InteractiveButton.displayName = 'InteractiveButton';

// ==================== 默认导出 ====================

export default InteractiveButton;

// ==================== 客户端专用Hook ====================

/**
 * 使用本地存储的Hook
 * 仅在客户端组件中使用
 */
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
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

  return [storedValue, setValue] as const;
};

/**
 * 使用点击分析的Hook
 * 跟踪按钮点击次数和时间
 */
export const useClickAnalytics = (buttonId: string) => {
  const [clickAnalytics, setClickAnalytics] = useLocalStorage(
    `button-analytics-${buttonId}`,
    {
      totalClicks: 0,
      lastClickTime: null as Date | null,
      averageTimeBetweenClicks: 0,
    }
  );

  const trackClick = useCallback(() => {
    const now = new Date();
    setClickAnalytics(prev => {
      const newTotalClicks = prev.totalClicks + 1;
      let newAverageTime = prev.averageTimeBetweenClicks;
      
      if (prev.lastClickTime) {
        const timeDiff = now.getTime() - prev.lastClickTime.getTime();
        newAverageTime = (prev.averageTimeBetweenClicks * (newTotalClicks - 1) + timeDiff) / newTotalClicks;
      }
      
      return {
        totalClicks: newTotalClicks,
        lastClickTime: now,
        averageTimeBetweenClicks: newAverageTime,
      };
    });
  }, [setClickAnalytics]);

  return {
    analytics: clickAnalytics,
    trackClick,
  };
};

// ==================== 样式定义（CSS-in-JS示例） ====================

/*
.interactive-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.25rem;
  text-align: center;
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  
  &:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
  }
  
  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }
  
  &-block {
    display: flex;
    width: 100%;
  }
  
  // 变体样式
  &-default {
    background-color: #f3f4f6;
    color: #374151;
    border-color: #d1d5db;
    
    &:hover:not(&-disabled) {
      background-color: #e5e7eb;
      border-color: #9ca3af;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    &:active:not(&-disabled) {
      transform: translateY(0);
      box-shadow: 0 1px 3px -1px rgba(0, 0, 0, 0.1);
    }
  }
  
  &-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-color: transparent;
    
    &:hover:not(&-disabled) {
      background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
      transform: translateY(-1px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    
    &:active:not(&-disabled) {
      transform: translateY(0);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
  }
  
  &-secondary {
    background-color: #6b7280;
    color: white;
    border-color: #6b7280;
    
    &:hover:not(&-disabled) {
      background-color: #4b5563;
      border-color: #4b5563;
      transform: translateY(-1px);
    }
    
    &:active:not(&-disabled) {
      transform: translateY(0);
    }
  }
  
  &-outline {
    background-color: transparent;
    color: #3b82f6;
    border-color: #3b82f6;
    
    &:hover:not(&-disabled) {
      background-color: #eff6ff;
      border-color: #2563eb;
      transform: translateY(-1px);
    }
    
    &:active:not(&-disabled) {
      transform: translateY(0);
    }
  }
  
  &-ghost {
    background-color: transparent;
    color: #374151;
    border-color: transparent;
    
    &:hover:not(&-disabled) {
      background-color: #f3f4f6;
      border-color: transparent;
      transform: translateY(-1px);
    }
    
    &:active:not(&-disabled) {
      transform: translateY(0);
    }
  }
  
  // 尺寸样式
  &-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    line-height: 1rem;
    border-radius: 0.25rem;
  }
  
  &-md {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    border-radius: 0.375rem;
  }
  
  &-lg {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    line-height: 1.5rem;
    border-radius: 0.5rem;
  }
  
  // 状态样式
  &-pressed {
    transform: scale(0.98);
  }
  
  &-focused {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }
  
  &-hovered {
    transform: translateY(-1px);
  }
  
  // 内部元素
  &-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  &-loading-text {
    opacity: 0.7;
  }
  
  &-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  &-content {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  &-click-count {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-left: 0.25rem;
  }
  
  &-focus-indicator {
    position: absolute;
    inset: -2px;
    border: 2px solid #3b82f6;
    border-radius: 0.5rem;
    pointer-events: none;
  }
  
  &-ripple {
    overflow: hidden;
  }
  
  &-ripple-effect {
    position: absolute;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
*/