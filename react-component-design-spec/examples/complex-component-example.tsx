/**
 * 复杂组件示例 - DataTable
 * 
 * 展示了一个完整的数据表格组件实现，包含排序、过滤、分页、选择等功能
 * 符合React最佳实践和设计规范
 * 
 * @author Claude
 * @created 2024-01-01
 * @updated 2024-01-01
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// ==================== 类型定义 ====================

/** 表格列类型 */
export interface TableColumn<T = any> {
  /** 列标题 */
  title: React.ReactNode;
  /** 数据字段名 */
  dataIndex: keyof T;
  /** 列键名 */
  key?: string;
  /** 列宽度 */
  width?: number | string;
  /** 固定列 */
  fixed?: 'left' | 'right' | boolean;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 是否可排序 */
  sortable?: boolean;
  /** 过滤器选项 */
  filters?: Array<{ text: React.ReactNode; value: any }>;
  /** 自定义渲染函数 */
  render?: (value: any, record: T, index: number) => React.ReactNode;
  /** 是否显示 */
  visible?: boolean;
}

/** 排序方向 */
export type SortDirection = 'asc' | 'desc' | null;

/** 排序状态 */
export interface SortState {
  /** 排序字段 */
  field: string;
  /** 排序方向 */
  direction: SortDirection;
}

/** 过滤状态 */
export interface FilterState {
  /** 过滤字段 */
  field: string;
  /** 过滤值 */
  value: any;
}

/** 分页状态 */
export interface PaginationState {
  /** 当前页码 */
  current: number;
  /** 每页条数 */
  pageSize: number;
  /** 总条数 */
  total: number;
}

/** 选择状态 */
export interface SelectionState {
  /** 选中的行键值 */
  selectedRowKeys: (string | number)[];
  /** 选中的行数据 */
  selectedRows: any[];
}

/** 表格Props接口 */
export interface DataTableProps<T = any> {
  /** 数据源 */
  data: T[];
  /** 列定义 */
  columns: TableColumn<T>[];
  /** 行键值 */
  rowKey?: keyof T | ((record: T, index: number) => string | number);
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示斑马纹 */
  striped?: boolean;
  /** 是否显示表头 */
  showHeader?: boolean;
  /** 是否可滚动 */
  scroll?: { x?: number | string; y?: number | string };
  /** 分页配置 */
  pagination?: false | PaginationState | {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  /** 行选择配置 */
  rowSelection?: {
    selectedRowKeys: (string | number)[];
    onChange: (selectedRowKeys: (string | number)[], selectedRows: T[]) => void;
    getCheckboxProps?: (record: T) => object;
  };
  /** 是否展开行 */
  expandable?: {
    expandedRowKeys: (string | number)[];
    onExpandedRowsChange: (expandedRowKeys: (string | number)[]) => void;
    expandedRowRender: (record: T, index: number, indent: number, expanded: boolean) => React.ReactNode;
  };
  /** 加载状态 */
  loading?: boolean;
  /** 空状态渲染 */
  emptyText?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 行类名 */
  rowClassName?: (record: T, index: number) => string;
  /** 行点击事件 */
  onRowClick?: (record: T, index: number, event: React.MouseEvent) => void;
  /** 行双击事件 */
  onRowDoubleClick?: (record: T, index: number, event: React.MouseEvent) => void;
  /** 排序变化事件 */
  onSortChange?: (sortState: SortState) => void;
  /** 过滤变化事件 */
  onFilterChange?: (filterState: FilterState[]) => void;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

// ==================== 工具函数 ====================

/**
 * 获取行键值
 */
export const getRowKey = <T = any>(
  record: T,
  index: number,
  rowKey?: keyof T | ((record: T, index: number) => string | number)
): string | number => {
  if (typeof rowKey === 'function') {
    return rowKey(record, index);
  }
  if (rowKey) {
    return record[rowKey] as string | number;
  }
  return index;
};

/**
 * 排序数据
 */
export const sortData = <T = any>(
  data: T[],
  sortState: SortState,
  columns: TableColumn<T>[]
): T[] => {
  if (!sortState.field || !sortState.direction) {
    return data;
  }
  
  const column = columns.find(col => col.dataIndex === sortState.field);
  if (!column) {
    return data;
  }
  
  return [...data].sort((a, b) => {
    const valueA = a[sortState.field as keyof T];
    const valueB = b[sortState.field as keyof T];
    
    // 使用自定义排序函数
    if (column.sortable && typeof column.sortable === 'function') {
      return column.sortable(a, b);
    }
    
    // 默认排序
    if (valueA < valueB) {
      return sortState.direction === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortState.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

/**
 * 过滤数据
 */
export const filterData = <T = any>(
  data: T[],
  filterStates: FilterState[],
  columns: TableColumn<T>[]
): T[] => {
  if (filterStates.length === 0) {
    return data;
  }
  
  return data.filter(record => {
    return filterStates.every(filter => {
      const column = columns.find(col => col.dataIndex === filter.field);
      if (!column) {
        return true;
      }
      
      const value = record[filter.field as keyof T];
      return filter.value === value;
    });
  });
};

// ==================== 主组件 ====================

/**
 * DataTable 组件
 * 
 * 一个功能完整的数据表格组件，支持排序、过滤、分页、选择等功能
 * 
 * @component
 * @example
 * const columns = [
 *   { title: '姓名', dataIndex: 'name', key: 'name' },
 *   { title: '年龄', dataIndex: 'age', key: 'age', sortable: true }
 * ];
 * 
 * const data = [
 *   { id: 1, name: '张三', age: 25 },
 *   { id: 2, name: '李四', age: 30 }
 * ];
 * 
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   rowKey="id"
 * />
 */
export const DataTable = <T = any>({
  data,
  columns,
  rowKey,
  bordered = false,
  striped = false,
  showHeader = true,
  scroll,
  pagination,
  rowSelection,
  expandable,
  loading = false,
  emptyText = '暂无数据',
  className,
  rowClassName,
  onRowClick,
  onRowDoubleClick,
  onSortChange,
  onFilterChange,
  style,
}: DataTableProps<T>) => {
  // ==================== 状态管理 ====================
  
  const [sortState, setSortState] = useState<SortState>({
    field: '',
    direction: null,
  });
  
  const [filterStates, setFilterStates] = useState<FilterState[]>([]);
  const [expandedRows, setExpandedRows] = useState<(string | number)[]>([]);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>(
    rowSelection?.selectedRowKeys || []
  );
  
  const tableRef = useRef<HTMLDivElement>(null);
  
  // ==================== 计算属性 ====================
  
  /**
   * 处理数据：过滤、排序、分页
   */
  const processedData = useMemo(() => {
    let result = data;
    
    // 过滤
    result = filterData(result, filterStates, columns);
    
    // 排序
    result = sortData(result, sortState, columns);
    
    // 分页
    if (pagination && typeof pagination === 'object' && 'current' in pagination) {
      const { current, pageSize } = pagination;
      const startIndex = (current - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      result = result.slice(startIndex, endIndex);
    }
    
    return result;
  }, [data, filterStates, sortState, pagination, columns]);
  
  /**
   * 计算表格类名
   */
  const tableClassName = useMemo(() => {
    return cn(
      'data-table',
      {
        'data-table-bordered': bordered,
        'data-table-striped': striped,
        'data-table-loading': loading,
      },
      className
    );
  }, [bordered, striped, loading, className]);
  
  /**
   * 计算可见列
   */
  const visibleColumns = useMemo(() => {
    return columns.filter(col => col.visible !== false);
  }, [columns]);
  
  // ==================== 事件处理 ====================
  
  /**
   * 处理排序
   */
  const handleSort = useCallback((field: string) => {
    let newDirection: SortDirection = 'asc';
    
    if (sortState.field === field) {
      if (sortState.direction === 'asc') {
        newDirection = 'desc';
      } else if (sortState.direction === 'desc') {
        newDirection = null;
      }
    }
    
    const newSortState: SortState = {
      field: newDirection ? field : '',
      direction: newDirection,
    };
    
    setSortState(newSortState);
    onSortChange?.(newSortState);
  }, [sortState, onSortChange]);
  
  /**
   * 处理过滤
   */
  const handleFilter = useCallback((field: string, value: any) => {
    const existingFilterIndex = filterStates.findIndex(f => f.field === field);
    let newFilterStates: FilterState[];
    
    if (existingFilterIndex >= 0) {
      if (value === null || value === undefined || value === '') {
        newFilterStates = filterStates.filter(f => f.field !== field);
      } else {
        newFilterStates = [...filterStates];
        newFilterStates[existingFilterIndex] = { field, value };
      }
    } else {
      newFilterStates = [...filterStates, { field, value }];
    }
    
    setFilterStates(newFilterStates);
    onFilterChange?.(newFilterStates);
  }, [filterStates, onFilterChange]);
  
  /**
   * 处理行选择
   */
  const handleRowSelect = useCallback((rowKey: string | number, checked: boolean, record: T) => {
    let newSelectedRows: (string | number)[];
    
    if (checked) {
      newSelectedRows = [...selectedRows, rowKey];
    } else {
      newSelectedRows = selectedRows.filter(key => key !== rowKey);
    }
    
    setSelectedRows(newSelectedRows);
    
    if (rowSelection) {
      const selectedRowData = data.filter(item => 
        newSelectedRows.includes(getRowKey(item, 0, rowKey))
      );
      rowSelection.onChange(newSelectedRows, selectedRowData);
    }
  }, [selectedRows, rowSelection, data, rowKey]);
  
  /**
   * 处理全选
   */
  const handleSelectAll = useCallback((checked: boolean) => {
    const allRowKeys = processedData.map((item, index) => 
      getRowKey(item, index, rowKey)
    );
    
    let newSelectedRows: (string | number)[];
    
    if (checked) {
      newSelectedRows = [...new Set([...selectedRows, ...allRowKeys])];
    } else {
      newSelectedRows = selectedRows.filter(key => !allRowKeys.includes(key));
    }
    
    setSelectedRows(newSelectedRows);
    
    if (rowSelection) {
      const selectedRowData = data.filter(item => 
        newSelectedRows.includes(getRowKey(item, 0, rowKey))
      );
      rowSelection.onChange(newSelectedRows, selectedRowData);
    }
  }, [selectedRows, processedData, rowSelection, data, rowKey]);
  
  /**
   * 处理展开行
   */
  const handleExpand = useCallback((rowKey: string | number) => {
    const newExpandedRows = expandedRows.includes(rowKey)
      ? expandedRows.filter(key => key !== rowKey)
      : [...expandedRows, rowKey];
    
    setExpandedRows(newExpandedRows);
    
    if (expandable) {
      expandable.onExpandedRowsChange(newExpandedRows);
    }
  }, [expandedRows, expandable]);
  
  /**
   * 处理行点击
   */
  const handleRowClick = useCallback((record: T, index: number, event: React.MouseEvent) => {
    onRowClick?.(record, index, event);
  }, [onRowClick]);
  
  /**
   * 处理行双击
   */
  const handleRowDoubleClick = useCallback((record: T, index: number, event: React.MouseEvent) => {
    onRowDoubleClick?.(record, index, event);
  }, [onRowDoubleClick]);
  
  // ==================== 渲染逻辑 ====================
  
  /**
   * 渲染表头
   */
  const renderHeader = () => {
    if (!showHeader) {
      return null;
    }
    
    return (
      <thead className="data-table-header">
        <tr>
          {rowSelection && (
            <th className="data-table-cell data-table-checkbox">
              <input
                type="checkbox"
                checked={processedData.length > 0 && processedData.every(item => 
                  selectedRows.includes(getRowKey(item, 0, rowKey))
                )}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
          )}
          {expandable && (
            <th className="data-table-cell data-table-expand" />
          )}
          {visibleColumns.map((column, index) => (
            <th
              key={column.key || column.dataIndex || index}
              className={cn(
                'data-table-cell',
                `data-table-cell-${column.align || 'left'}`,
                {
                  'data-table-cell-fixed-left': column.fixed === 'left',
                  'data-table-cell-fixed-right': column.fixed === 'right',
                }
              )}
              style={{ width: column.width }}
            >
              <div className="data-table-header-content">
                <span className="data-table-header-title">{column.title}</span>
                {column.sortable && (
                  <div className="data-table-sorter">
                    <button
                      className={cn('data-table-sorter-up', {
                        'data-table-sorter-active': sortState.field === column.dataIndex && sortState.direction === 'asc'
                      })}
                      onClick={() => handleSort(column.dataIndex as string)}
                    >
                      ↑
                    </button>
                    <button
                      className={cn('data-table-sorter-down', {
                        'data-table-sorter-active': sortState.field === column.dataIndex && sortState.direction === 'desc'
                      })}
                      onClick={() => handleSort(column.dataIndex as string)}
                    >
                      ↓
                    </button>
                  </div>
                )}
                {column.filters && (
                  <select
                    className="data-table-filter"
                    onChange={(e) => handleFilter(column.dataIndex as string, e.target.value)}
                  >
                    <option value="">全部</option>
                    {column.filters.map((filter, idx) => (
                      <option key={idx} value={filter.value}>
                        {filter.text}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </th>
          ))}
        </tr>
      </thead>
    );
  };
  
  /**
   * 渲染表体
   */
  const renderBody = () => {
    if (loading) {
      return (
        <tbody>
          <tr>
            <td colSpan={visibleColumns.length + (rowSelection ? 1 : 0) + (expandable ? 1 : 0)}>
              <div className="data-table-loading">
                <div className="data-table-spinner" />
                <span>加载中...</span>
              </div>
            </td>
          </tr>
        </tbody>
      );
    }
    
    if (processedData.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={visibleColumns.length + (rowSelection ? 1 : 0) + (expandable ? 1 : 0)}>
              <div className="data-table-empty">
                {emptyText}
              </div>
            </td>
          </tr>
        </tbody>
      );
    }
    
    return (
      <tbody>
        {processedData.map((record, index) => {
          const rowKeyValue = getRowKey(record, index, rowKey);
          const isExpanded = expandedRows.includes(rowKeyValue);
          const isSelected = selectedRows.includes(rowKeyValue);
          
          return (
            <React.Fragment key={rowKeyValue}>
              <tr
                className={cn(
                  'data-table-row',
                  rowClassName?.(record, index),
                  {
                    'data-table-row-selected': isSelected,
                    'data-table-row-striped': striped && index % 2 === 1,
                  }
                )}
                onClick={(e) => handleRowClick(record, index, e)}
                onDoubleClick={(e) => handleRowDoubleClick(record, index, e)}
              >
                {rowSelection && (
                  <td className="data-table-cell data-table-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleRowSelect(rowKeyValue, e.target.checked, record)}
                      {...rowSelection.getCheckboxProps?.(record)}
                    />
                  </td>
                )}
                {expandable && (
                  <td className="data-table-cell data-table-expand">
                    <button
                      className={cn('data-table-expand-icon', {
                        'data-table-expand-icon-expanded': isExpanded
                      })}
                      onClick={() => handleExpand(rowKeyValue)}
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                  </td>
                )}
                {visibleColumns.map((column, colIndex) => (
                  <td
                    key={column.key || column.dataIndex || colIndex}
                    className={cn(
                      'data-table-cell',
                      `data-table-cell-${column.align || 'left'}`,
                      {
                        'data-table-cell-fixed-left': column.fixed === 'left',
                        'data-table-cell-fixed-right': column.fixed === 'right',
                      }
                    )}
                  >
                    {column.render
                      ? column.render(record[column.dataIndex], record, index)
                      : record[column.dataIndex]}
                  </td>
                ))}
              </tr>
              {expandable && isExpanded && (
                <tr className="data-table-expanded-row">
                  <td colSpan={visibleColumns.length + (rowSelection ? 1 : 0) + (expandable ? 1 : 0)}>
                    <div className="data-table-expanded-content">
                      {expandable.expandedRowRender(record, index, 0, true)}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    );
  };
  
  /**
   * 渲染分页
   */
  const renderPagination = () => {
    if (!pagination) {
      return null;
    }
    
    const { current, pageSize, total } = typeof pagination === 'object' && 'current' in pagination
      ? pagination
      : { current: 1, pageSize: 10, total: 0 };
    
    const totalPages = Math.ceil(total / pageSize);
    
    return (
      <div className="data-table-pagination">
        <div className="data-table-pagination-info">
          显示 {(current - 1) * pageSize + 1} - {Math.min(current * pageSize, total)} 条，共 {total} 条
        </div>
        <div className="data-table-pagination-controls">
          <button
            className="data-table-pagination-button"
            disabled={current === 1}
            onClick={() => pagination?.onChange(current - 1, pageSize)}
          >
            上一页
          </button>
          <span className="data-table-pagination-current">
            {current} / {totalPages}
          </span>
          <button
            className="data-table-pagination-button"
            disabled={current === totalPages}
            onClick={() => pagination?.onChange(current + 1, pageSize)}
          >
            下一页
          </button>
        </div>
      </div>
    );
  };
  
  // ==================== 主渲染 ====================
  
  return (
    <div className="data-table-wrapper" ref={tableRef} style={style}>
      <div className={tableClassName}>
        <div className="data-table-container" style={scroll}>
          <table className="data-table-inner">
            {renderHeader()}
            {renderBody()}
          </table>
        </div>
        {renderPagination()}
      </div>
    </div>
  );
};

DataTable.displayName = 'DataTable';

// ==================== 类型导出 ====================

export type { 
  DataTableProps,
  TableColumn,
  SortState,
  FilterState,
  PaginationState,
  SelectionState,
  SortDirection,
};

// ==================== 样式定义（CSS-in-JS示例） ====================

/*
.data-table-wrapper {
  width: 100%;
  overflow: hidden;
}

.data-table {
  width: 100%;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  
  &-bordered {
    border: 1px solid #e5e7eb;
  }
  
  &-striped .data-table-row-striped {
    background-color: #f9fafb;
  }
  
  &-loading {
    position: relative;
    pointer-events: none;
    
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.7);
      z-index: 10;
    }
  }
}

.data-table-container {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 600px;
}

.data-table-inner {
  width: 100%;
  border-collapse: collapse;
  
  .data-table-header {
    background-color: #f9fafb;
    
    .data-table-cell {
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
      white-space: nowrap;
      
      &-left {
        text-align: left;
      }
      
      &-center {
        text-align: center;
      }
      
      &-right {
        text-align: right;
      }
      
      &-fixed-left {
        position: sticky;
        left: 0;
        z-index: 1;
        background: #f9fafb;
      }
      
      &-fixed-right {
        position: sticky;
        right: 0;
        z-index: 1;
        background: #f9fafb;
      }
    }
  }
  
  .data-table-row {
    &:hover {
      background-color: #f3f4f6;
    }
    
    &-selected {
      background-color: #dbeafe !important;
    }
  }
  
  .data-table-cell {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f3f4f6;
    color: #6b7280;
    
    &-left {
      text-align: left;
    }
    
    &-center {
      text-align: center;
    }
    
    &-right {
      text-align: right;
    }
    
    &-fixed-left {
      position: sticky;
      left: 0;
      z-index: 1;
      background: white;
    }
    
    &-fixed-right {
      position: sticky;
      right: 0;
      z-index: 1;
      background: white;
    }
  }
}

.data-table-header-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .data-table-header-title {
    flex: 1;
  }
  
  .data-table-sorter {
    display: flex;
    flex-direction: column;
    
    button {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: #9ca3af;
      font-size: 0.75rem;
      line-height: 1;
      
      &:hover {
        color: #6b7280;
      }
      
      &.data-table-sorter-active {
        color: #3b82f6;
      }
    }
  }
  
  .data-table-filter {
    padding: 0.25rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
  }
}

.data-table-checkbox {
  width: 1rem;
  text-align: center;
  
  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }
}

.data-table-expand {
  width: 2rem;
  text-align: center;
  
  .data-table-expand-icon {
    width: 1.5rem;
    height: 1.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #6b7280;
    
    &:hover {
      background: #f3f4f6;
    }
    
    &-expanded {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
  }
}

.data-table-expanded-row {
  .data-table-expanded-content {
    padding: 1rem;
    background: #f9fafb;
  }
}

.data-table-loading,
.data-table-empty {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}

.data-table-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  .data-table-spinner {
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

.data-table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  
  &-info {
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  &-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .data-table-pagination-button {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      color: #374151;
      cursor: pointer;
      font-size: 0.875rem;
      
      &:hover:not(:disabled) {
        background: #f3f4f6;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .data-table-pagination-current {
      padding: 0 0.5rem;
      color: #6b7280;
      font-size: 0.875rem;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
*/