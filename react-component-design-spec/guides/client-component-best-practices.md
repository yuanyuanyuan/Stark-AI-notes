# 客户端组件最佳实践和模式

> 基于 React 18.3.1 的客户端组件开发最佳实践和常见模式

## 📋 概述

本文档提供了 React 客户端组件开发的最佳实践和常见模式，帮助开发者构建高质量、可维护的客户端组件。

## 🎯 核心原则

### 1. 明确客户端组件边界

```tsx
// ✅ 正确：文件顶部声明 'use client'
'use client';

import React, { useState, useEffect } from 'react';

interface ClientComponentProps {
  userId: string;
  onAction: (action: string) => void;
}

export const ClientComponent: React.FC<ClientComponentProps> = ({ userId, onAction }) => {
  // 客户端组件逻辑
};
```

### 2. 最小化客户端组件

```tsx
// ✅ 好的做法：将静态内容分离为服务端组件
// ServerComponent.jsx (服务端组件)
export const ServerComponent = ({ data }) => (
  <div className="static-content">
    <h1>{data.title}</h1>
    <p>{data.description}</p>
    <ClientComponent userId={data.userId} />
  </div>
);

// ClientComponent.jsx (客户端组件)
'use client';
export const ClientComponent = ({ userId }) => {
  // 只包含交互逻辑
};
```

## 🏗️ 常见模式

### 1. 状态管理模式

#### 1.1 本地状态管理

```tsx
'use client';

import React, { useState, useCallback } from 'react';

interface FormState {
  name: string;
  email: string;
  isLoading: boolean;
}

export const FormComponent: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    name: '',
    email: '',
    isLoading: false,
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await submitForm(formState);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  }, [formState]);

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formState.name}
        onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Name"
      />
      <input
        value={formState.email}
        onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
        placeholder="Email"
      />
      <button type="submit" disabled={formState.isLoading}>
        {formState.isLoading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

#### 1.2 复杂状态管理（useReducer）

```tsx
'use client';

import React, { useReducer, useCallback } from 'react';

type State = {
  items: Array<{ id: string; text: string; completed: boolean }>;
  filter: 'all' | 'active' | 'completed';
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: 'ADD_ITEM'; text: string }
  | { type: 'TOGGLE_ITEM'; id: string }
  | { type: 'DELETE_ITEM'; id: string }
  | { type: 'SET_FILTER'; filter: State['filter'] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null };

const initialState: State = {
  items: [],
  filter: 'all',
  loading: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        ...state,
        items: [
          ...state.items,
          { id: Date.now().toString(), text: action.text, completed: false },
        ],
      };
    case 'TOGGLE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.id
            ? { ...item, completed: !item.completed }
            : item
        ),
      };
    case 'DELETE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.id),
      };
    case 'SET_FILTER':
      return { ...state, filter: action.filter };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

export const TodoList: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addItem = useCallback((text: string) => {
    dispatch({ type: 'ADD_ITEM', text });
  }, []);

  const toggleItem = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_ITEM', id });
  }, []);

  const filteredItems = React.useMemo(() => {
    switch (state.filter) {
      case 'active':
        return state.items.filter(item => !item.completed);
      case 'completed':
        return state.items.filter(item => item.completed);
      default:
        return state.items;
    }
  }, [state.items, state.filter]);

  return (
    <div className="todo-list">
      {/* Todo UI */}
    </div>
  );
};
```

### 2. 数据获取模式

#### 2.1 基础数据获取

```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

export const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId, fetchUser]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};
```

#### 2.2 自定义 Hook 模式

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url);
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
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// 使用自定义 Hook
export const UserData: React.FC<{ userId: string }> = ({ userId }) => {
  const { data, loading, error, refetch } = useFetch<User>(`/api/users/${userId}`);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data found</div>;

  return (
    <div>
      <h2>{data.name}</h2>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
};
```

### 3. 事件处理模式

#### 3.1 防抖和节流

```tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { debounce, throttle } from 'lodash-es';

export const SearchComponent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string }>>([]);

  // 防抖搜索
  const debouncedSearch = useMemo(
    () => debounce(async (term: string) => {
      if (term.length < 2) {
        setResults([]);
        return;
      }
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await response.json();
      setResults(data);
    }, 300),
    []
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  // 节流滚动事件
  const handleScroll = useMemo(
    () => throttle(() => {
      console.log('Scroll event throttled');
    }, 100),
    []
  );

  React.useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, [handleScroll]);

  return (
    <div className="search-component">
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search..."
      />
      <div className="results">
        {results.map(result => (
          <div key={result.id}>{result.name}</div>
        ))}
      </div>
    </div>
  );
};
```

#### 3.2 事件委托模式

```tsx
'use client';

import React, { useCallback } from 'react';

export const ListComponent: React.FC<{
  items: Array<{ id: string; name: string }>;
  onItemClick: (id: string) => void;
}> = ({ items, onItemClick }) => {
  const handleListClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const listItem = target.closest('[data-item-id]');
    
    if (listItem) {
      const itemId = listItem.getAttribute('data-item-id');
      if (itemId) {
        onItemClick(itemId);
      }
    }
  }, [onItemClick]);

  return (
    <div className="list" onClick={handleListClick}>
      {items.map(item => (
        <div
          key={item.id}
          data-item-id={item.id}
          className="list-item"
        >
          {item.name}
        </div>
      ))}
    </div>
  );
};
```

### 4. 性能优化模式

#### 4.1 React.memo 优化

```tsx
'use client';

import React, { memo } from 'react';

interface ItemProps {
  id: string;
  name: string;
  price: number;
  onAddToCart: (id: string) => void;
}

const ItemComponent: React.FC<ItemProps> = memo(({ id, name, price, onAddToCart }) => {
  console.log(`Rendering item: ${name}`);
  
  return (
    <div className="item">
      <h3>{name}</h3>
      <p>${price}</p>
      <button onClick={() => onAddToCart(id)}>
        Add to Cart
      </button>
    </div>
  );
});

ItemComponent.displayName = 'ItemComponent';

export const ProductList: React.FC<{
  products: Array<{ id: string; name: string; price: number }>;
  onAddToCart: (id: string) => void;
}> = ({ products, onAddToCart }) => {
  return (
    <div className="product-list">
      {products.map(product => (
        <ItemComponent
          key={product.id}
          id={product.id}
          name={product.name}
          price={product.price}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};
```

#### 4.2 useMemo 和 useCallback 优化

```tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';

export const FilteredList: React.FC<{
  items: Array<{ id: string; name: string; category: string }>;
}> = ({ items }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 过滤和搜索逻辑使用 useMemo
  const filteredItems = useMemo(() => {
    return items
      .filter(item => filter === 'all' || item.category === filter)
      .filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [items, filter, searchTerm]);

  // 事件处理函数使用 useCallback
  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(items.map(item => item.category))];
    return ['all', ...uniqueCategories];
  }, [items]);

  return (
    <div className="filtered-list">
      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => handleFilterChange(category)}
              className={filter === category ? 'active' : ''}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      <div className="items">
        {filteredItems.map(item => (
          <div key={item.id} className="item">
            {item.name} - {item.category}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 5. 表单处理模式

#### 5.1 受控组件模式

```tsx
'use client';

import React, { useState, useCallback, ChangeEvent } from 'react';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
}

export const RegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await submitRegistration(formData);
      // 处理成功
    } catch (error) {
      // 处理错误
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          className={errors.username ? 'error' : ''}
        />
        {errors.username && <span className="error-message">{errors.username}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className={errors.password ? 'error' : ''}
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={errors.confirmPassword ? 'error' : ''}
        />
        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
      </div>

      <div className="form-group">
        <label>
          <input
            name="agreeToTerms"
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={handleChange}
          />
          I agree to the terms and conditions
        </label>
        {errors.agreeToTerms && <span className="error-message">{errors.agreeToTerms}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

// 模拟 API 调用
async function submitRegistration(data: FormData): Promise<void> {
  // 实现 API 调用
}
```

#### 5.2 表单库集成模式

```tsx
'use client';

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export const FormWithValidation: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      await submitRegistration(data);
      // 处理成功
    } catch (error) {
      // 处理错误
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form">
      <div className="form-group">
        <label>Username</label>
        <input {...register('username')} className={errors.username ? 'error' : ''} />
        {errors.username && <span className="error">{errors.username.message}</span>}
      </div>

      <div className="form-group">
        <label>Email</label>
        <input {...register('email')} type="email" className={errors.email ? 'error' : ''} />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>

      <div className="form-group">
        <label>Password</label>
        <input {...register('password')} type="password" className={errors.password ? 'error' : ''} />
        {errors.password && <span className="error">{errors.password.message}</span>}
      </div>

      <div className="form-group">
        <label>Confirm Password</label>
        <input {...register('confirmPassword')} type="password" className={errors.confirmPassword ? 'error' : ''} />
        {errors.confirmPassword && <span className="error">{errors.confirmPassword.message}</span>}
      </div>

      <div className="form-group">
        <label>
          <input type="checkbox" {...register('agreeToTerms')} />
          I agree to the terms and conditions
        </label>
        {errors.agreeToTerms && <span className="error">{errors.agreeToTerms.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

### 6. 模态框和对话框模式

#### 6.1 模态框组件

```tsx
'use client';

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

// 使用示例
export const ModalExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Open Modal
      </button>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
      >
        <p>This is a modal dialog example.</p>
        <button onClick={() => setIsModalOpen(false)}>
          Close
        </button>
      </Modal>
    </div>
  );
};
```

### 7. 动画和过渡模式

#### 7.1 CSS 过渡动画

```tsx
'use client';

import React, { useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

interface Item {
  id: string;
  text: string;
}

export const AnimatedList: React.FC = () => {
  const [items, setItems] = useState<Item[]>([
    { id: '1', text: 'Item 1' },
    { id: '2', text: 'Item 2' },
    { id: '3', text: 'Item 3' },
  ]);

  const addItem = () => {
    const newItem = {
      id: Date.now().toString(),
      text: `Item ${items.length + 1}`,
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="animated-list">
      <button onClick={addItem}>Add Item</button>
      
      <TransitionGroup className="list">
        {items.map(item => (
          <CSSTransition
            key={item.id}
            timeout={300}
            classNames="item"
            unmountOnExit
          >
            <div className="list-item">
              {item.text}
              <button onClick={() => removeItem(item.id)}>
                Remove
              </button>
            </div>
          </CSSTransition>
        ))}
      </TransitionGroup>
    </div>
  );
};
```

### 8. 错误边界模式

#### 8.1 错误边界组件

```tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用示例
export const ComponentWithErrorHandling: React.FC = () => {
  return (
    <ErrorBoundary
      fallback={
        <div className="error-fallback">
          <h3>Unable to load component</h3>
          <button onClick={() => window.location.reload()}>
            Refresh page
          </button>
        </div>
      }
    >
      <RiskyComponent />
    </ErrorBoundary>
  );
};

const RiskyComponent: React.FC = () => {
  // 可能抛出错误的组件
  return <div>Risky component content</div>;
};
```

## 🚀 最佳实践总结

### 1. 组件设计原则
- **单一职责**：每个组件只负责一个功能
- **可复用性**：设计通用的、可配置的组件
- **可测试性**：编写易于测试的组件
- **可维护性**：保持代码清晰和文档化

### 2. 性能优化
- **使用 React.memo**：避免不必要的重新渲染
- **useMemo 和 useCallback**：优化计算和函数创建
- **懒加载**：使用 React.lazy 和 Suspense
- **虚拟化长列表**：对于大量数据的列表

### 3. 状态管理
- **本地状态**：使用 useState 和 useReducer
- **全局状态**：考虑 Context API 或状态管理库
- **服务端状态**：使用 React Query 或 SWR
- **表单状态**：使用 react-hook-form 或 Formik

### 4. 错误处理
- **错误边界**：捕获组件错误
- **异步错误**：处理 Promise 和 async/await 错误
- **用户反馈**：提供清晰的错误信息
- **错误恢复**：提供错误恢复机制

### 5. 可访问性
- **语义化 HTML**：使用正确的 HTML 标签
- **ARIA 属性**：提供适当的可访问性属性
- **键盘导航**：支持键盘操作
- **焦点管理**：正确的焦点处理

## 📚 相关资源

- [React 官方文档](https://react.dev/)
- [React Hooks 文档](https://react.dev/reference/react)
- [React 性能优化](https://react.dev/learn/render-and-commit)
- [React 可访问性](https://react.dev/learn/accessibility)

---

*最后更新：2024年*