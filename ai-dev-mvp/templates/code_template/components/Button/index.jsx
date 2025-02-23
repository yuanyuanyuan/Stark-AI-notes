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
