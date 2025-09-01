# React组件调试指南

> 专为开发者和AI大模型设计的完整调试解决方案

## 📋 概述

本指南提供了React组件开发的完整调试工具和方法，帮助开发者和AI大模型快速定位和解决各种问题。包含了从基础调试到高级性能优化的全方位调试策略。

## 🎯 调试工具栈

### 核心调试工具
- **React Developer Tools** - 组件状态和props检查
- **浏览器开发者工具** - 网络请求、性能分析
- **VS Code Debugger** - 代码断点调试
- **Console调试** - 日志输出和错误追踪
- **测试框架调试** - Jest、Playwright调试模式

### AI辅助调试工具
- **错误诊断助手** - 自动分析错误信息
- **性能分析器** - AI驱动的性能瓶颈识别
- **代码质量检查** - 智能代码问题检测
- **日志分析器** - 自动分析日志模式

## 🛠️ 快速调试流程

### 1. 问题识别阶段

```bash
# 第一步：运行快速诊断
npm run debug:quick

# 第二步：检查常见问题
npm run debug:common

# 第三步：生成调试报告
npm run debug:report
```

### 2. 问题分类诊断

```javascript
// 使用调试助手进行问题分类
const debugHelper = require('@/utils/debug-helper');

// 自动诊断问题类型
const diagnosis = await debugHelper.diagnose({
  symptoms: ['组件渲染缓慢', '内存占用高'],
  environment: 'development',
  component: 'UserProfile'
});

console.log(diagnosis.recommendations);
```

## 🔧 基础调试工具

### 控制台调试工具

```javascript
// utils/console-debug.js
export const consoleDebug = {
  // 组件生命周期调试
  lifecycle: {
    mount: (componentName) => {
      console.log(`🚀 [MOUNT] ${componentName} 组件已挂载`);
      console.time(`⏱️ ${componentName} 渲染时间`);
    },
    
    update: (componentName, props) => {
      console.log(`🔄 [UPDATE] ${componentName} 组件更新`);
      console.log('📦 Props变化:', props);
    },
    
    unmount: (componentName) => {
      console.timeEnd(`⏱️ ${componentName} 渲染时间`);
      console.log(`👋 [UNMOUNT] ${componentName} 组件已卸载`);
    }
  },
  
  // 状态调试
  state: {
    change: (componentName, stateKey, oldValue, newValue) => {
      console.log(`📊 [STATE] ${componentName}.${stateKey}:`, oldValue, '→', newValue);
    },
    
    effect: (componentName, effectKey, dependencies) => {
      console.log(`⚡ [EFFECT] ${componentName}.${effectKey} 触发`);
      console.log('🔗 依赖:', dependencies);
    }
  },
  
  // 性能调试
  performance: {
    start: (label) => {
      console.time(`⚡ ${label}`);
      console.log(`🏁 [START] ${label}`);
    },
    
    end: (label) => {
      console.timeEnd(`⚡ ${label}`);
      console.log(`🏁 [END] ${label}`);
    },
    
    memory: () => {
      const usage = process.memoryUsage();
      console.log('🧠 [MEMORY] 使用情况:', {
        rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`
      });
    }
  },
  
  // 网络调试
  network: {
    request: (url, options) => {
      console.log(`🌐 [REQUEST] ${url}`, options);
    },
    
    response: (url, response, duration) => {
      console.log(`📥 [RESPONSE] ${url} (${duration}ms)`, response);
    },
    
    error: (url, error) => {
      console.error(`❌ [NETWORK ERROR] ${url}:`, error);
    }
  }
};
```

### 组件调试装饰器

```javascript
// utils/debug-decorator.js
export const withDebug = (Component, debugOptions = {}) => {
  const {
    logLifecycle = false,
    logProps = false,
    logState = false,
    logPerformance = false
  } = debugOptions;

  return function DebugComponent(props) {
    const componentRef = useRef(null);
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());

    // 生命周期调试
    useEffect(() => {
      if (logLifecycle) {
        consoleDebug.lifecycle.mount(Component.name || 'Anonymous');
      }
      
      return () => {
        if (logLifecycle) {
          consoleDebug.lifecycle.unmount(Component.name || 'Anonymous');
        }
      };
    }, []);

    // Props变化调试
    useEffect(() => {
      if (logProps && componentRef.current) {
        consoleDebug.lifecycle.update(Component.name || 'Anonymous', props);
      }
      componentRef.current = props;
    }, [props]);

    // 性能调试
    if (logPerformance) {
      renderCount.current += 1;
      const currentTime = Date.now();
      const renderTime = currentTime - lastRenderTime.current;
      
      if (renderTime > 16) { // 超过60fps阈值
        console.warn(`⚠️ [PERFORMANCE] ${Component.name} 渲染时间过长: ${renderTime}ms`);
      }
      
      if (renderCount.current > 10) { // 频繁渲染警告
        console.warn(`⚠️ [PERFORMANCE] ${Component.name} 渲染次数过多: ${renderCount.current}`);
      }
      
      lastRenderTime.current = currentTime;
    }

    return <Component {...props} ref={componentRef} />;
  };
};
```

## 🤖 AI调试助手

### 智能错误诊断

```javascript
// utils/ai-debug-assistant.js
export class AIDebugAssistant {
  constructor() {
    this.errorPatterns = this.loadErrorPatterns();
    this.solutionDatabase = this.loadSolutions();
  }

  // 诊断错误
  async diagnoseError(error, context = {}) {
    const errorInfo = this.analyzeError(error);
    const patterns = this.matchErrorPatterns(errorInfo);
    const solutions = this.findSolutions(patterns);
    
    return {
      errorType: errorInfo.type,
      severity: errorInfo.severity,
      possibleCauses: patterns.map(p => p.cause),
      recommendedSolutions: solutions,
      codeExamples: this.generateCodeExamples(solutions),
      preventionTips: this.generatePreventionTips(errorInfo)
    };
  }

  // 分析错误信息
  analyzeError(error) {
    const errorStack = error.stack || '';
    const errorMessage = error.message || '';
    
    return {
      type: this.categorizeError(errorMessage),
      severity: this.assessSeverity(errorMessage),
      location: this.extractLocation(errorStack),
      timestamp: new Date().toISOString(),
      environment: this.getEnvironment(),
      component: this.extractComponent(errorStack)
    };
  }

  // 错误分类
  categorizeError(message) {
    const patterns = {
      'TypeError': 'type_error',
      'ReferenceError': 'reference_error',
      'SyntaxError': 'syntax_error',
      'Network Error': 'network_error',
      'Render Error': 'render_error',
      'Hook Error': 'hook_error',
      'State Error': 'state_error',
      'Props Error': 'props_error'
    };

    for (const [pattern, type] of Object.entries(patterns)) {
      if (message.includes(pattern)) {
        return type;
      }
    }
    
    return 'unknown_error';
  }

  // 评估严重程度
  assessSeverity(message) {
    const criticalPatterns = [
      'Maximum call stack size exceeded',
      'Cannot read property of null',
      'Cannot read property of undefined',
      'Network Error',
      'Failed to fetch'
    ];

    const warningPatterns = [
      'deprecated',
      'warning',
      'slow',
      'performance'
    ];

    if (criticalPatterns.some(pattern => message.includes(pattern))) {
      return 'critical';
    }

    if (warningPatterns.some(pattern => message.includes(pattern))) {
      return 'warning';
    }

    return 'normal';
  }

  // 匹配错误模式
  matchErrorPatterns(errorInfo) {
    return this.errorPatterns.filter(pattern => {
      return pattern.conditions.some(condition => {
        switch (condition.type) {
          case 'error_type':
            return condition.value === errorInfo.type;
          case 'severity':
            return condition.value === errorInfo.severity;
          case 'component':
            return condition.value === errorInfo.component;
          case 'environment':
            return condition.value === errorInfo.environment;
          case 'message_contains':
            return errorInfo.errorMessage?.includes(condition.value);
          default:
            return false;
        }
      });
    });
  }

  // 查找解决方案
  findSolutions(patterns) {
    const solutions = [];
    
    patterns.forEach(pattern => {
      pattern.solutions.forEach(solutionId => {
        const solution = this.solutionDatabase[solutionId];
        if (solution) {
          solutions.push(solution);
        }
      });
    });

    // 去重和排序
    return Array.from(new Set(solutions))
      .sort((a, b) => b.priority - a.priority);
  }

  // 生成代码示例
  generateCodeExamples(solutions) {
    return solutions.map(solution => ({
      title: solution.title,
      code: solution.codeExample,
      explanation: solution.explanation
    }));
  }

  // 生成预防建议
  generatePreventionTips(errorInfo) {
    const tips = [];
    
    // 基于错误类型的预防建议
    switch (errorInfo.type) {
      case 'type_error':
        tips.push('使用TypeScript进行类型检查');
        tips.push('添加PropTypes验证');
        break;
      case 'render_error':
        tips.push('使用ErrorBoundary捕获渲染错误');
        tips.push('添加组件key属性');
        break;
      case 'network_error':
        tips.push('添加网络请求重试机制');
        tips.push('实现优雅的错误处理');
        break;
      case 'hook_error':
        tips.push('遵循Hook规则');
        tips.push('使用ESLint检查Hook使用');
        break;
    }

    return tips;
  }

  // 获取环境信息
  getEnvironment() {
    return {
      browser: typeof window !== 'undefined' ? navigator.userAgent : 'Node.js',
      reactVersion: React.version,
      nodeVersion: process.version,
      timestamp: Date.now()
    };
  }

  // 加载错误模式
  loadErrorPatterns() {
    return [
      {
        id: 'hook_rules_violation',
        name: 'Hook规则违反',
        conditions: [
          { type: 'error_type', value: 'hook_error' },
          { type: 'message_contains', value: 'Hook rules' }
        ],
        solutions: ['hook_rules_fix', 'eslint_setup']
      },
      {
        id: 'state_update_error',
        name: '状态更新错误',
        conditions: [
          { type: 'error_type', value: 'state_error' },
          { type: 'message_contains', value: 'state update' }
        ],
        solutions: ['state_update_fix', 'use_callback_optimization']
      },
      {
        id: 'network_error',
        name: '网络错误',
        conditions: [
          { type: 'error_type', value: 'network_error' }
        ],
        solutions: ['network_retry', 'error_boundary', 'loading_states']
      }
    ];
  }

  // 加载解决方案数据库
  loadSolutions() {
    return {
      hook_rules_fix: {
        title: '修复Hook规则违反',
        codeExample: `// 错误示例
function BadComponent() {
  if (condition) {
    const [state, setState] = useState(false); // ❌ 条件中使用Hook
  }
}

// 正确示例
function GoodComponent() {
  const [state, setState] = useState(false); // ✅ 顶层使用Hook
  
  if (condition) {
    // 使用state
  }
}`,
        explanation: 'React Hooks必须在组件的顶层调用，不能在条件语句、循环或嵌套函数中使用。',
        priority: 9
      },
      state_update_fix: {
        title: '修复状态更新问题',
        codeExample: `// 错误示例
function BadComponent() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1); // ❌ 两次更新可能基于相同的state
  }
}

// 正确示例
function GoodComponent() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setCount(prevCount => prevCount + 1); // ✅ 使用函数式更新
    setCount(prevCount => prevCount + 1);
  }
}`,
        explanation: '使用函数式更新确保基于最新的状态进行更新，避免异步更新导致的问题。',
        priority: 8
      },
      network_retry: {
        title: '网络请求重试机制',
        codeExample: `const useFetchWithRetry = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const fetchData = async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await fetch(url, options);
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      if (retryCount < 3) {
        setTimeout(() => fetchData(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [url]);
  
  return { data, error, loading, refetch: () => fetchData() };
};`,
        explanation: '实现网络请求的重试机制，提高应用的稳定性和用户体验。',
        priority: 7
      }
    };
  }
}
```

## 🚀 快速调试脚本

### 调试启动脚本

```bash
#!/bin/bash
# scripts/debug/debug.sh

set -e

echo "🔍 React组件调试工具"
echo "===================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 默认配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEBUG_MODE="development"
DEBUG_PORT="9229"
DEBUG_TYPE="chrome"

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -m|--mode)
                DEBUG_MODE="$2"
                shift 2
                ;;
            -p|--port)
                DEBUG_PORT="$2"
                shift 2
                ;;
            -t|--type)
                DEBUG_TYPE="$2"
                shift 2
                ;;
            -c|--component)
                DEBUG_COMPONENT="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 显示帮助信息
show_help() {
    cat << EOF
🔍 React组件调试工具

使用方法:
    $0 [选项]

选项:
    -m, --mode <mode>       调试模式 (development, production, test)
    -p, --port <port>       调试端口 (默认: 9229)
    -t, --type <type>       调试器类型 (chrome, vscode, node)
    -c, --component <name>  要调试的组件名称
    -h, --help              显示帮助信息

示例:
    $0                      # 启动Chrome调试
    $0 -t vscode            # 启动VS Code调试
    $0 -c UserProfile       # 调试特定组件
    $0 -m test              # 测试环境调试

支持的调试器类型:
    chrome      - Chrome开发者工具
    vscode      - VS Code调试器
    node        - Node.js调试器

支持的调试模式:
    development - 开发环境调试
    production  - 生产环境调试
    test        - 测试环境调试
EOF
}

# 检查依赖
check_dependencies() {
    log_info "检查调试依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    # 检查项目依赖
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        log_error "package.json 文件不存在"
        exit 1
    fi
    
    # 安装依赖（如果需要）
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        log_info "安装项目依赖..."
        cd "$PROJECT_ROOT"
        npm install
    fi
    
    log_success "调试依赖检查完成"
}

# 启动开发服务器
start_dev_server() {
    log_info "启动开发服务器..."
    
    cd "$PROJECT_ROOT"
    
    # 设置环境变量
    export DEBUG_MODE="$DEBUG_MODE"
    export DEBUG_PORT="$DEBUG_PORT"
    export DEBUG_COMPONENT="$DEBUG_COMPONENT"
    
    # 启动开发服务器
    if [ "$DEBUG_TYPE" = "chrome" ]; then
        log_info "启动Chrome调试模式..."
        npm run dev -- --inspect-brk="$DEBUG_PORT"
    elif [ "$DEBUG_TYPE" = "vscode" ]; then
        log_info "启动VS Code调试模式..."
        npm run dev
    elif [ "$DEBUG_TYPE" = "node" ]; then
        log_info "启动Node.js调试模式..."
        node --inspect-brk="$DEBUG_PORT" node_modules/.bin/next dev
    else
        log_error "未知的调试器类型: $DEBUG_TYPE"
        exit 1
    fi
}

# 启动调试工具
start_debug_tools() {
    log_info "启动调试工具..."
    
    # 启动React Developer Tools
    if command -v google-chrome &> /dev/null; then
        log_info "启动Chrome浏览器..."
        google-chrome "http://localhost:3000" &
    elif command -v open &> /dev/null; then
        log_info "启动默认浏览器..."
        open "http://localhost:3000" &
    fi
    
    # 启动VS Code调试（如果需要）
    if [ "$DEBUG_TYPE" = "vscode" ]; then
        if command -v code &> /dev/null; then
            log_info "启动VS Code调试器..."
            code --inspect-brk="$DEBUG_PORT" "$PROJECT_ROOT"
        fi
    fi
}

# 生成调试报告
generate_debug_report() {
    log_info "生成调试报告..."
    
    cd "$PROJECT_ROOT"
    
    # 运行诊断脚本
    node scripts/debug/diagnose.js
    
    log_success "调试报告已生成"
}

# 主函数
main() {
    parse_args "$@"
    
    log_info "启动调试环境..."
    log_info "调试模式: $DEBUG_MODE"
    log_info "调试端口: $DEBUG_PORT"
    log_info "调试器类型: $DEBUG_TYPE"
    if [ -n "$DEBUG_COMPONENT" ]; then
        log_info "调试组件: $DEBUG_COMPONENT"
    fi
    echo "===================="
    
    # 检查依赖
    check_dependencies
    
    # 启动开发服务器
    start_dev_server &
    
    # 启动调试工具
    start_debug_tools
    
    # 生成调试报告
    generate_debug_report
    
    log_success "调试环境启动完成！"
    log_info "浏览器地址: http://localhost:3000"
    log_info "调试端口: $DEBUG_PORT"
}

# 运行主函数
main "$@"
```

### 诊断脚本

```javascript
// scripts/debug/diagnose.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DebugDiagnostics {
  constructor() {
    this.projectRoot = process.cwd();
    this.issues = [];
    this.warnings = [];
    this.suggestions = [];
  }

  async runFullDiagnostics() {
    console.log('🔍 开始全面诊断...');
    
    // 检查项目配置
    await this.checkProjectConfig();
    
    // 检查依赖版本
    await this.checkDependencies();
    
    // 检查代码质量
    await this.checkCodeQuality();
    
    // 检查性能问题
    await this.checkPerformanceIssues();
    
    // 检查安全性
    await this.checkSecurity();
    
    // 生成报告
    await this.generateReport();
    
    console.log('✅ 诊断完成');
  }

  async checkProjectConfig() {
    console.log('📋 检查项目配置...');
    
    // 检查package.json
    if (fs.existsSync(path.join(this.projectRoot, 'package.json'))) {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      
      // 检查React版本
      const reactVersion = packageJson.dependencies?.react;
      if (reactVersion && !reactVersion.startsWith('^18.')) {
        this.warnings.push({
          type: 'version',
          message: `React版本 ${reactVersion} 建议升级到18.x`,
          severity: 'medium'
        });
      }
      
      // 检查必要的脚本
      const scripts = packageJson.scripts || {};
      const requiredScripts = ['test', 'build', 'dev'];
      
      requiredScripts.forEach(script => {
        if (!scripts[script]) {
          this.warnings.push({
            type: 'missing_script',
            message: `缺少必要的npm脚本: ${script}`,
            severity: 'low'
          });
        }
      });
    }
    
    // 检查TypeScript配置
    if (fs.existsSync(path.join(this.projectRoot, 'tsconfig.json'))) {
      const tsConfig = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'tsconfig.json'), 'utf8'));
      
      if (!tsConfig.compilerOptions?.strict) {
        this.warnings.push({
          type: 'typescript',
          message: '建议启用TypeScript严格模式',
          severity: 'medium'
        });
      }
    }
  }

  async checkDependencies() {
    console.log('📦 检查依赖版本...');
    
    try {
      const outdated = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdatedPackages = JSON.parse(outdated);
      
      Object.entries(outdatedPackages).forEach(([name, info]) => {
        if (info.type === 'dependencies') {
          this.warnings.push({
            type: 'outdated_dependency',
            message: `${name} 当前版本 ${info.current}, 最新版本 ${info.latest}`,
            severity: 'low'
          });
        }
      });
    } catch (error) {
      // 忽略npm outdated命令失败
    }
    
    // 检查安全漏洞
    try {
      const audit = execSync('npm audit --json', { encoding: 'utf8' });
      const auditResult = JSON.parse(audit);
      
      if (auditResult.advisories) {
        Object.values(auditResult.advisories).forEach(advisory => {
          this.issues.push({
            type: 'security',
            message: `安全漏洞: ${advisory.module_name} - ${advisory.title}`,
            severity: advisory.severity === 'high' ? 'high' : 'medium',
            recommendation: advisory.recommendation
          });
        });
      }
    } catch (error) {
      // 忽略npm audit命令失败
    }
  }

  async checkCodeQuality() {
    console.log('🔍 检查代码质量...');
    
    // 运行ESLint检查
    try {
      execSync('npm run lint -- --format=json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (error) {
      if (error.stdout) {
        const lintResults = JSON.parse(error.stdout);
        
        lintResults.forEach(result => {
          result.messages.forEach(message => {
            this.warnings.push({
              type: 'lint',
              file: result.filePath,
              message: `${message.message} (${message.ruleId})`,
              line: message.line,
              severity: message.severity === 2 ? 'high' : 'medium'
            });
          });
        });
      }
    }
    
    // 检查TypeScript错误
    try {
      execSync('npm run type-check', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (error) {
      this.issues.push({
        type: 'typescript',
        message: 'TypeScript类型检查失败',
        severity: 'high',
        recommendation: '请修复TypeScript类型错误'
      });
    }
  }

  async checkPerformanceIssues() {
    console.log('⚡ 检查性能问题...');
    
    // 检查bundle大小
    if (fs.existsSync(path.join(this.projectRoot, '.next'))) {
      const statsFile = path.join(this.projectRoot, '.next', 'stats.json');
      
      if (fs.existsSync(statsFile)) {
        const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
        
        // 检查主bundle大小
        const mainBundle = stats.assets?.find(asset => 
          asset.name.includes('main') && asset.name.endsWith('.js')
        );
        
        if (mainBundle && mainBundle.size > 500000) {
          this.warnings.push({
            type: 'performance',
            message: `主bundle大小过大: ${(mainBundle.size / 1024 / 1024).toFixed(2)}MB`,
            severity: 'medium',
            recommendation: '考虑代码分割和懒加载'
          });
        }
      }
    }
    
    // 检查未使用的依赖
    try {
      const depcheck = require('depcheck');
      const { unused } = await depcheck(this.projectRoot);
      
      if (unused.dependencies.length > 0) {
        this.warnings.push({
          type: 'unused_dependency',
          message: `未使用的依赖: ${unused.dependencies.join(', ')}`,
          severity: 'low',
          recommendation: '删除未使用的依赖以减少bundle大小'
        });
      }
    } catch (error) {
      // 忽略depcheck错误
    }
  }

  async checkSecurity() {
    console.log('🔒 检查安全性...');
    
    // 检查敏感信息
    const sensitivePatterns = [
      /api[_-]?key/i,
      /secret/i,
      /password/i,
      /token/i
    ];
    
    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanDirectory(filePath);
        } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'))) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          sensitivePatterns.forEach(pattern => {
            if (pattern.test(content)) {
              this.issues.push({
                type: 'security',
                file: filePath,
                message: `可能包含敏感信息: ${pattern}`,
                severity: 'high',
                recommendation: '使用环境变量存储敏感信息'
              });
            }
          });
        }
      });
    };
    
    scanDirectory(path.join(this.projectRoot, 'src'));
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        issues: this.issues.length,
        warnings: this.warnings.length,
        suggestions: this.suggestions.length
      },
      issues: this.issues,
      warnings: this.warnings,
      suggestions: this.suggestions,
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(this.projectRoot, 'debug-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 诊断报告摘要:');
    console.log(`   问题: ${report.summary.issues}`);
    console.log(`   警告: ${report.summary.warnings}`);
    console.log(`   建议: ${report.summary.suggestions}`);
    console.log(`📄 详细报告: ${reportPath}`);
    
    // 显示关键问题
    if (report.summary.issues > 0) {
      console.log('\n🚨 关键问题:');
      this.issues.slice(0, 5).forEach(issue => {
        console.log(`   - ${issue.message} (${issue.severity})`);
      });
    }
    
    // 显示主要警告
    if (report.summary.warnings > 0) {
      console.log('\n⚠️  主要警告:');
      this.warnings.slice(0, 5).forEach(warning => {
        console.log(`   - ${warning.message} (${warning.severity})`);
      });
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    // 基于诊断结果生成建议
    if (this.issues.some(issue => issue.type === 'security')) {
      recommendations.push({
        priority: 'high',
        action: '修复安全问题',
        description: '检查并修复所有安全漏洞，移除代码中的敏感信息'
      });
    }
    
    if (this.issues.some(issue => issue.type === 'typescript')) {
      recommendations.push({
        priority: 'high',
        action: '修复TypeScript错误',
        description: '运行类型检查并修复所有类型错误'
      });
    }
    
    if (this.warnings.some(warning => warning.type === 'performance')) {
      recommendations.push({
        priority: 'medium',
        action: '优化性能',
        description: '检查bundle大小，实施代码分割和懒加载'
      });
    }
    
    if (this.warnings.some(warning => warning.type === 'outdated_dependency')) {
      recommendations.push({
        priority: 'low',
        action: '更新依赖',
        description: '更新过时的依赖包到最新版本'
      });
    }
    
    return recommendations;
  }
}

// CLI接口
async function main() {
  const args = process.argv.slice(2);
  const diagnostics = new DebugDiagnostics();
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 React组件诊断工具

使用方法:
    node scripts/debug/diagnose.js [选项]

选项:
    -h, --help     显示帮助信息
    --quick        快速诊断
    --full         全面诊断 (默认)

示例:
    node scripts/debug/diagnose.js              # 全面诊断
    node scripts/debug/diagnose.js --quick      # 快速诊断
    `);
    return;
  }
  
  if (args.includes('--quick')) {
    await diagnostics.checkProjectConfig();
    await diagnostics.checkCodeQuality();
    await diagnostics.generateReport();
  } else {
    await diagnostics.runFullDiagnostics();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DebugDiagnostics;
```

## 🎯 调试最佳实践

### 1. 组件调试策略

```javascript
// components/DebuggableComponent.jsx
import React, { useState, useEffect, useRef } from 'react';
import { withDebug, consoleDebug } from '@/utils/debug';

const DebuggableComponent = ({ data, onUpdate }) => {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const prevDataRef = useRef(data);
  
  // 调试模式下的额外日志
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      consoleDebug.lifecycle.mount('DebuggableComponent');
    }
    
    return () => {
      if (process.env.NODE_ENV === 'development') {
        consoleDebug.lifecycle.unmount('DebuggableComponent');
      }
    };
  }, []);

  // Props变化调试
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && prevDataRef.current !== data) {
      consoleDebug.lifecycle.update('DebuggableComponent', {
        from: prevDataRef.current,
        to: data
      });
      prevDataRef.current = data;
    }
  }, [data]);

  // 数据获取调试
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      consoleDebug.performance.start('数据获取');
    }
    
    setLoading(true);
    
    // 模拟数据获取
    const fetchData = async () => {
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        setState({ processed: true, data });
      } catch (error) {
        console.error('数据获取失败:', error);
      } finally {
        setLoading(false);
        if (process.env.NODE_ENV === 'development') {
          consoleDebug.performance.end('数据获取');
        }
      }
    };
    
    fetchData();
  }, [data]);

  // 事件处理调试
  const handleClick = () => {
    if (process.env.NODE_ENV === 'development') {
      consoleDebug.state.change('DebuggableComponent', 'clickCount', 
        state?.clickCount || 0, (state?.clickCount || 0) + 1);
    }
    
    onUpdate({ timestamp: Date.now() });
  };

  // 渲染性能调试
  if (process.env.NODE_ENV === 'development') {
    consoleDebug.performance.start('组件渲染');
  }

  return (
    <div className="debuggable-component">
      {loading ? (
        <div>加载中...</div>
      ) : (
        <div>
          <pre>{JSON.stringify(state, null, 2)}</pre>
          <button onClick={handleClick}>
            点击更新
          </button>
        </div>
      )}
    </div>
  );
};

// 使用调试装饰器包装
export default withDebug(DebuggableComponent, {
  logLifecycle: true,
  logProps: true,
  logState: true,
  logPerformance: true
});
```

### 2. 错误边界调试

```javascript
// components/DebugErrorBoundary.jsx
import React from 'react';
import { consoleDebug } from '@/utils/debug';

class DebugErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 调试日志
    consoleDebug.network.error('ErrorBoundary', error);
    console.log('Error Info:', errorInfo);

    // 发送错误到监控服务
    this.sendErrorToMonitoring(error, errorInfo);
  }

  sendErrorToMonitoring(error, errorInfo) {
    // 这里可以集成Sentry、LogRocket等监控服务
    if (process.env.NODE_ENV === 'production') {
      // 发送错误到监控服务
      console.error('生产环境错误:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <h2>组件出现错误</h2>
          <details>
            <summary>错误详情</summary>
            <pre>{this.state.error?.toString()}</pre>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </details>
          <button onClick={this.handleReset}>
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DebugErrorBoundary;
```

### 3. 性能调试Hook

```javascript
// hooks/usePerformanceDebug.js
import { useEffect, useRef } from 'react';
import { consoleDebug } from '@/utils/console-debug';

export const usePerformanceDebug = (componentName, options = {}) => {
  const {
    logRenderTime = true,
    logRenderCount = true,
    logMemoryUsage = false,
    threshold = 16 // 60fps阈值
  } = options;

  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const renderTimes = useRef([]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const currentTime = Date.now();
    const renderTime = currentTime - lastRenderTime.current;
    
    renderCount.current += 1;
    renderTimes.current.push(renderTime);

    // 渲染时间调试
    if (logRenderTime && renderTime > threshold) {
      console.warn(`⚠️ [PERFORMANCE] ${componentName} 渲染时间过长: ${renderTime}ms`);
    }

    // 渲染次数调试
    if (logRenderCount && renderCount.current > 10) {
      console.warn(`⚠️ [PERFORMANCE] ${componentName} 渲染次数过多: ${renderCount.current}`);
    }

    // 内存使用调试
    if (logMemoryUsage && renderCount.current % 10 === 0) {
      consoleDebug.performance.memory();
    }

    lastRenderTime.current = currentTime;

    // 清理旧的渲染时间记录
    if (renderTimes.current.length > 100) {
      renderTimes.current = renderTimes.current.slice(-50);
    }
  });

  // 获取性能统计
  const getStats = () => {
    const times = renderTimes.current;
    return {
      renderCount: renderCount.current,
      averageRenderTime: times.length > 0 ? 
        times.reduce((a, b) => a + b, 0) / times.length : 0,
      maxRenderTime: Math.max(...times, 0),
      minRenderTime: Math.min(...times, 0),
      lastRenderTime: times[times.length - 1] || 0
    };
  };

  return {
    renderCount: renderCount.current,
    getStats
  };
};
```

## 🤖 AI调试对话模板

### 错误诊断对话模板

```
我遇到了一个React组件错误，请帮我诊断：

错误信息：
[粘贴完整的错误信息]

组件代码：
[粘贴相关组件代码]

复现步骤：
1. [步骤1]
2. [步骤2]
3. [步骤3]

期望行为：
[描述期望的结果]

实际行为：
[描述实际发生的结果]

已尝试的解决方法：
1. [方法1]
2. [方法2]

请帮我：
1. 分析错误的根本原因
2. 提供具体的解决方案
3. 给出预防此类错误的建议
```

### 性能优化对话模板

```
我需要优化React组件的性能，请帮我分析：

组件描述：
[描述组件的功能和用途]

当前性能问题：
- 渲染时间：[具体时间]
- 内存占用：[具体数值]
- 用户反馈：[描述用户体验问题]

组件代码：
[粘贴组件代码]

使用场景：
- 数据量：[描述数据规模]
- 更新频率：[描述更新频率]
- 用户交互：[描述交互方式]

请帮我：
1. 识别性能瓶颈
2. 提供优化建议
3. 给出具体的代码改进方案
4. 推荐性能监控工具
```

### 代码审查对话模板

```
请帮我审查以下React组件代码的质量：

组件代码：
[粘贴完整的组件代码]

审查重点：
- 代码规范和最佳实践
- 性能优化机会
- 可维护性和可读性
- 错误处理和边界情况
- 无障碍访问支持

项目背景：
- 项目类型：[描述项目类型]
- 团队规模：[描述团队规模]
- 技术栈：[描述技术栈]

请提供：
1. 代码质量评分（1-10分）
2. 主要优点
3. 需要改进的地方
4. 具体的改进建议
5. 相关的最佳实践参考
```

## 📚 调试资源

### 常见错误解决方案

1. **"Cannot read property of undefined"**
   - 检查对象是否存在再访问属性
   - 使用可选链操作符 `?.`
   - 添加默认值

2. **"Maximum update depth exceeded"**
   - 检查无限循环渲染
   - 使用useMemo和useCallback优化
   - 检查effect依赖项

3. **"Hook rules violation"**
   - 确保Hook在顶层调用
   - 不在条件语句中使用Hook
   - 使用ESLint检查Hook规则

4. **"Memory leak"**
   - 清理定时器和事件监听器
   - 取消未完成的异步操作
   - 使用AbortController取消fetch请求

### 调试工具推荐

- **React Developer Tools** - 组件检查和性能分析
- **Chrome DevTools** - 网络请求和性能分析
- **VS Code Debugger** - 代码断点调试
- **Redux DevTools** - 状态管理调试
- **React Profiler** - 组件性能分析

---

*React组件调试指南 v1.0 | 专为开发者和AI大模型设计*