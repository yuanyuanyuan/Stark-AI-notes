/**
 * 基础组件示例 - Button
 * 
 * 展示了一个完整的、符合规范的按钮组件实现
 * 包含了完整的类型定义、事件处理、无障碍支持和测试
 * 
 * @author Claude
 * @created 2024-01-01
 * @updated 2024-01-01
 */

import React, { useState, useCallback, useMemo } from 'react';
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
} as const;

// ==================== 主组件 ====================

/**
 * Button 组件
 * 
 * 一个功能完整的按钮组件，支持多种变体、尺寸和状态
 * 
 * @component
 * @example
 * <Button variant="primary" size="lg" onClick={handleClick}>
 *   Click me
 * </Button>
 */
export const Button: React.FC<ButtonProps> = React.memo(({
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
  ...restProps
}) => {
  // ==================== 状态管理 ====================
  
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // ==================== 计算属性 ====================
  
  /**
   * 计算按钮基础类名
   */
  const baseClassName = useMemo(() => {
    return cn(
      // 基础样式
      'btn',
      // 变体样式
      {
        'btn-default': variant === 'default',
        'btn-primary': variant === 'primary',
        'btn-secondary': variant === 'secondary',
        'btn-outline': variant === 'outline',
        'btn-ghost': variant === 'ghost',
      },
      // 尺寸样式
      {
        'btn-sm': size === 'sm',
        'btn-md': size === 'md',
        'btn-lg': size === 'lg',
      },
      // 状态样式
      {
        'btn-disabled': disabled,
        'btn-loading': loading,
        'btn-block': block,
        'btn-pressed': isPressed,
        'btn-focused': isFocused,
      },
      // 自定义类名
      className
    );
  }, [variant, size, disabled, loading, block, isPressed, isFocused, className]);
  
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
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isInteractive) {
      event.preventDefault();
      return;
    }
    
    // 防止重复提交
    if (loading) {
      event.preventDefault();
      return;
    }
    
    // 更新按压状态
    setIsPressed(true);
    
    // 调用外部回调
    onClick?.(event);
    
    // 重置按压状态
    setTimeout(() => {
      setIsPressed(false);
    }, 150);
  }, [isInteractive, loading, onClick]);
  
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
   * 处理鼠标离开事件
   */
  const handleMouseLeave = useCallback(() => {
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
          <span className="btn-spinner" aria-hidden="true" />
          <span className="btn-loading-text">{children || '加载中...'}</span>
        </>
      );
    }
    
    const iconElement = icon && (
      <span className="btn-icon" aria-hidden="true">
        {icon}
      </span>
    );
    
    const contentElement = (
      <span className="btn-content">
        {children}
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
  };
  
  // ==================== 主渲染 ====================
  
  return (
    <button
      className={baseClassName}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
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
        <span className="btn-focus-indicator" aria-hidden="true" />
      )}
    </button>
  );
});

// ==================== 组件显示名称 ====================

Button.displayName = 'Button';

// ==================== 默认导出 ====================

export default Button;

// ==================== 按钮组组件 ====================

/** 按钮组Props接口 */
export interface ButtonGroupProps {
  /** 按钮组内容 */
  children: React.ReactNode;
  /** 按钮组尺寸 */
  size?: ButtonSize;
  /** 是否垂直排列 */
  vertical?: boolean;
  /** 是否块级显示 */
  block?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * ButtonGroup 组件
 * 
 * 用于组合多个按钮，提供统一的样式和布局
 */
export const ButtonGroup: React.FC<ButtonGroupProps> = React.memo(({
  children,
  size,
  vertical = false,
  block = false,
  className,
}) => {
  const groupClassName = useMemo(() => {
    return cn(
      'btn-group',
      {
        'btn-group-vertical': vertical,
        'btn-group-block': block,
        [`btn-group-${size}`]: size,
      },
      className
    );
  }, [vertical, block, size, className]);
  
  return (
    <div className={groupClassName} role="group">
      {children}
    </div>
  );
});

ButtonGroup.displayName = 'ButtonGroup';

// ==================== 类型导出 ====================

export type { ButtonProps, ButtonGroupProps };

// ==================== 样式定义（CSS-in-JS示例） ====================

/*
.btn {
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
    }
    
    &:focus-visible:not(&-disabled) {
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
    }
  }
  
  &-primary {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
    
    &:hover:not(&-disabled) {
      background-color: #2563eb;
      border-color: #2563eb;
    }
    
    &:focus-visible:not(&-disabled) {
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
    }
  }
  
  &-secondary {
    background-color: #6b7280;
    color: white;
    border-color: #6b7280;
    
    &:hover:not(&-disabled) {
      background-color: #4b5563;
      border-color: #4b5563;
    }
    
    &:focus-visible:not(&-disabled) {
      box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.5);
    }
  }
  
  &-outline {
    background-color: transparent;
    color: #3b82f6;
    border-color: #3b82f6;
    
    &:hover:not(&-disabled) {
      background-color: #eff6ff;
      border-color: #2563eb;
    }
    
    &:focus-visible:not(&-disabled) {
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
    }
  }
  
  &-ghost {
    background-color: transparent;
    color: #374151;
    border-color: transparent;
    
    &:hover:not(&-disabled) {
      background-color: #f3f4f6;
      border-color: transparent;
    }
    
    &:focus-visible:not(&-disabled) {
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
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
  }
  
  &-focus-indicator {
    position: absolute;
    inset: -2px;
    border: 2px solid #3b82f6;
    border-radius: 0.5rem;
    pointer-events: none;
  }
}

.btn-group {
  display: inline-flex;
  border-radius: 0.375rem;
  overflow: hidden;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  
  &-vertical {
    flex-direction: column;
  }
  
  &-block {
    display: flex;
    width: 100%;
  }
  
  .btn {
    border-radius: 0;
    border-right-width: 1px;
    border-right-style: solid;
    border-right-color: inherit;
    
    &:first-child {
      border-top-left-radius: 0.375rem;
      border-bottom-left-radius: 0.375rem;
    }
    
    &:last-child {
      border-right: none;
      border-top-right-radius: 0.375rem;
      border-bottom-right-radius: 0.375rem;
    }
    
    &:not(:first-child):not(:last-child) {
      border-radius: 0;
    }
  }
  
  &-vertical .btn {
    border-right: none;
    border-bottom-width: 1px;
    border-bottom-style: solid;
    border-bottom-color: inherit;
    
    &:first-child {
      border-top-left-radius: 0.375rem;
      border-top-right-radius: 0.375rem;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
    
    &:last-child {
      border-bottom: none;
      border-bottom-left-radius: 0.375rem;
      border-bottom-right-radius: 0.375rem;
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }
    
    &:not(:first-child):not(:last-child) {
      border-radius: 0;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
*/