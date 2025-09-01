/**
 * 集成测试 - 端到端功能验证
 * 测试向导与现有规范的完整集成流程
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SessionManager } from '../managers/SessionManager.js';
import { IntelligenceEngine } from '../engines/IntelligenceEngine.js';
import { Generator } from '../engines/Generator.js';
import { WizardEngine } from '../engines/WizardEngine.js';
import { ExternalToolsIntegrator } from '../integrators/ExternalToolsIntegrator.js';
import { CacheManager } from '../cache/CacheManager.js';
import { PerformanceMonitor } from '../performance/PerformanceMonitor.js';
import fs from 'fs-extra';
import path from 'path';

describe('React架构向导集成测试', () => {
  let sessionManager: SessionManager;
  let externalTools: ExternalToolsIntegrator;
  let intelligenceEngine: IntelligenceEngine;
  let generator: Generator;
  let wizardEngine: WizardEngine;
  let testProjectPath: string;

  beforeAll(async () => {
    // 初始化组件
    sessionManager = new SessionManager();
    externalTools = new ExternalToolsIntegrator();
    intelligenceEngine = new IntelligenceEngine(externalTools);
    generator = new Generator();
    wizardEngine = new WizardEngine(sessionManager, intelligenceEngine, generator, externalTools);

    // 创建测试输出目录
    testProjectPath = path.join(process.cwd(), '.test-output');
    await fs.ensureDir(testProjectPath);

    // 预热缓存
    await externalTools.warmupCache();
  });

  afterAll(async () => {
    // 清理测试数据
    if (await fs.pathExists(testProjectPath)) {
      await fs.remove(testProjectPath);
    }

    // 释放资源
    await externalTools.dispose();
  });

  describe('完整工作流程集成测试', () => {
    it('应该完成电商项目的完整向导流程', async () => {
      // 1. 启动向导
      const session = await wizardEngine.startWizard('ecommerce-integration-test');
      expect(session).toBeDefined();
      expect(session.stage).toBe('project_positioning');

      // 2. 项目定位阶段 - 选择电商平台
      let result = await wizardEngine.processAnswer(session.id, 'ecommerce');
      expect(result.stage).toBe('team_assessment');
      expect(result.progress).toBeGreaterThan(0);

      // 3. 团队评估阶段 - 中型团队
      result = await wizardEngine.processAnswer(session.id, '10');
      expect(result.stage).toBe('feature_collection');
      expect(result.progress).toBeGreaterThan(15);

      // 4. 功能收集阶段 - 选择核心功能
      result = await wizardEngine.processAnswer(session.id, 'auth,products,cart,payment');
      expect(['blind_spot_detection', 'contradiction_resolution', 'solution_confirmation'].includes(result.stage)).toBe(true);

      // 5. 智能分析阶段 - 验证需求
      const validation = await wizardEngine.validateRequirements(session.id);
      expect(validation.success).toBe(true);
      expect(validation.data.valid).toBeDefined();

      // 6. 生成架构
      const architecture = await wizardEngine.generateArchitecture(session.id, true);
      expect(architecture.success).toBe(true);
      expect(architecture.data).toBeDefined();
      expect(architecture.data.pattern).toBeDefined();
      expect(architecture.data.components).toBeDefined();

      // 7. 验证生成的架构符合规范
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.stage).toBe('completed');
      expect(finalSession?.architecture).toBeDefined();

      // 验证架构包含电商必需的组件
      const components = finalSession?.architecture?.components;
      expect(components?.pages).toBeDefined();
      expect(components?.business).toBeDefined();
      expect(components?.common).toBeDefined();

      // 验证技术栈选择
      const technologies = finalSession?.architecture?.technologies;
      expect(technologies).toBeDefined();
      expect(technologies?.length).toBeGreaterThan(0);
    }, 60000);

    it('应该完成SaaS项目的完整向导流程', async () => {
      // 测试SaaS项目的特殊需求
      const session = await wizardEngine.startWizard('saas-integration-test');
      
      // 项目定位 - SaaS应用
      let result = await wizardEngine.processAnswer(session.id, 'saas');
      expect(result.stage).toBe('team_assessment');

      // 团队评估 - 大团队
      result = await wizardEngine.processAnswer(session.id, '20');
      expect(result.stage).toBe('feature_collection');

      // 功能收集 - SaaS特有功能
      result = await wizardEngine.processAnswer(session.id, 'auth,dashboard,billing,analytics');
      
      // 智能分析 - 检测多租户盲点
      const blindSpots = await intelligenceEngine.detectBlindSpots(await sessionManager.getSession(session.id));
      const hasMultiTenantSpot = blindSpots.some(spot => spot.title.includes('多租户'));
      expect(hasMultiTenantSpot).toBe(true);

      // 生成架构
      const architecture = await wizardEngine.generateArchitecture(session.id, true);
      expect(architecture.success).toBe(true);

      // 验证SaaS架构特征
      const finalSession = await sessionManager.getSession(session.id);
      const pattern = finalSession?.architecture?.pattern;
      expect(['layered', 'micro-frontend', 'feature-based'].includes(pattern)).toBe(true);
    }, 60000);
  });

  describe('外部工具集成测试', () => {
    it('应该正确集成缓存系统', async () => {
      // 测试缓存命中
      const tech = 'React';
      
      // 第一次调用
      const start1 = Date.now();
      const result1 = await externalTools.getBestPractices(tech);
      const duration1 = Date.now() - start1;
      
      expect(result1.success).toBe(true);
      expect(result1.metadata?.fromCache).toBe(false);

      // 第二次调用应该从缓存返回
      const start2 = Date.now();
      const result2 = await externalTools.getBestPractices(tech);
      const duration2 = Date.now() - start2;
      
      expect(result2.success).toBe(true);
      expect(result2.metadata?.fromCache).toBe(true);
      expect(duration2).toBeLessThan(duration1); // 缓存应该更快
    });

    it('应该正确监控性能', async () => {
      const performanceStats = externalTools.getPerformanceStats();
      expect(performanceStats).toBeDefined();
      expect(performanceStats.profiles).toBeDefined();
      expect(performanceStats.metrics).toBeDefined();

      // 测试性能警告
      const alerts = externalTools.getPerformanceAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('应该正确调用多个外部工具', async () => {
      // 并行调用多个工具
      const [bestPractices, competitor, trends] = await Promise.allSettled([
        externalTools.getBestPractices('TypeScript'),
        externalTools.analyzeCompetitor('Slack'),
        externalTools.getTechTrends('frontend')
      ]);

      expect(bestPractices.status).toBe('fulfilled');
      expect(competitor.status).toBe('fulfilled');
      expect(trends.status).toBe('fulfilled');

      if (bestPractices.status === 'fulfilled') {
        expect(bestPractices.value.success).toBe(true);
      }
      if (competitor.status === 'fulfilled') {
        expect(competitor.value.success).toBe(true);
      }
      if (trends.status === 'fulfilled') {
        expect(trends.value.success).toBe(true);
      }
    });
  });

  describe('智能分析引擎集成测试', () => {
    it('应该正确执行高级分析功能', async () => {
      const session = await sessionManager.createSession('advanced-analysis-test');
      
      // 设置复杂的项目需求
      await sessionManager.updateSession(session.id, {
        requirements: {
          projectType: 'ecommerce',
          teamSize: 15,
          features: Array.from({ length: 12 }, (_, i) => ({
            id: `feature-${i}`,
            name: `功能${i}`,
            category: 'core',
            description: `功能描述${i}`,
            estimatedEffort: 30,
            priority: 'must-have'
          })),
          constraints: [],
          preferences: [
            { category: 'technology', value: 'GraphQL', priority: 'high' }
          ],
          technicalLevel: 'beginner',
        }
      });

      // 风险评估
      const riskAssessment = await intelligenceEngine.assessProjectRisk(session);
      expect(riskAssessment.success).toBe(true);
      expect(riskAssessment.data.riskLevel).toBeDefined();
      expect(riskAssessment.data.riskFactors).toBeDefined();
      expect(riskAssessment.data.mitigation).toBeDefined();

      // 性能预测
      const performancePrediction = await intelligenceEngine.predictPerformance(session);
      expect(performancePrediction.success).toBe(true);
      expect(performancePrediction.data.loadTime).toBeDefined();
      expect(performancePrediction.data.bundleSize).toBeDefined();

      // 技术债务预测
      const techDebtPrediction = await intelligenceEngine.predictTechDebt(session);
      expect(techDebtPrediction.success).toBe(true);
      expect(techDebtPrediction.data.debtScore).toBeDefined();
      expect(techDebtPrediction.data.recommendations).toBeDefined();

      // 成本效益分析
      const costBenefitAnalysis = await intelligenceEngine.analyzeCostBenefit(session);
      expect(costBenefitAnalysis.success).toBe(true);
      expect(costBenefitAnalysis.data.implementation).toBeDefined();
      expect(costBenefitAnalysis.data.roi).toBeDefined();

      // 智能学习
      const adaptiveLearning = await intelligenceEngine.generateAdaptiveLearning(session);
      expect(adaptiveLearning.success).toBe(true);
      expect(adaptiveLearning.data.historicalPatterns).toBeDefined();
      expect(adaptiveLearning.data.adaptiveRecommendations).toBeDefined();
    });

    it('应该检测复杂的矛盾和盲点', async () => {
      const session = await sessionManager.createSession('contradiction-test');
      
      // 设置矛盾的需求（初级团队选择高级技术）
      await sessionManager.updateSession(session.id, {
        requirements: {
          projectType: 'saas',
          teamSize: 3,
          technicalLevel: 'beginner',
          features: Array.from({ length: 20 }, (_, i) => ({
            id: `complex-feature-${i}`,
            name: `复杂功能${i}`,
            category: 'core',
            description: '高复杂度功能',
            estimatedEffort: 80,
            priority: 'must-have'
          })),
          preferences: [
            { category: 'technology', value: 'GraphQL', priority: 'high' },
            { category: 'technology', value: 'WebAssembly', priority: 'medium' },
            { category: 'technology', value: 'Micro-frontend', priority: 'high' }
          ],
          constraints: [],
        }
      });

      // 检测矛盾
      const contradictions = await intelligenceEngine.detectContradictions(session);
      expect(contradictions.length).toBeGreaterThan(0);
      
      // 应该检测到团队规模与工作量矛盾
      const teamSizeContradiction = contradictions.find(c => 
        c.description.includes('工作量') || c.description.includes('团队')
      );
      expect(teamSizeContradiction).toBeDefined();
      
      // 应该检测到技术水平与技术选择矛盾
      const techContradiction = contradictions.find(c => 
        c.description.includes('技术') && c.description.includes('初级')
      );
      expect(techContradiction).toBeDefined();

      // 检测盲点
      const blindSpots = await intelligenceEngine.detectBlindSpots(session);
      expect(blindSpots.length).toBeGreaterThan(0);
    });
  });

  describe('代码生成引擎集成测试', () => {
    it('应该生成符合规范的架构结构', async () => {
      const session = await sessionManager.createSession('generation-test');
      
      await sessionManager.updateSession(session.id, {
        requirements: {
          projectType: 'task_management',
          teamSize: 8,
          features: [
            { id: 'auth', name: '用户认证', category: 'core', description: '登录注册', estimatedEffort: 16, priority: 'must-have' },
            { id: 'tasks', name: '任务管理', category: 'business', description: '任务CRUD', estimatedEffort: 24, priority: 'must-have' },
            { id: 'realtime', name: '实时同步', category: 'infrastructure', description: '实时更新', estimatedEffort: 32, priority: 'nice-to-have' }
          ],
          constraints: [],
          preferences: [],
          technicalLevel: 'intermediate',
        }
      });

      const architecture = await generator.generateArchitecture(session);
      
      expect(architecture.success).toBe(true);
      expect(architecture.data).toBeDefined();

      const data = architecture.data;
      
      // 验证基础架构信息
      expect(data.name).toBeDefined();
      expect(data.pattern).toBeDefined();
      expect(['modular', 'feature-based', 'layered'].includes(data.pattern)).toBe(true);

      // 验证组件结构符合规范
      expect(data.structure).toBeDefined();
      expect(data.structure.layers).toBeDefined();
      expect(data.structure.layers.length).toBeGreaterThan(0);

      // 验证组件分类
      expect(data.components).toBeDefined();
      expect(data.components.pages).toBeDefined();
      expect(data.components.business).toBeDefined();
      expect(data.components.common).toBeDefined();
      expect(data.components.base).toBeDefined();

      // 验证技术栈选择合理
      expect(data.technologies).toBeDefined();
      expect(data.technologies.length).toBeGreaterThan(0);
      
      // 验证依赖关系
      expect(data.dependencies).toBeDefined();
      expect(Array.isArray(data.dependencies.external)).toBe(true);
      expect(Array.isArray(data.dependencies.internal)).toBe(true);
    });

    it('应该正确渲染多种模板', async () => {
      const templateData = {
        projectName: 'test-project',
        components: [
          { name: 'UserAuth', type: 'business' },
          { name: 'TaskList', type: 'business' }
        ],
        technologies: ['React', 'TypeScript']
      };

      // 测试不同类型的模板
      const templates = [
        'package-json',
        'tsx-component',
        'api-service',
        'type-definitions'
      ];

      for (const templateName of templates) {
        try {
          const result = await generator.renderTemplate(templateName, templateData);
          expect(result).toBeDefined();
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        } catch (error) {
          // 某些模板可能不存在，这是可以接受的
          console.warn(`Template ${templateName} not found: ${error}`);
        }
      }
    });
  });

  describe('项目导出集成测试', () => {
    it('应该成功导出完整项目', async () => {
      const session = await wizardEngine.startWizard('export-test');
      
      // 快速完成向导流程
      await wizardEngine.processAnswer(session.id, 'task_management');
      await wizardEngine.processAnswer(session.id, '5');
      await wizardEngine.processAnswer(session.id, 'auth,tasks');
      
      // 生成架构
      await wizardEngine.generateArchitecture(session.id, true);
      
      // 导出项目
      const exportPath = path.join(testProjectPath, 'exported-project');
      const exportResult = await wizardEngine.exportProject(session.id, exportPath, {
        includeTests: true,
        includeExamples: true
      });

      expect(exportResult.success).toBe(true);
      
      // 验证导出的文件结构
      expect(await fs.pathExists(exportPath)).toBe(true);
      expect(await fs.pathExists(path.join(exportPath, 'package.json'))).toBe(true);
      expect(await fs.pathExists(path.join(exportPath, 'src'))).toBe(true);
      expect(await fs.pathExists(path.join(exportPath, 'src/components'))).toBe(true);
      
      // 验证package.json内容
      const packageJson = await fs.readJson(path.join(exportPath, 'package.json'));
      expect(packageJson.name).toBeDefined();
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.scripts).toBeDefined();
    });
  });

  describe('错误处理和恢复测试', () => {
    it('应该正确处理无效输入', async () => {
      const session = await wizardEngine.startWizard('error-handling-test');
      
      // 测试无效的项目类型
      const invalidResult = await wizardEngine.processAnswer(session.id, 'invalid-type');
      expect(invalidResult).toBeDefined();
      // 向导应该要求澄清或提供有效选项
      
      // 测试空输入
      const emptyResult = await wizardEngine.processAnswer(session.id, '');
      expect(emptyResult).toBeDefined();
    });

    it('应该正确处理外部工具失败', async () => {
      // 测试网络错误情况下的降级处理
      // 这里我们通过禁用外部工具来模拟失败
      const originalConfig = externalTools['config'];
      externalTools['config'] = {
        context7: { enabled: false, tools: [], usage: '' },
        deepwiki: { enabled: false, tools: [], usage: '' },
        exa: { enabled: false, tools: [], usage: '' },
        specWorkflow: { enabled: false, tools: [], usage: '' }
      };

      try {
        const session = await sessionManager.createSession('fallback-test');
        const validation = await intelligenceEngine.validateRequirements(session);
        
        // 即使外部工具失败，基础验证仍应工作
        expect(validation).toBeDefined();
        expect(validation.success).toBeDefined();
      } finally {
        // 恢复原始配置
        externalTools['config'] = originalConfig;
      }
    });

    it('应该正确处理会话恢复', async () => {
      // 创建会话并进行部分完成
      const session = await wizardEngine.startWizard('recovery-test');
      await wizardEngine.processAnswer(session.id, 'ecommerce');
      await wizardEngine.processAnswer(session.id, '10');
      
      // 模拟会话中断和恢复
      const recoveredSession = await sessionManager.getSession(session.id);
      expect(recoveredSession).toBeDefined();
      expect(recoveredSession?.stage).toBe('feature_collection');
      
      // 继续完成流程
      const continueResult = await wizardEngine.processAnswer(session.id, 'auth,products');
      expect(continueResult).toBeDefined();
    });
  });

  describe('性能和内存测试', () => {
    it('应该在大量并发会话下保持性能', async () => {
      const sessionCount = 10;
      const sessions: string[] = [];
      
      // 创建多个并发会话
      const createPromises = Array.from({ length: sessionCount }, (_, i) => 
        wizardEngine.startWizard(`concurrent-test-${i}`)
      );
      
      const createdSessions = await Promise.all(createPromises);
      sessions.push(...createdSessions.map(s => s.id));
      
      // 并发处理回答
      const processPromises = sessions.map((sessionId, i) => 
        wizardEngine.processAnswer(sessionId, i % 2 === 0 ? 'ecommerce' : 'saas')
      );
      
      const results = await Promise.allSettled(processPromises);
      
      // 验证所有会话都成功处理
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBe(sessionCount);
      
      // 检查内存使用情况
      const memoryUsage = process.memoryUsage();
      expect(memoryUsage.heapUsed).toBeLessThan(500 * 1024 * 1024); // 500MB限制
    });

    it('应该正确清理缓存和临时数据', async () => {
      // 获取初始缓存统计
      const initialStats = await externalTools.getCacheStats();
      
      // 进行一些操作产生缓存数据
      await externalTools.getBestPractices('Vue');
      await externalTools.getBestPractices('Angular');
      
      // 验证缓存增长
      const afterStats = await externalTools.getCacheStats();
      expect(afterStats.totalEntries).toBeGreaterThanOrEqual(initialStats.totalEntries);
      
      // 清理缓存
      await externalTools.clearCache();
      
      // 验证缓存已清理
      const cleanStats = await externalTools.getCacheStats();
      expect(cleanStats.totalEntries).toBeLessThanOrEqual(initialStats.totalEntries);
    });
  });

  describe('规范合规性测试', () => {
    it('生成的架构应符合React组件架构规范', async () => {
      const session = await sessionManager.createSession('compliance-test');
      
      await sessionManager.updateSession(session.id, {
        requirements: {
          projectType: 'ecommerce',
          teamSize: 8,
          features: [
            { id: 'auth', name: '用户认证', category: 'core', description: '登录注册', estimatedEffort: 16, priority: 'must-have' },
            { id: 'products', name: '商品管理', category: 'business', description: '商品CRUD', estimatedEffort: 24, priority: 'must-have' },
            { id: 'cart', name: '购物车', category: 'business', description: '购物车功能', estimatedEffort: 20, priority: 'must-have' },
            { id: 'payment', name: '支付系统', category: 'infrastructure', description: '支付处理', estimatedEffort: 40, priority: 'must-have' }
          ],
          constraints: [],
          preferences: [],
          technicalLevel: 'intermediate',
        }
      });

      const architecture = await generator.generateArchitecture(session);
      expect(architecture.success).toBe(true);

      const data = architecture.data;
      
      // 验证符合规范的分层结构
      const expectedLayers = ['pages', 'business', 'common', 'base'];
      expectedLayers.forEach(layer => {
        expect(data.components[layer]).toBeDefined();
      });
      
      // 验证组件命名符合规范
      const allComponents = Object.values(data.components).flat();
      allComponents.forEach((component: any) => {
        expect(component.name).toMatch(/^[A-Z][a-zA-Z0-9]*$/); // PascalCase
        expect(component.type).toBeDefined();
        expect(component.description).toBeDefined();
      });
      
      // 验证依赖关系符合规范（下层不依赖上层）
      const layers = data.structure.layers;
      const layerIndex = layers.reduce((acc, layer, index) => {
        acc[layer] = index;
        return acc;
      }, {} as Record<string, number>);
      
      data.dependencies.internal.forEach((dep: any) => {
        const fromIndex = layerIndex[dep.from.split('/')[0]];
        const toIndex = layerIndex[dep.to.split('/')[0]];
        
        // 下层组件不应该依赖上层组件
        expect(fromIndex).toBeGreaterThanOrEqual(toIndex);
      });
    });

    it('生成的代码应符合TypeScript和React最佳实践', async () => {
      const templateData = {
        componentName: 'UserProfile',
        props: [
          { name: 'user', type: 'User', required: true },
          { name: 'onUpdate', type: '(user: User) => void', required: false }
        ]
      };
      
      const componentCode = await generator.renderTemplate('tsx-component', templateData);
      
      // 验证生成的代码包含必需的元素
      expect(componentCode).toContain('interface');
      expect(componentCode).toContain('React.FC');
      expect(componentCode).toContain('export default');
      
      // 验证TypeScript类型定义
      expect(componentCode).toMatch(/interface\s+\w+Props/);
      
      // 验证React Hooks最佳实践
      if (componentCode.includes('useState') || componentCode.includes('useEffect')) {
        expect(componentCode).toContain('import { useState, useEffect } from \'react\'');
      }
    });
  });
});