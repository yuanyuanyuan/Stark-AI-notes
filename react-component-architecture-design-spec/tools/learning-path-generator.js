#!/usr/bin/env node

/**
 * 学习路径生成器
 * 根据用户水平和目标生成个性化的学习路径
 */

const fs = require('fs').promises;
const path = require('path');

// ==================== 知识图谱 ====================

const KNOWLEDGE_GRAPH = {
  // 基础知识
  basics: {
    html: {
      name: 'HTML基础',
      level: 'beginner',
      duration: '1周',
      prerequisites: [],
      topics: ['标签', '语义化', '表单', 'SEO'],
      resources: {
        docs: ['MDN HTML教程'],
        courses: ['freeCodeCamp HTML'],
        practice: ['HTML练习项目'],
      },
    },
    css: {
      name: 'CSS基础',
      level: 'beginner',
      duration: '2周',
      prerequisites: ['html'],
      topics: ['选择器', '布局', 'Flexbox', 'Grid', '响应式'],
      resources: {
        docs: ['MDN CSS教程'],
        courses: ['CSS完全指南'],
        practice: ['CSS布局挑战'],
      },
    },
    javascript: {
      name: 'JavaScript基础',
      level: 'beginner',
      duration: '4周',
      prerequisites: ['html', 'css'],
      topics: ['语法', '函数', '对象', '数组', 'DOM操作', '事件', '异步'],
      resources: {
        docs: ['MDN JavaScript指南', 'JavaScript.info'],
        courses: ['JavaScript完整教程'],
        practice: ['JavaScript30天挑战'],
      },
    },
  },

  // React核心
  react: {
    reactBasics: {
      name: 'React基础',
      level: 'intermediate',
      duration: '3周',
      prerequisites: ['javascript'],
      topics: ['JSX', '组件', 'Props', 'State', '生命周期', 'Hooks'],
      resources: {
        docs: ['React官方文档', 'React中文文档'],
        courses: ['React完整指南'],
        practice: ['构建待办事项应用'],
      },
    },
    reactAdvanced: {
      name: 'React进阶',
      level: 'intermediate',
      duration: '2周',
      prerequisites: ['reactBasics'],
      topics: ['Context', 'Refs', '高阶组件', 'Render Props', '性能优化', 'Code Splitting'],
      resources: {
        docs: ['React进阶指南'],
        courses: ['React性能优化'],
        practice: ['优化现有项目'],
      },
    },
    reactHooks: {
      name: 'React Hooks深入',
      level: 'intermediate',
      duration: '2周',
      prerequisites: ['reactBasics'],
      topics: ['自定义Hooks', 'useReducer', 'useContext', 'useMemo', 'useCallback', 'useRef'],
      resources: {
        docs: ['Hooks完全指南'],
        courses: ['深入理解Hooks'],
        practice: ['创建自定义Hook库'],
      },
    },
  },

  // 状态管理
  stateManagement: {
    contextApi: {
      name: 'Context API',
      level: 'intermediate',
      duration: '1周',
      prerequisites: ['reactAdvanced'],
      topics: ['Provider/Consumer', '多个Context', '性能考虑'],
      resources: {
        docs: ['Context API指南'],
        courses: ['Context实战'],
        practice: ['主题切换系统'],
      },
    },
    redux: {
      name: 'Redux',
      level: 'intermediate',
      duration: '2周',
      prerequisites: ['reactAdvanced'],
      topics: ['Store', 'Actions', 'Reducers', 'Middleware', 'Redux Toolkit'],
      resources: {
        docs: ['Redux官方文档'],
        courses: ['Redux完整教程'],
        practice: ['电商购物车'],
      },
    },
    zustand: {
      name: 'Zustand',
      level: 'intermediate',
      duration: '3天',
      prerequisites: ['reactHooks'],
      topics: ['Store创建', '状态更新', '中间件', 'DevTools'],
      resources: {
        docs: ['Zustand文档'],
        courses: ['Zustand快速入门'],
        practice: ['用户认证系统'],
      },
    },
    mobx: {
      name: 'MobX',
      level: 'intermediate',
      duration: '1周',
      prerequisites: ['reactAdvanced'],
      topics: ['Observable', 'Actions', 'Computed', 'Reactions'],
      resources: {
        docs: ['MobX文档'],
        courses: ['MobX实战'],
        practice: ['实时协作应用'],
      },
    },
  },

  // 路由
  routing: {
    reactRouter: {
      name: 'React Router',
      level: 'intermediate',
      duration: '1周',
      prerequisites: ['reactBasics'],
      topics: ['路由配置', '嵌套路由', '动态路由', '路由守卫', '懒加载'],
      resources: {
        docs: ['React Router文档'],
        courses: ['路由完全指南'],
        practice: ['多页面应用'],
      },
    },
  },

  // 样式方案
  styling: {
    cssModules: {
      name: 'CSS Modules',
      level: 'intermediate',
      duration: '3天',
      prerequisites: ['css', 'reactBasics'],
      topics: ['局部作用域', '组合', '变量'],
      resources: {
        docs: ['CSS Modules指南'],
        courses: ['CSS Modules实战'],
        practice: ['组件库样式'],
      },
    },
    styledComponents: {
      name: 'Styled Components',
      level: 'intermediate',
      duration: '1周',
      prerequisites: ['reactBasics'],
      topics: ['CSS-in-JS', '主题', '动态样式', 'GlobalStyle'],
      resources: {
        docs: ['Styled Components文档'],
        courses: ['CSS-in-JS完全指南'],
        practice: ['主题系统'],
      },
    },
    tailwindcss: {
      name: 'Tailwind CSS',
      level: 'intermediate',
      duration: '1周',
      prerequisites: ['css', 'reactBasics'],
      topics: ['工具类', '响应式', '自定义配置', 'JIT模式'],
      resources: {
        docs: ['Tailwind文档'],
        courses: ['Tailwind实战'],
        practice: ['响应式布局'],
      },
    },
  },

  // 测试
  testing: {
    jest: {
      name: 'Jest测试框架',
      level: 'intermediate',
      duration: '1周',
      prerequisites: ['javascript'],
      topics: ['单元测试', '快照测试', 'Mock', '覆盖率'],
      resources: {
        docs: ['Jest文档'],
        courses: ['Jest完全指南'],
        practice: ['测试工具函数'],
      },
    },
    reactTestingLibrary: {
      name: 'React Testing Library',
      level: 'intermediate',
      duration: '1周',
      prerequisites: ['reactBasics', 'jest'],
      topics: ['组件测试', '用户交互', '异步测试', '最佳实践'],
      resources: {
        docs: ['Testing Library文档'],
        courses: ['React测试指南'],
        practice: ['测试React组件'],
      },
    },
    cypress: {
      name: 'Cypress E2E测试',
      level: 'advanced',
      duration: '1周',
      prerequisites: ['reactBasics'],
      topics: ['E2E测试', '集成测试', 'CI/CD集成'],
      resources: {
        docs: ['Cypress文档'],
        courses: ['E2E测试实战'],
        practice: ['用户流程测试'],
      },
    },
  },

  // 构建工具
  buildTools: {
    webpack: {
      name: 'Webpack',
      level: 'advanced',
      duration: '2周',
      prerequisites: ['javascript'],
      topics: ['配置', 'Loaders', 'Plugins', '优化', 'Code Splitting'],
      resources: {
        docs: ['Webpack文档'],
        courses: ['Webpack深入'],
        practice: ['自定义构建配置'],
      },
    },
    vite: {
      name: 'Vite',
      level: 'intermediate',
      duration: '3天',
      prerequisites: ['javascript'],
      topics: ['快速开发', 'HMR', '构建优化', '插件'],
      resources: {
        docs: ['Vite文档'],
        courses: ['Vite实战'],
        practice: ['迁移到Vite'],
      },
    },
  },

  // TypeScript
  typescript: {
    tsBasics: {
      name: 'TypeScript基础',
      level: 'intermediate',
      duration: '2周',
      prerequisites: ['javascript'],
      topics: ['类型系统', '接口', '泛型', '类型推断'],
      resources: {
        docs: ['TypeScript手册'],
        courses: ['TypeScript完全指南'],
        practice: ['类型化JavaScript项目'],
      },
    },
    tsReact: {
      name: 'TypeScript + React',
      level: 'intermediate',
      duration: '1周',
      prerequisites: ['tsBasics', 'reactBasics'],
      topics: ['组件类型', 'Props类型', 'Hooks类型', '事件类型'],
      resources: {
        docs: ['React TypeScript指南'],
        courses: ['React TypeScript实战'],
        practice: ['类型安全的React应用'],
      },
    },
  },

  // Next.js
  nextjs: {
    nextBasics: {
      name: 'Next.js基础',
      level: 'intermediate',
      duration: '2周',
      prerequisites: ['reactBasics'],
      topics: ['路由', 'SSR/SSG', 'API Routes', '数据获取'],
      resources: {
        docs: ['Next.js文档'],
        courses: ['Next.js完全指南'],
        practice: ['博客系统'],
      },
    },
    nextAdvanced: {
      name: 'Next.js进阶',
      level: 'advanced',
      duration: '2周',
      prerequisites: ['nextBasics'],
      topics: ['ISR', '中间件', '国际化', '性能优化'],
      resources: {
        docs: ['Next.js进阶'],
        courses: ['Next.js企业级开发'],
        practice: ['电商平台'],
      },
    },
  },

  // 架构设计
  architecture: {
    componentDesign: {
      name: '组件设计模式',
      level: 'advanced',
      duration: '2周',
      prerequisites: ['reactAdvanced'],
      topics: ['原子设计', '组合模式', '高阶组件', 'Render Props'],
      resources: {
        docs: ['组件设计规范'],
        courses: ['组件架构设计'],
        practice: ['组件库开发'],
      },
    },
    projectArchitecture: {
      name: '项目架构设计',
      level: 'advanced',
      duration: '3周',
      prerequisites: ['componentDesign'],
      topics: ['目录结构', '模块化', '分层架构', '微前端'],
      resources: {
        docs: ['架构设计指南'],
        courses: ['企业级架构'],
        practice: ['重构大型项目'],
      },
    },
    designPatterns: {
      name: '设计模式',
      level: 'advanced',
      duration: '2周',
      prerequisites: ['reactAdvanced'],
      topics: ['单例', '工厂', '观察者', '策略', '装饰器'],
      resources: {
        docs: ['设计模式指南'],
        courses: ['JavaScript设计模式'],
        practice: ['模式实践'],
      },
    },
  },

  // 性能优化
  performance: {
    reactPerformance: {
      name: 'React性能优化',
      level: 'advanced',
      duration: '2周',
      prerequisites: ['reactAdvanced'],
      topics: ['渲染优化', 'Memo', 'useMemo', 'useCallback', '虚拟列表'],
      resources: {
        docs: ['性能优化指南'],
        courses: ['React性能'],
        practice: ['优化大型列表'],
      },
    },
    webPerformance: {
      name: 'Web性能优化',
      level: 'advanced',
      duration: '2周',
      prerequisites: ['reactBasics'],
      topics: ['加载优化', '运行时优化', '网络优化', 'PWA'],
      resources: {
        docs: ['Web性能指南'],
        courses: ['性能优化实战'],
        practice: ['性能审计'],
      },
    },
  },
};

// ==================== 学习路径模板 ====================

const LEARNING_PATHS = {
  // 零基础到React开发者
  zeroToReact: {
    name: '零基础到React开发者',
    duration: '3-6个月',
    target: '能独立开发React应用',
    phases: [
      {
        name: '基础阶段',
        duration: '6周',
        modules: ['html', 'css', 'javascript'],
      },
      {
        name: 'React入门',
        duration: '4周',
        modules: ['reactBasics', 'reactRouter'],
      },
      {
        name: 'React进阶',
        duration: '4周',
        modules: ['reactAdvanced', 'reactHooks', 'contextApi'],
      },
      {
        name: '实战项目',
        duration: '4周',
        project: '完整的CRUD应用',
      },
    ],
  },

  // React全栈工程师
  fullStackReact: {
    name: 'React全栈工程师',
    duration: '6-9个月',
    target: '全栈开发能力',
    phases: [
      {
        name: 'React深入',
        duration: '6周',
        modules: ['reactAdvanced', 'reactHooks', 'redux', 'reactRouter'],
      },
      {
        name: 'TypeScript',
        duration: '3周',
        modules: ['tsBasics', 'tsReact'],
      },
      {
        name: 'Next.js全栈',
        duration: '4周',
        modules: ['nextBasics', 'nextAdvanced'],
      },
      {
        name: '测试与部署',
        duration: '3周',
        modules: ['jest', 'reactTestingLibrary', 'cypress'],
      },
      {
        name: '架构设计',
        duration: '4周',
        modules: ['componentDesign', 'projectArchitecture'],
      },
    ],
  },

  // 前端架构师
  frontendArchitect: {
    name: '前端架构师',
    duration: '12个月',
    target: '架构设计和团队领导',
    phases: [
      {
        name: '深入React生态',
        duration: '8周',
        modules: ['reactAdvanced', 'redux', 'mobx', 'zustand'],
      },
      {
        name: '工程化',
        duration: '6周',
        modules: ['webpack', 'vite', 'tsBasics', 'tsReact'],
      },
      {
        name: '架构设计',
        duration: '8周',
        modules: ['componentDesign', 'projectArchitecture', 'designPatterns'],
      },
      {
        name: '性能专家',
        duration: '6周',
        modules: ['reactPerformance', 'webPerformance'],
      },
      {
        name: '大型项目实战',
        duration: '12周',
        project: '企业级应用架构设计与实现',
      },
    ],
  },

  // 快速转型React
  quickTransition: {
    name: '快速转型React（有前端经验）',
    duration: '1-2个月',
    target: '快速上手React开发',
    phases: [
      {
        name: 'React核心',
        duration: '2周',
        modules: ['reactBasics', 'reactHooks'],
      },
      {
        name: '生态系统',
        duration: '2周',
        modules: ['reactRouter', 'redux', 'styledComponents'],
      },
      {
        name: '实战强化',
        duration: '2周',
        project: '迁移现有项目到React',
      },
    ],
  },
};

// ==================== 学习路径生成器 ====================

class LearningPathGenerator {
  constructor() {
    this.knowledgeGraph = KNOWLEDGE_GRAPH;
    this.paths = LEARNING_PATHS;
  }

  /**
   * 评估用户水平
   */
  assessUserLevel(skills) {
    const levels = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };

    // 统计各水平技能数量
    Object.values(this.knowledgeGraph).forEach(category => {
      Object.values(category).forEach(module => {
        if (skills.includes(module.name)) {
          levels[module.level]++;
        }
      });
    });

    // 确定整体水平
    if (levels.advanced > 2) return 'advanced';
    if (levels.intermediate > 3) return 'intermediate';
    return 'beginner';
  }

  /**
   * 生成个性化学习路径
   */
  generatePersonalizedPath(profile) {
    const {
      currentSkills = [],
      targetRole,
      availableHours = 10, // 每周可用学习时间
      preferredStyle, // 理论型、实践型、混合型
      deadline, // 目标完成时间
    } = profile;

    const userLevel = this.assessUserLevel(currentSkills);
    const path = {
      profile: {
        level: userLevel,
        targetRole,
        weeklyHours: availableHours,
        style: preferredStyle || 'mixed',
      },
      phases: [],
      totalDuration: 0,
      recommendations: [],
    };

    // 根据目标角色选择基础路径
    let basePath;
    switch (targetRole) {
      case 'React开发者':
        basePath = userLevel === 'beginner' ? this.paths.zeroToReact : this.paths.quickTransition;
        break;
      case '全栈工程师':
        basePath = this.paths.fullStackReact;
        break;
      case '架构师':
        basePath = this.paths.frontendArchitect;
        break;
      default:
        basePath = this.paths.zeroToReact;
    }

    // 过滤已掌握的模块
    basePath.phases.forEach(phase => {
      const filteredModules = phase.modules?.filter(moduleKey => {
        const module = this.findModule(moduleKey);
        return module && !currentSkills.includes(module.name);
      }) || [];

      if (filteredModules.length > 0 || phase.project) {
        path.phases.push({
          ...phase,
          modules: filteredModules,
          estimatedWeeks: this.calculatePhaseDuration(filteredModules, availableHours),
        });
      }
    });

    // 计算总时长
    path.totalDuration = path.phases.reduce((sum, phase) => sum + phase.estimatedWeeks, 0);

    // 生成建议
    path.recommendations = this.generateRecommendations(profile, path);

    return path;
  }

  /**
   * 查找模块
   */
  findModule(moduleKey) {
    for (const category of Object.values(this.knowledgeGraph)) {
      if (category[moduleKey]) {
        return category[moduleKey];
      }
    }
    return null;
  }

  /**
   * 计算阶段时长
   */
  calculatePhaseDuration(modules, weeklyHours) {
    const totalHours = modules.reduce((sum, moduleKey) => {
      const module = this.findModule(moduleKey);
      if (module) {
        const weeks = parseInt(module.duration) || 1;
        return sum + weeks * 20; // 假设每周需要20小时标准学习时间
      }
      return sum;
    }, 0);

    return Math.ceil(totalHours / weeklyHours);
  }

  /**
   * 生成学习建议
   */
  generateRecommendations(profile, path) {
    const recommendations = [];

    // 时间管理建议
    if (profile.availableHours < 10) {
      recommendations.push({
        type: 'time',
        priority: 'high',
        message: '建议每周至少投入10小时学习时间，以保持学习连续性和效果',
      });
    }

    // 学习风格建议
    if (profile.preferredStyle === 'practical') {
      recommendations.push({
        type: 'style',
        priority: 'medium',
        message: '推荐通过项目驱动学习，每个模块都配合实际项目练习',
      });
    }

    // 补充学习建议
    if (profile.targetRole === '架构师' && !profile.currentSkills.includes('设计模式')) {
      recommendations.push({
        type: 'skill',
        priority: 'high',
        message: '强烈建议学习设计模式，这是架构师必备技能',
      });
    }

    // 学习社区建议
    recommendations.push({
      type: 'community',
      priority: 'medium',
      message: '加入React中文社区，参与开源项目，可以加速学习进程',
    });

    return recommendations;
  }

  /**
   * 生成学习计划
   */
  generateStudyPlan(path) {
    const plan = {
      overview: path,
      weekly: [],
      milestones: [],
      resources: {},
    };

    let weekCounter = 1;
    
    path.phases.forEach((phase, phaseIndex) => {
      // 添加里程碑
      plan.milestones.push({
        week: weekCounter,
        phase: phase.name,
        goal: phase.project || `完成${phase.modules.length}个模块学习`,
      });

      // 生成每周计划
      phase.modules?.forEach(moduleKey => {
        const module = this.findModule(moduleKey);
        if (module) {
          const moduleWeeks = parseInt(module.duration) || 1;
          
          for (let w = 0; w < moduleWeeks; w++) {
            plan.weekly.push({
              week: weekCounter++,
              module: module.name,
              topics: module.topics.slice(w * 3, (w + 1) * 3),
              resources: module.resources,
              practice: `完成${module.name}第${w + 1}周练习`,
            });
          }

          // 收集资源
          plan.resources[module.name] = module.resources;
        }
      });

      // 项目周
      if (phase.project) {
        const projectWeeks = phase.estimatedWeeks - (phase.modules?.length || 0);
        for (let w = 0; w < projectWeeks; w++) {
          plan.weekly.push({
            week: weekCounter++,
            module: '项目实战',
            topics: ['需求分析', '架构设计', '功能实现', '测试部署'],
            practice: phase.project,
          });
        }
      }
    });

    return plan;
  }

  /**
   * 生成学习路径图
   */
  generateRoadmap(path) {
    const roadmap = [];
    
    roadmap.push('# 📚 个性化学习路径\n');
    roadmap.push(`## 目标: ${path.profile.targetRole}`);
    roadmap.push(`- 当前水平: ${path.profile.level}`);
    roadmap.push(`- 每周学习时间: ${path.profile.weeklyHours}小时`);
    roadmap.push(`- 预计总时长: ${path.totalDuration}周\n`);
    
    roadmap.push('## 🎯 学习阶段\n');
    
    path.phases.forEach((phase, index) => {
      roadmap.push(`### 第${index + 1}阶段: ${phase.name}`);
      roadmap.push(`预计时长: ${phase.estimatedWeeks}周\n`);
      
      if (phase.modules && phase.modules.length > 0) {
        roadmap.push('**学习模块:**');
        phase.modules.forEach(moduleKey => {
          const module = this.findModule(moduleKey);
          if (module) {
            roadmap.push(`- [ ] ${module.name} (${module.duration})`);
            module.topics.slice(0, 3).forEach(topic => {
              roadmap.push(`  - ${topic}`);
            });
          }
        });
      }
      
      if (phase.project) {
        roadmap.push(`\n**实战项目:** ${phase.project}`);
      }
      
      roadmap.push('');
    });
    
    if (path.recommendations.length > 0) {
      roadmap.push('## 💡 学习建议\n');
      path.recommendations.forEach(rec => {
        const icon = rec.priority === 'high' ? '❗' : '💡';
        roadmap.push(`${icon} ${rec.message}`);
      });
    }
    
    return roadmap.join('\n');
  }
}

// ==================== 进度跟踪器 ====================

class ProgressTracker {
  constructor() {
    this.progress = {
      startDate: null,
      modules: {},
      milestones: [],
      totalHours: 0,
    };
  }

  /**
   * 开始学习
   */
  startLearning(path) {
    this.progress.startDate = new Date();
    this.progress.path = path;
    
    // 初始化模块进度
    path.phases.forEach(phase => {
      phase.modules?.forEach(moduleKey => {
        this.progress.modules[moduleKey] = {
          status: 'pending',
          startDate: null,
          endDate: null,
          hoursSpent: 0,
          completion: 0,
        };
      });
    });
  }

  /**
   * 更新进度
   */
  updateProgress(moduleKey, updates) {
    if (this.progress.modules[moduleKey]) {
      Object.assign(this.progress.modules[moduleKey], updates);
      
      if (updates.completion === 100) {
        this.progress.modules[moduleKey].status = 'completed';
        this.progress.modules[moduleKey].endDate = new Date();
      } else if (updates.completion > 0) {
        this.progress.modules[moduleKey].status = 'in-progress';
        if (!this.progress.modules[moduleKey].startDate) {
          this.progress.modules[moduleKey].startDate = new Date();
        }
      }
    }
  }

  /**
   * 生成进度报告
   */
  generateProgressReport() {
    const report = {
      overview: {
        startDate: this.progress.startDate,
        daysElapsed: Math.floor((new Date() - this.progress.startDate) / (1000 * 60 * 60 * 24)),
        totalModules: Object.keys(this.progress.modules).length,
        completedModules: Object.values(this.progress.modules).filter(m => m.status === 'completed').length,
        inProgressModules: Object.values(this.progress.modules).filter(m => m.status === 'in-progress').length,
        totalHours: this.progress.totalHours,
      },
      modules: this.progress.modules,
      completionRate: 0,
      estimatedCompletion: null,
    };

    // 计算完成率
    report.completionRate = (report.overview.completedModules / report.overview.totalModules * 100).toFixed(1);

    // 预估完成时间
    if (report.overview.completedModules > 0) {
      const avgDaysPerModule = report.overview.daysElapsed / report.overview.completedModules;
      const remainingModules = report.overview.totalModules - report.overview.completedModules;
      const estimatedDays = Math.ceil(avgDaysPerModule * remainingModules);
      
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + estimatedDays);
      report.estimatedCompletion = completionDate;
    }

    return report;
  }
}

// ==================== CLI接口 ====================

class LearningPathCLI {
  constructor() {
    this.generator = new LearningPathGenerator();
    this.tracker = new ProgressTracker();
  }

  parseArgs() {
    const args = process.argv.slice(2);
    const command = args[0];
    const options = {};
    
    for (let i = 1; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        const key = args[i].substring(2);
        const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
        options[key] = value;
      }
    }
    
    return { command, options };
  }

  showHelp() {
    console.log(`
学习路径生成器 - 个性化React学习路径规划

使用方法:
  node learning-path-generator.js <command> [options]

命令:
  generate          生成学习路径
    --role          目标角色: React开发者|全栈工程师|架构师
    --level         当前水平: beginner|intermediate|advanced
    --hours         每周学习时间 (默认: 10)
    --style         学习风格: theory|practical|mixed
    --skills        已掌握技能 (逗号分隔)
    
  plan              生成详细学习计划
    --path          学习路径名称
    --output        输出文件路径
    
  track             跟踪学习进度
    --module        模块名称
    --progress      完成百分比
    --hours         学习时长
    
  report            生成进度报告
    --format        输出格式: text|json|html
    
  list              列出可用资源
    --type          资源类型: paths|modules|resources

示例:
  # 生成React开发者学习路径
  node learning-path-generator.js generate --role "React开发者" --level beginner --hours 15
  
  # 生成详细学习计划
  node learning-path-generator.js plan --path zeroToReact
  
  # 更新学习进度
  node learning-path-generator.js track --module reactBasics --progress 50 --hours 10
    `);
  }

  async run() {
    const { command, options } = this.parseArgs();
    
    try {
      switch (command) {
        case 'generate': {
          const profile = {
            targetRole: options.role || 'React开发者',
            currentSkills: options.skills ? options.skills.split(',') : [],
            availableHours: parseInt(options.hours) || 10,
            preferredStyle: options.style || 'mixed',
          };
          
          console.log('\n生成个性化学习路径...\n');
          const path = this.generator.generatePersonalizedPath(profile);
          const roadmap = this.generator.generateRoadmap(path);
          
          console.log(roadmap);
          
          if (options.output) {
            await fs.writeFile(options.output, roadmap);
            console.log(`\n学习路径已保存到: ${options.output}`);
          }
          break;
        }
        
        case 'plan': {
          const pathName = options.path || 'zeroToReact';
          const basePath = LEARNING_PATHS[pathName];
          
          if (!basePath) {
            console.error(`Unknown path: ${pathName}`);
            this.listPaths();
            process.exit(1);
          }
          
          console.log(`\n生成 ${basePath.name} 详细学习计划...\n`);
          
          const path = {
            profile: { targetRole: basePath.target, weeklyHours: 20 },
            phases: basePath.phases,
            totalDuration: 0,
          };
          
          const plan = this.generator.generateStudyPlan(path);
          
          // 输出每周计划
          console.log('## 📅 每周学习计划\n');
          plan.weekly.forEach(week => {
            console.log(`### 第${week.week}周: ${week.module}`);
            console.log('**学习内容:**');
            week.topics?.forEach(topic => console.log(`- ${topic}`));
            console.log(`**实践:** ${week.practice}`);
            console.log('');
          });
          
          // 输出里程碑
          console.log('## 🎯 学习里程碑\n');
          plan.milestones.forEach(milestone => {
            console.log(`- 第${milestone.week}周: ${milestone.phase} - ${milestone.goal}`);
          });
          break;
        }
        
        case 'track': {
          const moduleKey = options.module;
          const progress = parseInt(options.progress) || 0;
          const hours = parseInt(options.hours) || 0;
          
          if (!moduleKey) {
            console.error('Please specify module name');
            process.exit(1);
          }
          
          this.tracker.updateProgress(moduleKey, {
            completion: progress,
            hoursSpent: hours,
          });
          
          console.log(`✅ 进度已更新: ${moduleKey} - ${progress}% 完成`);
          break;
        }
        
        case 'report': {
          const report = this.tracker.generateProgressReport();
          
          console.log('\n## 📊 学习进度报告\n');
          console.log(`- 开始日期: ${report.overview.startDate || '未开始'}`);
          console.log(`- 学习天数: ${report.overview.daysElapsed || 0}天`);
          console.log(`- 完成模块: ${report.overview.completedModules}/${report.overview.totalModules}`);
          console.log(`- 完成率: ${report.completionRate}%`);
          console.log(`- 总学习时长: ${report.overview.totalHours}小时`);
          
          if (report.estimatedCompletion) {
            console.log(`- 预计完成: ${report.estimatedCompletion.toLocaleDateString()}`);
          }
          break;
        }
        
        case 'list': {
          const type = options.type || 'paths';
          
          if (type === 'paths') {
            this.listPaths();
          } else if (type === 'modules') {
            this.listModules();
          } else if (type === 'resources') {
            this.listResources();
          }
          break;
        }
        
        default:
          this.showHelp();
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }

  listPaths() {
    console.log('\n## 可用学习路径:\n');
    Object.entries(LEARNING_PATHS).forEach(([key, path]) => {
      console.log(`- ${key}: ${path.name}`);
      console.log(`  时长: ${path.duration}`);
      console.log(`  目标: ${path.target}`);
      console.log('');
    });
  }

  listModules() {
    console.log('\n## 可用学习模块:\n');
    Object.entries(KNOWLEDGE_GRAPH).forEach(([category, modules]) => {
      console.log(`### ${category}`);
      Object.values(modules).forEach(module => {
        console.log(`- ${module.name} (${module.level}, ${module.duration})`);
      });
      console.log('');
    });
  }

  listResources() {
    console.log('\n## 学习资源推荐:\n');
    console.log('### 官方文档');
    console.log('- React官方文档: https://react.dev');
    console.log('- React中文文档: https://zh-hans.react.dev');
    console.log('');
    console.log('### 在线课程');
    console.log('- freeCodeCamp');
    console.log('- Udemy React课程');
    console.log('- Frontend Masters');
    console.log('');
    console.log('### 实战项目');
    console.log('- 30 Days of React');
    console.log('- React Projects');
    console.log('- Open Source贡献');
  }
}

// ==================== 导出模块 ====================

module.exports = {
  LearningPathGenerator,
  ProgressTracker,
  KNOWLEDGE_GRAPH,
  LEARNING_PATHS,
};

// ==================== CLI入口 ====================

if (require.main === module) {
  const cli = new LearningPathCLI();
  cli.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}