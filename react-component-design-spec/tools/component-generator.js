#!/usr/bin/env node

/**
 * React组件生成器
 * 
 * 基于模板快速生成符合规范的React组件
 * 支持多种组件类型和配置选项
 * 
 * @author Claude
 * @created 2024-01-01
 * @updated 2024-01-01
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ==================== 配置常量 ====================

const COMPONENT_TYPES = {
  basic: '基础组件',
  form: '表单组件',
  complex: '复杂组件',
  container: '容器组件',
  layout: '布局组件',
};

const TEMPLATES = {
  basic: 'component-template.tsx',
  test: 'component-test-template.tsx',
  types: 'component-types-template.ts',
};

const DEFAULT_CONFIG = {
  outputDir: 'src/components',
  testDir: 'src/tests/components',
  typesDir: 'src/types',
  createTest: true,
  createTypes: true,
  useTypescript: true,
  useStyledComponents: false,
  useTailwind: true,
  includeExamples: false,
};

// ==================== 工具函数 ====================

/**
 * 创建目录
 */
function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ 创建目录: ${dirPath}`);
  }
}

/**
 * 读取模板文件
 */
function readTemplate(templateName) {
  const templatePath = path.join(__dirname, '..', 'templates', templateName);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`模板文件不存在: ${templatePath}`);
  }
  return fs.readFileSync(templatePath, 'utf8');
}

/**
 * 替换模板占位符
 */
function replaceTemplatePlaceholders(template, config) {
  return template
    .replace(/\[ComponentName\]/g, config.componentName)
    .replace(/\[组件名称\]/g, config.componentNameZh || config.componentName)
    .replace(/\[开发者名称\]/g, config.author || 'Developer')
    .replace(/\[创建日期\]/g, new Date().toISOString().split('T')[0])
    .replace(/\[更新日期\]/g, new Date().toISOString().split('T')[0])
    .replace(/\/component-name/g, config.componentName.toLowerCase())
    .replace(/\[component-name\]/g, config.componentName.toLowerCase())
    .replace(/\[SubComponentName\]/g, config.componentName + 'Item')
    .replace(/\[子组件名称\]/g, (config.componentNameZh || config.componentName) + '子项');
}

/**
 * 写入文件
 */
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ 创建文件: ${filePath}`);
}

/**
 * 格式化文件名
 */
function formatFileName(name) {
  return name
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

/**
 * 转换为PascalCase
 */
function toPascalCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      index === 0 ? word.toUpperCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '');
}

/**
 * 转换为kebab-case
 */
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

// ==================== 用户交互 ====================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * 询问用户输入
 */
function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

/**
 * 选择选项
 */
function askChoice(question, choices) {
  return new Promise((resolve) => {
    console.log(question);
    choices.forEach((choice, index) => {
      console.log(`${index + 1}. ${choice}`);
    });
    
    rl.question('请选择 (输入数字): ', (answer) => {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < choices.length) {
        resolve(choices[index]);
      } else {
        console.log('无效选择，请重新输入');
        return askChoice(question, choices);
      }
    });
  });
}

/**
 * 确认操作
 */
function askConfirm(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// ==================== 主要功能 ====================

/**
 * 收集用户配置
 */
async function collectConfig() {
  console.log('🚀 React组件生成器');
  console.log('==================');
  console.log('');
  
  const config = { ...DEFAULT_CONFIG };
  
  // 基本信息
  config.componentName = await askQuestion('组件名称 (英文，PascalCase)', 'MyComponent');
  config.componentName = toPascalCase(config.componentName);
  
  config.componentNameZh = await askQuestion('组件中文名称', config.componentName);
  
  config.description = await askQuestion('组件描述', `${config.componentNameZh}组件`);
  
  // 组件类型
  const componentType = await askChoice(
    '选择组件类型',
    Object.values(COMPONENT_TYPES)
  );
  config.componentType = Object.keys(COMPONENT_TYPES).find(
    key => COMPONENT_TYPES[key] === componentType
  );
  
  // 输出目录
  config.outputDir = await askQuestion('组件输出目录', config.outputDir);
  
  // 文件配置
  config.createTest = await askConfirm('是否创建测试文件？');
  config.createTypes = await askConfirm('是否创建类型定义文件？');
  config.includeExamples = await askConfirm('是否包含示例代码？');
  
  // 技术栈
  config.useTypescript = await askConfirm('使用TypeScript？');
  config.useStyledComponents = await askConfirm('使用Styled Components？');
  config.useTailwind = await askConfirm('使用Tailwind CSS？');
  
  // 作者信息
  config.author = await askQuestion('作者姓名', 'Developer');
  
  // 显示配置摘要
  console.log('');
  console.log('📋 配置摘要:');
  console.log(`组件名称: ${config.componentName}`);
  console.log(`组件类型: ${componentType}`);
  console.log(`输出目录: ${config.outputDir}`);
  console.log(`创建测试: ${config.createTest ? '是' : '否'}`);
  console.log(`创建类型: ${config.createTypes ? '是' : '否'}`);
  console.log(`TypeScript: ${config.useTypescript ? '是' : '否'}`);
  console.log(`Tailwind CSS: ${config.useTailwind ? '是' : '否'}`);
  console.log('');
  
  const confirm = await askConfirm('确认生成组件？');
  if (!confirm) {
    console.log('❌ 操作已取消');
    rl.close();
    process.exit(0);
  }
  
  return config;
}

/**
 * 生成组件文件
 */
function generateComponent(config) {
  const { componentName, outputDir, useTypescript } = config;
  const fileName = formatFileName(componentName);
  const fileExt = useTypescript ? 'tsx' : 'jsx';
  const componentDir = path.join(outputDir, fileName);
  
  // 创建组件目录
  createDirectory(componentDir);
  
  // 生成主组件文件
  const templateContent = readTemplate(TEMPLATES.basic);
  const componentContent = replaceTemplatePlaceholders(templateContent, config);
  const componentFilePath = path.join(componentDir, `${componentName}.${fileExt}`);
  writeFile(componentFilePath, componentContent);
  
  // 生成测试文件
  if (config.createTest) {
    const testTemplate = readTemplate(TEMPLATES.test);
    const testContent = replaceTemplatePlaceholders(testTemplate, config);
    const testFileName = `${componentName}.test.${fileExt}`;
    const testFilePath = path.join(componentDir, testFileName);
    writeFile(testFilePath, testContent);
  }
  
  // 生成类型定义文件
  if (config.createTypes && useTypescript) {
    const typesTemplate = readTemplate(TEMPLATES.types);
    const typesContent = replaceTemplatePlaceholders(typesTemplate, config);
    const typesFileName = `${componentName}.types.ts`;
    const typesFilePath = path.join(componentDir, typesFileName);
    writeFile(typesFilePath, typesContent);
  }
  
  // 生成样式文件
  if (config.useStyledComponents) {
    const stylesContent = generateStyledComponentsStyles(config);
    const stylesFilePath = path.join(componentDir, `${componentName}.styles.ts`);
    writeFile(stylesFilePath, stylesContent);
  }
  
  // 生成CSS模块文件
  if (!config.useStyledComponents && !config.useTailwind) {
    const cssContent = generateCSSModuleStyles(config);
    const cssFilePath = path.join(componentDir, `${componentName}.module.css`);
    writeFile(cssFilePath, cssContent);
  }
  
  // 生成索引文件
  const indexContent = generateIndexFile(config);
  const indexFilePath = path.join(componentDir, 'index.ts');
  writeFile(indexFilePath, indexContent);
  
  console.log('');
  console.log('✅ 组件生成完成!');
  console.log(`📁 组件位置: ${componentDir}`);
}

/**
 * 生成Styled Components样式
 */
function generateStyledComponentsStyles(config) {
  return `import styled from 'styled-components';

export const Styled${config.componentName} = styled.div\`
  /* 在这里添加样式 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border-radius: 0.5rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
\`;
`;
}

/**
 * 生成CSS模块样式
 */
function generateCSSModuleStyles(config) {
  const kebabName = toKebabCase(config.componentName);
  return `.${kebabName} {
  /* 在这里添加样式 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border-radius: 0.5rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.${kebabName}--variant-primary {
  background: #3b82f6;
  color: white;
}

.${kebabName}--variant-secondary {
  background: #6b7280;
  color: white;
}
`;
}

/**
 * 生成索引文件
 */
function generateIndexFile(config) {
  const { componentName, useTypescript, createTypes } = config;
  const fileExt = useTypescript ? 'ts' : 'js';
  
  let content = `export { ${componentName} } from './${componentName}';\n`;
  
  if (createTypes && useTypescript) {
    content += `export type { ${componentName}Props } from './${componentName}';\n`;
  }
  
  content += `\nexport default ${componentName};\n`;
  
  return content;
}

/**
 * 生成示例代码
 */
function generateExampleCode(config) {
  const { componentName, componentType } = config;
  
  const examples = {
    basic: `import { ${componentName} } from './${componentName}';

function Example() {
  return (
    <div>
      <${componentName}>
        Hello World
      </${componentName}>
    </div>
  );
}`,
    
    form: `import { ${componentName} } from './${componentName}';

function Example() {
  const handleSubmit = (values) => {
    console.log('Form submitted:', values);
  };
  
  return (
    <${componentName} onSubmit={handleSubmit}>
      {/* 表单字段 */}
    </${componentName}>
  );
}`,
    
    complex: `import { ${componentName} } from './${componentName}';

function Example() {
  const data = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
  ];
  
  return (
    <${componentName} data={data}>
      {/* 子组件 */}
    </${componentName}>
  );
}`,
  };
  
  return examples[componentType] || examples.basic;
}

/**
 * 生成package.json脚本
 */
function generatePackageScript() {
  return `{
  "scripts": {
    "generate:component": "node tools/component-generator.js"
  }
}`;
}

// ==================== 主函数 ====================

/**
 * 主函数
 */
async function main() {
  try {
    const config = await collectConfig();
    generateComponent(config);
    
    // 生成示例代码
    if (config.includeExamples) {
      const exampleCode = generateExampleCode(config);
      const exampleFilePath = path.join(config.outputDir, formatFileName(config.componentName), 'example.tsx');
      writeFile(exampleFilePath, exampleCode);
      console.log('✅ 示例代码已生成');
    }
    
    console.log('');
    console.log('🎉 组件创建成功!');
    console.log('');
    console.log('📝 使用方法:');
    console.log(\`import { ${config.componentName} } from '${config.outputDir}/${formatFileName(config.componentName)}';\`);
    console.log('');
    
  } catch (error) {
    console.error('❌ 生成组件时出错:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
🚀 React组件生成器

使用方法:
  node tools/component-generator.js

选项:
  -h, --help     显示帮助信息
  -i, --interactive  交互式模式（默认）
  -c, --config <file>  使用配置文件

示例:
  node tools/component-generator.js              # 交互式模式
  node tools/component-generator.js -c config.json  # 使用配置文件

支持的组件类型:
  - basic: 基础组件
  - form: 表单组件
  - complex: 复杂组件
  - container: 容器组件
  - layout: 布局组件
`);
}

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }
  
  if (args.includes('-i') || args.includes('--interactive')) {
    return { mode: 'interactive' };
  }
  
  if (args.includes('-c') || args.includes('--config')) {
    const configIndex = args.findIndex(arg => arg === '-c' || arg === '--config');
    const configFile = args[configIndex + 1];
    return { mode: 'config', configFile };
  }
  
  return { mode: 'interactive' };
}

// ==================== 启动 ====================

if (require.main === module) {
  const args = parseArgs();
  
  if (args.mode === 'interactive') {
    main();
  } else if (args.mode === 'config') {
    console.log('🚧 配置文件模式尚未实现');
    process.exit(1);
  }
}

module.exports = {
  generateComponent,
  collectConfig,
  showHelp,
};