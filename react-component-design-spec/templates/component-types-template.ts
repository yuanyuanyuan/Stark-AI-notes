/**
 * React 组件类型定义模板
 * 
 * 提供了完整的类型定义模板，包括：
 * - 基础 Props 类型
 * - 事件处理函数类型
 * - 状态管理类型
 * - 工具函数类型
 * - 泛型组件类型
 * 
 * @author [开发者名称]
 * @created [创建日期]
 * @updated [更新日期]
 */

import React from 'react';

// ==================== 基础类型定义 ====================

/**
 * 基础尺寸类型
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * 基础变体类型
 */
export type Variant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

/**
 * 基础颜色类型
 */
export type Color = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'light' 
  | 'dark';

/**
 * 对齐方式类型
 */
export type Alignment = 'left' | 'center' | 'right' | 'justify';

/**
 * 方向类型
 */
export type Direction = 'horizontal' | 'vertical';

/**
 * 位置类型
 */
export type Position = 'top' | 'right' | 'bottom' | 'left';

// ==================== 组件 Props 类型 ====================

/**
 * 通用基础 Props 接口
 */
export interface BaseComponentProps {
  /** 组件唯一标识 */
  id?: string;
  /** 自定义类名 */
  className?: string;
  /** 内联样式 */
  style?: React.CSSProperties;
  /** 子组件内容 */
  children?: React.ReactNode;
  /** 测试标识 */
  'data-testid'?: string;
}

/**
 * 可交互组件 Props 接口
 */
export interface InteractiveComponentProps extends BaseComponentProps {
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** Tab 键索引 */
  tabIndex?: number;
  /** 点击事件 */
  onClick?: (event: React.MouseEvent) => void;
  /** 键盘事件 */
  onKeyDown?: (event: React.KeyboardEvent) => void;
  /** 焦点事件 */
  onFocus?: (event: React.FocusEvent) => void;
  /** 失焦事件 */
  onBlur?: (event: React.FocusEvent) => void;
}

/**
 * 表单组件 Props 接口
 */
export interface FormComponentProps<T = any> extends InteractiveComponentProps {
  /** 表单名称 */
  name?: string;
  /** 表单值 */
  value?: T;
  /** 默认值 */
  defaultValue?: T;
  /** 必填验证 */
  required?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 变更事件 */
  onChange?: (value: T, event: React.ChangeEvent) => void;
  /** 提交事件 */
  onSubmit?: (value: T, event: React.FormEvent) => void;
  /** 验证错误 */
  error?: string;
  /** 帮助文本 */
  helpText?: string;
  /** 标签 */
  label?: React.ReactNode;
}

/**
 * 布局组件 Props 接口
 */
export interface LayoutComponentProps extends BaseComponentProps {
  /** 布局方向 */
  direction?: Direction;
  /** 对齐方式 */
  align?: Alignment;
  /** 间距 */
  spacing?: Size | number;
  /** 包装方式 */
  wrap?: boolean;
  /** 弹性布局 */
  flex?: boolean;
  /** 网格布局 */
  grid?: boolean;
  /** 列数 */
  columns?: number;
}

/**
 * 显示组件 Props 接口
 */
export interface DisplayComponentProps extends BaseComponentProps {
  /** 显示/隐藏 */
  visible?: boolean;
  /** 动画效果 */
  animation?: boolean;
  /** 过渡效果 */
  transition?: boolean;
  /** 悬停效果 */
  hover?: boolean;
  /** 圆角 */
  rounded?: boolean | Size;
  /** 阴影 */
  shadow?: boolean | Size;
  /** 边框 */
  border?: boolean | Size;
  /** 背景色 */
  background?: Color | string;
  /** 文字颜色 */
  color?: Color | string;
}

// ==================== 事件处理函数类型 ====================

/**
 * 点击事件处理函数类型
 */
export type ClickHandler = (event: React.MouseEvent) => void;

/**
 * 变更事件处理函数类型
 */
export type ChangeHandler<T = any> = (value: T, event: React.ChangeEvent) => void;

/**
 * 提交事件处理函数类型
 */
export type SubmitHandler<T = any> = (value: T, event: React.FormEvent) => void;

/**
 * 键盘事件处理函数类型
 */
export type KeyDownHandler = (event: React.KeyboardEvent) => void;

/**
 * 焦点事件处理函数类型
 */
export type FocusHandler = (event: React.FocusEvent) => void;

/**
 * 异步事件处理函数类型
 */
export type AsyncEventHandler<T = any> = (
  ...args: any[]
) => Promise<T>;

/**
 * 防抖事件处理函数类型
 */
export type DebouncedHandler<T = any> = (
  value: T,
  event?: React.Event
) => void;

/**
 * 节流事件处理函数类型
 */
export type ThrottledHandler<T = any> = (
  value: T,
  event?: React.Event
) => void;

// ==================== 状态管理类型 ====================

/**
 * 异步状态类型
 */
export interface AsyncState<T = any> {
  /** 数据 */
  data: T | null;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 成功状态 */
  success: boolean;
}

/**
 * 分页状态类型
 */
export interface PaginationState {
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 总条数 */
  total: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 表单状态类型
 */
export interface FormState<T = Record<string, any>> {
  /** 表单值 */
  values: T;
  /** 表单错误 */
  errors: Partial<Record<keyof T, string>>;
  /** 触摸状态 */
  touched: Partial<Record<keyof T, boolean>>;
  /** 是否已提交 */
  isSubmitted: boolean;
  /** 是否正在提交 */
  isSubmitting: boolean;
  /** 是否有效 */
  isValid: boolean;
}

/**
 * 列表状态类型
 */
export interface ListState<T = any> {
  /** 数据列表 */
  items: T[];
  /** 选中项 */
  selectedItems: T[];
  /** 过滤条件 */
  filters: Record<string, any>;
  /** 排序条件 */
  sort: {
    field: string;
    order: 'asc' | 'desc';
  };
  /** 搜索关键字 */
  search: string;
}

/**
 * 模态框状态类型
 */
export interface ModalState {
  /** 是否显示 */
  isOpen: boolean;
  /** 标题 */
  title: React.ReactNode;
  /** 内容 */
  content: React.ReactNode;
  /** 尺寸 */
  size: Size;
  /** 是否可关闭 */
  closable: boolean;
  /** 是否有遮罩 */
  mask: boolean;
  /** 是否点击遮罩关闭 */
  maskClosable: boolean;
}

// ==================== 工具函数类型 ====================

/**
 * 样式合并函数类型
 */
export type ClassNamesFn = (
  ...args: (string | undefined | null | false | Record<string, boolean>)[]
) => string;

/**
 * 条件渲染函数类型
 */
export type ConditionalRenderFn = (
  condition: boolean,
  truthy: React.ReactNode,
  falsy?: React.ReactNode
) => React.ReactNode;

/**
 * 格式化函数类型
 */
export type FormatFn<T = any, R = string> = (value: T) => R;

/**
 * 验证函数类型
 */
export type ValidateFn<T = any> = (value: T) => string | null;

/**
 * 过滤函数类型
 */
export type FilterFn<T = any> = (item: T, index: number, array: T[]) => boolean;

/**
 * 排序函数类型
 */
export type SortFn<T = any> = (a: T, b: T) => number;

/**
 * 映射函数类型
 */
export type MapFn<T = any, R = any> = (item: T, index: number, array: T[]) => R;

/**
 * 归纳函数类型
 */
export type ReduceFn<T = any, R = any> = (
  accumulator: R,
  currentValue: T,
  index: number,
  array: T[]
) => R;

// ==================== 泛型组件类型 ====================

/**
 * 列表组件 Props 类型
 */
export interface ListProps<T = any> extends BaseComponentProps {
  /** 数据源 */
  data: T[];
  /** 渲染函数 */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** 键值提取函数 */
  keyExtractor: (item: T, index: number) => string;
  /** 空状态渲染 */
  renderEmpty?: () => React.ReactNode;
  /** 加载状态 */
  loading?: boolean;
  /** 加载状态渲染 */
  renderLoading?: () => React.ReactNode;
  /** 错误状态 */
  error?: string;
  /** 错误状态渲染 */
  renderError?: (error: string) => React.ReactNode;
}

/**
 * 选择器组件 Props 类型
 */
export interface SelectProps<T = any> extends FormComponentProps<T> {
  /** 选项列表 */
  options: Array<{
    label: React.ReactNode;
    value: T;
    disabled?: boolean;
    [key: string]: any;
  }>;
  /** 是否多选 */
  multiple?: boolean;
  /** 是否可搜索 */
  searchable?: boolean;
  /** 是否可清除 */
  clearable?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 渲染选项 */
  renderOption?: (option: any) => React.ReactNode;
  /** 渲染选中项 */
  renderSelected?: (value: T) => React.ReactNode;
}

/**
 * 表格组件 Props 类型
 */
export interface TableProps<T = any> extends BaseComponentProps {
  /** 数据源 */
  data: T[];
  /** 列定义 */
  columns: Array<{
    title: React.ReactNode;
    dataIndex: keyof T;
    key?: string;
    width?: number | string;
    render?: (value: any, record: T, index: number) => React.ReactNode;
    sorter?: (a: T, b: T) => number;
    filters?: Array<{ text: React.ReactNode; value: any }>;
    onFilter?: (value: any, record: T) => boolean;
    align?: Alignment;
    fixed?: Position | boolean;
  }>;
  /** 行键值 */
  rowKey?: keyof T | ((record: T, index: number) => string);
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示斑马纹 */
  striped?: boolean;
  /** 是否显示表头 */
  showHeader?: boolean;
  /** 是否可滚动 */
  scroll?: { x?: number | string; y?: number | string };
  /** 分页配置 */
  pagination?: false | {
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
  /** 展开配置 */
  expandable?: {
    expandedRowKeys: (string | number)[];
    onExpandedRowsChange: (expandedRowKeys: (string | number)[]) => void;
    expandedRowRender: (record: T, index: number, indent: number, expanded: boolean) => React.ReactNode;
  };
}

/**
 * 表单组件 Props 类型
 */
export interface FormProps<T = Record<string, any>> extends BaseComponentProps {
  /** 表单值 */
  initialValues?: T;
  /** 提交事件 */
  onSubmit: (values: T) => void | Promise<void>;
  /** 变更事件 */
  onChange?: (values: T) => void;
  /** 布局方式 */
  layout?: 'horizontal' | 'vertical' | 'inline';
  /** 标签宽度 */
  labelWidth?: number | string;
  /** 标签对齐 */
  labelAlign?: Alignment;
  /** 是否显示冒号 */
  colon?: boolean;
  /** 是否必填标记 */
  requiredMark?: boolean;
  /** 验证规则 */
  rules?: Record<keyof T, Array<{
    required?: boolean;
    message?: string;
    validator?: (rule: any, value: any) => Promise<void>;
  }>>;
}

// ==================== 自定义 Hook 类型 ====================

/**
 * 使用本地存储 Hook 类型
 */
export interface UseLocalStorageProps<T = any> {
  /** 键名 */
  key: string;
  /** 默认值 */
  defaultValue: T;
  /** 序列化函数 */
  serializer?: (value: T) => string;
  /** 反序列化函数 */
  deserializer?: (value: string) => T;
}

/**
 * 使用防抖 Hook 类型
 */
export interface UseDebounceProps<T = any> {
  /** 值 */
  value: T;
  /** 延迟时间 */
  delay: number;
  /** 立即执行 */
  immediate?: boolean;
}

/**
 * 使用 API 请求 Hook 类型
 */
export interface UseApiProps<T = any, P = any> {
  /** API 函数 */
  apiFunc: (params: P) => Promise<T>;
  /** 请求参数 */
  params: P;
  /** 是否立即执行 */
  immediate?: boolean;
  /** 成功回调 */
  onSuccess?: (data: T) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
  /** 完成回调 */
  onComplete?: () => void;
}

/**
 * 使用表单 Hook 类型
 */
export interface UseFormProps<T = Record<string, any>> {
  /** 初始值 */
  initialValues: T;
  /** 验证规则 */
  validationRules?: Record<keyof T, ValidateFn<T[keyof T]>>;
  /** 提交函数 */
  onSubmit: (values: T) => void | Promise<void>;
}

// ==================== 事件类型扩展 ====================

/**
 * 自定义事件类型
 */
export interface CustomEvent<T = any> extends React.SyntheticEvent {
  detail: T;
}

/**
 * 拖拽事件类型
 */
export interface DragEvent<T = any> extends React.DragEvent {
  data: T;
}

/**
 * 滚动事件类型
 */
export interface ScrollEvent extends React.UIEvent {
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
  scrollHeight: number;
}

/**
 * 调整大小事件类型
 */
export interface ResizeEvent extends React.UIEvent {
  width: number;
  height: number;
}

// ==================== 主题类型 ====================

/**
 * 主题配置类型
 */
export interface ThemeConfig {
  /** 主色调 */
  primaryColor: string;
  /** 次要色调 */
  secondaryColor: string;
  /** 成功色调 */
  successColor: string;
  /** 警告色调 */
  warningColor: string;
  /** 危险色调 */
  dangerColor: string;
  /** 信息色调 */
  infoColor: string;
  /** 文字颜色 */
  textColor: string;
  /** 背景颜色 */
  backgroundColor: string;
  /** 边框颜色 */
  borderColor: string;
  /** 圆角大小 */
  borderRadius: string;
  /** 字体大小 */
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  /** 间距大小 */
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

/**
 * 主题模式类型
 */
export type ThemeMode = 'light' | 'dark';

/**
 * 主题上下文类型
 */
export interface ThemeContextType {
  /** 当前主题 */
  theme: ThemeConfig;
  /** 主题模式 */
  mode: ThemeMode;
  /** 切换主题模式 */
  toggleMode: () => void;
  /** 设置主题 */
  setTheme: (theme: Partial<ThemeConfig>) => void;
}

// ==================== 导出类型 ====================

/**
 * 组件库类型导出
 */
export type ComponentLibraryTypes = {
  // 基础组件
  Button: React.FC<InteractiveComponentProps & {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
  }>;
  Input: React.FC<FormComponentProps<string>>;
  Select: React.FC<SelectProps<any>>;
  
  // 布局组件
  Container: React.FC<LayoutComponentProps>;
  Grid: React.FC<LayoutComponentProps & {
    columns: number;
  }>;
  Flex: React.FC<LayoutComponentProps>;
  
  // 显示组件
  Card: React.FC<DisplayComponentProps>;
  Badge: React.FC<DisplayComponentProps & {
    count: number | string;
    dot?: boolean;
  }>;
  Avatar: React.FC<DisplayComponentProps & {
    src?: string;
    alt?: string;
    size?: Size | number;
  }>;
  
  // 复合组件
  Table: React.FC<TableProps<any>>;
  Form: React.FC<FormProps<any>>;
  Modal: React.FC<ModalState & {
    onOk?: () => void;
    onCancel?: () => void;
  }>;
};

// ==================== 类型工具 ====================

/**
 * 递归部分类型
 */
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

/**
 * 递归只读类型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 递归可选类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 提取函数参数类型
 */
export type ExtractParams<T> = T extends (...args: infer P) => any ? P : never;

/**
 * 提取函数返回类型
 */
export type ExtractReturn<T> = T extends (...args: any[]) => infer R ? R : never;

/**
 * 提取 Promise 类型
 */
export type ExtractPromise<T> = T extends Promise<infer P> ? P : T;

// ==================== 类型守卫 ====================

/**
 * 判断是否为 React 节点
 */
export function isReactNode(value: any): value is React.ReactNode {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    React.isValidElement(value) ||
    (Array.isArray(value) && value.every(isReactNode))
  );
}

/**
 * 判断是否为事件对象
 */
export function isEventObject(value: any): value is React.SyntheticEvent {
  return (
    value !== null &&
    typeof value === 'object' &&
    'nativeEvent' in value &&
    'currentTarget' in value
  );
}

/**
 * 判断是否为异步状态
 */
export function isAsyncState<T = any>(value: any): value is AsyncState<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'data' in value &&
    'loading' in value &&
    'error' in value &&
    'success' in value
  );
}

// ==================== 导出 ====================

// 导出所有类型定义
export * from './component-types';

// 默认导出
export default {
  // 基础类型
  Size,
  Variant,
  Color,
  Alignment,
  Direction,
  Position,
  
  // Props 类型
  BaseComponentProps,
  InteractiveComponentProps,
  FormComponentProps,
  LayoutComponentProps,
  DisplayComponentProps,
  
  // 事件类型
  ClickHandler,
  ChangeHandler,
  SubmitHandler,
  KeyDownHandler,
  FocusHandler,
  AsyncEventHandler,
  DebouncedHandler,
  ThrottledHandler,
  
  // 状态类型
  AsyncState,
  PaginationState,
  FormState,
  ListState,
  ModalState,
  
  // 工具类型
  ClassNamesFn,
  ConditionalRenderFn,
  FormatFn,
  ValidateFn,
  FilterFn,
  SortFn,
  MapFn,
  ReduceFn,
  
  // 泛型组件类型
  ListProps,
  SelectProps,
  TableProps,
  FormProps,
  
  // Hook 类型
  UseLocalStorageProps,
  UseDebounceProps,
  UseApiProps,
  UseFormProps,
  
  // 主题类型
  ThemeConfig,
  ThemeMode,
  ThemeContextType,
  
  // 类型工具
  RecursivePartial,
  DeepReadonly,
  DeepPartial,
  ExtractParams,
  ExtractReturn,
  ExtractPromise,
  
  // 类型守卫
  isReactNode,
  isEventObject,
  isAsyncState,
};