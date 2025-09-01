# React 组件设计规范 - 快速开始版

> 专为快速开发和小型项目设计的简化版规范

## 📋 概述

本版本是 React 组件设计规范的简化版本，专注于核心最佳实践，让开发者能够快速上手并开始编码。

## 🎯 核心原则（精简版）

### 1. 组件分类
- **基础组件**：Button、Input、Card 等 UI 元素
- **业务组件**：包含业务逻辑的复合组件
- **页面组件**：路由级别的页面组件

### 2. 命名规范
```tsx
// ✅ 正确
interface UserProfileProps {
  userName: string;
  isLoading: boolean;
  onClick: () => void;
}

// ❌ 错误
interface UserProps {
  name: string;
  loading: boolean;
  click: () => void;
}
```

### 3. 组件结构
```tsx
// 标准组件结构
interface ComponentProps {
  // props 定义
}

const Component: React.FC<ComponentProps> = ({ props }) => {
  // 状态和逻辑
  
  return (
    // JSX
  );
};

export default Component;
```

## 🏗️ 快速开始模板

### 基础组件模板
```tsx
// templates/simple-component.tsx
import React from 'react';

interface SimpleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}

const SimpleButton: React.FC<SimpleButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = ''
}) => {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default SimpleButton;
```

### 客户端组件模板（带交互）
```tsx
// templates/simple-client-component.tsx
'use client';

import React, { useState, useCallback } from 'react';

interface InteractiveCardProps {
  title: string;
  initialCount?: number;
  onCountChange?: (count: number) => void;
}

const InteractiveCard: React.FC<InteractiveCardProps> = ({
  title,
  initialCount = 0,
  onCountChange
}) => {
  const [count, setCount] = useState(initialCount);
  
  const handleClick = useCallback(() => {
    const newCount = count + 1;
    setCount(newCount);
    onCountChange?.(newCount);
  }, [count, onCountChange]);
  
  return (
    <div className="interactive-card">
      <h3>{title}</h3>
      <p>Count: {count}</p>
      <button onClick={handleClick}>
        Increment
      </button>
    </div>
  );
};

export default InteractiveCard;
```

### 服务端组件模板（数据获取）
```tsx
// templates/simple-server-component.tsx
import React from 'react';
import { db } from '@/lib/db';

interface ServerDataListProps {
  limit?: number;
  category?: string;
}

const ServerDataList: React.FC<ServerDataListProps> = async ({
  limit = 10,
  category
}) => {
  // 直接在服务端获取数据
  const items = await db.items
    .where('category', category)
    .limit(limit)
    .select();
  
  return (
    <div className="data-list">
      {items.map((item) => (
        <div key={item.id} className="data-item">
          <h4>{item.title}</h4>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  );
};

export default ServerDataList;
```

## 🧪 简化版测试模板

### 基础组件测试
```tsx
// __tests__/simple-component.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SimpleButton from '../SimpleButton';

describe('SimpleButton', () => {
  it('renders correctly', () => {
    render(<SimpleButton>Click me</SimpleButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<SimpleButton onClick={handleClick}>Click me</SimpleButton>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = jest.fn();
    render(<SimpleButton disabled onClick={handleClick}>Disabled</SimpleButton>);
    
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

### 快速测试命令
```bash
# 运行所有测试
npm test

# 运行特定文件测试
npm test SimpleButton.test.tsx

# 监视模式
npm test -- --watch

# 生成覆盖率报告
npm test -- --coverage
```

## 📦 快速使用指南

### 1. 创建新组件
```bash
# 使用简化模板创建组件
npx create-react-component my-button --template=simple

# 或者手动创建
cp templates/simple-component.tsx src/components/MyButton.tsx
```

### 2. 开发流程
1. **设计阶段**：确定组件 props 和功能
2. **编码阶段**：使用对应模板快速实现
3. **测试阶段**：复制测试模板，修改测试用例
4. **文档阶段**：添加基本的使用说明

### 3. 代码检查
```bash
# 快速 lint 检查
npm run lint

# 类型检查
npm run type-check

# 格式化代码
npm run format
```

## 🎨 样式处理（简化版）

### CSS Modules 推荐
```tsx
import styles from './MyComponent.module.css';

const MyComponent: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Hello World</h1>
    </div>
  );
};
```

### Tailwind CSS 快速开始
```tsx
const MyComponent: React.FC = () => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-xl font-bold text-gray-800">Hello World</h1>
    </div>
  );
};
```

## 🚀 性能优化（核心要点）

### 1. 使用 React.memo
```tsx
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* 渲染内容 */}</div>;
});
```

### 2. 使用 useCallback
```tsx
const MyComponent: React.FC = ({ onClick }) => {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);
  
  return <button onClick={handleClick}>Click</button>;
};
```

### 3. 条件渲染优化
```tsx
// ✅ 好的做法
{isLoading && <Spinner />}

// ❌ 避免复杂的条件逻辑
{isLoading ? (
  <Spinner />
) : hasError ? (
  <Error />
) : (
  <Content />
)}
```

## 📋 快速检查清单

### 开发前检查
- [ ] 组件职责是否单一？
- [ ] Props 类型是否定义？
- [ ] 是否选择了合适的组件类型？
- [ ] 命名是否符合规范？

### 提交前检查
- [ ] 代码是否通过 lint 检查？
- [ ] 类型检查是否通过？
- [ ] 测试是否通过？
- [ ] 是否有基本的错误处理？

### 性能检查
- [ ] 是否有必要使用 memo？
- [ ] 大列表是否需要虚拟化？
- [ ] 图片是否需要懒加载？
- [ ] 是否有不必要的重渲染？

## 🔧 常用工具配置

### ESLint 简化配置
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off"
  }
}
```

### Prettier 简化配置
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

## 📚 进阶学习

当你掌握了简化版规范后，可以逐步学习完整版规范中的高级特性：

- **高级状态管理**：Context、useReducer、状态管理库
- **性能优化**：useMemo、useCallback、代码分割
- **测试策略**：集成测试、E2E 测试
- **无障碍访问**：ARIA 属性、键盘导航
- **服务端组件**：高级缓存、数据获取模式

## 🎯 总结

简化版规范提供了 React 组件开发的核心要素，让你能够快速开始项目开发。随着项目复杂度的增长，可以逐步采用完整版规范中的高级特性。

**记住：先让它工作，再让它正确，最后让它快速。**

---

*简化版规范 v1.0 | 完整版规范请参考 `component-design-spec.md`*