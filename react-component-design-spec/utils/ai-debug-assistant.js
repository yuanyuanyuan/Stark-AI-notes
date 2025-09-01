// utils/ai-debug-assistant.js
/**
 * AI调试助手
 * 为AI大模型提供智能调试支持
 */

export class AIDebugAssistant {
  constructor() {
    this.errorPatterns = this.loadErrorPatterns();
    this.solutionDatabase = this.loadSolutions();
    this.debugHistory = [];
    this.context = {
      environment: this.detectEnvironment(),
      reactVersion: this.getReactVersion(),
      projectType: this.detectProjectType()
    };
  }

  // 主要诊断方法
  async diagnoseIssue(issueDescription, context = {}) {
    console.log('🤖 [AI ASSISTANT] 开始诊断问题...');
    
    // 解析问题描述
    const parsedIssue = this.parseIssueDescription(issueDescription);
    
    // 收集上下文信息
    const fullContext = { ...this.context, ...context };
    
    // 分析问题类型
    const analysis = await this.analyzeIssue(parsedIssue, fullContext);
    
    // 生成解决方案
    const solutions = await this.generateSolutions(analysis, fullContext);
    
    // 提供预防建议
    const prevention = await this.generatePreventionTips(analysis);
    
    // 记录诊断历史
    this.recordDiagnosis(parsedIssue, analysis, solutions);
    
    return {
      issue: parsedIssue,
      analysis,
      solutions,
      prevention,
      confidence: this.calculateConfidence(analysis),
      followUpQuestions: this.generateFollowUpQuestions(analysis)
    };
  }

  // 解析问题描述
  parseIssueDescription(description) {
    const patterns = {
      // 错误信息模式
      error: {
        regex: /error:?\s*(.+)/i,
        extractor: (match) => ({
          type: 'error',
          message: match[1],
          severity: 'high'
        })
      },
      
      // 性能问题模式
      performance: {
        regex: /(slow|performance|lag|freeze|crash)/i,
        extractor: (match) => ({
          type: 'performance',
          symptom: match[1],
          severity: 'medium'
        })
      },
      
      // 渲染问题模式
      rendering: {
        regex: /(render|display|ui|interface)/i,
        extractor: (match) => ({
          type: 'rendering',
          symptom: match[1],
          severity: 'medium'
        })
      },
      
      // 状态问题模式
      state: {
        regex: /(state|props|data|update)/i,
        extractor: (match) => ({
          type: 'state',
          symptom: match[1],
          severity: 'medium'
        })
      },
      
      // 网络问题模式
      network: {
        regex: /(network|api|fetch|request|response)/i,
        extractor: (match) => ({
          type: 'network',
          symptom: match[1],
          severity: 'medium'
        })
      }
    };

    // 尝试匹配各种模式
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = description.match(pattern.regex);
      if (match) {
        return pattern.extractor(match);
      }
    }

    // 默认返回通用问题
    return {
      type: 'general',
      message: description,
      severity: 'medium'
    };
  }

  // 分析问题
  async analyzeIssue(issue, context) {
    const analysis = {
      category: issue.type,
      severity: issue.severity,
      possibleCauses: [],
      relevantFactors: [],
      debuggingSteps: []
    };

    // 基于问题类型进行分析
    switch (issue.type) {
      case 'error':
        analysis.possibleCauses = this.analyzeErrorCauses(issue.message, context);
        analysis.debuggingSteps = this.generateErrorDebuggingSteps(issue.message);
        break;
      
      case 'performance':
        analysis.possibleCauses = this.analyzePerformanceCauses(issue.symptom, context);
        analysis.debuggingSteps = this.generatePerformanceDebuggingSteps();
        break;
      
      case 'rendering':
        analysis.possibleCauses = this.analyzeRenderingCauses(issue.symptom, context);
        analysis.debuggingSteps = this.generateRenderingDebuggingSteps();
        break;
      
      case 'state':
        analysis.possibleCauses = this.analyzeStateCauses(issue.symptom, context);
        analysis.debuggingSteps = this.generateStateDebuggingSteps();
        break;
      
      case 'network':
        analysis.possibleCauses = this.analyzeNetworkCauses(issue.symptom, context);
        analysis.debuggingSteps = this.generateNetworkDebuggingSteps();
        break;
      
      default:
        analysis.possibleCauses = this.analyzeGeneralCauses(issue.message, context);
        analysis.debuggingSteps = this.generateGeneralDebuggingSteps();
    }

    // 分析相关因素
    analysis.relevantFactors = this.analyzeRelevantFactors(context);

    return analysis;
  }

  // 分析错误原因
  analyzeErrorCauses(errorMessage, context) {
    const causes = [];
    
    // 常见错误模式
    if (errorMessage.includes('Cannot read property')) {
      causes.push({
        cause: '空值引用',
        likelihood: 'high',
        description: '尝试访问null或undefined对象的属性',
        solution: '添加空值检查或使用可选链操作符'
      });
    }
    
    if (errorMessage.includes('Maximum update depth exceeded')) {
      causes.push({
        cause: '无限渲染循环',
        likelihood: 'high',
        description: '组件在渲染过程中更新状态导致无限循环',
        solution: '检查useEffect依赖项和状态更新逻辑'
      });
    }
    
    if (errorMessage.includes('Hook rules')) {
      causes.push({
        cause: 'Hook规则违反',
        likelihood: 'high',
        description: 'Hook使用不当，如在条件语句中使用',
        solution: '确保Hook在组件顶层调用'
      });
    }
    
    if (errorMessage.includes('Network Error')) {
      causes.push({
        cause: '网络连接问题',
        likelihood: 'medium',
        description: '网络请求失败',
        solution: '检查网络连接和API端点'
      });
    }

    return causes;
  }

  // 分析性能问题原因
  analyzePerformanceCauses(symptom, context) {
    return [
      {
        cause: '未优化的重渲染',
        likelihood: 'high',
        description: '组件不必要的重渲染导致性能下降',
        solution: '使用React.memo、useMemo、useCallback优化'
      },
      {
        cause: '大数据量渲染',
        likelihood: 'medium',
        description: '大量数据一次性渲染导致卡顿',
        solution: '使用虚拟化列表或分页加载'
      },
      {
        cause: '内存泄漏',
        likelihood: 'medium',
        description: '未清理的事件监听器或定时器',
        solution: '在useEffect中返回清理函数'
      }
    ];
  }

  // 分析渲染问题原因
  analyzeRenderingCauses(symptom, context) {
    return [
      {
        cause: 'CSS样式问题',
        likelihood: 'high',
        description: 'CSS样式冲突或缺失',
        solution: '检查CSS类名和样式优先级'
      },
      {
        cause: '条件渲染逻辑错误',
        likelihood: 'medium',
        description: '条件判断逻辑有问题',
        solution: '检查渲染条件和状态值'
      },
      {
        cause: '组件key问题',
        likelihood: 'medium',
        description: '列表渲染时key设置不当',
        solution: '使用稳定且唯一的key值'
      }
    ];
  }

  // 分析状态问题原因
  analyzeStateCauses(symptom, context) {
    return [
      {
        cause: '状态更新异步',
        likelihood: 'high',
        description: '基于过时状态进行更新',
        solution: '使用函数式更新或useEffect同步'
      },
      {
        cause: '状态提升不当',
        likelihood: 'medium',
        description: '状态位置设计不合理',
        solution: '重新设计状态管理架构'
      },
      {
        cause: '依赖项配置错误',
        likelihood: 'medium',
        description: 'useEffect依赖项配置不当',
        solution: '检查和优化useEffect依赖项'
      }
    ];
  }

  // 分析网络问题原因
  analyzeNetworkCauses(symptom, context) {
    return [
      {
        cause: 'API端点错误',
        likelihood: 'high',
        description: 'API端点配置错误或服务不可用',
        solution: '检查API配置和服务状态'
      },
      {
        cause: '请求参数错误',
        likelihood: 'medium',
        description: '请求参数格式或值不正确',
        solution: '验证请求参数格式'
      },
      {
        cause: '响应处理错误',
        likelihood: 'medium',
        description: '响应数据处理逻辑有问题',
        solution: '检查响应数据解析逻辑'
      }
    ];
  }

  // 生成解决方案
  async generateSolutions(analysis, context) {
    const solutions = [];
    
    // 基于分析结果生成解决方案
    for (const cause of analysis.possibleCauses) {
      const solution = this.findSolutionForCause(cause, context);
      if (solution) {
        solutions.push(solution);
      }
    }
    
    // 按优先级排序
    return solutions.sort((a, b) => b.priority - a.priority);
  }

  // 查找特定原因的解决方案
  findSolutionForCause(cause, context) {
    const solutionKey = this.generateSolutionKey(cause.cause);
    const baseSolution = this.solutionDatabase[solutionKey];
    
    if (!baseSolution) {
      return this.generateGenericSolution(cause);
    }
    
    return {
      ...baseSolution,
      cause: cause.cause,
      likelihood: cause.likelihood,
      context: context
    };
  }

  // 生成解决方案键
  generateSolutionKey(cause) {
    return cause.toLowerCase().replace(/\s+/g, '_');
  }

  // 生成通用解决方案
  generateGenericSolution(cause) {
    return {
      title: `解决${cause.cause}`,
      description: cause.description,
      steps: [
        '检查相关代码逻辑',
        '添加调试日志',
        '逐步排查问题',
        '参考最佳实践'
      ],
      codeExample: this.generateGenericCodeExample(cause),
      priority: 5
    };
  }

  // 生成通用代码示例
  generateGenericCodeExample(cause) {
    return `
// 通用调试示例
console.log('调试信息:', {
  context: '相关上下文',
  data: '相关数据',
  timestamp: new Date().toISOString()
});

// 添加错误边界
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// 性能优化
const MemoizedComponent = React.memo(YourComponent);
`;
  }

  // 生成预防建议
  async generatePreventionTips(analysis) {
    const tips = [];
    
    // 基于问题类型生成预防建议
    switch (analysis.category) {
      case 'error':
        tips.push('使用TypeScript进行类型检查');
        tips.push('添加PropTypes验证');
        tips.push('实现错误边界');
        tips.push('编写单元测试');
        break;
      
      case 'performance':
        tips.push('使用React DevTools Profiler');
        tips.push('实施代码分割和懒加载');
        tips.push('使用useMemo和useCallback优化');
        tips.push('监控组件渲染性能');
        break;
      
      case 'rendering':
        tips.push('使用CSS Modules或样式组件');
        tips.push('确保列表项有稳定的key');
        tips.push('使用CSS变量管理主题');
        tips.push('测试不同屏幕尺寸');
        break;
      
      case 'state':
        tips.push('合理设计状态架构');
        tips.push('使用useReducer管理复杂状态');
        tips.push('避免状态提升过度');
        tips.push('使用Context API共享状态');
        break;
      
      case 'network':
        tips.push('实现请求重试机制');
        tips.push('添加加载状态处理');
        tips.push('实现错误处理逻辑');
        tips.push('使用请求缓存和防抖');
        break;
    }
    
    return tips;
  }

  // 生成后续问题
  generateFollowUpQuestions(analysis) {
    const questions = [];
    
    // 基于分析结果生成后续问题
    if (analysis.category === 'error') {
      questions.push('错误是否可以稳定复现？');
      questions.push('错误在哪个浏览器/环境中出现？');
      questions.push('是否有相关的控制台日志？');
    }
    
    if (analysis.category === 'performance') {
      questions.push('性能问题在什么操作时出现？');
      questions.push('数据量大约是多少？');
      questions.push('是否使用了性能监控工具？');
    }
    
    if (analysis.category === 'state') {
      questions.push('状态更新触发了哪些副作用？');
      questions.push('是否使用了状态管理库？');
      questions.push('组件层级结构如何？');
    }
    
    return questions;
  }

  // 计算诊断置信度
  calculateConfidence(analysis) {
    if (analysis.possibleCauses.length === 0) {
      return 0.3; // 低置信度
    }
    
    const highConfidenceCauses = analysis.possibleCauses.filter(
      cause => cause.likelihood === 'high'
    ).length;
    
    const totalCauses = analysis.possibleCauses.length;
    
    return Math.min(0.9, (highConfidenceCauses / totalCauses) + 0.3);
  }

  // 记录诊断历史
  recordDiagnosis(issue, analysis, solutions) {
    this.debugHistory.push({
      timestamp: new Date().toISOString(),
      issue,
      analysis,
      solutions,
      confidence: this.calculateConfidence(analysis)
    });
  }

  // 检测环境
  detectEnvironment() {
    if (typeof window !== 'undefined') {
      return {
        type: 'browser',
        userAgent: navigator.userAgent,
        url: window.location.href
      };
    } else {
      return {
        type: 'node',
        version: process.version,
        platform: process.platform
      };
    }
  }

  // 获取React版本
  getReactVersion() {
    try {
      return React.version;
    } catch (error) {
      return 'unknown';
    }
  }

  // 检测项目类型
  detectProjectType() {
    // 这里可以添加更复杂的项目类型检测逻辑
    return 'react';
  }

  // 分析相关因素
  analyzeRelevantFactors(context) {
    const factors = [];
    
    // 环境因素
    if (context.environment) {
      factors.push({
        type: 'environment',
        value: context.environment.type,
        relevance: 'medium'
      });
    }
    
    // React版本因素
    if (context.reactVersion) {
      factors.push({
        type: 'react_version',
        value: context.reactVersion,
        relevance: 'high'
      });
    }
    
    // 项目类型因素
    if (context.projectType) {
      factors.push({
        type: 'project_type',
        value: context.projectType,
        relevance: 'medium'
      });
    }
    
    return factors;
  }

  // 生成调试步骤
  generateErrorDebuggingSteps(errorMessage) {
    return [
      '检查错误信息中的关键线索',
      '查看错误堆栈跟踪',
      '检查相关组件的代码',
      '验证数据流和状态',
      '检查网络请求（如果相关）',
      '使用浏览器开发者工具调试'
    ];
  }

  generatePerformanceDebuggingSteps() {
    return [
      '使用React DevTools Profiler分析性能',
      '检查组件重渲染次数',
      '识别性能瓶颈组件',
      '检查大数据量渲染',
      '分析内存使用情况',
      '实施性能优化措施'
    ];
  }

  generateRenderingDebuggingSteps() {
    return [
      '检查组件的JSX结构',
      '验证CSS样式应用',
      '检查条件渲染逻辑',
      '验证props传递',
      '检查组件key设置',
      '使用浏览器开发者工具检查DOM'
    ];
  }

  generateStateDebuggingSteps() {
    return [
      '检查状态初始值',
      '验证状态更新逻辑',
      '检查useEffect依赖项',
      '验证状态传递和共享',
      '检查异步状态更新',
      '使用React DevTools监控状态'
    ];
  }

  generateNetworkDebuggingSteps() {
    return [
      '检查网络连接',
      '验证API端点配置',
      '检查请求参数',
      '查看响应数据格式',
      '检查错误处理逻辑',
      '使用网络面板分析请求'
    ];
  }

  generateGeneralDebuggingSteps() {
    return [
      '收集问题信息',
      '复现问题',
      '分析可能原因',
      '实施解决方案',
      '验证修复效果',
      '添加预防措施'
    ];
  }

  // 加载错误模式
  loadErrorPatterns() {
    return [
      {
        id: 'null_reference',
        patterns: [
          'Cannot read property',
          'Cannot read properties',
          'undefined is not an object'
        ],
        type: 'error',
        severity: 'high'
      },
      {
        id: 'infinite_loop',
        patterns: [
          'Maximum update depth exceeded',
          'infinite loop',
          'too much recursion'
        ],
        type: 'error',
        severity: 'high'
      },
      {
        id: 'hook_violation',
        patterns: [
          'Hook rules',
          'cannot call hook',
          'invalid hook call'
        ],
        type: 'error',
        severity: 'high'
      }
    ];
  }

  // 加载解决方案数据库
  loadSolutions() {
    return {
      null_reference: {
        title: '解决空值引用错误',
        description: '处理null或undefined值的引用问题',
        steps: [
          '添加空值检查',
          '使用可选链操作符',
          '提供默认值',
          '使用TypeScript类型检查'
        ],
        codeExample: `// 错误示例
const name = user.name; // 可能为undefined

// 解决方案1: 可选链操作符
const name = user?.name;

// 解决方案2: 空值检查
const name = user && user.name;

// 解决方案3: 默认值
const name = user?.name || '默认值';

// 解决方案4: TypeScript
interface User {
  name?: string;
}

const name = (user as User)?.name;`,
        priority: 9
      },
      
      infinite_loop: {
        title: '解决无限渲染循环',
        description: '修复组件无限重渲染问题',
        steps: [
          '检查useEffect依赖项',
          '避免在渲染过程中更新状态',
          '使用useCallback和useMemo',
          '检查递归组件调用'
        ],
        codeExample: `// 错误示例
function BadComponent() {
  const [count, setCount] = useState(0);
  
  // 在渲染过程中更新状态导致无限循环
  setCount(count + 1); // ❌
  
  return <div>{count}</div>;
}

// 正确示例
function GoodComponent() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // 在effect中更新状态
    const timer = setInterval(() => {
      setCount(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return <div>{count}</div>;
}`,
        priority: 9
      },
      
      performance_optimization: {
        title: '性能优化方案',
        description: '优化React组件性能',
        steps: [
          '使用React.memo避免不必要的重渲染',
          '使用useMemo缓存计算结果',
          '使用useCallback缓存函数',
          '实现虚拟化列表',
          '代码分割和懒加载'
        ],
        codeExample: `// 优化前
function ExpensiveComponent({ data, onClick }) {
  const processedData = data.map(item => {
    // 复杂计算
    return item.value * 2;
  });
  
  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={onClick}>
          {item.value}
        </div>
      ))}
    </div>
  );
}

// 优化后
const OptimizedComponent = React.memo(({ data, onClick }) => {
  const processedData = useMemo(() => {
    return data.map(item => item.value * 2);
  }, [data]);
  
  const handleClick = useCallback((item) => {
    onClick(item);
  }, [onClick]);
  
  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={() => handleClick(item)}>
          {item.value}
        </div>
      ))}
    </div>
  );
});`,
        priority: 8
      }
    };
  }

  // 获取诊断历史
  getDebugHistory() {
    return this.debugHistory;
  }

  // 清空历史记录
  clearHistory() {
    this.debugHistory = [];
  }

  // 导出诊断报告
  exportReport() {
    return {
      context: this.context,
      history: this.debugHistory,
      patterns: this.errorPatterns,
      solutions: this.solutionDatabase
    };
  }
}

// 创建全局AI调试助手实例
const aiDebugAssistant = new AIDebugAssistant();

// 导出工具函数
export const debugAssistant = {
  diagnose: async (issue, context) => {
    return await aiDebugAssistant.diagnoseIssue(issue, context);
  },
  
  getHistory: () => aiDebugAssistant.getDebugHistory(),
  
  clearHistory: () => aiDebugAssistant.clearHistory(),
  
  exportReport: () => aiDebugAssistant.exportReport()
};

// 为AI大模型提供的调试对话模板
export const debugConversationTemplates = {
  errorDiagnosis: {
    title: '错误诊断对话',
    template: `
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
    `
  },
  
  performanceOptimization: {
    title: '性能优化对话',
    template: `
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
    `
  },
  
  codeReview: {
    title: '代码审查对话',
    template: `
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
    `
  }
};

export default aiDebugAssistant;