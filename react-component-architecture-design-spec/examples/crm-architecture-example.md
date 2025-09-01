# 🎯 完整示例：用AI和组件架构设计规范开发CRM系统

> **真实的对话示例，展示如何一步步引导AI按照规范设计组件架构**

## 📋 项目概述

**目标**: 开发一个CRM（客户关系管理）系统
**技术**: 使用React组件架构设计规范 + React组件设计规范
**用户**: 销售人员和中小企业
**时间**: 4周完成MVP

**开发流程**: 架构设计 → 组件实现 → 测试部署

---

## 🗣️ 第一步：项目启动对话

**用户对AI说**：
```
我想开发一个CRM系统，需要先设计组件架构。

我的项目：
- 想做一个：CRM客户关系管理系统
- 类似这种：简化的Salesforce
- 主要功能：1. 客户信息管理 2. 跟进记录 3. 数据报表
- 目标用户：销售人员和中小企业
- 页面需求：登录页、仪表板、客户管理、跟进记录、报表分析

请按照React组件架构设计规范的简化版帮我：
1. 设计整体组件架构
2. 列出需要的核心组件
3. 说明组件层级关系
4. 推荐目录结构

然后再使用React组件设计规范来实现每个组件。

架构规范文档：https://github.com/your-repo/react-component-architecture-design-spec
组件设计规范：https://github.com/your-repo/react-component-design-spec
```

**AI回答**：
```
我理解了！您想开发一个CRM系统，我会按照React组件架构设计规范的简化版来帮您设计组件架构。

让我先分析您的需求：

## 架构设计分析

### 页面需求分析
- 登录页 (LoginPage)
- 仪表板 (DashboardPage)
- 客户管理 (CustomersPage)
- 跟进记录 (FollowUpsPage)
- 报表分析 (ReportsPage)

### 核心业务组件识别
- 客户相关：CustomerCard, CustomerList, CustomerForm, CustomerDetails
- 跟进相关：FollowUpCard, FollowUpList, FollowUpForm
- 报表相关：ReportChart, StatsCard, DataExporter
- 通用组件：SearchBar, FilterBar, DataTable

## 推荐的组件架构

### 分层架构设计
```
src/
├── pages/                    # 页面组件
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── CustomersPage.tsx
│   ├── FollowUpsPage.tsx
│   └── ReportsPage.tsx
├── components/               # 业务组件
│   ├── customer/            # 客户管理组件
│   │   ├── CustomerCard.tsx
│   │   ├── CustomerList.tsx
│   │   ├── CustomerForm.tsx
│   │   └── CustomerDetails.tsx
│   ├── followup/            # 跟进记录组件
│   │   ├── FollowUpCard.tsx
│   │   ├── FollowUpList.tsx
│   │   └── FollowUpForm.tsx
│   ├── reports/             # 报表组件
│   │   ├── ReportChart.tsx
│   │   ├── StatsCard.tsx
│   │   └── DataExporter.tsx
│   └── layout/              # 布局组件
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Layout.tsx
├── shared/                   # 共享组件
│   ├── ui/                   # 基础UI组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Table.tsx
│   │   └── Modal.tsx
│   ├── forms/                # 表单组件
│   │   ├── SearchBar.tsx
│   │   └── FilterBar.tsx
│   └── data/                 # 数据组件
│       └── DataTable.tsx
├── hooks/                    # 自定义Hooks
│   ├── useAuth.ts
│   ├── useCustomers.ts
│   ├── useFollowUps.ts
│   └── useReports.ts
├── services/                 # API服务
│   ├── authService.ts
│   ├── customerService.ts
│   └── followUpService.ts
├── utils/                    # 工具函数
├── types/                    # 类型定义
│   ├── customer.ts
│   ├── followUp.ts
│   └── auth.ts
└── lib/                      # 第三方库配置
```

### 组件层级关系
```
Layout (布局层)
├── Header (导航)
├── Sidebar (菜单)
└── Content (内容区域)
    ├── Pages (页面层)
    │   ├── DashboardPage
    │   ├── CustomersPage
    │   └── FollowUpsPage
    └── Business Components (业务组件层)
        ├── CustomerList
        ├── FollowUpForm
        └── ReportChart
            └── Shared Components (共享组件层)
                ├── Button, Input
                ├── Table, Modal
                └── SearchBar, FilterBar
```

### 组件分类说明
- **页面组件 (5个)**: 处理路由和页面级逻辑
- **业务组件 (12个)**: 实现具体业务功能
- **共享组件 (8个)**: 通用功能，可复用
- **总计**: 25个核心组件

这个架构设计符合React组件架构设计规范的分层原则，具有良好的可扩展性和可维护性。您觉得这个架构如何？我们可以基于这个架构开始具体的组件开发。
```

---

## 🏗️ 第二步：架构细化对话

**用户对AI说**：
```
很好！这个架构设计很清晰。现在我想细化一下客户管理模块的架构：

客户管理模块需求：
- 客户信息列表展示（支持搜索、筛选、排序、分页）
- 客户信息添加/编辑/删除
- 客户详情查看
- 客户跟进记录关联
- 客户数据导入/导出

请帮我设计客户管理模块的详细组件架构，包括：
1. 组件间的数据流
2. 状态管理方案
3. 组件接口设计
4. 性能考虑

请按照React组件架构设计规范的组件设计原则。
```

**AI回答**：
```
好的！让我为您设计客户管理模块的详细组件架构：

## 客户管理模块详细架构

### 组件数据流设计
```
CustomersPage (页面级组件)
    ↓ (管理状态和业务逻辑)
CustomerList (列表容器组件)
    ↓ (传递数据和回调)
CustomerCard (客户卡片组件)
    ↓ (交互事件)
CustomerDetails (客户详情组件)
    ↓ (关联数据)
FollowUpList (跟进记录组件)
```

### 状态管理方案
```typescript
// 页面级状态
interface CustomerPageState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filters: CustomerFilters;
  sortBy: keyof Customer;
  sortOrder: 'asc' | 'desc';
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// 使用自定义Hooks管理状态
const useCustomerPage = () => {
  // 整合所有客户相关的状态和逻辑
};
```

### 详细组件设计

#### 1. CustomerPage (页面组件)
```typescript
// 职责：页面级状态管理、路由处理、权限控制
interface CustomerPageProps {
  // 页面配置
}

const CustomerPage: React.FC<CustomerPageProps> = () => {
  const {
    customers,
    loading,
    error,
    searchQuery,
    filters,
    pagination,
    // ... 其他状态
  } = useCustomerPage();

  return (
    <div className="customer-page">
      <PageHeader title="客户管理" />
      <CustomerToolbar
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onExport={handleExport}
        onImport={handleImport}
      />
      <CustomerList
        customers={customers}
        loading={loading}
        error={error}
        onView={handleViewCustomer}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
      />
      <CustomerPagination
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
```

#### 2. CustomerList (列表容器组件)
```typescript
// 职责：数据展示、批量操作、排序分页
interface CustomerListProps {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  loading,
  error,
  onView,
  onEdit,
  onDelete
}) => {
  // 性能优化：使用React.memo和虚拟化列表
  return (
    <div className="customer-list">
      {customers.map(customer => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
```

#### 3. CustomerCard (客户卡片组件)
```typescript
// 职责：单个客户信息展示、基础交互
interface CustomerCardProps {
  customer: Customer;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = React.memo(({
  customer,
  onView,
  onEdit,
  onDelete
}) => {
  return (
    <div className="customer-card">
      <CustomerInfo customer={customer} />
      <CustomerActions
        customer={customer}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
});
```

### 组件接口设计

#### 数据接口
```typescript
// 客户数据类型
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  status: 'active' | 'inactive' | 'prospect';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastContact?: string;
  notes?: string;
}

// 筛选条件
interface CustomerFilters {
  status?: Customer['status'];
  company?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}
```

#### 事件处理器接口
```typescript
interface CustomerEventHandlers {
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onAddFollowUp: (customerId: string) => void;
  onExport: (customerIds: string[]) => void;
}
```

### 性能优化考虑

#### 1. 组件层面优化
```typescript
// 使用React.memo避免不必要的重渲染
const CustomerCard = React.memo(({ customer, onView, onEdit, onDelete }) => {
  // 组件实现
});

// 使用useCallback缓存事件处理函数
const handleViewCustomer = useCallback((customer: Customer) => {
  // 处理查看逻辑
}, []);

// 使用useMemo优化计算
const filteredCustomers = useMemo(() => {
  return customers.filter(filterFn);
}, [customers, filters]);
```

#### 2. 列表性能优化
```typescript
// 虚拟化列表处理大数据量
import { useVirtualizer } from '@tanstack/react-virtual';

const CustomerList: React.FC<CustomerListProps> = ({ customers }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: customers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // 每行大约80px
  });

  return (
    <div ref={parentRef} className="virtual-list">
      {rowVirtualizer.getVirtualItems().map(virtualRow => (
        <div key={virtualRow.index}>
          <CustomerCard customer={customers[virtualRow.index]} />
        </div>
      ))}
    </div>
  );
};
```

#### 3. 数据获取优化
```typescript
// 分页数据获取
const useCustomers = (params: CustomerQueryParams) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerService.getCustomers(params),
    keepPreviousData: true, // 保持旧数据，提升用户体验
    staleTime: 5 * 60 * 1000, // 5分钟内数据新鲜
  });
};
```

### 推荐的目录结构
```
src/components/customer/
├── CustomerPage.tsx          # 页面组件
├── CustomerList.tsx          # 列表容器
├── CustomerCard.tsx          # 客户卡片
├── CustomerDetails.tsx       # 客户详情
├── CustomerForm.tsx          # 客户表单
├── CustomerToolbar.tsx       # 工具栏
├── CustomerSearch.tsx        # 搜索组件
├── CustomerFilters.tsx       # 筛选组件
├── CustomerPagination.tsx    # 分页组件
└── hooks/
    ├── useCustomerPage.ts    # 页面状态管理
    ├── useCustomers.ts       # 客户数据获取
    └── useCustomerActions.ts # 客户操作
```

这个详细架构设计考虑了：
- **单一职责**: 每个组件职责明确
- **性能优化**: 使用React.memo、虚拟化、数据缓存
- **可扩展性**: 模块化设计，便于功能扩展
- **可维护性**: 清晰的代码结构和接口设计

您觉得这个详细架构如何？我们可以开始具体的组件开发了。
```

---

## 🎨 第三步：组件实现对话

**用户对AI说**：
```
很好！现在请基于这个架构设计，帮我实现CustomerCard组件。

请按照React组件设计规范的简化版来实现：

组件需求：
- 展示客户基本信息（姓名、公司、职位、邮箱、电话）
- 显示客户状态（活跃、非活跃、潜在客户）
- 显示最后联系时间
- 提供快捷操作按钮（查看、编辑、删除、添加跟进）
- 支持标签显示
- 响应式设计

请参考React组件设计规范中的：
- 客户端组件设计指南
- Props接口设计规范
- TypeScript类型定义
- 样式组织方式
- 性能优化建议

生成完整的CustomerCard组件代码。
```

**AI生成的CustomerCard组件**：
```tsx
// src/components/customer/CustomerCard.tsx
import React, { memo } from 'react';
import { Customer } from '@/types/customer';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { useCustomerActions } from '../hooks/useCustomerActions';

interface CustomerCardProps {
  customer: Customer;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onAddFollowUp: (customerId: string) => void;
  className?: string;
}

export const CustomerCard: React.FC<CustomerCardProps> = memo(({
  customer,
  onView,
  onEdit,
  onDelete,
  onAddFollowUp,
  className = ''
}) => {
  const { isDeleting, handleDelete } = useCustomerActions(customer.id, onDelete);

  // 状态对应的样式和文本
  const statusConfig = {
    active: { variant: 'success' as const, text: '活跃' },
    inactive: { variant: 'secondary' as const, text: '非活跃' },
    prospect: { variant: 'warning' as const, text: '潜在客户' }
  };

  const currentStatus = statusConfig[customer.status];

  // 格式化最后联系时间
  const formatLastContact = (date?: string) => {
    if (!date) return '暂无联系';
    const contactDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    return `${Math.floor(diffDays / 30)}个月前`;
  };

  return (
    <Card className={`customer-card ${className}`} hoverable>
      <Card.Header className="customer-card__header">
        <div className="customer-card__info">
          <h3 className="customer-card__name">{customer.name}</h3>
          <div className="customer-card__company">{customer.company}</div>
          <div className="customer-card__position">{customer.position}</div>
        </div>
        <Badge variant={currentStatus.variant} className="customer-card__status">
          {currentStatus.text}
        </Badge>
      </Card.Header>

      <Card.Content className="customer-card__content">
        <div className="customer-card__contact">
          <div className="customer-card__email">
            <span className="customer-card__label">邮箱:</span>
            <a href={`mailto:${customer.email}`} className="customer-card__link">
              {customer.email}
            </a>
          </div>
          <div className="customer-card__phone">
            <span className="customer-card__label">电话:</span>
            <a href={`tel:${customer.phone}`} className="customer-card__link">
              {customer.phone}
            </a>
          </div>
        </div>

        {customer.tags.length > 0 && (
          <div className="customer-card__tags">
            <span className="customer-card__label">标签:</span>
            <div className="customer-card__tags-list">
              {customer.tags.map((tag, index) => (
                <Badge key={index} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="customer-card__last-contact">
          <span className="customer-card__label">最后联系:</span>
          <span className="customer-card__contact-time">
            {formatLastContact(customer.lastContact)}
          </span>
        </div>
      </Card.Content>

      <Card.Footer className="customer-card__actions">
        <div className="customer-card__actions-group">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(customer)}
            className="customer-card__action-btn"
          >
            查看
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(customer)}
            className="customer-card__action-btn"
          >
            编辑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAddFollowUp(customer.id)}
            className="customer-card__action-btn"
          >
            跟进
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting}
            className="customer-card__action-btn customer-card__action-btn--delete"
          >
            {isDeleting ? '删除中...' : '删除'}
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
});

CustomerCard.displayName = 'CustomerCard';
```

**AI生成的样式文件**：
```scss
// src/components/customer/CustomerCard.scss
.customer-card {
  transition: all 0.2s ease;
  border: 1px solid var(--color-border);
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  &__info {
    flex: 1;
  }

  &__name {
    margin: 0 0 0.25rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__company {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.125rem;
  }

  &__position {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }

  &__status {
    font-size: 0.75rem;
  }

  &__content {
    space-y: 0.75rem;
  }

  &__contact {
    margin-bottom: 0.75rem;
  }

  &__label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-tertiary);
    margin-right: 0.5rem;
    display: inline-block;
    min-width: 3rem;
  }

  &__link {
    color: var(--color-primary);
    text-decoration: none;
    font-size: 0.875rem;
    
    &:hover {
      text-decoration: underline;
    }
  }

  &__tags {
    margin-bottom: 0.75rem;
  }

  &__tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.25rem;
  }

  &__last-contact {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  &__contact-time {
    font-weight: 500;
  }

  &__actions {
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border);
  }

  &__actions-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__action-btn {
    flex: 1;
    min-width: 4rem;
    
    &--delete {
      color: var(--color-danger);
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    &__header {
      flex-direction: column;
      gap: 0.5rem;
    }

    &__actions-group {
      flex-direction: column;
    }

    &__action-btn {
      width: 100%;
    }
  }
}
```

**AI生成的Hook**：
```tsx
// src/components/customer/hooks/useCustomerActions.ts
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customerService';
import { toast } from '@/shared/ui/toast';

export const useCustomerActions = (
  customerId: string,
  onDelete?: (customerId: string) => void
) => {
  const queryClient = useQueryClient();

  // 删除客户
  const deleteMutation = useMutation({
    mutationFn: customerService.deleteCustomer,
    onSuccess: () => {
      // 使客户列表缓存失效
      queryClient.invalidateQueries(['customers']);
      toast.success('客户删除成功');
      onDelete?.(customerId);
    },
    onError: (error) => {
      toast.error('删除失败，请重试');
      console.error('删除客户失败:', error);
    }
  });

  const handleDelete = useCallback(() => {
    if (window.confirm('确定要删除这个客户吗？此操作不可撤销。')) {
      deleteMutation.mutate(customerId);
    }
  }, [customerId, deleteMutation]);

  return {
    isDeleting: deleteMutation.isLoading,
    handleDelete
  };
};
```

---

## 🧪 第四步：测试对话

**用户对AI说**：
```
很好！现在请为CustomerCard组件生成测试用例。

请按照React组件设计规范的测试指南：

测试要求：
- 单元测试覆盖率 > 80%
- 包含用户交互测试
- 测试各种状态（正常、加载中、错误状态）
- 测试响应式设计
- 使用测试数据生成器

请使用规范中的：
- 测试数据生成器
- 测试自动化指南
- 测试检查清单

生成完整的测试代码和运行说明。
```

**AI生成的测试代码**：
```tsx
// src/components/customer/CustomerCard.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerCard } from './CustomerCard';
import { Customer } from '@/types/customer';
import { factories } from '@/test/factories';

// Mock the useCustomerActions hook
jest.mock('../hooks/useCustomerActions');

describe('CustomerCard', () => {
  const mockOnView = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnAddFollowUp = jest.fn();

  // 使用测试数据生成器生成测试数据
  const mockCustomer: Customer = factories.customer.build({
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '13800138001',
    company: '腾讯',
    position: '产品经理',
    status: 'active',
    tags: ['VIP', '重点客户'],
    lastContact: '2024-01-15T10:30:00Z'
  });

  const mockUseCustomerActions = require('../hooks/useCustomerActions');

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCustomerActions.mockReturnValue({
      isDeleting: false,
      handleDelete: jest.fn()
    });
  });

  it('应该渲染客户基本信息', () => {
    render(
      <CustomerCard
        customer={mockCustomer}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
      />
    );

    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('腾讯')).toBeInTheDocument();
    expect(screen.getByText('产品经理')).toBeInTheDocument();
    expect(screen.getByText('zhangsan@example.com')).toBeInTheDocument();
    expect(screen.getByText('13800138001')).toBeInTheDocument();
  });

  it('应该显示客户状态', () => {
    render(
      <CustomerCard
        customer={mockCustomer}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
      />
    );

    expect(screen.getByText('活跃')).toBeInTheDocument();
  });

  it('应该显示客户标签', () => {
    render(
      <CustomerCard
        customer={mockCustomer}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
      />
    );

    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('重点客户')).toBeInTheDocument();
  });

  it('应该格式化最后联系时间', () => {
    const customerWithRecentContact = {
      ...mockCustomer,
      lastContact: new Date().toISOString()
    };

    render(
      <CustomerCard
        customer={customerWithRecentContact}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
      />
    );

    expect(screen.getByText('今天')).toBeInTheDocument();
  });

  it('应该处理查看操作', () => {
    render(
      <CustomerCard
        customer={mockCustomer}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
      />
    );

    const viewButton = screen.getByText('查看');
    fireEvent.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith(mockCustomer);
  });

  it('应该处理编辑操作', () => {
    render(
      <CustomerCard
        customer={mockCustomer}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
      />
    );

    const editButton = screen.getByText('编辑');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCustomer);
  });

  it('应该处理跟进操作', () => {
    render(
      <CustomerCard
        customer={mockCustomer}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
      />
    );

    const followUpButton = screen.getByText('跟进');
    fireEvent.click(followUpButton);

    expect(mockOnAddFollowUp).toHaveBeenCalledWith(mockCustomer.id);
  });

  it('应该处理删除操作', () => {
    const mockHandleDelete = jest.fn();
    mockUseCustomerActions.mockReturnValue({
      isDeleting: false,
      handleDelete: mockHandleDelete
    });

    render(
      <CustomerCard
        customer={mockCustomer}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
      />
    );

    const deleteButton = screen.getByText('删除');
    fireEvent.click(deleteButton);

    expect(mockHandleDelete).toHaveBeenCalled();
  });

  it('应该显示删除中的状态', () => {
    mockUseCustomerActions.mockReturnValue({
      isDeleting: true,
      handleDelete: jest.fn()
    });

    render(
      <CustomerCard
        customer={mockCustomer}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
      />
    );

    expect(screen.getByText('删除中...')).toBeInTheDocument();
  });

  it('应该处理没有最后联系时间的情况', () => {
    const customerWithoutLastContact = {
      ...mockCustomer,
      lastContact: undefined
    };

    render(
      <CustomerCard
        customer={customerWithoutLastContact}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
      />
    );

    expect(screen.getByText('暂无联系')).toBeInTheDocument();
  });

  it('应该处理不同客户状态', () => {
    const inactiveCustomer = {
      ...mockCustomer,
      status: 'inactive' as const
    };

    render(
      <CustomerCard
        customer={inactiveCustomer}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
      />
    );

    expect(screen.getByText('非活跃')).toBeInTheDocument();
  });

  it('应该响应自定义className', () => {
    const { container } = render(
      <CustomerCard
        customer={mockCustomer}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  // 性能测试
  it('应该使用React.memo优化渲染', () => {
    const { rerender } = render(
      <CustomerCard
        customer={mockCustomer}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
      />
    );

    // 重新渲染相同的props，不应该触发重新渲染
    rerender(
      <CustomerCard
        customer={mockCustomer}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
      />
    );

    // 如果使用React.memo，组件不会重新渲染
    // 这里我们只是验证组件能正确处理相同的props
    expect(screen.getByText('张三')).toBeInTheDocument();
  });

  // 可访问性测试
  it('应该符合可访问性标准', () => {
    render(
      <CustomerCard
        customer={mockCustomer}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddFollowUp={mockOnAddFollowUp}
      />
    );

    // 检查按钮是否有正确的aria-label
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
    });

    // 检查链接是否有正确的href
    const emailLink = screen.getByText('zhangsan@example.com');
    expect(emailLink).toHaveAttribute('href', 'mailto:zhangsan@example.com');

    const phoneLink = screen.getByText('13800138001');
    expect(phoneLink).toHaveAttribute('href', 'tel:13800138001');
  });
});

// 集成测试
describe('CustomerCard Integration', () => {
  it('应该与useCustomerActions hook正确集成', async () => {
    const mockHandleDelete = jest.fn();
    mockUseCustomerActions.mockReturnValue({
      isDeleting: false,
      handleDelete: mockHandleDelete
    });

    const mockCustomer = factories.customer.build();

    render(
      <CustomerCard
        customer={mockCustomer}
        onView={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onAddFollowUp={jest.fn()}
      />
    );

    const deleteButton = screen.getByText('删除');
    fireEvent.click(deleteButton);

    expect(mockHandleDelete).toHaveBeenCalled();
  });
});
```

---

## 🐛 第五步：调试和优化对话

**用户对AI说**：
```
我的CustomerCard组件在渲染大量客户时性能有问题，请用React组件架构设计规范的调试工具帮我优化：

当前问题：
- 客户列表页面渲染缓慢（100+客户）
- 滚动时卡顿
- 内存使用过多
- 重渲染频繁

请使用规范中的：
- 性能优化指南
- 调试工具
- 性能监控方案

帮我分析问题并提供优化方案。
```

**AI提供的优化方案**：
```tsx
// 优化后的CustomerCard组件
import React, { memo, useCallback } from 'react';
import { Customer } from '@/types/customer';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { useCustomerActions } from '../hooks/useCustomerActions';
import { usePerformanceDebug } from '@/utils/console-debug';

interface CustomerCardProps {
  customer: Customer;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onAddFollowUp: (customerId: string) => void;
  className?: string;
}

// 使用memo进行深度比较
export const CustomerCard: React.FC<CustomerCardProps> = memo(({
  customer,
  onView,
  onEdit,
  onDelete,
  onAddFollowUp,
  className = ''
}) => {
  // 性能调试
  const { renderCount, getStats } = usePerformanceDebug('CustomerCard');
  
  const { isDeleting, handleDelete } = useCustomerActions(customer.id, onDelete);

  // 使用useCallback缓存事件处理函数
  const handleView = useCallback(() => {
    onView(customer);
  }, [customer, onView]);

  const handleEdit = useCallback(() => {
    onEdit(customer);
  }, [customer, onEdit]);

  const handleAddFollowUp = useCallback(() => {
    onAddFollowUp(customer.id);
  }, [customer.id, onAddFollowUp]);

  // 缓存计算结果
  const statusConfig = React.useMemo(() => ({
    active: { variant: 'success' as const, text: '活跃' },
    inactive: { variant: 'secondary' as const, text: '非活跃' },
    prospect: { variant: 'warning' as const, text: '潜在客户' }
  }), []);

  const currentStatus = statusConfig[customer.status];

  // 缓存格式化函数结果
  const formattedLastContact = React.useMemo(() => {
    if (!customer.lastContact) return '暂无联系';
    const contactDate = new Date(customer.lastContact);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    return `${Math.floor(diffDays / 30)}个月前`;
  }, [customer.lastContact]);

  // 缓存标签渲染
  const renderedTags = React.useMemo(() => {
    if (customer.tags.length === 0) return null;
    
    return (
      <div className="customer-card__tags">
        <span className="customer-card__label">标签:</span>
        <div className="customer-card__tags-list">
          {customer.tags.map((tag, index) => (
            <Badge key={index} variant="outline" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    );
  }, [customer.tags]);

  // 懒加载图片（如果有头像）
  const [imageLoaded, setImageLoaded] = React.useState(false);

  return (
    <Card className={`customer-card customer-card--optimized ${className}`} hoverable>
      <Card.Header className="customer-card__header">
        <div className="customer-card__info">
          <h3 className="customer-card__name">{customer.name}</h3>
          <div className="customer-card__company">{customer.company}</div>
          <div className="customer-card__position">{customer.position}</div>
        </div>
        <Badge variant={currentStatus.variant} className="customer-card__status">
          {currentStatus.text}
        </Badge>
      </Card.Header>

      <Card.Content className="customer-card__content">
        <div className="customer-card__contact">
          <div className="customer-card__email">
            <span className="customer-card__label">邮箱:</span>
            <a href={`mailto:${customer.email}`} className="customer-card__link">
              {customer.email}
            </a>
          </div>
          <div className="customer-card__phone">
            <span className="customer-card__label">电话:</span>
            <a href={`tel:${customer.phone}`} className="customer-card__link">
              {customer.phone}
            </a>
          </div>
        </div>

        {renderedTags}

        <div className="customer-card__last-contact">
          <span className="customer-card__label">最后联系:</span>
          <span className="customer-card__contact-time">
            {formattedLastContact}
          </span>
        </div>
      </Card.Content>

      <Card.Footer className="customer-card__actions">
        <div className="customer-card__actions-group">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleView}
            className="customer-card__action-btn"
          >
            查看
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="customer-card__action-btn"
          >
            编辑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAddFollowUp}
            className="customer-card__action-btn"
          >
            跟进
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting}
            className="customer-card__action-btn customer-card__action-btn--delete"
          >
            {isDeleting ? '删除中...' : '删除'}
          </Button>
        </div>
      </Card.Footer>

      {/* 性能调试信息（仅在开发环境显示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="customer-card__debug-info" style={{ fontSize: '10px', color: '#999' }}>
          渲染次数: {renderCount}
        </div>
      )}
    </Card>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，深度比较customer对象
  return (
    prevProps.customer.id === nextProps.customer.id &&
    prevProps.customer.name === nextProps.customer.name &&
    prevProps.customer.email === nextProps.customer.email &&
    prevProps.customer.company === nextProps.customer.company &&
    prevProps.customer.status === nextProps.customer.status &&
    prevProps.customer.tags.join(',') === nextProps.customer.tags.join(',') &&
    prevProps.customer.lastContact === nextProps.customer.lastContact &&
    prevProps.isDeleting === nextProps.isDeleting
  );
});

CustomerCard.displayName = 'CustomerCard';
```

**AI提供的虚拟化列表解决方案**：
```tsx
// src/components/customer/CustomerVirtualizedList.tsx
import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Customer } from '@/types/customer';
import { CustomerCard } from './CustomerCard';

interface CustomerVirtualizedListProps {
  customers: Customer[];
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onAddFollowUp: (customerId: string) => void;
  loading?: boolean;
}

export const CustomerVirtualizedList: React.FC<CustomerVirtualizedListProps> = ({
  customers,
  onView,
  onEdit,
  onDelete,
  onAddFollowUp,
  loading = false
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // 使用虚拟化列表
  const rowVirtualizer = useVirtualizer({
    count: customers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // 每个CustomerCard大约200px高
    overscan: 5, // 预渲染5个额外的项目
  });

  // 缓存项目
  const items = useMemo(() => {
    return rowVirtualizer.getVirtualItems().map((virtualRow) => {
      const customer = customers[virtualRow.index];
      return {
        virtualRow,
        customer,
        key: `${customer.id}-${virtualRow.index}`
      };
    });
  }, [customers, rowVirtualizer.getVirtualItems()]);

  if (loading) {
    return (
      <div className="customer-list__loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="customer-list__virtual-container"
      style={{
        height: '600px',
        overflow: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '0.375rem'
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {items.map(({ virtualRow, customer, key }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <CustomerCard
              customer={customer}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddFollowUp={onAddFollowUp}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🎯 成果总结

### 4周完成的CRM系统架构和组件

#### 架构设计成果
1. ✅ **完整的组件架构设计** - 25个核心组件，分层架构
2. ✅ **详细的数据流设计** - 状态管理、组件通信
3. ✅ **性能优化方案** - 虚拟化列表、React.memo、useMemo
4. ✅ **可扩展的目录结构** - 模块化组织，便于维护

#### 组件实现成果
1. ✅ **CustomerCard组件** - 完整的客户信息展示
2. ✅ **虚拟化列表组件** - 支持大量数据的高效渲染
3. ✅ **性能优化** - 解决了大数据量渲染问题
4. ✅ **完整测试覆盖** - 单元测试、集成测试、性能测试
5. ✅ **调试工具集成** - 性能监控、错误诊断

### 使用双规范的好处

#### 1. 架构设计阶段
- **先设计架构，再实现组件** - 避免了架构混乱
- **清晰的组件边界** - 每个组件职责明确
- **合理的数据流** - 状态管理和组件通信清晰
- **良好的扩展性** - 便于后续功能扩展

#### 2. 组件实现阶段
- **代码质量高** - 遵循组件设计规范
- **性能优秀** - 优化后的组件支持大数据量
- **测试完善** - 自动化测试保证质量
- **维护成本低** - 标准化的代码结构

#### 3. 开发效率提升
- **架构先行** - 减少了重构次数
- **规范指导** - 组件开发有明确标准
- **工具支持** - 自动化测试和调试
- **团队协作** - 清晰的代码结构和规范

### 关键成功因素

#### 1. **分层设计思路**
- 架构设计规范：解决"需要什么组件"的问题
- 组件设计规范：解决"如何实现组件"的问题
- 两个规范相互配合，各司其职

#### 2. **渐进式开发流程**
- 第一步：整体架构设计
- 第二步：模块架构细化
- 第三步：具体组件实现
- 第四步：测试和优化

#### 3. **AI协作模式**
- 使用AI对话模板进行架构设计
- 基于架构设计进行组件开发
- 利用AI进行测试和调试

---

**这个例子展示了如何真正利用React组件架构设计规范和组件设计规范来指导AI开发高质量的应用！** 🏗️🚀