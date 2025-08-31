#!/usr/bin/env node

/**
 * React组件验证规则工具
 * 
 * 提供组件设计和实现的验证规则
 * 确保组件符合最佳实践和质量标准
 * 
 * @author Claude
 * @created 2024-01-01
 * @updated 2024-01-01
 */

const fs = require('fs');
const path = require('path');

// ==================== 验证规则定义 ====================

const VALIDATION_RULES = {
  // 命名规则
  naming: {
    componentName: {
      pattern: /^[A-Z][a-zA-Z0-9]*$/,
      message: '组件名称必须使用PascalCase格式',
      examples: ['Button', 'DataTable', 'UserProfile']
    },
    fileName: {
      pattern: /^[a-z][a-z0-9-]*$/,
      message: '文件名必须使用kebab-case格式',
      examples: ['button', 'data-table', 'user-profile']
    },
    propName: {
      pattern: /^[a-z][a-zA-Z0-9]*$/,
      message: 'Props名称必须使用camelCase格式',
      examples: ['onClick', 'dataItems', 'isLoading']
    },
    eventName: {
      pattern: /^on[A-Z][a-zA-Z0-9]*$/,
      message: '事件名称必须以on开头，使用camelCase格式',
      examples: ['onClick', 'onSubmit', 'onDataChange']
    },
    typeName: {
      pattern: /^[A-Z][a-zA-Z0-9]*$/,
      message: '类型名称必须使用PascalCase格式',
      examples: ['ButtonProps', 'DataItem', 'ThemeConfig']
    }
  },

  // TypeScript规则
  typescript: {
    // Props接口必须以Props结尾
    propsInterface: {
      pattern: /Props$/,
      message: 'Props接口必须以Props结尾',
      examples: ['ButtonProps', 'FormProps', 'DataTableProps']
    },
    // 避免使用any类型
    noAnyType: {
      pattern: /: any\b/,
      message: '避免使用any类型，请使用具体的类型定义',
      severity: 'error'
    },
    // 必须为组件Props定义接口
    propsInterfaceRequired: {
      check: (content, componentName) => {
        return content.includes(`interface ${componentName}Props`) || 
               content.includes(`type ${componentName}Props`);
      },
      message: '必须为组件Props定义接口或类型'
    },
    // 必须为子组件定义类型
    childrenType: {
      pattern: /children\s*:\s*React\.Node/,
      message: 'children属性必须使用React.Node类型'
    }
  },

  // React Hooks规则
  hooks: {
    // 必须在顶层调用Hooks
    hooksAtTopLevel: {
      check: (content) => {
        const hookCalls = content.match(/use[A-Z][a-zA-Z0-9]*\s*\(/g) || [];
        const lines = content.split('\n');
        
        for (const call of hookCalls) {
          const lineIndex = lines.findIndex(line => line.includes(call));
          if (lineIndex !== -1) {
            const line = lines[lineIndex];
            // 检查是否在条件语句、循环或嵌套函数中
            if (line.includes('if') || line.includes('for') || line.includes('while') || 
                line.includes('function') || line.includes('return')) {
              return false;
            }
          }
        }
        return true;
      },
      message: 'Hooks必须在组件顶层调用，不能在条件语句、循环或嵌套函数中调用'
    },
    // useEffect必须有依赖数组
    useEffectDeps: {
      pattern: /useEffect\([^,]+,\s*\[[^\]]*\]\)/,
      message: 'useEffect必须有依赖数组'
    },
    // useCallback必须有依赖数组
    useCallbackDeps: {
      pattern: /useCallback\([^,]+,\s*\[[^\]]*\]\)/,
      message: 'useCallback必须有依赖数组'
    },
    // useMemo必须有依赖数组
    useMemoDeps: {
      pattern: /useMemo\([^,]+,\s*\[[^\]]*\]\)/,
      message: 'useMemo必须有依赖数组'
    }
  },

  // 性能优化规则
  performance: {
    // 复杂组件必须使用React.memo
    useMemo: {
      check: (content) => {
        const lines = content.split('\n');
        const hasComplexLogic = lines.some(line => 
          line.includes('.map(') || 
          line.includes('.filter(') || 
          line.includes('.reduce(') ||
          line.length > 100
        );
        
        if (hasComplexLogic) {
          return content.includes('React.memo');
        }
        return true;
      },
      message: '包含复杂逻辑的组件应该使用React.memo优化'
    },
    // 大数组操作必须使用useMemo
    useMemoForArrays: {
      check: (content) => {
        const hasArrayOperations = content.match(/\.(map|filter|reduce|sort)\(/g);
        if (hasArrayOperations && hasArrayOperations.length > 2) {
          return content.includes('useMemo');
        }
        return true;
      },
      message: '多次数组操作应该使用useMemo优化'
    },
    // 事件处理函数必须使用useCallback
    useCallbackForEvents: {
      check: (content) => {
        const hasEventHandlers = content.match(/on[A-Z][a-zA-Z0-9]*\s*=/g);
        if (hasEventHandlers) {
          return content.includes('useCallback');
        }
        return true;
      },
      message: '事件处理函数应该使用useCallback优化'
    }
  },

  // 可访问性规则
  accessibility: {
    // 按钮必须有类型
    buttonType: {
      pattern: /type\s*=\s*['"]button['"]/,
      message: '按钮元素必须指定type属性',
      check: (content) => {
        if (content.includes('<button')) {
          return content.includes('type=');
        }
        return true;
      }
    },
    // 图片必须有alt属性
    imgAlt: {
      pattern: /<img[^>]*alt=/,
      message: '图片元素必须有alt属性',
      check: (content) => {
        if (content.includes('<img')) {
          return content.includes('alt=');
        }
        return true;
      }
    },
    // 输入框必须有label
    inputLabel: {
      check: (content) => {
        if (content.includes('<input')) {
          return content.includes('htmlFor=') || content.includes('aria-label=');
        }
        return true;
      },
      message: '输入框元素必须有对应的label或aria-label属性'
    },
    // ARIA属性使用
    ariaAttributes: {
      check: (content) => {
        const ariaPattern = /aria-[a-z-]+=/;
        return ariaPattern.test(content);
      },
      message: '动态内容应该使用适当的ARIA属性',
      severity: 'warning'
    }
  },

  // 代码结构规则
  structure: {
    // 文件必须有导出
    hasExport: {
      pattern: /export\s+(const|function|class|default)/,
      message: '文件必须有导出语句'
    },
    // 组件函数必须使用React.FC
    reactFC: {
      pattern: /React\.FC|React\.FunctionComponent/,
      message: '组件函数应该使用React.FC类型'
    },
    // 必须有导入React
    importReact: {
      pattern: /import\s+React/,
      message: '必须导入React'
    },
    // 文件长度限制
    fileLength: {
      check: (content) => {
        const lines = content.split('\n');
        return lines.length <= 500;
      },
      message: '文件长度不应超过500行',
      severity: 'warning'
    },
    // 函数长度限制
    functionLength: {
      check: (content) => {
        const functions = content.match(/function\s+\w+[^{]*\{[\s\S]*?\}/g) || [];
        return functions.every(func => {
          const lines = func.split('\n');
          return lines.length <= 50;
        });
      },
      message: '函数长度不应超过50行',
      severity: 'warning'
    }
  },

  // 安全规则
  security: {
    // 防止XSS攻击
    xssPrevention: {
      pattern: /dangerouslySetInnerHTML/,
      message: '避免使用dangerouslySetInnerHTML，存在XSS风险',
      severity: 'error'
    },
    // 输入验证
    inputValidation: {
      check: (content) => {
        const hasUserInput = content.includes('onChange') || content.includes('onSubmit');
        if (hasUserInput) {
          return content.includes('validation') || content.includes('validate');
        }
        return true;
      },
      message: '处理用户输入时应该进行验证',
      severity: 'warning'
    }
  },

  // 测试规则
  testing: {
    // 测试文件必须存在
    testFileExists: {
      check: (filePath) => {
        const testPath = filePath.replace(/\.tsx?$/, '.test.tsx');
        return fs.existsSync(testPath);
      },
      message: '组件必须有对应的测试文件'
    },
    // 测试覆盖率要求
    testCoverage: {
      check: (content) => {
        const hasDescribe = content.includes('describe(');
        const hasIt = content.includes('it(');
        const hasExpect = content.includes('expect(');
        
        return hasDescribe && hasIt && hasExpect;
      },
      message: '测试文件必须包含describe、it和expect'
    }
  }
};

// ==================== 验证函数 ====================

/**
 * 验证单个规则
 */
function validateRule(content, rule, filePath) {
  const result = {
    rule: rule.name,
    passed: true,
    message: '',
    severity: rule.severity || 'error'
  };

  try {
    if (rule.pattern) {
      if (rule.pattern.test) {
        result.passed = rule.pattern.test(content);
      } else {
        result.passed = new RegExp(rule.pattern).test(content);
      }
    } else if (rule.check) {
      result.passed = rule.check(content, filePath);
    }

    if (!result.passed) {
      result.message = rule.message;
    }
  } catch (error) {
    result.passed = false;
    result.message = `验证规则执行错误: ${error.message}`;
  }

  return result;
}

/**
 * 验证文件
 */
function validateFile(filePath, rules) {
  if (!fs.existsSync(filePath)) {
    return [{
      rule: 'file_exists',
      passed: false,
      message: '文件不存在',
      severity: 'error'
    }];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const results = [];

  Object.entries(rules).forEach(([category, categoryRules]) => {
    Object.entries(categoryRules).forEach(([ruleName, rule]) => {
      const ruleWithMeta = { ...rule, name: `${category}.${ruleName}` };
      const result = validateRule(content, ruleWithMeta, filePath);
      results.push(result);
    });
  });

  return results;
}

/**
 * 验证组件目录
 */
function validateComponent(componentPath) {
  const results = [];
  
  // 验证主组件文件
  const componentFiles = fs.readdirSync(componentPath);
  const mainComponentFile = componentFiles.find(file => 
    file.endsWith('.tsx') && !file.includes('.test.') && !file.includes('.types.')
  );

  if (mainComponentFile) {
    const mainFilePath = path.join(componentPath, mainComponentFile);
    const mainResults = validateFile(mainFilePath, VALIDATION_RULES);
    results.push(...mainResults);
  }

  // 验证测试文件
  const testFile = componentFiles.find(file => file.includes('.test.'));
  if (testFile) {
    const testPath = path.join(componentPath, testFile);
    const testResults = validateFile(testPath, {
      testing: VALIDATION_RULES.testing
    });
    results.push(...testResults);
  }

  return results;
}

/**
 * 格式化验证结果
 */
function formatResults(results) {
  const errors = results.filter(r => r.severity === 'error' && !r.passed);
  const warnings = results.filter(r => r.severity === 'warning' && !r.passed);
  const passed = results.filter(r => r.passed);

  return {
    summary: {
      total: results.length,
      passed: passed.length,
      errors: errors.length,
      warnings: warnings.length,
      score: Math.round((passed.length / results.length) * 100)
    },
    errors,
    warnings,
    passed
  };
}

/**
 * 生成验证报告
 */
function generateReport(results, componentPath) {
  const formatted = formatResults(results);
  
  let report = `🔍 组件验证报告\n`;
  report += `==================\n\n`;
  report += `📁 组件路径: ${componentPath}\n`;
  report += `📊 验证结果: ${formatted.summary.score}% (${formatted.summary.passed}/${formatted.summary.total})\n\n`;

  if (formatted.errors.length > 0) {
    report += `❌ 错误 (${formatted.errors.length}):\n`;
    formatted.errors.forEach(error => {
      report += `  - ${error.rule}: ${error.message}\n`;
    });
    report += `\n`;
  }

  if (formatted.warnings.length > 0) {
    report += `⚠️  警告 (${formatted.warnings.length}):\n`;
    formatted.warnings.forEach(warning => {
      report += `  - ${warning.rule}: ${warning.message}\n`;
    });
    report += `\n`;
  }

  if (formatted.summary.score === 100) {
    report += `🎉 所有验证规则都通过了！\n`;
  } else if (formatted.summary.score >= 80) {
    report += `✅ 验证通过，但有一些需要改进的地方\n`;
  } else {
    report += `🔧 需要修复错误和警告才能通过验证\n`;
  }

  return report;
}

// ==================== 命令行接口 ====================

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
🔍 React组件验证工具

使用方法:
  node tools/validation-rules.js <command> [options]

命令:
  validate <path>     验证组件目录
  check <file>        检查单个文件
  list-rules          列出所有验证规则
  report <path>       生成验证报告

选项:
  -h, --help          显示帮助信息
  -v, --verbose       详细输出
  --json              JSON格式输出

示例:
  node tools/validation-rules.js validate src/components/Button
  node tools/validation-rules.js check src/components/Button/Button.tsx
  node tools/validation-rules.js report src/components/Button
  node tools/validation-rules.js list-rules
`);
}

/**
 * 列出所有验证规则
 */
function listRules() {
  console.log('📋 验证规则列表:');
  console.log('=================');
  
  Object.entries(VALIDATION_RULES).forEach(([category, rules]) => {
    console.log(`\n${category.toUpperCase()}:`);
    Object.entries(rules).forEach(([ruleName, rule]) => {
      const severity = rule.severity || 'error';
      const severityIcon = severity === 'error' ? '❌' : '⚠️';
      console.log(`  ${severityIcon} ${ruleName}: ${rule.message}`);
    });
  });
}

// ==================== 主函数 ====================

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  const command = args[0];
  const target = args[1];
  const verbose = args.includes('-v') || args.includes('--verbose');
  const jsonOutput = args.includes('--json');

  try {
    switch (command) {
      case 'validate':
        if (!target) {
          console.error('❌ 请指定要验证的组件路径');
          process.exit(1);
        }
        const results = validateComponent(target);
        if (jsonOutput) {
          console.log(JSON.stringify(formatResults(results), null, 2));
        } else {
          console.log(generateReport(results, target));
        }
        break;

      case 'check':
        if (!target) {
          console.error('❌ 请指定要检查的文件路径');
          process.exit(1);
        }
        const fileResults = validateFile(target, VALIDATION_RULES);
        if (jsonOutput) {
          console.log(JSON.stringify(formatResults(fileResults), null, 2));
        } else {
          console.log(generateReport(fileResults, target));
        }
        break;

      case 'list-rules':
        listRules();
        break;

      case 'report':
        if (!target) {
          console.error('❌ 请指定要生成报告的组件路径');
          process.exit(1);
        }
        const reportResults = validateComponent(target);
        const report = generateReport(reportResults, target);
        console.log(report);
        
        // 保存报告到文件
        const reportPath = path.join(target, 'validation-report.md');
        fs.writeFileSync(reportPath, report);
        console.log(`\n📄 报告已保存到: ${reportPath}`);
        break;

      default:
        console.error(`❌ 未知命令: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ 验证过程中出错:', error.message);
    if (verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// ==================== 导出模块 ====================

module.exports = {
  validateFile,
  validateComponent,
  formatResults,
  generateReport,
  VALIDATION_RULES
};

// ==================== 启动 ====================

if (require.main === module) {
  main();
}