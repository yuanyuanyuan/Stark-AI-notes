# React 组件开发工具链配置

> 基于 React 18.3.1 的完整开发工具链配置指南

## 📋 概述

本指南提供了完整的 React 组件开发工具链配置，包括代码质量检查、格式化、Git 工作流和自动化工具，确保团队开发一致性和代码质量。

## 🛠️ ESLint 配置

### 基础 ESLint 配置

```json
// .eslintrc.json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    },
    "project": "./tsconfig.json"
  },
  "plugins": [
    "@typescript-eslint",
    "react",
    "react-hooks",
    "jsx-a11y",
    "import",
    "prettier",
    "sonarjs"
  ],
  "rules": {
    // React 相关规则
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/jsx-uses-react": "off",
    "react/jsx-props-no-spreading": "warn",
    "react/jsx-key": "error",
    "react/no-unescaped-entities": "warn",
    "react/require-default-props": "error",
    "react/function-component-definition": [
      "error",
      {
        "namedComponents": "function-declaration",
        "unnamedComponents": "function-expression"
      }
    ],
    
    // React Hooks 规则
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    
    // TypeScript 规则
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-floating-promises": "error",
    
    // 导入规则
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }
    ],
    "import/no-unresolved": "error",
    "import/no-cycle": "error",
    "import/no-duplicates": "error",
    "import/no-useless-path-segments": "error",
    
    // 可访问性规则
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/anchor-is-valid": "error",
    "jsx-a11y/click-events-have-key-events": "warn",
    "jsx-a11y/no-static-element-interactions": "warn",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/interactive-supports-focus": "error",
    
    // 代码质量规则
    "sonarjs/cognitive-complexity": ["error", 15],
    "sonarjs/no-identical-functions": "error",
    "sonarjs/no-duplicate-string": "warn",
    "sonarjs/no-collapsible-if": "error",
    "sonarjs/prefer-immediate-return": "error",
    
    // 通用代码规则
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-debugger": "error",
    "no-alert": "error",
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "prefer-const": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-template": "error",
    "template-curly-spacing": "error",
    "curly": ["error", "all"],
    "eqeqeq": ["error", "always"],
    "no-multiple-empty-lines": ["error", { "max": 1 }],
    "padded-blocks": ["error", "never"]
  },
  "settings": {
    "react": {
      "version": "detect"
    },
    "import/resolver": {
      "typescript": {},
      "node": {
        "extensions": [".js", ".jsx", ".ts", ".tsx"]
      }
    }
  },
  "overrides": [
    {
      "files": ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "sonarjs/no-duplicate-string": "off",
        "no-console": "off"
      }
    },
    {
      "files": ["**/*.stories.tsx"],
      "rules": {
        "import/no-default-export": "off",
        "react/prop-types": "off"
      }
    }
  ]
}
```

### 专用组件 ESLint 配置

```json
// .eslintrc.components.json
{
  "extends": ["./.eslintrc.json"],
  "rules": {
    // 组件特定规则
    "react/forbid-component-props": [
      "error",
      {
        "forbid": ["className", "style"]
      }
    ],
    "react/no-multi-comp": "error",
    "react/no-unused-prop-types": "error",
    "react/prop-types": "error",
    "react/jsx-no-bind": "warn",
    "react/jsx-no-literals": [
      "warn",
      {
        "allowedStrings": [" ", "-", "+", "×"]
      }
    ],
    
    // 性能相关规则
    "react-hooks/exhaustive-deps": "error",
    "react-perf/jsx-no-new-array-as-prop": "error",
    "react-perf/jsx-no-new-object-as-prop": "error",
    
    // 类型安全规则
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/prefer-readonly": "error",
    "@typescript-eslint/prefer-readonly-parameter-types": "warn"
  }
}
```

## 💅 Prettier 配置

### 基础 Prettier 配置

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "jsxSingleQuote": false,
  "bracketSameLine": false,
  "quoteProps": "as-needed"
}
```

### Prettier 忽略配置

```markdown
# .prettierignore
# 依赖和构建产物
node_modules/
dist/
build/
out/
coverage/

# 配置文件
*.config.js
*.config.ts
*.json
*.yml
*.yaml
.prettierrc
.eslintrc*

# 日志文件
*.log
logs/

# 缓存文件
.cache/
.temp/
*.tmp

# 自动生成的文件
*.generated.*
*.min.js
*.min.css

# 文档文件
docs/
*.md
README*

# 测试覆盖率报告
coverage/
.nyc_output/

# 包管理器锁文件
package-lock.json
yarn.lock
pnpm-lock.yaml

# 环境文件
.env
.env.*
!.env.example

# IDE 文件
.vscode/
.idea/
*.swp
*.swo
*~

# 操作系统文件
.DS_Store
Thumbs.db
```

## 🐶 Husky 和 lint-staged 配置

### Husky 配置

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
      "pre-push": "npm run test:ci && npm run build"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ],
    "*.{css,scss,less}": [
      "stylelint --fix",
      "prettier --write"
    ]
  }
}
```

### Commitlint 配置

```json
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // Bug修复
        'docs',     // 文档更新
        'style',    // 代码格式化
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试相关
        'chore',    // 构建工具或依赖管理
        'ci',       // CI配置
        'build',    // 构建相关
        'revert',   // 回滚
        'wip'       // 进行中的工作
      ]
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100]
  },
  prompt: {
    questions: {
      type: {
        description: '选择你要提交的更改类型:',
        enum: {
          feat: {
            description: '新功能',
            title: 'Features',
            emoji: '✨'
          },
          fix: {
            description: 'Bug修复',
            title: 'Bug Fixes',
            emoji: '🐛'
          },
          docs: {
            description: '文档更新',
            title: 'Documentation',
            emoji: '📚'
          },
          style: {
            description: '代码格式化（不影响功能）',
            title: 'Styles',
            emoji: '💎'
          },
          refactor: {
            description: '重构（既不是新功能也不是修复bug）',
            title: 'Code Refactoring',
            emoji: '🔨'
          },
          perf: {
            description: '性能优化',
            title: 'Performance Improvements',
            emoji: '⚡'
          },
          test: {
            description: '添加或修改测试',
            title: 'Tests',
            emoji: '🧪'
          },
          build: {
            description: '构建系统或依赖变更',
            title: 'Builds',
            emoji: '📦'
          },
          ci: {
            description: 'CI配置变更',
            title: 'Continuous Integrations',
            emoji: '👷'
          },
          chore: {
            description: '其他不修改src或test文件的变更',
            title: 'Chores',
            emoji: '♻️'
          },
          revert: {
            description: '回滚之前的提交',
            title: 'Reverts',
            emoji: '🗑️'
          }
        }
      },
      scope: {
        description: '此更改的范围是什么（例如组件或文件名）:'
      },
      subject: {
        description: '写一个简短的变更描述:'
      },
      body: {
        description: '提供更详细的变更描述:'
      },
      isBreaking: {
        description: '是否有破坏性变更?'
      },
      breakingBody: {
        description: '破坏性变更的详细描述:'
      },
      breaking: {
        description: '描述破坏性变更:'
      },
      isIssueAffected: {
        description: '此变更是否影响任何开放的issue?'
      },
      issuesBody: {
        description: '如果issues被关闭，提交需要一个body。请输入更长的变更描述:'
      },
      issues: {
        description: '添加issue引用 (例如 "fix #123", "re #123".):'
      }
    }
  }
};
```

## 🎨 Stylelint 配置

```json
// .stylelintrc.json
{
  "extends": [
    "stylelint-config-standard",
    "stylelint-config-recommended",
    "stylelint-config-styled-components"
  ],
  "plugins": [
    "stylelint-order",
    "stylelint-config-rational-order"
  ],
  "rules": {
    "order/properties-alphabetical-order": true,
    "plugin/rational-order": true,
    "declaration-colon-space-after": "always",
    "declaration-colon-space-before": "never",
    "declaration-block-trailing-semicolon": "always",
    "rule-empty-line-before": [
      "always",
      {
        "except": ["first-nested"],
        "ignore": ["after-comment"]
      }
    ],
    "unit-no-unknown": [
      true,
      {
        "ignoreUnits": ["rpx"]
      }
    ],
    "selector-pseudo-class-no-unknown": [
      true,
      {
        "ignorePseudoClasses": ["global", "local"]
      }
    ],
    "selector-pseudo-element-no-unknown": [
      true,
      {
        "ignorePseudoElements": ["v-deep", "v-global", "v-slotted"]
      }
    ],
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": ["use", "forward", "apply", "include", "mixin"]
      }
    ]
  },
  "overrides": [
    {
      "files": ["**/*.scss"],
      "customSyntax": "postcss-scss"
    },
    {
      "files": ["**/*.less"],
      "customSyntax": "postcss-less"
    }
  ]
}
```

## 📊 代码质量工具

### SonarQube 配置

```json
// sonar-project.properties
sonar.projectKey=my-react-components
sonar.projectName=My React Components
sonar.projectVersion=1.0.0

# 源代码路径
sonar.sources=src
sonar.inclusions=src/**/*.ts,src/**/*.tsx

# 测试路径
sonar.tests=src
sonar.test.inclusions=src/**/*.test.ts,src/**/*.test.tsx,src/**/*.spec.ts,src/**/*.spec.tsx

# 覆盖率路径
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.testExecutionReportPaths=test-results.xml

# 代码分析
sonar.exclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,**/stories/**,**/*.stories.tsx
sonar.coverage.exclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,**/stories/**,**/*.stories.tsx

# TypeScript 配置
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.javascript.node.maxsize=500
```

### Codecov 配置

```yaml
# codecov.yml
coverage:
  status:
    project:
      default:
        target: auto
        threshold: 1%
        informational: true
    patch:
      default:
        target: auto
        threshold: 1%
        informational: true

ignore:
  - "src/**/*.stories.tsx"
  - "src/**/*.test.tsx"
  - "src/**/__tests__/**"
  - "src/setupTests.ts"

comment:
  layout: "reach,diff,flags,tree"
  behavior: default
  require_changes: false
```

## 🔧 开发工具配置

### VSCode 配置

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/coverage": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "stylelint.validate": [
    "css",
    "scss",
    "less",
    "postcss"
  ]
}
```

### VSCode 扩展推荐

```json
// .vscode/extensions.json
{
  "recommendations": [
    // ESLint 和 Prettier
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    
    // TypeScript 支持
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    
    // React 相关
    "ms-vscode.vscode-react-Preview",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    
    // 样式相关
    "stylelint.vscode-stylelint",
    "bradlc.vscode-tailwindcss",
    
    // 测试相关
    "ms-vscode.vscode-jest",
    
    // Git 相关
    "eamodio.gitlens",
    "donjayamanne.githistory",
    
    // 代码质量
    "sonarlint.sonarlint-vscode",
    
    // 开发效率
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "editorconfig.editorconfig"
  ]
}
```

## 📦 依赖包配置

### 开发依赖包

```json
// package.json
{
  "devDependencies": {
    // 代码检查和格式化
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-import": "^2.29.1",
    "eslint-plugin-prettier": "^5.1.3",
    "eslint-plugin-sonarjs": "^0.23.0",
    "eslint-plugin-react-perf": "^3.3.1",
    
    // 代码格式化
    "prettier": "^3.2.5",
    "prettier-plugin-tailwindcss": "^0.5.11",
    
    // 样式检查
    "stylelint": "^16.2.1",
    "stylelint-config-standard": "^36.0.0",
    "stylelint-config-recommended": "^14.0.0",
    "stylelint-config-styled-components": "^0.1.1",
    "stylelint-order": "^6.0.4",
    "stylelint-config-rational-order": "^0.1.2",
    "postcss": "^8.4.35",
    "postcss-scss": "^4.0.9",
    "postcss-less": "^6.0.0",
    
    // Git 工作流
    "husky": "^8.0.3",
    "lint-staged": "^15.2.2",
    "@commitlint/cli": "^18.6.1",
    "@commitlint/config-conventional": "^18.6.2",
    "commitlint-plugin-function-rules": "^3.1.1",
    
    // 测试相关
    "@testing-library/react": "^14.2.1",
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/user-event": "^14.5.2",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@jest/globals": "^29.7.0",
    "@types/jest": "^29.5.12",
    "ts-jest": "^29.1.2",
    "jest-transform-stub": "^2.0.0",
    "identity-obj-proxy": "^3.0.0",
    
    // 代码覆盖率
    "jest-sonar": "^0.2.15",
    "codecov": "^3.8.3",
    
    // 构建和打包
    "@types/node": "^20.11.20",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "ts-patch": "^3.2.1",
    
    // 文档生成
    "typedoc": "^0.25.8",
    "typedoc-plugin-markdown": "^4.0.3",
    
    // 代码质量
    "sonar-scanner": "^3.1.0",
    
    // 自动化
    "npm-run-all": "^4.1.5",
    "cross-env": "^7.0.3",
    
    // 类型检查
    "@typescript-eslint/type-utils": "^6.21.0"
  },
  "scripts": {
    // 代码检查
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "lint:style": "stylelint src/**/*.{css,scss,less}",
    "lint:style:fix": "stylelint src/**/*.{css,scss,less} --fix",
    
    // 类型检查
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    
    // 格式化
    "format": "prettier --write src/**/*.{ts,tsx,css,scss,less,json,md}",
    "format:check": "prettier --check src/**/*.{ts,tsx,css,scss,less,json,md}",
    
    // 测试
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    
    // 构建
    "build": "tsc",
    "build:watch": "tsc --watch",
    
    // Git 相关
    "prepare": "husky install",
    "commit": "git-cz",
    
    // 综合检查
    "check": "npm run type-check && npm run lint && npm run lint:style && npm run test",
    "check:fix": "npm run lint:fix && npm run lint:style:fix && npm run format",
    
    // 文档
    "docs:generate": "typedoc src/index.ts",
    "docs:serve": "npm run docs:generate && live-server docs"
  }
}
```

## 🚀 自动化脚本

### 组件生成脚本

```javascript
// scripts/generate-component.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const componentTemplate = (name) => `import React from 'react';
import { cn } from '@/lib/utils';

interface ${name}Props {
  className?: string;
  children?: React.ReactNode;
}

export const ${name} = React.forwardRef<HTMLDivElement, ${name}Props>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('${name.toLowerCase()}-container', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

${name}.displayName = '${name}';

export default ${name};
`;

const testTemplate = (name) => `import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders without crashing', () => {
    render(<${name} />);
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<${name} className="custom-class" />);
    const container = screen.getByRole('generic');
    expect(container).toHaveClass('custom-class');
  });

  it('renders children correctly', () => {
    render(<${name}>Test Content</${name}>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
`;

const storiesTemplate = (name) => `import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ${name} } from './${name}';

const meta: Meta<typeof ${name}> = {
  title: 'Components/${name}',
  component: ${name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Hello World',
  },
};

export const WithCustomClass: Story = {
  args: {
    children: 'Custom Style',
    className: 'text-blue-500',
  },
};
`;

function generateComponent(name) {
  const componentDir = path.join(process.cwd(), 'src/components', name.toLowerCase());
  
  // 创建目录
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }
  
  // 生成文件
  const files = [
    { name: `${name}.tsx`, content: componentTemplate(name) },
    { name: `${name}.test.tsx`, content: testTemplate(name) },
    { name: `${name}.stories.tsx`, content: storiesTemplate(name) },
    { name: 'index.ts', content: `export { ${name} } from './${name}';\nexport default ${name};\n` }
  ];
  
  files.forEach(file => {
    const filePath = path.join(componentDir, file.name);
    fs.writeFileSync(filePath, file.content);
    console.log(`✅ Created: ${filePath}`);
  });
  
  // 运行格式化
  try {
    execSync(`npm run format ${componentDir}`);
    console.log('🎨 Formatted files');
  } catch (error) {
    console.warn('⚠️ Formatting failed:', error.message);
  }
  
  console.log(`🎉 Component ${name} generated successfully!`);
}

const componentName = process.argv[2];
if (!componentName) {
  console.error('❌ Please provide a component name');
  process.exit(1);
}

generateComponent(componentName);
```

### 代码质量检查脚本

```javascript
// scripts/quality-check.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const checks = [
  {
    name: 'TypeScript Type Check',
    command: 'npm run type-check',
    critical: true
  },
  {
    name: 'ESLint Check',
    command: 'npm run lint',
    critical: true
  },
  {
    name: 'Stylelint Check',
    command: 'npm run lint:style',
    critical: false
  },
  {
    name: 'Prettier Check',
    command: 'npm run format:check',
    critical: false
  },
  {
    name: 'Tests',
    command: 'npm run test:ci',
    critical: true
  },
  {
    name: 'Build Check',
    command: 'npm run build',
    critical: true
  }
];

async function runQualityChecks() {
  console.log('🔍 Running quality checks...\n');
  
  const results = [];
  
  for (const check of checks) {
    try {
      console.log(`📋 Running: ${check.name}`);
      execSync(check.command, { stdio: 'pipe' });
      console.log(`✅ ${check.name}: PASSED\n`);
      results.push({ name: check.name, status: 'PASSED', critical: check.critical });
    } catch (error) {
      console.log(`❌ ${check.name}: FAILED`);
      console.log(`   ${error.message}\n`);
      results.push({ 
        name: check.name, 
        status: 'FAILED', 
        critical: check.critical,
        error: error.message 
      });
      
      if (check.critical) {
        console.log('🚨 Critical check failed, stopping...');
        break;
      }
    }
  }
  
  // 生成报告
  const report = generateReport(results);
  console.log(report);
  
  // 检查是否有关键检查失败
  const criticalFailures = results.filter(r => r.critical && r.status === 'FAILED');
  if (criticalFailures.length > 0) {
    process.exit(1);
  }
}

function generateReport(results) {
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const total = results.length;
  
  let report = '📊 Quality Check Report\n';
  report += '=' .repeat(30) + '\n\n';
  report += `Total: ${total}, Passed: ${passed}, Failed: ${failed}\n\n`;
  
  results.forEach(result => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    const critical = result.critical ? ' (Critical)' : '';
    report += `${status} ${result.name}${critical}\n`;
    if (result.error) {
      report += `   ${result.error}\n`;
    }
  });
  
  return report;
}

runQualityChecks();
```

## 📋 总结

完整的开发工具链配置能够确保：

1. **代码质量**：通过 ESLint 和 TypeScript 确保代码规范和类型安全
2. **代码风格**：通过 Prettier 保持一致的代码格式
3. **Git 工作流**：通过 Husky 和 lint-staged 自动化代码检查
4. **测试质量**：通过 Jest 和 Testing Library 确保测试覆盖率
5. **文档质量**：通过自动化工具生成和维护文档

这套工具链配置为 React 组件开发提供了完整的质量保障体系。

---

*文档版本：1.0.0*  
*最后更新：2024年*