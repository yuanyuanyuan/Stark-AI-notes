# React 组件文档自动化生成工具

> 基于 React 18.3.1 的组件文档自动生成和管理工具

## 📋 概述

本工具提供了完整的 React 组件文档自动生成功能，包括 API 文档、使用示例、Storybook 集成、类型定义等，帮助团队快速生成和维护高质量的组件文档。

## 🛠️ 文档生成器核心

### 文档生成器主类

```typescript
// tools/DocumentGenerator.ts
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { parse } from 'react-docgen-typescript';
import { Project } from 'ts-morph';

export interface ComponentInfo {
  name: string;
  description?: string;
  filePath: string;
  props: PropInfo[];
  methods: MethodInfo[];
  events: EventInfo[];
  slots?: SlotInfo[];
  examples: ExampleInfo[];
  dependencies: string[];
  usage: string;
  category: string;
  tags: string[];
  version: string;
  author: string;
  since: string;
}

export interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
  deprecated?: boolean;
  deprecatedReason?: string;
}

export interface MethodInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  description?: string;
  deprecated?: boolean;
}

export interface ParameterInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface EventInfo {
  name: string;
  type: string;
  description?: string;
  parameters?: ParameterInfo[];
}

export interface SlotInfo {
  name: string;
  description?: string;
  props?: Record<string, any>;
}

export interface ExampleInfo {
  title: string;
  description?: string;
  code: string;
  live?: boolean;
  dependencies?: string[];
}

export interface DocumentGeneratorConfig {
  sourceDir: string;
  outputDir: string;
  templatesDir: string;
  includePatterns: string[];
  excludePatterns: string[];
  generateMarkdown: boolean;
  generateStorybook: boolean;
  generateTypes: boolean;
  generateApiDocs: boolean;
  customTemplates?: Record<string, string>;
}

export class DocumentGenerator {
  private config: DocumentGeneratorConfig;
  private project: Project;
  private parser: any;
  private templates: Map<string, string> = new Map();
  
  constructor(config: DocumentGeneratorConfig) {
    this.config = config;
    this.project = new Project({
      tsConfigFilePath: path.join(config.sourceDir, 'tsconfig.json'),
      skipAddingFilesFromTsConfig: false,
    });
    
    // 初始化 React Docgen 解析器
    this.parser = parse.withCompilerOptions({
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    });
    
    // 加载模板
    this.loadTemplates();
  }
  
  private loadTemplates(): void {
    const templatesDir = this.config.templatesDir;
    
    // 加载默认模板
    const defaultTemplates = [
      'component.md',
      'props-table.md',
      'example-code.md',
      'storybook.stories.tsx',
      'api-reference.md'
    ];
    
    defaultTemplates.forEach(template => {
      const templatePath = path.join(templatesDir, template);
      if (fs.existsSync(templatePath)) {
        const content = fs.readFileSync(templatePath, 'utf-8');
        this.templates.set(template, content);
      }
    });
    
    // 加载自定义模板
    if (this.config.customTemplates) {
      Object.entries(this.config.customTemplates).forEach(([name, content]) => {
        this.templates.set(name, content);
      });
    }
  }
  
  // 生成所有组件文档
  async generateAll(): Promise<void> {
    const componentFiles = this.findComponentFiles();
    
    for (const filePath of componentFiles) {
      await this.generateComponentDocs(filePath);
    }
    
    // 生成总览文档
    await this.generateOverview();
    
    // 生成索引
    await this.generateIndex();
  }
  
  // 查找组件文件
  private findComponentFiles(): string[] {
    const files: string[] = [];
    
    const searchDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // 检查是否应该跳过此目录
          if (!this.shouldExcludeDir(fullPath)) {
            searchDir(fullPath);
          }
        } else if (entry.isFile()) {
          // 检查文件是否匹配包含模式
          if (this.shouldIncludeFile(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    searchDir(this.config.sourceDir);
    return files;
  }
  
  private shouldExcludeDir(dirPath: string): boolean {
    const dirName = path.basename(dirPath);
    const excludePatterns = [
      'node_modules',
      'dist',
      'build',
      'coverage',
      '__tests__',
      '__mocks__',
      '.storybook',
      '.vscode',
      '.git'
    ];
    
    return excludePatterns.includes(dirName);
  }
  
  private shouldIncludeFile(filePath: string): boolean {
    const fileName = path.basename(filePath);
    
    // 检查包含模式
    const includePatterns = this.config.includePatterns || [
      '*.tsx',
      '*.jsx',
      '*.ts',
      '*.js'
    ];
    
    const isMatch = includePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(fileName);
    });
    
    if (!isMatch) return false;
    
    // 检查排除模式
    const excludePatterns = this.config.excludePatterns || [
      '*.test.*',
      '*.spec.*',
      '*.stories.*',
      '*.config.*',
      'index.*',
      'types.*'
    ];
    
    const isExcluded = excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(fileName);
    });
    
    return !isExcluded;
  }
  
  // 生成单个组件文档
  async generateComponentDocs(filePath: string): Promise<void> {
    try {
      const componentInfo = await this.analyzeComponent(filePath);
      
      if (componentInfo) {
        await this.generateMarkdownDocs(componentInfo);
        await this.generateStorybookStories(componentInfo);
        await this.generateApiReference(componentInfo);
        
        console.log(`✅ 生成文档: ${componentInfo.name}`);
      }
    } catch (error) {
      console.error(`❌ 生成文档失败: ${filePath}`, error);
    }
  }
  
  // 分析组件
  private async analyzeComponent(filePath: string): Promise<ComponentInfo | null> {
    const sourceFile = this.project.addSourceFileAtPath(filePath);
    const componentInfo = this.parser.parse(filePath);
    
    if (!componentInfo || componentInfo.length === 0) {
      return null;
    }
    
    const component = componentInfo[0];
    const componentName = path.basename(filePath, path.extname(filePath));
    
    // 提取 JSDoc 注释
    const jsDocInfo = this.extractJSDocInfo(sourceFile);
    
    // 提取示例代码
    const examples = this.extractExamples(sourceFile);
    
    // 提取依赖
    const dependencies = this.extractDependencies(sourceFile);
    
    return {
      name: componentName,
      description: component.description || jsDocInfo.description,
      filePath,
      props: this.extractProps(component),
      methods: this.extractMethods(sourceFile),
      events: this.extractEvents(component),
      slots: this.extractSlots(component),
      examples,
      dependencies,
      usage: jsDocInfo.usage || '',
      category: jsDocInfo.category || 'Components',
      tags: jsDocInfo.tags || [],
      version: jsDocInfo.version || '1.0.0',
      author: jsDocInfo.author || '',
      since: jsDocInfo.since || '1.0.0'
    };
  }
  
  // 提取 JSDoc 信息
  private extractJSDocInfo(sourceFile: ts.SourceFile) {
    const classes = sourceFile.getClasses();
    if (classes.length === 0) {
      return {};
    }
    
    const mainClass = classes[0];
    const jsDoc = ts.getJSDocCommentsAndTags(mainClass);
    
    const info: any = {};
    
    jsDoc.forEach(tag => {
      if (ts.isJSDocComment(tag)) {
        info.description = tag.comment;
      } else if (ts.isJSDocTag(tag)) {
        switch (tag.tagName.text) {
          case 'category':
            info.category = tag.comment;
            break;
          case 'usage':
            info.usage = tag.comment;
            break;
          case 'author':
            info.author = tag.comment;
            break;
          case 'version':
            info.version = tag.comment;
            break;
          case 'since':
            info.since = tag.comment;
            break;
          case 'example':
            if (!info.examples) info.examples = [];
            info.examples.push(tag.comment);
            break;
        }
      }
    });
    
    return info;
  }
  
  // 提取 Props 信息
  private extractProps(component: any): PropInfo[] {
    if (!component.props || !component.props.length) {
      return [];
    }
    
    return component.props.map((prop: any) => ({
      name: prop.name,
      type: this.formatType(prop.type),
      required: prop.required,
      defaultValue: prop.defaultValue?.value,
      description: prop.description,
      deprecated: prop.deprecated,
      deprecatedReason: prop.deprecatedReason
    }));
  }
  
  // 提取方法信息
  private extractMethods(sourceFile: ts.SourceFile): MethodInfo[] {
    const classes = sourceFile.getClasses();
    if (classes.length === 0) {
      return [];
    }
    
    const methods: MethodInfo[] = [];
    
    classes.forEach(classDeclaration => {
      const classMethods = classDeclaration.getMethods();
      
      classMethods.forEach(method => {
        if (!method.isStatic()) { // 只处理实例方法
          methods.push({
            name: method.getName(),
            parameters: method.getParameters().map(param => ({
              name: param.getName(),
              type: param.getType().getText(),
              required: !param.hasInitializer(),
              defaultValue: param.getInitializer()?.getText(),
              description: ''
            })),
            returnType: method.getReturnType().getText(),
            description: ''
          });
        }
      });
    });
    
    return methods;
  }
  
  // 提取事件信息
  private extractEvents(component: any): EventInfo[] {
    // 从 props 中提取事件处理器
    const events: EventInfo[] = [];
    
    if (component.props) {
      component.props.forEach((prop: any) => {
        if (prop.name.startsWith('on') && prop.type.name === 'func') {
          events.push({
            name: prop.name,
            type: prop.type.raw || 'Function',
            description: prop.description
          });
        }
      });
    }
    
    return events;
  }
  
  // 提取 Slots 信息
  private extractSlots(component: any): SlotInfo[] {
    // 从 React 组件的 children 属性提取 slots
    const slots: SlotInfo[] = [];
    
    if (component.props) {
      const childrenProp = component.props.find((prop: any) => prop.name === 'children');
      if (childrenProp) {
        slots.push({
          name: 'default',
          description: '默认插槽'
        });
      }
    }
    
    return slots;
  }
  
  // 提取示例代码
  private extractExamples(sourceFile: ts.SourceFile): ExampleInfo[] {
    const examples: ExampleInfo[] = [];
    const text = sourceFile.getText();
    
    // 匹配 @example 注释块
    const exampleRegex = /\/\*\*\s*\n\s*\*\s*@example\s*\n\s*\*\s*([\s\S]*?)\n\s*\*\//g;
    let match;
    
    while ((match = exampleRegex.exec(text)) !== null) {
      const exampleText = match[1];
      const codeMatch = exampleText.match(/```tsx?\n([\s\S]*?)\n```/);
      
      if (codeMatch) {
        examples.push({
          title: '示例',
          code: codeMatch[1].trim(),
          live: true
        });
      }
    }
    
    return examples;
  }
  
  // 提取依赖
  private extractDependencies(sourceFile: ts.SourceFile): string[] {
    const imports = sourceFile.getImportDeclarations();
    const dependencies: Set<string> = new Set();
    
    imports.forEach(importDeclaration => {
      const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
      
      // 只保留外部依赖
      if (!moduleSpecifier.startsWith('.') && !moduleSpecifier.startsWith('/')) {
        dependencies.add(moduleSpecifier);
      }
    });
    
    return Array.from(dependencies);
  }
  
  // 格式化类型信息
  private formatType(type: any): string {
    if (!type) return 'any';
    
    if (type.name) {
      let result = type.name;
      
      if (type.raw) {
        result = type.raw;
      }
      
      if (type.value) {
        result += ' | ' + type.value.map((v: any) => v.value || v).join(' | ');
      }
      
      return result;
    }
    
    return 'any';
  }
  
  // 生成 Markdown 文档
  private async generateMarkdownDocs(componentInfo: ComponentInfo): Promise<void> {
    if (!this.config.generateMarkdown) return;
    
    const template = this.templates.get('component.md');
    if (!template) return;
    
    const content = this.renderTemplate(template, componentInfo);
    const outputPath = path.join(this.config.outputDir, 'components', `${componentInfo.name}.md`);
    
    await this.ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, content, 'utf-8');
  }
  
  // 生成 Storybook Stories
  private async generateStorybookStories(componentInfo: ComponentInfo): Promise<void> {
    if (!this.config.generateStorybook) return;
    
    const template = this.templates.get('storybook.stories.tsx');
    if (!template) return;
    
    const content = this.renderTemplate(template, componentInfo);
    const outputPath = path.join(this.config.outputDir, 'stories', `${componentInfo.name}.stories.tsx`);
    
    await this.ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, content, 'utf-8');
  }
  
  // 生成 API 参考
  private async generateApiReference(componentInfo: ComponentInfo): Promise<void> {
    if (!this.config.generateApiDocs) return;
    
    const template = this.templates.get('api-reference.md');
    if (!template) return;
    
    const content = this.renderTemplate(template, componentInfo);
    const outputPath = path.join(this.config.outputDir, 'api', `${componentInfo.name}.md`);
    
    await this.ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, content, 'utf-8');
  }
  
  // 生成总览文档
  private async generateOverview(): Promise<void> {
    const componentFiles = this.findComponentFiles();
    const components: ComponentInfo[] = [];
    
    for (const filePath of componentFiles) {
      const info = await this.analyzeComponent(filePath);
      if (info) {
        components.push(info);
      }
    }
    
    // 按类别分组
    const categories = new Map<string, ComponentInfo[]>();
    components.forEach(component => {
      if (!categories.has(component.category)) {
        categories.set(component.category, []);
      }
      categories.get(component.category)!.push(component);
    });
    
    const template = this.templates.get('overview.md') || `
# 组件总览

{{#each categories}}
## {{@key}}

{{#each this}}
- [{{name}}]({{filePath}})
{{/each}}

{{/each}}
`;
    
    const content = template.replace(/{{#each categories}}([\s\S]*?){{\/each}}/g, (match, templateContent) => {
      let result = '';
      
      categories.forEach((comps, category) => {
        let categoryContent = templateContent.replace(/{{@key}}/g, category);
        
        // 处理组件列表
        categoryContent = categoryContent.replace(/{{#each this}}([\s\S]*?){{\/each}}/g, (match, itemTemplate) => {
          let items = '';
          comps.forEach(comp => {
            items += itemTemplate
              .replace(/{{name}}/g, comp.name)
              .replace(/{{filePath}}/g, `components/${comp.name}.md`);
          });
          return items;
        });
        
        result += categoryContent;
      });
      
      return result;
    });
    
    const outputPath = path.join(this.config.outputDir, 'overview.md');
    await this.ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, content, 'utf-8');
  }
  
  // 生成索引文件
  private async generateIndex(): Promise<void> {
    const componentFiles = this.findComponentFiles();
    const components: ComponentInfo[] = [];
    
    for (const filePath of componentFiles) {
      const info = await this.analyzeComponent(filePath);
      if (info) {
        components.push(info);
      }
    }
    
    // 生成按字母排序的索引
    const sortedComponents = components.sort((a, b) => a.name.localeCompare(b.name));
    
    const indexContent = `# 组件索引

${sortedComponents.map(comp => `- [${comp.name}](components/${comp.name}.md) - ${comp.description || ''}`).join('\n')}

## 按类别查看

${Array.from(new Set(components.map(c => c.category))).map(category => 
  `- [${category}](overview.md#${category.toLowerCase().replace(/\s+/g, '-')})`
).join('\n')}
`;
    
    const outputPath = path.join(this.config.outputDir, 'index.md');
    await this.ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, indexContent, 'utf-8');
  }
  
  // 渲染模板
  private renderTemplate(template: string, data: ComponentInfo): string {
    let content = template;
    
    // 基础变量替换
    const variables = [
      'name', 'description', 'filePath', 'usage', 'category', 'version', 'author', 'since'
    ];
    
    variables.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      content = content.replace(regex, (data as any)[variable] || '');
    });
    
    // Props 表格
    content = content.replace(/{{propsTable}}/g, this.generatePropsTable(data.props));
    
    // 方法列表
    content = content.replace(/{{methodsList}}/g, this.generateMethodsList(data.methods));
    
    // 事件列表
    content = content.replace(/{{eventsList}}/g, this.generateEventsList(data.events));
    
    // 示例代码
    content = content.replace(/{{examples}}/g, this.generateExamples(data.examples));
    
    // 依赖列表
    content = content.replace(/{{dependencies}}/g, this.generateDependencies(data.dependencies));
    
    // 标签列表
    content = content.replace(/{{tags}}/g, this.generateTags(data.tags));
    
    return content;
  }
  
  // 生成 Props 表格
  private generatePropsTable(props: PropInfo[]): string {
    if (!props || props.length === 0) {
      return '此组件没有 props';
    }
    
    const rows = props.map(prop => {
      const required = prop.required ? '✅' : '❌';
      const deprecated = prop.deprecated ? ' ⚠️' : '';
      const defaultValue = prop.defaultValue ? `\`${prop.defaultValue}\`` : '-';
      const description = prop.description || '';
      
      return `| ${prop.name}${deprecated} | \`${prop.type}\` | ${required} | ${defaultValue} | ${description} |`;
    }).join('\n');
    
    return `| 属性名 | 类型 | 必需 | 默认值 | 描述 |
|--------|------|------|--------|------|
${rows}`;
  }
  
  // 生成方法列表
  private generateMethodsList(methods: MethodInfo[]): string {
    if (!methods || methods.length === 0) {
      return '此组件没有方法';
    }
    
    return methods.map(method => {
      const params = method.parameters.map(p => 
        `${p.name}: ${p.type}${p.required ? '' : '?'}${p.defaultValue ? ` = ${p.defaultValue}` : ''}`
      ).join(', ');
      
      return `### ${method.name}(${params}): ${method.returnType}

${method.description || ''}

${method.parameters.length > 0 ? `
**参数:**
${method.parameters.map(p => `- \`${p.name}\`: ${p.type} - ${p.description || ''}`).join('\n')}
` : ''}
`;
    }).join('\n');
  }
  
  // 生成事件列表
  private generateEventsList(events: EventInfo[]): string {
    if (!events || events.length === 0) {
      return '此组件没有事件';
    }
    
    return events.map(event => 
      `### ${event.name}

**类型:** ${event.type}

${event.description || ''}`
    ).join('\n\n');
  }
  
  // 生成示例代码
  private generateExamples(examples: ExampleInfo[]): string {
    if (!examples || examples.length === 0) {
      return '暂无示例';
    }
    
    return examples.map((example, index) => `
### ${example.title || `示例 ${index + 1}`}

${example.description ? `${example.description}\n\n` : ''}

\`\`\`tsx
${example.code}
\`\`\`
${example.live ? '\n[在 Storybook 中查看](storybook)\n' : ''}
`).join('\n');
  }
  
  // 生成依赖列表
  private generateDependencies(dependencies: string[]): string {
    if (!dependencies || dependencies.length === 0) {
      return '无外部依赖';
    }
    
    return dependencies.map(dep => `- ${dep}`).join('\n');
  }
  
  // 生成标签列表
  private generateTags(tags: string[]): string {
    if (!tags || tags.length === 0) {
      return '';
    }
    
    return tags.map(tag => `\`${tag}\``).join(' ');
  }
  
  // 确保目录存在
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
```

### 命令行工具

```typescript
// tools/docgen-cli.ts
#!/usr/bin/env node

import { Command } from 'commander';
import { DocumentGenerator, DocumentGeneratorConfig } from './DocumentGenerator';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();

program
  .name('docgen')
  .description('React 组件文档生成工具')
  .version('1.0.0');

program
  .command('generate')
  .alias('gen')
  .description('生成组件文档')
  .option('-s, --source <dir>', '源代码目录', './src')
  .option('-o, --output <dir>', '输出目录', './docs')
  .option('-t, --templates <dir>', '模板目录', './templates')
  .option('-w, --watch', '监视模式')
  .option('--no-markdown', '不生成 Markdown 文档')
  .option('--no-storybook', '不生成 Storybook Stories')
  .option('--no-api', '不生成 API 参考')
  .option('--include <patterns>', '包含文件模式', '*.tsx,*.jsx,*.ts,*.js')
  .option('--exclude <patterns>', '排除文件模式', '*.test.*,*.spec.*,*.stories.*')
  .action(async (options) => {
    try {
      const config: DocumentGeneratorConfig = {
        sourceDir: path.resolve(options.source),
        outputDir: path.resolve(options.output),
        templatesDir: path.resolve(options.templates),
        includePatterns: options.include.split(','),
        excludePatterns: options.exclude.split(','),
        generateMarkdown: options.markdown,
        generateStorybook: options.storybook,
        generateTypes: true,
        generateApiDocs: options.api
      };
      
      const generator = new DocumentGenerator(config);
      
      if (options.watch) {
        console.log('📡 启动监视模式...');
        await generator.startWatchMode();
      } else {
        console.log('🚀 开始生成文档...');
        await generator.generateAll();
        console.log('✅ 文档生成完成!');
      }
    } catch (error) {
      console.error('❌ 生成文档失败:', error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('初始化文档生成配置')
  .option('-d, --dir <dir>', '项目目录', '.')
  .action(async (options) => {
    const projectDir = path.resolve(options.dir);
    
    // 创建默认配置
    const config = {
      sourceDir: './src',
      outputDir: './docs',
      templatesDir: './templates',
      includePatterns: ['*.tsx', '*.jsx', '*.ts', '*.js'],
      excludePatterns: ['*.test.*', '*.spec.*', '*.stories.*'],
      generateMarkdown: true,
      generateStorybook: true,
      generateTypes: true,
      generateApiDocs: true
    };
    
    // 创建配置文件
    const configPath = path.join(projectDir, 'docgen.config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    // 创建模板目录
    const templatesDir = path.join(projectDir, 'templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    
    // 创建默认模板
    createDefaultTemplates(templatesDir);
    
    console.log('✅ 初始化完成!');
    console.log(`📝 配置文件: ${configPath}`);
    console.log(`📁 模板目录: ${templatesDir}`);
  });

program
  .command('serve')
  .description('启动文档开发服务器')
  .option('-p, --port <port>', '端口号', '3000')
  .option('-d, --dir <dir>', '文档目录', './docs')
  .action(async (options) => {
    const express = require('express');
    const app = express();
    const docsDir = path.resolve(options.dir);
    
    app.use(express.static(docsDir));
    
    app.get('/', (req, res) => {
      res.sendFile(path.join(docsDir, 'index.html'));
    });
    
    app.listen(options.port, () => {
      console.log(`🚀 文档服务器启动: http://localhost:${options.port}`);
    });
  });

program.parse();

// 创建默认模板
function createDefaultTemplates(templatesDir: string): void {
  // 组件文档模板
  const componentTemplate = `# {{name}}

{{#if description}}
{{description}}
{{/if}}

{{#if usage}}
## 使用方法

\`\`\`tsx
{{usage}}
\`\`\`
{{/if}}

## Props

{{propsTable}}

{{#if methods}}
## 方法

{{methodsList}}
{{/if}}

{{#if events}}
## 事件

{{eventsList}}
{{/if}}

{{#if examples}}
## 示例

{{examples}}
{{/if}}

{{#if dependencies}}
## 依赖

{{dependencies}}
{{/if}}

{{#if tags}}
## 标签

{{tags}}
{{/if}}

---

- **版本:** {{version}}
- **作者:** {{author}}
- **更新时间:** {{since}}
`;

  // Storybook 模板
  const storybookTemplate = `import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { {{name}} } from '../src/{{name}}';

const meta: Meta<typeof {{name}}> = {
  title: 'Components/{{name}}',
  component: {{name}},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '{{description}}'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    {{#each props}}
    {{name}}: {
      description: '{{description}}',
      control: {{#if type.name === 'boolean'}}'boolean'{{else if type.name === 'string'}}'text'{{else if type.name === 'number'}}'number'{{else}}'object'{{/if}},
      table: {
        type: { summary: '{{type}}' },
        defaultValue: { summary: '{{defaultValue}}' }
      }
    },
    {{/each}}
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

{{#each examples}}
export const {{@key}}: Story = {
  args: {
    // Add default props here
  },
  render: (args) => (
    <{{name}} {...args}>
      {{#if content}}
      {{content}}
      {{/if}}
    </{{name}}>
  )
};
{{/each}}
`;

  // API 参考模板
  const apiTemplate = `# {{name}} API 参考

## 概述

{{description}}

## 类型定义

\`\`\`typescript
interface {{name}}Props {
  {{#each props}}
  {{name}}{{#if required}}{{else}}?{{/if}}: {{type}};
  {{/each}}
}
\`\`\`

## Props 详细说明

{{propsTable}}

## 方法

{{#if methods}}
{{methodsList}}
{{else}}
此组件没有公开方法。
{{/if}}

## 事件

{{#if events}}
{{eventsList}}
{{else}}
此组件没有事件。
{{/if}}

## 使用示例

{{#each examples}}
### {{title}}

\`\`\`tsx
{{code}}
\`\`\`
{{/each}}
`;

  // 总览模板
  const overviewTemplate = `# 组件总览

本项目包含以下组件：

{{#each categories}}
## {{@key}}

{{#each this}}
### [{{name}}]({{filePath}})

{{description}}

**版本:** {{version}} **作者:** {{author}}

{{/each}}

{{/each}}

## 快速开始

\`\`\`bash
npm install
npm run docgen generate
\`\`\`

## 开发

\`\`\`bash
npm run docgen generate --watch
\`\`\`
`;

  // 写入模板文件
  fs.writeFileSync(path.join(templatesDir, 'component.md'), componentTemplate);
  fs.writeFileSync(path.join(templatesDir, 'storybook.stories.tsx'), storybookTemplate);
  fs.writeFileSync(path.join(templatesDir, 'api-reference.md'), apiTemplate);
  fs.writeFileSync(path.join(templatesDir, 'overview.md'), overviewTemplate);
}
```

### 扩展 DocumentGenerator 类

```typescript
// tools/DocumentGeneratorExtensions.ts
import { DocumentGenerator } from './DocumentGenerator';

export class ExtendedDocumentGenerator extends DocumentGenerator {
  private watchMode: boolean = false;
  private watcher: fs.FSWatcher | null = null;
  
  // 启动监视模式
  async startWatchMode(): Promise<void> {
    this.watchMode = true;
    
    const chokidar = require('chokidar');
    
    // 监视源代码目录
    this.watcher = chokidar.watch(this.config.sourceDir, {
      ignored: /node_modules|dist|build|coverage/,
      persistent: true
    });
    
    this.watcher
      .on('change', async (filePath) => {
        if (this.shouldIncludeFile(filePath)) {
          console.log(`📝 检测到文件变更: ${filePath}`);
          await this.generateComponentDocs(filePath);
        }
      })
      .on('add', async (filePath) => {
        if (this.shouldIncludeFile(filePath)) {
          console.log(`📁 检测到新文件: ${filePath}`);
          await this.generateComponentDocs(filePath);
        }
      })
      .on('unlink', async (filePath) => {
        console.log(`🗑️ 检测到文件删除: ${filePath}`);
        await this.removeDocsForFile(filePath);
      });
    
    console.log('👁️  监视模式已启动，按 Ctrl+C 停止');
  }
  
  // 停止监视模式
  stopWatchMode(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.watchMode = false;
    console.log('⏹️  监视模式已停止');
  }
  
  // 删除文档
  private async removeDocsForFile(filePath: string): Promise<void> {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // 删除 Markdown 文档
    const markdownPath = path.join(this.config.outputDir, 'components', `${fileName}.md`);
    if (fs.existsSync(markdownPath)) {
      fs.unlinkSync(markdownPath);
    }
    
    // 删除 Storybook 文件
    const storyPath = path.join(this.config.outputDir, 'stories', `${fileName}.stories.tsx`);
    if (fs.existsSync(storyPath)) {
      fs.unlinkSync(storyPath);
    }
    
    // 删除 API 参考
    const apiPath = path.join(this.config.outputDir, 'api', `${fileName}.md`);
    if (fs.existsSync(apiPath)) {
      fs.unlinkSync(apiPath);
    }
    
    // 重新生成总览和索引
    await this.generateOverview();
    await this.generateIndex();
  }
  
  // 生成 Docusaurus 配置
  async generateDocusaurusConfig(): Promise<void> {
    const config = {
      title: 'React Components Documentation',
      tagline: '高质量 React 组件库',
      url: 'https://your-domain.com',
      baseUrl: '/',
      onBrokenLinks: 'throw',
      onBrokenMarkdownLinks: 'warn',
      favicon: 'img/favicon.ico',
      
      presets: [
        [
          '@docusaurus/preset-classic',
          {
            docs: {
              sidebarPath: require.resolve('./sidebars.js'),
              editUrl: 'https://github.com/your-repo/edit/main/',
            },
            theme: {
              customCss: require.resolve('./src/css/custom.css'),
            },
          },
        ],
      ],
      
      themeConfig: {
        navbar: {
          title: 'My Components',
          logo: {
            alt: 'My Site Logo',
            src: 'img/logo.svg',
          },
          items: [
            {
              type: 'doc',
              docId: 'intro',
              position: 'left',
              label: '文档',
            },
            {
              href: 'https://github.com/your-repo',
              label: 'GitHub',
              position: 'right',
            },
          ],
        },
        footer: {
          style: 'dark',
          links: [
            {
              title: '文档',
              items: [
                {
                  label: '教程',
                  to: '/docs/intro',
                },
              ],
            },
            {
              title: '社区',
              items: [
                {
                  label: 'Stack Overflow',
                  href: 'https://stackoverflow.com/questions/tagged/react',
                },
              ],
            },
            {
              title: '更多',
              items: [
                {
                  label: 'GitHub',
                  href: 'https://github.com/your-repo',
                },
              ],
            },
          ],
          copyright: \`Copyright © \${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.\`,
        },
      },
    };
    
    const configPath = path.join(this.config.outputDir, 'docusaurus.config.js');
    fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(config, null, 2)}`);
  }
  
  // 生成侧边栏配置
  async generateSidebars(): Promise<void> {
    const componentFiles = this.findComponentFiles();
    const components: any[] = [];
    
    for (const filePath of componentFiles) {
      const info = await this.analyzeComponent(filePath);
      if (info) {
        components.push({
          type: 'doc',
          id: \`components/\${info.name}\`,
          label: info.name,
        });
      }
    }
    
    const sidebars = {
      docs: [
        {
          type: 'category',
          label: '组件',
          items: components,
        },
      ],
    };
    
    const sidebarPath = path.join(this.config.outputDir, 'sidebars.js');
    fs.writeFileSync(sidebarPath, \`module.exports = \${JSON.stringify(sidebars, null, 2)}\`);
  }
  
  // 生成 VuePress 配置
  async generateVuePressConfig(): Promise<void> {
    const config = {
      title: 'React Components',
      description: '高质量 React 组件库文档',
      
      head: [
        ['meta', { name: 'theme-color', content: '#3eaf7c' }],
        ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
        ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
      ],
      
      themeConfig: {
        repo: 'your-repo/react-components',
        editLinks: true,
        docsDir: 'docs',
        docsBranch: 'main',
        editLinkText: '帮助我们改善此页面！',
        lastUpdated: '上次更新',
        nav: [
          { text: '指南', link: '/guide/' },
          { text: '组件', link: '/components/' },
          { text: 'API', link: '/api/' },
        ],
      },
    };
    
    const configPath = path.join(this.config.outputDir, '.vuepress/config.js');
    await this.ensureDirectoryExists(path.dirname(configPath));
    fs.writeFileSync(configPath, \`module.exports = \${JSON.stringify(config, null, 2)}\`);
  }
}
```

### 使用示例

```typescript
// 示例：在项目中使用文档生成器
import { DocumentGenerator } from './tools/DocumentGenerator';

const config = {
  sourceDir: './src',
  outputDir: './docs',
  templatesDir: './templates',
  includePatterns: ['*.tsx', '*.jsx'],
  excludePatterns: ['*.test.*', '*.spec.*', '*.stories.*'],
  generateMarkdown: true,
  generateStorybook: true,
  generateTypes: true,
  generateApiDocs: true,
  customTemplates: {
    'custom-component.md': `
# {{name}} - 自定义模板

{{description}}

## 快速开始

\`\`\`tsx
import { {{name}} } from './{{name}}';

function App() {
  return <{{name}} />;
}
\`\`\`
`
  }
};

const generator = new DocumentGenerator(config);

// 生成所有文档
generator.generateAll().then(() => {
  console.log('文档生成完成');
});

// 或者启动监视模式
generator.startWatchMode();
```

### package.json 脚本配置

```json
{
  "scripts": {
    "docgen": "node tools/docgen-cli.js generate",
    "docgen:watch": "node tools/docgen-cli.js generate --watch",
    "docgen:init": "node tools/docgen-cli.js init",
    "docgen:serve": "node tools/docgen-cli.js serve",
    "docs:build": "npm run docgen && docusaurus build",
    "docs:serve": "docusaurus serve"
  }
}
```

## 📋 总结

完整的组件文档自动化生成工具提供了：

1. **自动分析**：通过 TypeScript 和 React Docgen 自动分析组件结构
2. **多格式输出**：支持 Markdown、Storybook、API 参考等多种格式
3. **模板系统**：灵活的模板系统支持自定义输出格式
4. **监视模式**：支持文件变更时自动重新生成文档
5. **扩展性**：支持 Docusaurus、VuePress 等文档框架
6. **命令行工具**：提供完整的 CLI 工具链

这套工具能够帮助团队快速生成和维护高质量的组件文档，提高开发效率和文档质量。

---

*文档版本：1.0.0*  
*最后更新：2024年*