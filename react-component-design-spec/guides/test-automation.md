# 测试配置环境与自动化测试指南

> 提供简化的测试配置环境和一键式测试脚本

## 📋 概述

本指南提供了完整的测试配置环境解决方案，包括自动化测试脚本、测试环境配置、CI/CD集成和性能优化，让测试变得简单高效。

## 🏗️ 目录结构

```
config/
├── jest/                   # Jest配置
│   ├── config.js
│   ├── setup.js
│   └── transform.js
├── testing-library/        # Testing Library配置
│   └── config.js
├── playwright/            # Playwright配置
│   ├── config.js
│   └── browsers.json
└── cypress/              # Cypress配置
    └── config.js

scripts/
├── test/                  # 测试脚本
│   ├── test.sh
│   ├── test.bat
│   └── test-all.js
├── coverage/              # 覆盖率脚本
│   ├── coverage.sh
│   └── coverage-report.js
├── e2e/                  # E2E测试脚本
│   ├── e2e.sh
│   └── e2e-all.js
└── performance/          # 性能测试脚本
    ├── perf.sh
    └── performance-test.js

tests/
├── setup/                # 测试设置
│   ├── jest.setup.js
│   ├── beforeAll.js
│   └── afterAll.js
├── utils/                # 测试工具
│   ├── test-helpers.js
│   ├── mock-helpers.js
│   └── assertion-helpers.js
├── fixtures/             # 测试固件
│   ├── data/
│   ├── responses/
│   └── files/
└── __mocks__/            # 模拟文件
    ├── fs.js
    ├── axios.js
    └── localStorage.js

.github/
└── workflows/
    ├── test.yml
    ├── e2e.yml
    └── coverage.yml
```

## 🚀 一键式测试脚本

### 主要测试脚本

```bash
#!/bin/bash

# scripts/test/test.sh
# 一键式测试脚本

set -e

echo "🧪 开始运行测试..."
echo "=================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_TYPE="unit"
COVERAGE=false
WATCH=false
VERBOSE=false
UPDATE_SNAPSHOTS=false
REPORTER="default"

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--type)
                TEST_TYPE="$2"
                shift 2
                ;;
            -c|--coverage)
                COVERAGE=true
                shift
                ;;
            -w|--watch)
                WATCH=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -u|--update-snapshots)
                UPDATE_SNAPSHOTS=true
                shift
                ;;
            -r|--reporter)
                REPORTER="$2"
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
🧪 一键式测试脚本

使用方法:
    $0 [选项]

选项:
    -t, --type <type>       测试类型 (unit, integration, e2e, performance)
    -c, --coverage          生成覆盖率报告
    -w, --watch             监视模式
    -v, --verbose           详细输出
    -u, --update-snapshots  更新快照
    -r, --reporter <type>  报告器类型
    -h, --help              显示帮助信息

示例:
    $0                      # 运行单元测试
    $0 -t integration       # 运行集成测试
    $0 -c                   # 运行测试并生成覆盖率报告
    $0 -t e2e               # 运行端到端测试
    $0 -w                   # 监视模式
    $0 -t performance       # 运行性能测试

支持的测试类型:
    unit          - 单元测试
    integration   - 集成测试
    e2e           - 端到端测试
    performance   - 性能测试
    all           - 所有测试
EOF
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查 npm
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
        npm install
    fi
    
    log_success "依赖检查完成"
}

# 运行单元测试
run_unit_tests() {
    log_info "运行单元测试..."
    
    local jest_cmd="npm test"
    
    if [ "$WATCH" = true ]; then
        jest_cmd="$jest_cmd --watch"
    fi
    
    if [ "$COVERAGE" = true ]; then
        jest_cmd="$jest_cmd --coverage"
    fi
    
    if [ "$VERBOSE" = true ]; then
        jest_cmd="$jest_cmd --verbose"
    fi
    
    if [ "$UPDATE_SNAPSHOTS" = true ]; then
        jest_cmd="$jest_cmd --updateSnapshots"
    fi
    
    if [ "$REPORTER" != "default" ]; then
        jest_cmd="$jest_cmd --reporter=$REPORTER"
    fi
    
    cd "$PROJECT_ROOT"
    eval $jest_cmd
}

# 运行集成测试
run_integration_tests() {
    log_info "运行集成测试..."
    
    local jest_cmd="npm run test:integration"
    
    if [ "$COVERAGE" = true ]; then
        jest_cmd="$jest_cmd --coverage"
    fi
    
    if [ "$VERBOSE" = true ]; then
        jest_cmd="$jest_cmd --verbose"
    fi
    
    cd "$PROJECT_ROOT"
    eval $jest_cmd
}

# 运行E2E测试
run_e2e_tests() {
    log_info "运行端到端测试..."
    
    # 检查是否安装了Playwright或Cypress
    if [ -f "$PROJECT_ROOT/playwright.config.js" ]; then
        log_info "使用Playwright运行E2E测试..."
        cd "$PROJECT_ROOT"
        npx playwright test
    elif [ -f "$PROJECT_ROOT/cypress.config.js" ]; then
        log_info "使用Cypress运行E2E测试..."
        cd "$PROJECT_ROOT"
        npx cypress run
    else
        log_error "未找到E2E测试配置"
        exit 1
    fi
}

# 运行性能测试
run_performance_tests() {
    log_info "运行性能测试..."
    
    cd "$PROJECT_ROOT"
    
    if [ -f "$PROJECT_ROOT/scripts/performance/performance-test.js" ]; then
        node scripts/performance/performance-test.js
    else
        log_warning "未找到性能测试脚本，运行基础性能测试..."
        
        # 使用Lighthouse进行基础性能测试
        if command -v lighthouse &> /dev/null; then
            log_info "运行Lighthouse性能测试..."
            # 这里可以添加具体的Lighthouse测试命令
        else
            log_error "请安装Lighthouse: npm install -g lighthouse"
            exit 1
        fi
    fi
}

# 生成覆盖率报告
generate_coverage_report() {
    log_info "生成覆盖率报告..."
    
    cd "$PROJECT_ROOT"
    
    # 运行测试并生成覆盖率
    npm run test:coverage
    
    # 打开覆盖率报告
    if command -v open &> /dev/null; then
        open coverage/lcov-report/index.html
    elif command -v xdg-open &> /dev/null; then
        xdg-open coverage/lcov-report/index.html
    fi
    
    log_success "覆盖率报告已生成"
}

# 清理测试文件
cleanup_test_files() {
    log_info "清理测试文件..."
    
    cd "$PROJECT_ROOT"
    
    # 清理覆盖率报告
    if [ -d "coverage" ]; then
        rm -rf coverage
    fi
    
    # 清理测试缓存
    if [ -d ".jest-cache" ]; then
        rm -rf .jest-cache
    fi
    
    # 清理Playwright报告
    if [ -d "playwright-report" ]; then
        rm -rf playwright-report
    fi
    
    # 清理Cypress报告
    if [ -d "cypress/reports" ]; then
        rm -rf cypress/reports
    fi
    
    log_success "测试文件清理完成"
}

# 运行所有测试
run_all_tests() {
    log_info "运行所有测试..."
    
    # 运行单元测试
    run_unit_tests
    
    # 运行集成测试
    run_integration_tests
    
    # 运行E2E测试
    run_e2e_tests
    
    # 运行性能测试
    run_performance_tests
    
    # 生成覆盖率报告
    if [ "$COVERAGE" = true ]; then
        generate_coverage_report
    fi
    
    log_success "所有测试完成"
}

# 显示测试结果摘要
show_test_summary() {
    log_info "测试结果摘要"
    echo "=================="
    echo "测试类型: $TEST_TYPE"
    echo "覆盖率: $([ "$COVERAGE" = true ] && echo "启用" || echo "禁用")"
    echo "监视模式: $([ "$WATCH" = true ] && echo "启用" || echo "禁用")"
    echo "详细输出: $([ "$VERBOSE" = true ] && echo "启用" || echo "禁用")"
    echo "=================="
}

# 主函数
main() {
    parse_args "$@"
    
    log_info "开始测试流程..."
    show_test_summary
    
    # 检查依赖
    check_dependencies
    
    # 根据测试类型运行相应的测试
    case $TEST_TYPE in
        "unit")
            run_unit_tests
            ;;
        "integration")
            run_integration_tests
            ;;
        "e2e")
            run_e2e_tests
            ;;
        "performance")
            run_performance_tests
            ;;
        "all")
            run_all_tests
            ;;
        *)
            log_error "未知的测试类型: $TEST_TYPE"
            show_help
            exit 1
            ;;
    esac
    
    log_success "测试完成！"
}

# 运行主函数
main "$@"
```

### Windows版本测试脚本

```batch
@echo off
REM scripts/test/test.bat
REM Windows版本的一键式测试脚本

setlocal enabledelayedexpansion

echo 🧪 开始运行测试...
echo ==================

REM 颜色定义（Windows 10+）
for /f %%i in ('echo prompt $E^| cmd') do set "ESC=%%i"

REM 默认配置
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
set "TEST_TYPE=unit"
set "COVERAGE=false"
set "WATCH=false"
set "VERBOSE=false"
set "UPDATE_SNAPSHOTS=false"
set "REPORTER=default"

REM 解析命令行参数
:parse_args
if "%~1"=="" goto main
if "%~1"=="-t" (
    set "TEST_TYPE=%~2"
    shift /2
    goto parse_args
)
if "%~1"=="--type" (
    set "TEST_TYPE=%~2"
    shift /2
    goto parse_args
)
if "%~1"=="-c" (
    set "COVERAGE=true"
    shift
    goto parse_args
)
if "%~1"=="--coverage" (
    set "COVERAGE=true"
    shift
    goto parse_args
)
if "%~1"=="-w" (
    set "WATCH=true"
    shift
    goto parse_args
)
if "%~1"=="--watch" (
    set "WATCH=true"
    shift
    goto parse_args
)
if "%~1"=="-v" (
    set "VERBOSE=true"
    shift
    goto parse_args
)
if "%~1"=="--verbose" (
    set "VERBOSE=true"
    shift
    goto parse_args
)
if "%~1"=="-u" (
    set "UPDATE_SNAPSHOTS=true"
    shift
    goto parse_args
)
if "%~1"=="--update-snapshots" (
    set "UPDATE_SNAPSHOTS=true"
    shift
    goto parse_args
)
if "%~1"=="-r" (
    set "REPORTER=%~2"
    shift /2
    goto parse_args
)
if "%~1"=="--reporter" (
    set "REPORTER=%~2"
    shift /2
    goto parse_args
)
if "%~1"=="-h" (
    call :show_help
    exit /b 0
)
if "%~1"=="--help" (
    call :show_help
    exit /b 0
)
echo %ESC%[31m[ERROR]%ESC%[0m 未知参数: %~1
call :show_help
exit /b 1

REM 显示帮助信息
:show_help
echo 🧪 一键式测试脚本
echo.
echo 使用方法:
echo     %~nx0 [选项]
echo.
echo 选项:
echo     -t, --type ^<type^>       测试类型 (unit, integration, e2e, performance)
echo     -c, --coverage          生成覆盖率报告
echo     -w, --watch             监视模式
echo     -v, --verbose           详细输出
echo     -u, --update-snapshots  更新快照
echo     -r, --reporter ^<type^>  报告器类型
echo     -h, --help              显示帮助信息
echo.
echo 示例:
echo     %~nx0                    # 运行单元测试
echo     %~nx0 -t integration     # 运行集成测试
echo     %~nx0 -c                 # 运行测试并生成覆盖率报告
echo     %~nx0 -t e2e             # 运行端到端测试
echo     %~nx0 -w                 # 监视模式
echo     %~nx0 -t performance     # 运行性能测试
echo.
echo 支持的测试类型:
echo     unit          - 单元测试
echo     integration   - 集成测试
echo     e2e           - 端到端测试
echo     performance   - 性能测试
echo     all           - 所有测试
goto :eof

REM 检查依赖
:check_dependencies
echo %ESC%[34m[INFO]%ESC%[0m 检查依赖...

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo %ESC%[31m[ERROR]%ESC%[0m Node.js 未安装
    exit /b 1
)

REM 检查 npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo %ESC%[31m[ERROR]%ESC%[0m npm 未安装
    exit /b 1
)

REM 检查项目依赖
if not exist "%PROJECT_ROOT%\package.json" (
    echo %ESC%[31m[ERROR]%ESC%[0m package.json 文件不存在
    exit /b 1
)

REM 安装依赖（如果需要）
if not exist "%PROJECT_ROOT%\node_modules" (
    echo %ESC%[34m[INFO]%ESC%[0m 安装项目依赖...
    cd /d "%PROJECT_ROOT%"
    npm install
)

echo %ESC%[32m[SUCCESS]%ESC%[0m 依赖检查完成
goto :eof

REM 运行单元测试
:run_unit_tests
echo %ESC%[34m[INFO]%ESC%[0m 运行单元测试...

set "jest_cmd=npm test"

if "%COVERAGE%"=="true" (
    set "jest_cmd=!jest_cmd! --coverage"
)

if "%WATCH%"=="true" (
    set "jest_cmd=!jest_cmd! --watch"
)

if "%VERBOSE%"=="true" (
    set "jest_cmd=!jest_cmd! --verbose"
)

if "%UPDATE_SNAPSHOTS%"=="true" (
    set "jest_cmd=!jest_cmd! --updateSnapshots"
)

if not "%REPORTER%"=="default" (
    set "jest_cmd=!jest_cmd! --reporter=%REPORTER%"
)

cd /d "%PROJECT_ROOT%"
%jest_cmd%
goto :eof

REM 运行集成测试
:run_integration_tests
echo %ESC%[34m[INFO]%ESC%[0m 运行集成测试...

set "jest_cmd=npm run test:integration"

if "%COVERAGE%"=="true" (
    set "jest_cmd=!jest_cmd! --coverage"
)

if "%VERBOSE%"=="true" (
    set "jest_cmd=!jest_cmd! --verbose"
)

cd /d "%PROJECT_ROOT%"
%jest_cmd%
goto :eof

REM 运行E2E测试
:run_e2e_tests
echo %ESC%[34m[INFO]%ESC%[0m 运行端到端测试...

cd /d "%PROJECT_ROOT%"

if exist "%PROJECT_ROOT%\playwright.config.js" (
    echo %ESC%[34m[INFO]%ESC%[0m 使用Playwright运行E2E测试...
    npx playwright test
) else if exist "%PROJECT_ROOT%\cypress.config.js" (
    echo %ESC%[34m[INFO]%ESC%[0m 使用Cypress运行E2E测试...
    npx cypress run
) else (
    echo %ESC%[31m[ERROR]%ESC%[0m 未找到E2E测试配置
    exit /b 1
)
goto :eof

REM 运行性能测试
:run_performance_tests
echo %ESC%[34m[INFO]%ESC%[0m 运行性能测试...

cd /d "%PROJECT_ROOT%"

if exist "%PROJECT_ROOT%\scripts\performance\performance-test.js" (
    node scripts\performance\performance-test.js
) else (
    echo %ESC%[33m[WARNING]%ESC%[0m 未找到性能测试脚本，跳过性能测试
)
goto :eof

REM 生成覆盖率报告
:generate_coverage_report
echo %ESC%[34m[INFO]%ESC%[0m 生成覆盖率报告...

cd /d "%PROJECT_ROOT%"
npm run test:coverage

echo %ESC%[32m[SUCCESS]%ESC%[0m 覆盖率报告已生成
goto :eof

REM 运行所有测试
:run_all_tests
echo %ESC%[34m[INFO]%ESC%[0m 运行所有测试...

call :run_unit_tests
call :run_integration_tests
call :run_e2e_tests
call :run_performance_tests

if "%COVERAGE%"=="true" (
    call :generate_coverage_report
)

echo %ESC%[32m[SUCCESS]%ESC%[0m 所有测试完成
goto :eof

REM 主函数
:main
echo %ESC%[34m[INFO]%ESC%[0m 开始测试流程...
echo 测试类型: %TEST_TYPE%
echo 覆盖率: %COVERAGE%
echo 监视模式: %WATCH%
echo 详细输出: %VERBOSE%
echo ==================

call :check_dependencies

REM 根据测试类型运行相应的测试
if "%TEST_TYPE%"=="unit" (
    call :run_unit_tests
) else if "%TEST_TYPE%"=="integration" (
    call :run_integration_tests
) else if "%TEST_TYPE%"=="e2e" (
    call :run_e2e_tests
) else if "%TEST_TYPE%"=="performance" (
    call :run_performance_tests
) else if "%TEST_TYPE%"=="all" (
    call :run_all_tests
) else (
    echo %ESC%[31m[ERROR]%ESC%[0m 未知的测试类型: %TEST_TYPE%
    call :show_help
    exit /b 1
)

echo %ESC%[32m[SUCCESS]%ESC%[0m 测试完成！
goto :eof
```

## ⚙️ 测试配置文件

### Jest配置

```javascript
// config/jest/config.js
const path = require('path');

module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // 覆盖率配置
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // 模块映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/test-utils/(.*)$': '<rootDir>/test-utils/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  
  // 转换配置
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // 测试超时时间
  testTimeout: 10000,
  
  // 缓存目录
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // 报告器
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml'
      }
    ]
  ],
  
  // 快照序列化
  snapshotSerializers: ['@emotion/jest/serializer']
};
```

### 测试设置文件

```javascript
// tests/setup/jest.setup.js
import '@testing-library/jest-dom';
import { server } from '../mocks/server';

// 设置全局测试超时
jest.setTimeout(10000);

// 在所有测试前设置模拟服务器
beforeAll(() => server.listen());

// 每个测试后重置处理器
afterEach(() => server.resetHandlers());

// 所有测试后关闭服务器
afterAll(() => server.close());

// 全局模拟
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// 模拟 matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// 模拟 scrollTo
window.scrollTo = jest.fn();

// 清理每个测试后的状态
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
```

### Playwright配置

```javascript
// config/playwright/config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  
  // 并行运行测试
  fullyParallel: true,
  
  // 失败时重试
  retries: process.env.CI ? 2 : 0,
  
  // 工作线程数
  workers: process.env.CI ? 4 : undefined,
  
  // 报告器
  reporter: [
    ['list'],
    ['html'],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }]
  ],
  
  // 全超时时间
  timeout: 30000,
  
  // 期望超时时间
  expect: {
    timeout: 5000
  },
  
  // 使用项目
  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'firefox',
      use: { 
        browserName: 'firefox',
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'webkit',
      use: { 
        browserName: 'webkit',
        viewport: { width: 1280, height: 720 }
      },
    }
  ],
  
  // Web服务器配置
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});
```

## 📊 测试报告和覆盖率

### 覆盖率报告脚本

```javascript
// scripts/coverage/coverage-report.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CoverageReporter {
  constructor() {
    this.coverageDir = path.join(process.cwd(), 'coverage');
    this.reportDir = path.join(this.coverageDir, 'lcov-report');
    this.thresholds = {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    };
  }

  async generateReport() {
    console.log('🔄 生成覆盖率报告...');
    
    try {
      // 运行测试并生成覆盖率
      execSync('npm run test:coverage', { stdio: 'inherit' });
      
      // 分析覆盖率结果
      const summary = await this.analyzeCoverage();
      
      // 生成详细报告
      await this.generateDetailedReport(summary);
      
      // 检查覆盖率阈值
      this.checkThresholds(summary);
      
      console.log('✅ 覆盖率报告生成完成');
      
    } catch (error) {
      console.error('❌ 生成覆盖率报告失败:', error.message);
      process.exit(1);
    }
  }

  async analyzeCoverage() {
    const summaryPath = path.join(this.coverageDir, 'coverage-summary.json');
    
    if (!fs.existsSync(summaryPath)) {
      throw new Error('覆盖率摘要文件不存在');
    }
    
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    
    // 计算总体覆盖率
    const total = summary.total;
    const result = {
      branches: {
        percentage: (total.branches.pct / 100).toFixed(4),
        covered: total.branches.covered,
        total: total.branches.total
      },
      functions: {
        percentage: (total.functions.pct / 100).toFixed(4),
        covered: total.functions.covered,
        total: total.functions.total
      },
      lines: {
        percentage: (total.lines.pct / 100).toFixed(4),
        covered: total.lines.covered,
        total: total.lines.total
      },
      statements: {
        percentage: (total.statements.pct / 100).toFixed(4),
        covered: total.statements.covered,
        total: total.statements.total
      }
    };
    
    return result;
  }

  async generateDetailedReport(summary) {
    const reportPath = path.join(this.coverageDir, 'detailed-report.md');
    
    let report = `# 测试覆盖率报告\n\n`;
    report += `生成时间: ${new Date().toISOString()}\n\n`;
    
    report += `## 覆盖率概览\n\n`;
    report += `| 指标 | 覆盖率 | 覆盖数/总数 | 状态 |\n`;
    report += `|------|--------|------------|------|\n`;
    
    Object.entries(summary).forEach(([key, value]) => {
      const percentage = (parseFloat(value.percentage) * 100).toFixed(2);
      const status = parseFloat(value.percentage) >= (this.thresholds[key] / 100) ? '✅' : '❌';
      report += `| ${key.toUpperCase()} | ${percentage}% | ${value.covered}/${value.total} | ${status} |\n`;
    });
    
    report += `\n## 详细说明\n\n`;
    report += `- **分支覆盖率 (Branches)**: 测试覆盖的代码分支比例\n`;
    report += `- **函数覆盖率 (Functions)**: 测试覆盖的函数比例\n`;
    report += `- **行覆盖率 (Lines)**: 测试覆盖的代码行比例\n`;
    report += `- **语句覆盖率 (Statements)**: 测试覆盖的语句比例\n\n`;
    
    report += `## 建议\n\n`;
    
    Object.entries(summary).forEach(([key, value]) => {
      const percentage = parseFloat(value.percentage) * 100;
      const threshold = this.thresholds[key];
      
      if (percentage < threshold) {
        report += `- ${key.toUpperCase()} 覆盖率 (${percentage}%) 低于目标 (${threshold}%)，建议增加相关测试\n`;
      }
    });
    
    fs.writeFileSync(reportPath, report);
    console.log(`📄 详细报告已生成: ${reportPath}`);
  }

  checkThresholds(summary) {
    const failures = [];
    
    Object.entries(this.thresholds).forEach(([key, threshold]) => {
      const percentage = parseFloat(summary[key].percentage) * 100;
      
      if (percentage < threshold) {
        failures.push({
          metric: key,
          actual: percentage,
          expected: threshold
        });
      }
    });
    
    if (failures.length > 0) {
      console.error('❌ 覆盖率未达到要求:');
      failures.forEach(failure => {
        console.error(`   ${failure.metric}: ${failure.actual.toFixed(2)}% < ${failure.expected}%`);
      });
      
      if (process.env.CI) {
        process.exit(1);
      }
    }
  }

  openReport() {
    const indexPath = path.join(this.reportDir, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      const { exec } = require('child_process');
      
      switch (process.platform) {
        case 'darwin':
          exec(`open ${indexPath}`);
          break;
        case 'win32':
          exec(`start ${indexPath}`);
          break;
        default:
          exec(`xdg-open ${indexPath}`);
      }
      
      console.log(`📊 已打开覆盖率报告: ${indexPath}`);
    } else {
      console.error('❌ 覆盖率报告不存在，请先生成报告');
    }
  }
}

// CLI 接口
async function main() {
  const args = process.argv.slice(2);
  const reporter = new CoverageReporter();
  
  if (args.includes('--open')) {
    reporter.openReport();
  } else if (args.includes('--check')) {
    await reporter.generateReport();
  } else {
    await reporter.generateReport();
    reporter.openReport();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoverageReporter;
```

## 🤖 自动化测试脚本

### 完整测试套件

```javascript
// scripts/test/test-all.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, skipped: 0 },
      integration: { passed: 0, failed: 0, skipped: 0 },
      e2e: { passed: 0, failed: 0, skipped: 0 },
      performance: { passed: 0, failed: 0, skipped: 0 }
    };
    this.startTime = Date.now();
    this.projectRoot = process.cwd();
  }

  async runAllTests() {
    console.log('🚀 开始运行完整测试套件...');
    console.log('===========================================');
    
    try {
      // 1. 运行单元测试
      await this.runUnitTests();
      
      // 2. 运行集成测试
      await this.runIntegrationTests();
      
      // 3. 运行E2E测试
      await this.runE2ETests();
      
      // 4. 运行性能测试
      await this.runPerformanceTests();
      
      // 5. 生成综合报告
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ 测试运行失败:', error.message);
      process.exit(1);
    }
  }

  async runUnitTests() {
    console.log('\n🧪 运行单元测试...');
    
    try {
      execSync('npm run test:unit -- --coverage --json --outputFile=test-results/unit-results.json', {
        stdio: 'inherit',
        cwd: this.projectRoot
      });
      
      // 解析结果
      const results = this.parseTestResults('test-results/unit-results.json');
      this.results.unit = results;
      
      console.log('✅ 单元测试完成');
      
    } catch (error) {
      console.error('❌ 单元测试失败');
      this.results.unit.failed = 1;
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 运行集成测试...');
    
    try {
      execSync('npm run test:integration -- --json --outputFile=test-results/integration-results.json', {
        stdio: 'inherit',
        cwd: this.projectRoot
      });
      
      // 解析结果
      const results = this.parseTestResults('test-results/integration-results.json');
      this.results.integration = results;
      
      console.log('✅ 集成测试完成');
      
    } catch (error) {
      console.error('❌ 集成测试失败');
      this.results.integration.failed = 1;
    }
  }

  async runE2ETests() {
    console.log('\n🌐 运行端到端测试...');
    
    try {
      // 检查使用哪个E2E框架
      if (fs.existsSync(path.join(this.projectRoot, 'playwright.config.js'))) {
        execSync('npx playwright test --reporter=list', {
          stdio: 'inherit',
          cwd: this.projectRoot
        });
      } else if (fs.existsSync(path.join(this.projectRoot, 'cypress.config.js'))) {
        execSync('npx cypress run --reporter spec', {
          stdio: 'inherit',
          cwd: this.projectRoot
        });
      } else {
        console.log('⚠️  未找到E2E测试配置，跳过E2E测试');
        this.results.e2e.skipped = 1;
        return;
      }
      
      // 解析E2E测试结果（简化处理）
      this.results.e2e.passed = 1;
      
      console.log('✅ E2E测试完成');
      
    } catch (error) {
      console.error('❌ E2E测试失败');
      this.results.e2e.failed = 1;
    }
  }

  async runPerformanceTests() {
    console.log('\n⚡ 运行性能测试...');
    
    try {
      const perfScript = path.join(this.projectRoot, 'scripts/performance/performance-test.js');
      
      if (fs.existsSync(perfScript)) {
        execSync(`node ${perfScript}`, {
          stdio: 'inherit',
          cwd: this.projectRoot
        });
        
        this.results.performance.passed = 1;
      } else {
        console.log('⚠️  未找到性能测试脚本，跳过性能测试');
        this.results.performance.skipped = 1;
      }
      
      console.log('✅ 性能测试完成');
      
    } catch (error) {
      console.error('❌ 性能测试失败');
      this.results.performance.failed = 1;
    }
  }

  parseTestResults(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
          passed: data.numPassedTests || 0,
          failed: data.numFailedTests || 0,
          skipped: data.numPendingTests || 0
        };
      }
    } catch (error) {
      console.warn(`⚠️  无法解析测试结果文件: ${filePath}`);
    }
    
    return { passed: 0, failed: 0, skipped: 0 };
  }

  async generateReport() {
    console.log('\n📊 生成测试报告...');
    
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);
    
    const report = this.generateReportHTML(duration);
    const reportPath = path.join(this.projectRoot, 'test-results', 'test-report.html');
    
    // 确保目录存在
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 测试报告已生成: ${reportPath}`);
    this.printSummary(duration);
  }

  generateReportHTML(duration) {
    const summary = this.calculateSummary();
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .card.success { border-left-color: #28a745; }
        .card.warning { border-left-color: #ffc107; }
        .card.danger { border-left-color: #dc3545; }
        .card h3 { margin: 0 0 10px 0; color: #333; }
        .card .value { font-size: 2em; font-weight: bold; color: #007bff; }
        .card.success .value { color: #28a745; }
        .card.warning .value { color: #ffc107; }
        .card.danger .value { color: #dc3545; }
        .test-results { margin-bottom: 30px; }
        .test-type { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .test-type h3 { margin: 0 0 10px 0; color: #333; }
        .results { display: flex; gap: 20px; }
        .result-item { text-align: center; padding: 10px; background: white; border-radius: 4px; min-width: 80px; }
        .result-item.passed { background: #d4edda; color: #155724; }
        .result-item.failed { background: #f8d7da; color: #721c24; }
        .result-item.skipped { background: #fff3cd; color: #856404; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 测试报告</h1>
            <p>生成时间: ${new Date().toLocaleString()}</p>
            <p>运行时长: ${duration} 秒</p>
        </div>
        
        <div class="summary">
            <div class="card ${summary.status === 'success' ? 'success' : summary.status === 'warning' ? 'warning' : 'danger'}">
                <h3>总体状态</h3>
                <div class="value">${summary.total.passed}/${summary.total.total}</div>
                <div>${summary.status === 'success' ? '✅ 通过' : summary.status === 'warning' ? '⚠️ 警告' : '❌ 失败'}</div>
            </div>
            
            <div class="card">
                <h3>通过率</h3>
                <div class="value">${summary.passRate}%</div>
                <div>测试通过率</div>
            </div>
            
            <div class="card">
                <h3>总测试数</h3>
                <div class="value">${summary.total.total}</div>
                <div>所有测试</div>
            </div>
            
            <div class="card">
                <h3>失败测试</h3>
                <div class="value">${summary.total.failed}</div>
                <div>需要修复</div>
            </div>
        </div>
        
        <div class="test-results">
            <div class="test-type">
                <h3>🧪 单元测试</h3>
                <div class="results">
                    <div class="result-item passed">
                        <div>${this.results.unit.passed}</div>
                        <div>通过</div>
                    </div>
                    <div class="result-item failed">
                        <div>${this.results.unit.failed}</div>
                        <div>失败</div>
                    </div>
                    <div class="result-item skipped">
                        <div>${this.results.unit.skipped}</div>
                        <div>跳过</div>
                    </div>
                </div>
            </div>
            
            <div class="test-type">
                <h3>🔗 集成测试</h3>
                <div class="results">
                    <div class="result-item passed">
                        <div>${this.results.integration.passed}</div>
                        <div>通过</div>
                    </div>
                    <div class="result-item failed">
                        <div>${this.results.integration.failed}</div>
                        <div>失败</div>
                    </div>
                    <div class="result-item skipped">
                        <div>${this.results.integration.skipped}</div>
                        <div>跳过</div>
                    </div>
                </div>
            </div>
            
            <div class="test-type">
                <h3>🌐 E2E测试</h3>
                <div class="results">
                    <div class="result-item passed">
                        <div>${this.results.e2e.passed}</div>
                        <div>通过</div>
                    </div>
                    <div class="result-item failed">
                        <div>${this.results.e2e.failed}</div>
                        <div>失败</div>
                    </div>
                    <div class="result-item skipped">
                        <div>${this.results.e2e.skipped}</div>
                        <div>跳过</div>
                    </div>
                </div>
            </div>
            
            <div class="test-type">
                <h3>⚡ 性能测试</h3>
                <div class="results">
                    <div class="result-item passed">
                        <div>${this.results.performance.passed}</div>
                        <div>通过</div>
                    </div>
                    <div class="result-item failed">
                        <div>${this.results.performance.failed}</div>
                        <div>失败</div>
                    </div>
                    <div class="result-item skipped">
                        <div>${this.results.performance.skipped}</div>
                        <div>跳过</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>测试报告由自动化测试系统生成</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  calculateSummary() {
    const total = {
      passed: Object.values(this.results).reduce((sum, result) => sum + result.passed, 0),
      failed: Object.values(this.results).reduce((sum, result) => sum + result.failed, 0),
      skipped: Object.values(this.results).reduce((sum, result) => sum + result.skipped, 0),
      total: Object.values(this.results).reduce((sum, result) => sum + result.passed + result.failed + result.skipped, 0)
    };
    
    const passRate = total.total > 0 ? Math.round((total.passed / total.total) * 100) : 0;
    const status = total.failed === 0 ? 'success' : total.failed <= 3 ? 'warning' : 'danger';
    
    return { total, passRate, status };
  }

  printSummary(duration) {
    const summary = this.calculateSummary();
    
    console.log('\n📊 测试结果摘要');
    console.log('===========================================');
    console.log(`总测试数: ${summary.total.total}`);
    console.log(`通过: ${summary.total.passed} (${summary.passRate}%)`);
    console.log(`失败: ${summary.total.failed}`);
    console.log(`跳过: ${summary.total.skipped}`);
    console.log(`运行时长: ${duration} 秒`);
    console.log('===========================================');
    
    if (summary.status === 'success') {
      console.log('🎉 所有测试通过！');
    } else if (summary.status === 'warning') {
      console.log('⚠️  有少量测试失败，请检查');
    } else {
      console.log('❌ 测试失败过多，请优先修复');
    }
  }
}

// CLI 接口
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧪 完整测试套件运行器

使用方法:
    node scripts/test/test-all.js [选项]

选项:
    -h, --help     显示帮助信息
    --report-only  只生成报告，不运行测试

示例:
    node scripts/test/test-all.js              # 运行所有测试
    node scripts/test/test-all.js --report-only # 只生成报告
    `);
    return;
  }
  
  if (args.includes('--report-only')) {
    await runner.generateReport();
  } else {
    await runner.runAllTests();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TestRunner;
```

## 🔄 CI/CD集成

### GitHub Actions工作流

```yaml
# .github/workflows/test.yml
name: 测试

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - name: 检出代码
      uses: actions/checkout@v3
    
    - name: 设置Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: 安装依赖
      run: npm ci
    
    - name: 运行单元测试
      run: npm run test:unit
    
    - name: 运行集成测试
      run: npm run test:integration
    
    - name: 生成覆盖率报告
      run: npm run test:coverage
    
    - name: 上传覆盖率报告
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
    
    - name: 上传测试结果
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results-${{ matrix.node-version }}
        path: |
          test-results/
          coverage/

  e2e:
    runs-on: ubuntu-latest
    
    steps:
    - name: 检出代码
      uses: actions/checkout@v3
    
    - name: 设置Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18.x'
        cache: 'npm'
    
    - name: 安装依赖
      run: npm ci
    
    - name: 安装Playwright
      run: npx playwright install --with-deps
    
    - name: 运行E2E测试
      run: npx playwright test
    
    - name: 上传测试结果
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: e2e-results
        path: |
          playwright-report/
          test-results/
```

### 性能测试工作流

```yaml
# .github/workflows/performance.yml
name: 性能测试

on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点
  push:
    branches: [ main ]
    paths:
      - 'src/**'
      - 'performance/**'

jobs:
  performance:
    runs-on: ubuntu-latest
    
    steps:
    - name: 检出代码
      uses: actions/checkout@v3
    
    - name: 设置Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18.x'
        cache: 'npm'
    
    - name: 安装依赖
      run: npm ci
    
    - name: 构建应用
      run: npm run build
    
    - name: 启动服务器
      run: npm run start &
      shell: bash
    
    - name: 等待服务器启动
      run: sleep 30
      shell: bash
    
    - name: 运行Lighthouse测试
      uses: treosh/lighthouse-ci-action@v9
      with:
        urls: |
          http://localhost:3000
          http://localhost:3000/dashboard
        uploadArtifacts: true
        temporaryPublicStorage: true
    
    - name: 运行性能测试
      run: npm run test:performance
    
    - name: 上传性能测试结果
      uses: actions/upload-artifact@v3
      with:
        name: performance-results
        path: performance-reports/
```

## 🎯 使用示例

### 基本使用

```bash
# 运行单元测试
./scripts/test/test.sh

# 运行集成测试
./scripts/test/test.sh -t integration

# 运行测试并生成覆盖率报告
./scripts/test/test.sh -c

# 运行E2E测试
./scripts/test/test.sh -t e2e

# 运行所有测试
./scripts/test/test.sh -t all

# 监视模式
./scripts/test/test.sh -w

# 更新快照
./scripts/test/test.sh -u
```

### 高级使用

```bash
# 生成详细报告
node scripts/test/test-all.js

# 只生成报告
node scripts/test/test-all.js --report-only

# 生成覆盖率报告
node scripts/coverage/coverage-report.js

# 检查覆盖率阈值
node scripts/coverage/coverage-report.js --check

# 打开覆盖率报告
node scripts/coverage/coverage-report.js --open
```

## 📈 性能优化

### 测试性能优化

```javascript
// tests/utils/performance-helpers.js
export const performanceHelpers = {
  // 并行运行测试
  async runParallelTests(testFiles, concurrency = 4) {
    const chunks = this.chunkArray(testFiles, concurrency);
    const results = [];
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(file => this.runSingleTest(file))
      );
      results.push(...chunkResults);
    }
    
    return results;
  },
  
  // 分割数组
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  
  // 运行单个测试
  async runSingleTest(testFile) {
    const startTime = Date.now();
    
    try {
      // 运行测试
      await import(testFile);
      
      return {
        file: testFile,
        status: 'passed',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        file: testFile,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  },
  
  // 内存使用监控
  startMemoryMonitoring() {
    const usage = process.memoryUsage();
    
    console.log('内存使用情况:');
    console.log(`RSS: ${Math.round(usage.rss / 1024 / 1024)}MB`);
    console.log(`Heap Used: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
    console.log(`Heap Total: ${Math.round(usage.heapTotal / 1024 / 1024)}MB`);
    console.log(`External: ${Math.round(usage.external / 1024 / 1024)}MB`);
  },
  
  // 清理内存
  cleanupMemory() {
    if (global.gc) {
      global.gc();
      console.log('已触发垃圾回收');
    }
  }
};
```

### 测试缓存优化

```javascript
// tests/utils/cache-helpers.js
export const cacheHelpers = {
  // 缓存测试数据
  cache: new Map(),
  
  // 设置缓存
  setCache(key, data, ttl = 300000) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  },
  
  // 获取缓存
  getCache(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  },
  
  // 清理过期缓存
  cleanupCache() {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  },
  
  // 预生成常用测试数据
  async preloadTestData() {
    const testDataKeys = ['users', 'products', 'orders'];
    
    for (const key of testDataKeys) {
      if (!this.getCache(key)) {
        const data = await this.generateTestData(key);
        this.setCache(key, data, 600000); // 10分钟缓存
      }
    }
  },
  
  // 生成测试数据
  async generateTestData(type) {
    switch (type) {
      case 'users':
        return Array.from({ length: 100 }, (_, i) => ({
          id: `user_${i}`,
          name: `User ${i}`,
          email: `user${i}@example.com`
        }));
      
      case 'products':
        return Array.from({ length: 50 }, (_, i) => ({
          id: `product_${i}`,
          name: `Product ${i}`,
          price: Math.random() * 1000
        }));
      
      default:
        return [];
    }
  }
};
```

## 🚨 故障排除

### 常见问题

1. **测试超时**
   ```bash
   # 增加测试超时时间
   ./scripts/test/test.sh --timeout 30000
   ```

2. **内存不足**
   ```bash
   # 减少并行测试数量
   ./scripts/test/test.sh --max-workers 2
   ```

3. **E2E测试失败**
   ```bash
   # 以调试模式运行E2E测试
   ./scripts/test/test.sh -t e2e --debug
   ```

4. **覆盖率报告生成失败**
   ```bash
   # 清理并重新生成
   rm -rf coverage
   ./scripts/test/test.sh -c
   ```

### 调试技巧

1. **启用详细输出**
   ```bash
   ./scripts/test/test.sh -v
   ```

2. **只运行特定测试**
   ```bash
   ./scripts/test/test.sh --testNamePattern="用户登录"
   ```

3. **生成测试覆盖率报告**
   ```bash
   ./scripts/test/test.sh -c --coverage-reporters=html
   ```

## 📚 总结

测试配置环境和自动化测试脚本提供了：

1. **一键式测试脚本** - 支持多种测试类型和配置选项
2. **完整的测试配置** - Jest、Playwright、Cypress配置
3. **自动化测试流程** - 单元测试、集成测试、E2E测试、性能测试
4. **详细的测试报告** - HTML报告、覆盖率分析、性能指标
5. **CI/CD集成** - GitHub Actions工作流配置
6. **性能优化** - 并行测试、缓存优化、内存管理
7. **故障排除** - 常见问题解决和调试技巧

这套解决方案将显著提高测试效率，减少配置时间，确保代码质量。

---

*测试配置环境与自动化测试指南 v1.0 | 完整版规范的一部分*