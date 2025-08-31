## 📋 文件摘要

本文档提供了一个完整的Button组件测试用例模板，使用Jest和React Testing Library框架。包含基本的渲染测试、点击事件测试、默认样式测试和变体样式测试，覆盖了Button组件的核心功能验证场景，作为React组件测试的标准模板，确保组件的行为和表现符合预期。

---

// Button 组件测试用例模板 (Jest + React Testing Library)

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../components/Button'; // 假设 Button 组件路径

describe('Button Component', () => {
  it('should render button text', () => {
    render(<Button text="Click Me" />);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button text="Click Me" onClick={handleClick} />);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should have primary style by default', () => {
    render(<Button text="Click Me" />);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toHaveClass('primaryButton'); // 假设 primaryButton 是 primary 样式类名
  });

  it('should have secondary style when variant is secondary', () => {
    render(<Button text="Click Me" variant="secondary" />);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toHaveClass('secondaryButton'); // 假设 secondaryButton 是 secondary 样式类名
  });
}); 