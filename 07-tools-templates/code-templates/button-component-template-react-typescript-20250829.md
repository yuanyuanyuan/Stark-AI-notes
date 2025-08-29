## 📋 文件摘要

本文档提供了一个React TypeScript版本的Button组件模板，采用函数式组件和严格的TypeScript类型定义。包含完整的按钮属性接口（文本、点击事件、变体类型）、样式处理逻辑和导出配置，作为React TypeScript项目开发中按钮组件的标准模板，支持主要和次要两种样式变体，提供完整的类型安全保障。

---

// Button 组件模板

import React from "react";
import styles from "./index.css"; // 组件样式

interface ButtonProps {
  text: string;
  onClick?: () => void;
  variant?: "primary" | "secondary"; // 变体类型
}

const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  variant = "primary",
}) => {
  const buttonClass =
    variant === "primary" ? styles.primaryButton : styles.secondaryButton;

  return (
    <button className={buttonClass} onClick={onClick}>
      {text}
    </button>
  );
};

export default Button;
