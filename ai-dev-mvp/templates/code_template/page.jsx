// 页面模板

import React from 'react';
import styles from './index.css'; // 页面样式

const {{pageName}}Page = () => {
  return (
    <div className={styles.container}>
      <h1>Welcome to {{pageName}} Page</h1>
      {/* 页面内容 */}
    </div>
  );
};

export default {{pageName}}Page; 