/**
 * 代码生成引擎 - 负责架构生成、代码模板渲染和项目导出
 * 基于Handlebars模板引擎，支持自定义模板和增量生成
 */

import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { 
  WizardSession,
  ArchitectureSpec,
  FolderStructure,
  ComponentSpec,
  ComponentHierarchy,
  ToolResult,
  CustomTemplate,
  Technology,
  DocumentationSpec
} from '../types/index.js';

export class Generator {
  private templates: Map<string, string> = new Map();
  private handlebars: typeof Handlebars;
  private builtinTemplatesPath: string;

  constructor() {
    this.handlebars = Handlebars.create();
    this.builtinTemplatesPath = path.join(process.cwd(), 'templates');
    this.initializeHandlebars();
    this.loadBuiltinTemplates();
  }

  /**
   * 生成完整的React项目架构
   */
  async generateArchitecture(session: WizardSession): Promise<ToolResult> {
    try {
      const { requirements } = session;
      
      // 1. 确定架构模式
      const pattern = this.determineArchitecturePattern(session);
      
      // 2. 生成文件夹结构
      const structure = this.generateFolderStructure(pattern, requirements.projectType);
      
      // 3. 生成组件层次结构
      const components = this.generateComponentHierarchy(session);
      
      // 4. 确定技术栈
      const technologies = this.determineTechnologyStack(session);
      
      // 5. 生成文档规范
      const documentation = this.generateDocumentationSpec(session);

      const architecture: ArchitectureSpec = {
        id: `arch_${session.id}_${Date.now()}`,
        name: `${session.projectName} Architecture`,
        pattern,
        structure,
        components,
        dependencies: this.generateDependencyGraph(components),
        technologies,
        documentation,
      };

      return {
        success: true,
        data: architecture,
        metadata: {
          generatedAt: new Date().toISOString(),
          pattern,
          componentCount: this.countComponents(components),
          technologiesCount: technologies.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '架构生成失败',
      };
    }
  }

  /**
   * 导出完整项目到指定目录
   */
  async exportProject(
    session: WizardSession, 
    outputPath: string, 
    options: {
      includeTests?: boolean;
      includeExamples?: boolean;
    } = {}
  ): Promise<ToolResult> {
    try {
      if (!session.architecture) {
        throw new Error('架构尚未生成，无法导出项目');
      }

      const { includeTests = true, includeExamples = false } = options;
      const exportedFiles: string[] = [];

      // 1. 创建输出目录
      await fs.ensureDir(outputPath);

      // 2. 生成项目配置文件
      const configFiles = await this.generateConfigFiles(session);
      for (const [filePath, content] of Object.entries(configFiles)) {
        const fullPath = path.join(outputPath, filePath);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content, 'utf-8');
        exportedFiles.push(filePath);
      }

      // 3. 创建文件夹结构
      await this.createFolderStructure(outputPath, session.architecture.structure);

      // 4. 生成组件文件
      const componentFiles = await this.generateComponentFiles(session, includeTests);
      for (const [filePath, content] of Object.entries(componentFiles)) {
        const fullPath = path.join(outputPath, filePath);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content, 'utf-8');
        exportedFiles.push(filePath);
      }

      // 5. 生成样式文件
      const styleFiles = await this.generateStyleFiles(session);
      for (const [filePath, content] of Object.entries(styleFiles)) {
        const fullPath = path.join(outputPath, filePath);
        await fs.writeFile(fullPath, content, 'utf-8');
        exportedFiles.push(filePath);
      }

      // 6. 生成工具配置文件
      const toolFiles = await this.generateToolConfigFiles(session);
      for (const [filePath, content] of Object.entries(toolFiles)) {
        const fullPath = path.join(outputPath, filePath);
        await fs.writeFile(fullPath, content, 'utf-8');
        exportedFiles.push(filePath);
      }

      // 7. 生成文档文件
      const docFiles = await this.generateDocumentationFiles(session);
      for (const [filePath, content] of Object.entries(docFiles)) {
        const fullPath = path.join(outputPath, filePath);
        await fs.writeFile(fullPath, content, 'utf-8');
        exportedFiles.push(filePath);
      }

      // 8. 生成示例文件（可选）
      if (includeExamples) {
        const exampleFiles = await this.generateExampleFiles(session);
        for (const [filePath, content] of Object.entries(exampleFiles)) {
          const fullPath = path.join(outputPath, filePath);
          await fs.ensureDir(path.dirname(fullPath));
          await fs.writeFile(fullPath, content, 'utf-8');
          exportedFiles.push(filePath);
        }
      }

      return {
        success: true,
        data: {
          outputPath,
          filesGenerated: exportedFiles.length,
          files: exportedFiles,
          size: await this.calculateDirectorySize(outputPath),
        },
        metadata: {
          exportedAt: new Date().toISOString(),
          includeTests,
          includeExamples,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '项目导出失败',
      };
    }
  }

  /**
   * 渲染自定义模板
   */
  async renderTemplate(
    templateName: string, 
    data: Record<string, any>,
    customTemplates?: CustomTemplate[]
  ): Promise<string> {
    // 优先使用自定义模板
    if (customTemplates) {
      const customTemplate = customTemplates.find(t => t.name === templateName);
      if (customTemplate) {
        const compiled = this.handlebars.compile(customTemplate.template);
        return compiled(data);
      }
    }

    // 使用内置模板
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`模板 ${templateName} 不存在`);
    }

    const compiled = this.handlebars.compile(template);
    return compiled(data);
  }

  // =============================================================================
  // 私有方法 - 架构生成
  // =============================================================================

  private determineArchitecturePattern(session: WizardSession): string {
    const { teamSize, projectType, features } = session.requirements;
    
    // 基于团队规模和项目复杂度确定架构模式
    if (teamSize <= 3 && features.length <= 10) {
      return 'modular';
    } else if (teamSize <= 10 && features.length <= 20) {
      return 'feature-based';
    } else if (teamSize > 10) {
      return 'layered';
    }
    
    return 'modular';
  }

  private generateFolderStructure(pattern: string, projectType: string): FolderStructure {
    const structures: Record<string, FolderStructure> = {
      modular: {
        'src': {
          type: 'folder',
          description: '源代码根目录',
          children: {
            'components': {
              type: 'folder',
              description: '可复用组件',
              children: {
                'common': { type: 'folder', description: '通用组件' },
                'business': { type: 'folder', description: '业务组件' }
              }
            },
            'pages': {
              type: 'folder',
              description: '页面组件',
            },
            'hooks': {
              type: 'folder',
              description: '自定义Hooks',
            },
            'utils': {
              type: 'folder',
              description: '工具函数',
            },
            'styles': {
              type: 'folder',
              description: '全局样式',
            },
            'assets': {
              type: 'folder',
              description: '静态资源',
            },
            'types': {
              type: 'folder',
              description: 'TypeScript类型定义',
            }
          }
        },
        'public': {
          type: 'folder',
          description: '公共静态文件',
        }
      },
      'feature-based': {
        'src': {
          type: 'folder',
          description: '源代码根目录',
          children: {
            'features': {
              type: 'folder',
              description: '功能模块',
              children: {
                'auth': { type: 'folder', description: '认证功能' },
                'dashboard': { type: 'folder', description: '仪表板功能' }
              }
            },
            'shared': {
              type: 'folder',
              description: '共享代码',
              children: {
                'components': { type: 'folder', description: '共享组件' },
                'hooks': { type: 'folder', description: '共享Hooks' },
                'utils': { type: 'folder', description: '工具函数' }
              }
            }
          }
        }
      }
    };

    return structures[pattern] || structures.modular;
  }

  private generateComponentHierarchy(session: WizardSession): ComponentHierarchy {
    const { projectType, features } = session.requirements;
    
    const hierarchy: ComponentHierarchy = {
      pages: this.generatePageComponents(projectType, features),
      layouts: this.generateLayoutComponents(projectType),
      business: this.generateBusinessComponents(features),
      common: this.generateCommonComponents(projectType),
      base: this.generateBaseComponents(),
    };

    return hierarchy;
  }

  private generatePageComponents(projectType: string, features: any[]): ComponentSpec[] {
    const basePages: ComponentSpec[] = [
      {
        id: 'home-page',
        name: 'HomePage',
        type: 'page',
        description: '首页组件',
        props: [],
        dependencies: ['Layout', 'Header'],
        template: 'page-component',
      }
    ];

    // 基于项目类型添加特定页面
    const typeSpecificPages: Record<string, ComponentSpec[]> = {
      ecommerce: [
        {
          id: 'product-list-page',
          name: 'ProductListPage',
          type: 'page',
          description: '商品列表页面',
          props: [],
          dependencies: ['ProductCard', 'FilterSidebar'],
          template: 'page-component',
        },
        {
          id: 'cart-page',
          name: 'CartPage',
          type: 'page',
          description: '购物车页面',
          props: [],
          dependencies: ['CartItem', 'CheckoutButton'],
          template: 'page-component',
        }
      ],
      saas: [
        {
          id: 'dashboard-page',
          name: 'DashboardPage',
          type: 'page',
          description: '仪表板页面',
          props: [],
          dependencies: ['Chart', 'MetricCard'],
          template: 'page-component',
        }
      ]
    };

    return [...basePages, ...(typeSpecificPages[projectType] || [])];
  }

  private generateLayoutComponents(projectType: string): ComponentSpec[] {
    return [
      {
        id: 'main-layout',
        name: 'MainLayout',
        type: 'layout',
        description: '主布局组件',
        props: [
          { name: 'children', type: 'React.ReactNode', required: true }
        ],
        dependencies: ['Header', 'Footer'],
        template: 'layout-component',
      },
      {
        id: 'auth-layout',
        name: 'AuthLayout',
        type: 'layout',
        description: '认证页面布局',
        props: [
          { name: 'children', type: 'React.ReactNode', required: true }
        ],
        dependencies: [],
        template: 'layout-component',
      }
    ];
  }

  private generateBusinessComponents(features: any[]): ComponentSpec[] {
    const components: ComponentSpec[] = [];

    features.forEach(feature => {
      // 基于功能生成业务组件
      if (feature.name.includes('用户') || feature.name.includes('认证')) {
        components.push({
          id: 'user-profile',
          name: 'UserProfile',
          type: 'business',
          description: '用户资料组件',
          props: [
            { name: 'user', type: 'User', required: true }
          ],
          dependencies: ['Button', 'Input'],
          template: 'business-component',
        });
      }
    });

    return components;
  }

  private generateCommonComponents(projectType: string): ComponentSpec[] {
    return [
      {
        id: 'button',
        name: 'Button',
        type: 'common',
        description: '通用按钮组件',
        props: [
          { name: 'children', type: 'React.ReactNode', required: true },
          { name: 'variant', type: '"primary" | "secondary"', required: false, defaultValue: 'primary' },
          { name: 'onClick', type: '() => void', required: false }
        ],
        dependencies: [],
        template: 'button-component',
      },
      {
        id: 'input',
        name: 'Input',
        type: 'common',
        description: '通用输入框组件',
        props: [
          { name: 'value', type: 'string', required: true },
          { name: 'onChange', type: '(value: string) => void', required: true },
          { name: 'placeholder', type: 'string', required: false }
        ],
        dependencies: [],
        template: 'input-component',
      }
    ];
  }

  private generateBaseComponents(): ComponentSpec[] {
    return [
      {
        id: 'loading',
        name: 'Loading',
        type: 'base',
        description: '加载状态组件',
        props: [
          { name: 'size', type: '"small" | "medium" | "large"', required: false, defaultValue: 'medium' }
        ],
        dependencies: [],
        template: 'loading-component',
      }
    ];
  }

  private generateDependencyGraph(components: ComponentHierarchy): any {
    const nodes: any[] = [];
    const edges: any[] = [];

    // 收集所有组件
    const allComponents = [
      ...components.pages,
      ...components.layouts,
      ...components.business,
      ...components.common,
      ...components.base
    ];

    // 生成节点
    allComponents.forEach(comp => {
      nodes.push({
        id: comp.id,
        name: comp.name,
        type: 'component'
      });
    });

    // 生成边
    allComponents.forEach(comp => {
      comp.dependencies.forEach(dep => {
        const depComponent = allComponents.find(c => c.name === dep);
        if (depComponent) {
          edges.push({
            from: comp.id,
            to: depComponent.id,
            type: 'imports'
          });
        }
      });
    });

    return { nodes, edges };
  }

  private determineTechnologyStack(session: WizardSession): Technology[] {
    const { projectType, preferences, teamSize } = session.requirements;
    const technologies: Technology[] = [];

    // 核心框架
    technologies.push({
      name: 'React',
      version: '18.2.0',
      category: 'framework',
      purpose: '用户界面构建',
      alternatives: ['Vue.js', 'Angular']
    });

    // TypeScript（推荐给中大型团队）
    if (teamSize > 2) {
      technologies.push({
        name: 'TypeScript',
        version: '5.0.0',
        category: 'tool',
        purpose: '类型安全和开发体验',
        alternatives: ['JavaScript', 'Flow']
      });
    }

    // 状态管理
    const hasComplexState = session.requirements.features.some(f => 
      f.name.includes('状态') || f.name.includes('数据')
    );
    if (hasComplexState) {
      technologies.push({
        name: 'Redux Toolkit',
        category: 'library',
        purpose: '状态管理',
        alternatives: ['Zustand', 'Context API', 'Jotai']
      });
    }

    // 路由
    technologies.push({
      name: 'React Router',
      category: 'library',
      purpose: '客户端路由',
      alternatives: ['Next.js Router', 'Reach Router']
    });

    // 样式解决方案
    technologies.push({
      name: 'Tailwind CSS',
      category: 'library',
      purpose: '样式框架',
      alternatives: ['Styled Components', 'CSS Modules', 'Emotion']
    });

    // 基于项目类型添加特定技术
    if (projectType === 'ecommerce') {
      technologies.push({
        name: 'Stripe',
        category: 'service',
        purpose: '支付处理',
        alternatives: ['PayPal', 'Square']
      });
    }

    return technologies;
  }

  private generateDocumentationSpec(session: WizardSession): DocumentationSpec {
    return {
      readme: this.generateReadmeContent(session),
      architecture: this.generateArchitectureDoc(session),
      components: this.generateComponentDocs(session),
      deployment: this.generateDeploymentDoc(session),
    };
  }

  // =============================================================================
  // 私有方法 - 文件生成
  // =============================================================================

  private async generateConfigFiles(session: WizardSession): Promise<Record<string, string>> {
    const files: Record<string, string> = {};

    // package.json
    files['package.json'] = await this.renderTemplate('package-json', {
      projectName: session.projectName,
      technologies: session.architecture?.technologies || [],
    });

    // tsconfig.json
    files['tsconfig.json'] = await this.renderTemplate('tsconfig-json', {});

    // vite.config.ts
    files['vite.config.ts'] = await this.renderTemplate('vite-config', {});

    return files;
  }

  private async createFolderStructure(basePath: string, structure: FolderStructure): Promise<void> {
    for (const [name, config] of Object.entries(structure)) {
      const fullPath = path.join(basePath, name);
      
      if (config.type === 'folder') {
        await fs.ensureDir(fullPath);
        if (config.children) {
          await this.createFolderStructure(fullPath, config.children);
        }
      } else if (config.type === 'file') {
        await fs.ensureFile(fullPath);
      }
    }
  }

  private async generateComponentFiles(session: WizardSession, includeTests: boolean): Promise<Record<string, string>> {
    const files: Record<string, string> = {};
    
    if (!session.architecture) return files;

    const allComponents = [
      ...session.architecture.components.pages,
      ...session.architecture.components.layouts,
      ...session.architecture.components.business,
      ...session.architecture.components.common,
      ...session.architecture.components.base
    ];

    for (const component of allComponents) {
      const componentPath = this.getComponentPath(component);
      
      // 生成组件文件
      files[`${componentPath}/index.tsx`] = await this.renderTemplate(
        component.template || 'default-component',
        {
          name: component.name,
          type: component.type,
          props: component.props,
          dependencies: component.dependencies,
          description: component.description,
        }
      );

      // 生成样式文件
      files[`${componentPath}/styles.module.css`] = await this.renderTemplate('component-styles', {
        name: component.name,
      });

      // 生成测试文件（可选）
      if (includeTests) {
        files[`${componentPath}/__tests__/${component.name}.test.tsx`] = await this.renderTemplate('component-test', {
          name: component.name,
          props: component.props,
        });
      }
    }

    return files;
  }

  private async generateStyleFiles(session: WizardSession): Promise<Record<string, string>> {
    const files: Record<string, string> = {};

    // 全局样式
    files['src/styles/globals.css'] = await this.renderTemplate('global-styles', {});
    
    // 变量文件
    files['src/styles/variables.css'] = await this.renderTemplate('css-variables', {
      projectType: session.requirements.projectType,
    });

    return files;
  }

  private async generateToolConfigFiles(session: WizardSession): Promise<Record<string, string>> {
    const files: Record<string, string> = {};

    // ESLint配置
    files['.eslintrc.json'] = await this.renderTemplate('eslint-config', {});
    
    // Prettier配置
    files['.prettierrc'] = await this.renderTemplate('prettier-config', {});
    
    // Tailwind配置
    files['tailwind.config.js'] = await this.renderTemplate('tailwind-config', {});

    return files;
  }

  private async generateDocumentationFiles(session: WizardSession): Promise<Record<string, string>> {
    const files: Record<string, string> = {};

    if (!session.architecture?.documentation) return files;

    const { documentation } = session.architecture;

    files['README.md'] = documentation.readme;
    files['docs/architecture.md'] = documentation.architecture;
    files['docs/components.md'] = this.generateComponentsMarkdown(documentation.components);
    files['docs/deployment.md'] = documentation.deployment;

    return files;
  }

  private async generateExampleFiles(session: WizardSession): Promise<Record<string, string>> {
    const files: Record<string, string> = {};

    // 生成示例页面
    files['examples/BasicExample.tsx'] = await this.renderTemplate('basic-example', {
      projectName: session.projectName,
    });

    return files;
  }

  // =============================================================================
  // 私有方法 - 文档生成
  // =============================================================================

  private generateReadmeContent(session: WizardSession): string {
    return `# ${session.projectName}

## 项目概述

${session.requirements.projectType}类型的React应用，支持以下功能：

${session.requirements.features.map(f => `- ${f.name}: ${f.description}`).join('\n')}

## 技术栈

${session.architecture?.technologies.map(t => `- ${t.name}: ${t.purpose}`).join('\n') || ''}

## 开发指南

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
\`\`\`

## 架构说明

采用${session.architecture?.pattern}架构模式，具体请参考 [架构文档](docs/architecture.md)。

## 贡献指南

请参考项目的代码规范和提交规范。
`;
  }

  private generateArchitectureDoc(session: WizardSession): string {
    return `# 架构文档

## 架构模式

本项目采用 **${session.architecture?.pattern}** 架构模式。

## 目录结构

\`\`\`
${this.generateDirectoryTree(session.architecture?.structure || {})}
\`\`\`

## 组件层次

### 页面组件 (Pages)
${session.architecture?.components.pages.map(c => `- ${c.name}: ${c.description}`).join('\n') || ''}

### 布局组件 (Layouts)
${session.architecture?.components.layouts.map(c => `- ${c.name}: ${c.description}`).join('\n') || ''}

### 业务组件 (Business)
${session.architecture?.components.business.map(c => `- ${c.name}: ${c.description}`).join('\n') || ''}

### 通用组件 (Common)
${session.architecture?.components.common.map(c => `- ${c.name}: ${c.description}`).join('\n') || ''}

## 设计原则

- 单一职责原则：每个组件只负责一个功能
- 组件复用：抽取通用逻辑到共享组件
- 类型安全：使用TypeScript确保类型安全
- 性能优化：合理使用React的优化特性
`;
  }

  private generateComponentDocs(session: WizardSession): any[] {
    if (!session.architecture) return [];

    const allComponents = [
      ...session.architecture.components.pages,
      ...session.architecture.components.layouts,
      ...session.architecture.components.business,
      ...session.architecture.components.common,
      ...session.architecture.components.base
    ];

    return allComponents.map(component => ({
      name: component.name,
      purpose: component.description,
      usage: `import { ${component.name} } from './${this.getComponentPath(component)}';`,
      examples: [`<${component.name} ${component.props.map(p => `${p.name}={${p.defaultValue || 'value'}}`).join(' ')} />`]
    }));
  }

  private generateDeploymentDoc(session: WizardSession): string {
    return `# 部署指南

## 构建项目

\`\`\`bash
npm run build
\`\`\`

## 部署选项

### Vercel 部署
1. 连接 GitHub 仓库
2. 配置构建命令: \`npm run build\`
3. 配置输出目录: \`dist\`

### Netlify 部署
1. 拖拽 dist 目录到 Netlify
2. 或连接 Git 仓库自动部署

### 自托管部署
1. 将 dist 目录内容上传到服务器
2. 配置 Web 服务器（Nginx/Apache）

## 环境变量

根据需要配置以下环境变量：
- \`VITE_API_URL\`: API 服务地址
- \`VITE_APP_ENV\`: 应用环境
`;
  }

  // =============================================================================
  // 辅助方法
  // =============================================================================

  private initializeHandlebars(): void {
    // 注册Helper函数
    this.handlebars.registerHelper('capitalize', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    this.handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });

    this.handlebars.registerHelper('camelCase', (str: string) => {
      return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    });
  }

  private async loadBuiltinTemplates(): Promise<void> {
    // 内置模板内容
    const builtinTemplates = {
      'default-component': `import React from 'react';
import styles from './styles.module.css';

interface {{name}}Props {
{{#each props}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
{{/each}}
}

export const {{name}}: React.FC<{{name}}Props> = ({
{{#each props}}
  {{name}}{{#if defaultValue}} = {{defaultValue}}{{/if}},
{{/each}}
}) => {
  return (
    <div className={styles.{{kebabCase name}}}>
      <span>{{description}}</span>
    </div>
  );
};`,
      
      'package-json': `{
  "name": "{{kebabCase projectName}}",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
{{#each technologies}}
{{#if (eq category "library")}}
    ,"{{name}}": "latest"
{{/if}}
{{/each}}
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "vitest": "^0.34.0"
  }
}`,

      'tsconfig-json': `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`,

      'component-styles': `.{{kebabCase name}} {
  /* Styles for {{name}} component */
}`,

      'global-styles': `/* Global styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`
    };

    // 加载内置模板
    for (const [name, template] of Object.entries(builtinTemplates)) {
      this.templates.set(name, template);
    }
  }

  private getComponentPath(component: ComponentSpec): string {
    const typeMap = {
      page: 'src/pages',
      layout: 'src/components/layouts',
      business: 'src/components/business',
      common: 'src/components/common',
      base: 'src/components/base',
    };
    
    return `${typeMap[component.type]}/${component.name}`;
  }

  private generateDirectoryTree(structure: FolderStructure, level: number = 0): string {
    let tree = '';
    const indent = '  '.repeat(level);
    
    for (const [name, config] of Object.entries(structure)) {
      tree += `${indent}${config.type === 'folder' ? '📁' : '📄'} ${name}/\n`;
      if (config.children) {
        tree += this.generateDirectoryTree(config.children, level + 1);
      }
    }
    
    return tree;
  }

  private generateComponentsMarkdown(components: any[]): string {
    return `# 组件文档

${components.map(comp => `
## ${comp.name}

**用途**: ${comp.purpose}

**使用方式**:
\`\`\`tsx
${comp.usage}
\`\`\`

**示例**:
\`\`\`tsx
${comp.examples.join('\n')}
\`\`\`
`).join('\n')}`;
  }

  private countComponents(hierarchy: ComponentHierarchy): number {
    return hierarchy.pages.length + 
           hierarchy.layouts.length + 
           hierarchy.business.length + 
           hierarchy.common.length + 
           hierarchy.base.length;
  }

  private async calculateDirectorySize(dirPath: string): Promise<number> {
    try {
      const stats = await fs.stat(dirPath);
      if (stats.isFile()) {
        return stats.size;
      }
      
      const files = await fs.readdir(dirPath);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        totalSize += await this.calculateDirectorySize(filePath);
      }
      
      return totalSize;
    } catch {
      return 0;
    }
  }
}