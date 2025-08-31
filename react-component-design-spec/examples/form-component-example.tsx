/**
 * 表单组件示例 - Form 和 FormField
 * 
 * 展示了一个完整的表单组件实现，包含表单验证、状态管理和错误处理
 * 符合React最佳实践和设计规范
 * 
 * @author Claude
 * @created 2024-01-01
 * @updated 2024-01-01
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';

// ==================== 类型定义 ====================

/** 表单字段类型 */
export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';

/** 验证规则类型 */
export interface ValidationRule {
  /** 是否必填 */
  required?: boolean;
  /** 最小长度 */
  minLength?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 正则表达式 */
  pattern?: RegExp;
  /** 自定义验证函数 */
  validator?: (value: any) => string | null;
  /** 错误消息 */
  message?: string;
}

/** 表单字段配置 */
export interface FormFieldConfig {
  /** 字段名称 */
  name: string;
  /** 字段标签 */
  label: React.ReactNode;
  /** 字段类型 */
  type: FormFieldType;
  /** 占位符 */
  placeholder?: string;
  /** 默认值 */
  defaultValue?: any;
  /** 验证规则 */
  rules?: ValidationRule[];
  /** 选项（用于select、radio、checkbox） */
  options?: Array<{ label: React.ReactNode; value: any; disabled?: boolean }>;
  /** 帮助文本 */
  helpText?: React.ReactNode;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读 */
  readOnly?: boolean;
  /** 自定义渲染函数 */
  render?: (field: FormFieldState) => React.ReactNode;
}

/** 表单字段状态 */
export interface FormFieldState {
  /** 字段值 */
  value: any;
  /** 错误消息 */
  error: string | null;
  /** 是否被触摸过 */
  touched: boolean;
  /** 是否正在验证 */
  validating: boolean;
  /** 字段配置 */
  config: FormFieldConfig;
}

/** 表单状态 */
export interface FormState {
  /** 字段状态映射 */
  fields: Record<string, FormFieldState>;
  /** 表单值 */
  values: Record<string, any>;
  /** 表单错误 */
  errors: Record<string, string | null>;
  /** 是否正在提交 */
  isSubmitting: boolean;
  /** 是否已提交 */
  isSubmitted: boolean;
  /** 是否有效 */
  isValid: boolean;
}

/** 表单Props接口 */
export interface FormProps {
  /** 表单字段配置 */
  fields: FormFieldConfig[];
  /** 初始值 */
  initialValues?: Record<string, any>;
  /** 提交事件处理函数 */
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  /** 变更事件处理函数 */
  onChange?: (values: Record<string, any>) => void;
  /** 布局方式 */
  layout?: 'horizontal' | 'vertical' | 'inline';
  /** 标签宽度 */
  labelWidth?: number | string;
  /** 标签对齐 */
  labelAlign?: 'left' | 'right';
  /** 是否显示冒号 */
  colon?: boolean;
  /** 是否必填标记 */
  requiredMark?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 提交按钮文本 */
  submitText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 是否显示取消按钮 */
  showCancelButton?: boolean;
  /** 取消事件处理函数 */
  onCancel?: () => void;
  /** 提交按钮属性 */
  submitButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  /** 取消按钮属性 */
  cancelButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

// ==================== 验证工具函数 ====================

/**
 * 验证单个字段值
 */
export const validateField = (
  value: any,
  rules: ValidationRule[] = []
): string | null => {
  for (const rule of rules) {
    // 必填验证
    if (rule.required && (value === null || value === undefined || value === '')) {
      return rule.message || '此字段为必填项';
    }
    
    // 如果值不存在且不是必填，跳过其他验证
    if (value === null || value === undefined || value === '') {
      continue;
    }
    
    // 字符串长度验证
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return rule.message || `最小长度为 ${rule.minLength}`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message || `最大长度为 ${rule.maxLength}`;
      }
    }
    
    // 数字范围验证
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return rule.message || `最小值为 ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return rule.message || `最大值为 ${rule.max}`;
      }
    }
    
    // 正则表达式验证
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        return rule.message || '格式不正确';
      }
    }
    
    // 自定义验证函数
    if (rule.validator) {
      const customError = rule.validator(value);
      if (customError) {
        return customError;
      }
    }
  }
  
  return null;
};

/**
 * 验证整个表单
 */
export const validateForm = (fields: Record<string, FormFieldState>): Record<string, string | null> => {
  const errors: Record<string, string | null> = {};
  
  Object.keys(fields).forEach(fieldName => {
    const field = fields[fieldName];
    errors[fieldName] = validateField(field.value, field.config.rules);
  });
  
  return errors;
};

// ==================== 主组件 ====================

/**
 * Form 组件
 * 
 * 一个功能完整的表单组件，支持字段验证、状态管理和错误处理
 * 
 * @component
 * @example
 * const fields = [
 *   {
 *     name: 'username',
 *     label: '用户名',
 *     type: 'text',
 *     rules: [{ required: true, message: '请输入用户名' }]
 *   }
 * ];
 * 
 * <Form
 *   fields={fields}
 *   onSubmit={(values) => console.log(values)}
 * />
 */
export const Form: React.FC<FormProps> = React.memo(({
  fields,
  initialValues = {},
  onSubmit,
  onChange,
  layout = 'vertical',
  labelWidth = 120,
  labelAlign = 'right',
  colon = true,
  requiredMark = true,
  className,
  submitText = '提交',
  cancelText = '取消',
  showCancelButton = false,
  onCancel,
  submitButtonProps = {},
  cancelButtonProps = {},
}) => {
  // ==================== 状态管理 ====================
  
  const [formState, setFormState] = useState<FormState>(() => {
    const initialFields: Record<string, FormFieldState> = {};
    const initialValues: Record<string, any> = {};
    
    fields.forEach(field => {
      const defaultValue = field.defaultValue || initialValues[field.name];
      initialFields[field.name] = {
        value: defaultValue,
        error: null,
        touched: false,
        validating: false,
        config: field,
      };
      initialValues[field.name] = defaultValue;
    });
    
    return {
      fields: initialFields,
      values: initialValues,
      errors: {},
      isSubmitting: false,
      isSubmitted: false,
      isValid: true,
    };
  });
  
  // ==================== 计算属性 ====================
  
  /**
   * 计算表单类名
   */
  const formClassName = useMemo(() => {
    return cn(
      'form',
      `form-${layout}`,
      {
        'form-colon': colon,
        'form-required-mark': requiredMark,
      },
      className
    );
  }, [layout, colon, requiredMark, className]);
  
  /**
   * 计算表单是否有效
   */
  const isValid = useMemo(() => {
    return Object.values(formState.errors).every(error => error === null);
  }, [formState.errors]);
  
  // ==================== 事件处理 ====================
  
  /**
   * 更新字段值
   */
  const updateFieldValue = useCallback((fieldName: string, value: any) => {
    setFormState(prev => {
      const newFields = { ...prev.fields };
      const newValues = { ...prev.values };
      
      newFields[fieldName] = {
        ...newFields[fieldName],
        value,
        touched: true,
        validating: true,
      };
      newValues[fieldName] = value;
      
      // 验证字段
      const error = validateField(value, newFields[fieldName].config.rules);
      newFields[fieldName].error = error;
      newFields[fieldName].validating = false;
      
      const newErrors = { ...prev.errors, [fieldName]: error };
      
      return {
        ...prev,
        fields: newFields,
        values: newValues,
        errors: newErrors,
        isValid: Object.values(newErrors).every(e => e === null),
      };
    });
    
    // 触发变更回调
    if (onChange) {
      onChange({ ...formState.values, [fieldName]: value });
    }
  }, [formState.values, onChange]);
  
  /**
   * 处理字段变更
   */
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    updateFieldValue(fieldName, value);
  }, [updateFieldValue]);
  
  /**
   * 处理字段失焦
   */
  const handleFieldBlur = useCallback((fieldName: string) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          touched: true,
        },
      },
    }));
  }, []);
  
  /**
   * 处理表单提交
   */
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    // 验证所有字段
    const errors = validateForm(formState.fields);
    const hasErrors = Object.values(errors).some(error => error !== null);
    
    setFormState(prev => ({
      ...prev,
      errors,
      isSubmitted: true,
      isValid: !hasErrors,
    }));
    
    if (hasErrors) {
      return;
    }
    
    // 开始提交
    setFormState(prev => ({
      ...prev,
      isSubmitting: true,
    }));
    
    try {
      await onSubmit(formState.values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
      }));
    }
  }, [formState.fields, formState.values, onSubmit]);
  
  /**
   * 重置表单
   */
  const resetForm = useCallback(() => {
    setFormState(prev => {
      const newFields: Record<string, FormFieldState> = {};
      const newValues: Record<string, any> = {};
      
      Object.keys(prev.fields).forEach(fieldName => {
        const defaultValue = prev.fields[fieldName].config.defaultValue || initialValues[fieldName];
        newFields[fieldName] = {
          ...prev.fields[fieldName],
          value: defaultValue,
          error: null,
          touched: false,
          validating: false,
        };
        newValues[fieldName] = defaultValue;
      });
      
      return {
        ...prev,
        fields: newFields,
        values: newValues,
        errors: {},
        isSubmitting: false,
        isSubmitted: false,
        isValid: true,
      };
    });
  }, [initialValues]);
  
  // ==================== 渲染字段 ====================
  
  /**
   * 渲染单个字段
   */
  const renderField = (fieldConfig: FormFieldConfig) => {
    const fieldState = formState.fields[fieldConfig.name];
    const { value, error, touched } = fieldState;
    
    const fieldProps = {
      value,
      onChange: (newValue: any) => handleFieldChange(fieldConfig.name, newValue),
      onBlur: () => handleFieldBlur(fieldConfig.name),
      disabled: fieldConfig.disabled,
      readOnly: fieldConfig.readOnly,
      placeholder: fieldConfig.placeholder,
      error: touched ? error : null,
      helpText: fieldConfig.helpText,
      options: fieldConfig.options,
      required: fieldConfig.rules?.some(rule => rule.required),
    };
    
    // 如果有自定义渲染函数，使用自定义渲染
    if (fieldConfig.render) {
      return fieldConfig.render(fieldState);
    }
    
    // 根据类型渲染不同的字段
    switch (fieldConfig.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        return <FormFieldInput {...fieldProps} type={fieldConfig.type} />;
      case 'textarea':
        return <FormFieldTextarea {...fieldProps} />;
      case 'select':
        return <FormFieldSelect {...fieldProps} />;
      case 'checkbox':
        return <FormFieldCheckbox {...fieldProps} />;
      case 'radio':
        return <FormFieldRadio {...fieldProps} />;
      default:
        return <FormFieldInput {...fieldProps} type="text" />;
    }
  };
  
  // ==================== 主渲染 ====================
  
  return (
    <form className={formClassName} onSubmit={handleSubmit} noValidate>
      {fields.map(field => (
        <div key={field.name} className="form-field">
          <label 
            className="form-label"
            style={{ 
              width: layout === 'horizontal' ? labelWidth : 'auto',
              textAlign: labelAlign,
            }}
          >
            {field.label}
            {requiredMark && field.rules?.some(rule => rule.required) && (
              <span className="form-required-mark">*</span>
            )}
            {colon && ':'}
          </label>
          
          <div className="form-control">
            {renderField(field)}
            
            {formState.fields[field.name].error && (
              <div className="form-error">
                {formState.fields[field.name].error}
              </div>
            )}
            
            {field.helpText && (
              <div className="form-help-text">
                {field.helpText}
              </div>
            )}
          </div>
        </div>
      ))}
      
      <div className="form-actions">
        {showCancelButton && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            {...cancelButtonProps}
          >
            {cancelText}
          </button>
        )}
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={formState.isSubmitting || !isValid}
          {...submitButtonProps}
        >
          {formState.isSubmitting ? '提交中...' : submitText}
        </button>
      </div>
    </form>
  );
});

Form.displayName = 'Form';

// ==================== 字段组件 ====================

/** 字段组件Props接口 */
interface FormFieldProps {
  /** 字段值 */
  value: any;
  /** 变更事件处理函数 */
  onChange: (value: any) => void;
  /** 失焦事件处理函数 */
  onBlur: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读 */
  readOnly?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 错误消息 */
  error?: string | null;
  /** 帮助文本 */
  helpText?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
}

/** 输入框字段Props接口 */
interface FormFieldInputProps extends FormFieldProps {
  /** 输入类型 */
  type: 'text' | 'email' | 'password' | 'number';
}

/**
 * 输入框字段组件
 */
export const FormFieldInput: React.FC<FormFieldInputProps> = React.memo(({
  type,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  placeholder,
  error,
  className,
}) => {
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? 
      (event.target.value === '' ? null : Number(event.target.value)) : 
      event.target.value;
    onChange(newValue);
  }, [type, onChange]);
  
  return (
    <input
      type={type}
      value={value || ''}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      className={cn('form-input', { 'form-input-error': error }, className)}
    />
  );
});

FormFieldInput.displayName = 'FormFieldInput';

/** 文本域字段组件 */
export const FormFieldTextarea: React.FC<FormFieldProps> = React.memo(({
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  placeholder,
  error,
  className,
}) => {
  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  }, [onChange]);
  
  return (
    <textarea
      value={value || ''}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      className={cn('form-textarea', { 'form-textarea-error': error }, className)}
      rows={4}
    />
  );
});

FormFieldTextarea.displayName = 'FormFieldTextarea';

/** 选择框字段Props接口 */
interface FormFieldSelectProps extends FormFieldProps {
  /** 选项 */
  options?: Array<{ label: React.ReactNode; value: any; disabled?: boolean }>;
}

/**
 * 选择框字段组件
 */
export const FormFieldSelect: React.FC<FormFieldSelectProps> = React.memo(({
  value,
  onChange,
  onBlur,
  disabled,
  placeholder,
  error,
  options = [],
  className,
}) => {
  const handleChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  }, [onChange]);
  
  return (
    <select
      value={value || ''}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      className={cn('form-select', { 'form-select-error': error }, className)}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {options.map((option, index) => (
        <option 
          key={index} 
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
});

FormFieldSelect.displayName = 'FormFieldSelect';

/**
 * 复选框字段组件
 */
export const FormFieldCheckbox: React.FC<FormFieldProps> = React.memo(({
  value,
  onChange,
  onBlur,
  disabled,
  error,
  className,
}) => {
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  }, [onChange]);
  
  return (
    <label className={cn('form-checkbox', { 'form-checkbox-error': error }, className)}>
      <input
        type="checkbox"
        checked={value || false}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        className="form-checkbox-input"
      />
      <span className="form-checkbox-label">{value ? '是' : '否'}</span>
    </label>
  );
});

FormFieldCheckbox.displayName = 'FormFieldCheckbox';

/**
 * 单选框字段组件
 */
export const FormFieldRadio: React.FC<FormFieldSelectProps> = React.memo(({
  value,
  onChange,
  onBlur,
  disabled,
  error,
  options = [],
  className,
}) => {
  const handleChange = useCallback((newValue: any) => {
    onChange(newValue);
  }, [onChange]);
  
  return (
    <div className={cn('form-radio-group', { 'form-radio-group-error': error }, className)}>
      {options.map((option, index) => (
        <label key={index} className="form-radio">
          <input
            type="radio"
            name={`radio-${Date.now()}`}
            value={option.value}
            checked={value === option.value}
            onChange={() => handleChange(option.value)}
            onBlur={onBlur}
            disabled={disabled || option.disabled}
            className="form-radio-input"
          />
          <span className="form-radio-label">{option.label}</span>
        </label>
      ))}
    </div>
  );
});

FormFieldRadio.displayName = 'FormFieldRadio';

// ==================== 类型导出 ====================

export type { 
  FormProps, 
  FormFieldProps, 
  FormFieldInputProps, 
  FormFieldSelectProps,
  FormFieldConfig,
  FormFieldState,
  FormState,
  ValidationRule,
};

// ==================== 样式定义（CSS-in-JS示例） ====================

/*
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  &-horizontal {
    .form-field {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      
      .form-label {
        flex-shrink: 0;
        padding-top: 0.375rem;
      }
      
      .form-control {
        flex: 1;
      }
    }
  }
  
  &-inline {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    
    .form-field {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .form-actions {
      margin-left: auto;
    }
  }
  
  &-colon .form-label::after {
    content: ':';
    margin-left: 0.25rem;
  }
  
  &-required-mark .form-required-mark {
    color: #ef4444;
    margin-left: 0.25rem;
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.form-control {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  &-error {
    border-color: #ef4444;
    
    &:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
    }
  }
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-checkbox,
.form-radio {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  
  &-input {
    width: 1rem;
    height: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    cursor: pointer;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
  }
  
  &-label {
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: #374151;
  }
  
  &-error .form-input {
    border-color: #ef4444;
  }
}

.form-radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-error {
  color: #ef4444;
  font-size: 0.75rem;
  line-height: 1rem;
}

.form-help-text {
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}
*/