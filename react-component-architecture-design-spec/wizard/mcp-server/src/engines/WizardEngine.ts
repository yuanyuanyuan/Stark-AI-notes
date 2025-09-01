/**
 * 向导引擎 - 管理对话流程和阶段转换的核心引擎
 * 实现6阶段对话流程：项目定位、团队评估、功能收集、盲点发现、矛盾解决、方案确认
 */

import { 
  WizardSession, 
  WizardStage, 
  QuestionResult, 
  ConversationHistory,
  Decision,
  ToolResult,
  QuestionOption 
} from '../types/index.js';
import { SessionManager } from '../managers/SessionManager.js';
import { IntelligenceEngine } from './IntelligenceEngine.js';
import { Generator } from './Generator.js';
import { ExternalToolsIntegrator } from '../integrators/ExternalToolsIntegrator.js';
import { v4 as uuidv4 } from 'uuid';

export class WizardEngine {
  constructor(
    private sessionManager: SessionManager,
    private intelligenceEngine: IntelligenceEngine,
    private generator: Generator,
    private externalTools: ExternalToolsIntegrator
  ) {}

  /**
   * 启动新的架构设计向导
   */
  async startWizard(projectName: string, reset: boolean = false): Promise<WizardSession> {
    // 检查是否已存在同名项目的会话
    const existingSessions = await this.sessionManager.listSessions();
    const existingSession = existingSessions.find(s => s.projectName === projectName);

    if (existingSession && !reset) {
      console.error(`恢复现有会话: ${projectName} (${existingSession.id})`);
      return existingSession;
    }

    if (existingSession && reset) {
      await this.sessionManager.deleteSession(existingSession.id);
      console.error(`重置会话: ${projectName}`);
    }

    // 创建新会话
    const session = await this.sessionManager.createSession(projectName);
    
    // 记录启动历史
    const history: ConversationHistory = {
      id: uuidv4(),
      timestamp: new Date(),
      role: 'assistant',
      message: `🚀 React架构向导已启动！\n\n我将通过几个问题帮你设计专业的React项目架构。\n项目名称：${projectName}`,
    };

    await this.sessionManager.updateSession(session.id, {
      history: [history],
    });

    return session;
  }

  /**
   * 获取下一个问题
   */
  async getNextQuestion(sessionId: string): Promise<QuestionResult> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在`);
    }

    switch (session.stage) {
      case 'project_positioning':
        return await this.getProjectPositioningQuestion(session);
      case 'team_assessment':
        return await this.getTeamAssessmentQuestion(session);
      case 'feature_collection':
        return await this.getFeatureCollectionQuestion(session);
      case 'blind_spot_detection':
        return await this.getBlindSpotQuestion(session);
      case 'contradiction_resolution':
        return await this.getContradictionQuestion(session);
      case 'solution_confirmation':
        return await this.getSolutionConfirmationQuestion(session);
      default:
        throw new Error(`未知阶段: ${session.stage}`);
    }
  }

  /**
   * 处理用户回答
   */
  async processAnswer(sessionId: string, answer: string): Promise<{
    type: string;
    message: string;
    question?: QuestionResult;
    stage: WizardStage;
    progress: number;
  }> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在`);
    }

    // 记录用户回答
    const userHistory: ConversationHistory = {
      id: uuidv4(),
      timestamp: new Date(),
      role: 'user',
      message: answer,
    };

    // 处理答案并生成决策
    const decision = await this.createDecision(session, answer);
    const updatedRequirements = await this.updateRequirements(session, decision);

    // 检查是否需要澄清
    const clarification = await this.checkNeedsClarification(session, answer);
    if (clarification) {
      const assistantHistory: ConversationHistory = {
        id: uuidv4(),
        timestamp: new Date(),
        role: 'assistant',
        message: clarification.message,
      };

      await this.sessionManager.updateSession(sessionId, {
        history: [...session.history, userHistory, assistantHistory],
      });

      return {
        type: 'clarification',
        message: clarification.message,
        question: clarification,
        stage: session.stage,
        progress: session.progress,
      };
    }

    // 更新会话状态
    const newStage = this.getNextStage(session.stage, updatedRequirements);
    const newProgress = this.calculateProgress(newStage);

    await this.sessionManager.updateSession(sessionId, {
      requirements: updatedRequirements,
      decisions: [...session.decisions, decision],
      history: [...session.history, userHistory],
      stage: newStage,
      progress: newProgress,
    });

    // 如果到达生成阶段，直接生成架构
    if (newStage === 'architecture_generation') {
      return {
        type: 'generation_ready',
        message: '✅ 需求收集完成！准备生成架构...',
        stage: newStage,
        progress: newProgress,
      };
    }

    // 获取下一个问题
    const nextQuestion = await this.getNextQuestion(sessionId);
    
    const assistantHistory: ConversationHistory = {
      id: uuidv4(),
      timestamp: new Date(),
      role: 'assistant',
      message: nextQuestion.message,
    };

    await this.sessionManager.updateSession(sessionId, {
      history: [...session.history, userHistory, assistantHistory],
    });

    return {
      type: 'continue',
      message: '回答已记录，继续下一个问题...',
      question: nextQuestion,
      stage: newStage,
      progress: newProgress,
    };
  }

  /**
   * 验证需求合理性
   */
  async validateRequirements(sessionId: string): Promise<ToolResult> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在`);
    }

    return await this.intelligenceEngine.validateRequirements(session);
  }

  /**
   * 生成架构
   */
  async generateArchitecture(sessionId: string, confirm: boolean = false): Promise<ToolResult> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在`);
    }

    if (!confirm) {
      // 先进行预检查
      const validation = await this.intelligenceEngine.validateRequirements(session);
      if (!validation.success) {
        return validation;
      }
    }

    // 生成架构
    const architecture = await this.generator.generateArchitecture(session);
    
    // 更新会话
    await this.sessionManager.updateSession(sessionId, {
      architecture: architecture.data,
      stage: 'completed',
      progress: 100,
    });

    return architecture;
  }

  /**
   * 导出项目
   */
  async exportProject(sessionId: string, outputPath: string, options: {
    includeTests?: boolean;
    includeExamples?: boolean;
  } = {}): Promise<ToolResult> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在`);
    }

    if (!session.architecture) {
      throw new Error('架构尚未生成，无法导出项目');
    }

    return await this.generator.exportProject(session, outputPath, options);
  }

  // =============================================================================
  // 私有方法 - 阶段问题生成
  // =============================================================================

  /**
   * 项目定位阶段的问题
   */
  private async getProjectPositioningQuestion(session: WizardSession): Promise<QuestionResult> {
    // 如果用户描述模糊，可能需要调用外部工具来分析竞品
    const needsAnalysis = this.needsCompetitorAnalysis(session);
    
    if (needsAnalysis && session.history.length > 0) {
      const lastUserMessage = session.history
        .filter(h => h.role === 'user')
        .pop()?.message || '';
      
      if (lastUserMessage.includes('像') && lastUserMessage.includes('一样')) {
        // 提取竞品名称并分析
        const competitor = this.extractCompetitorName(lastUserMessage);
        if (competitor) {
          const analysis = await this.externalTools.analyzeCompetitor(competitor);
          if (analysis.success) {
            const features = analysis.data?.features || [];
            return {
              type: 'clarification',
              title: '竞品特性分析',
              message: `我分析了 ${competitor} 的特性，发现主要包括：\n\n${features.map(f => `• ${f}`).join('\n')}\n\n你希望实现哪些类似的功能？`,
              options: features.map(f => ({
                id: uuidv4(),
                text: f,
                value: f,
              })),
            };
          }
        }
      }
    }

    return {
      type: 'question',
      title: '项目类型',
      message: '你好！我来帮你设计React项目架构。首先想了解一下，你想做什么类型的产品？',
      options: [
        {
          id: 'task_management',
          text: '📋 任务管理系统',
          value: 'task_management',
          description: '像Trello、Notion这样的任务管理工具',
          implications: ['需要拖拽功能', '实时协作', '数据同步'],
        },
        {
          id: 'ecommerce',
          text: '🛒 电商平台',
          value: 'ecommerce',
          description: '在线商城、购物网站',
          implications: ['支付集成', '库存管理', '订单系统'],
        },
        {
          id: 'saas',
          text: '💼 SaaS应用',
          value: 'saas',
          description: '企业级软件即服务',
          implications: ['多租户', '权限管理', '计费系统'],
        },
        {
          id: 'dashboard',
          text: '📊 数据看板',
          value: 'dashboard',
          description: '数据可视化、监控面板',
          implications: ['图表组件', '实时数据', '报表导出'],
        },
        {
          id: 'blog',
          text: '📝 内容站点',
          value: 'blog',
          description: '博客、新闻网站、CMS',
          implications: ['SEO优化', '内容管理', '评论系统'],
        },
        {
          id: 'social',
          text: '👥 社交平台',
          value: 'social',
          description: '社区、论坛、聊天应用',
          implications: ['实时通信', '用户关系', '内容推荐'],
        },
        {
          id: 'other',
          text: '🔧 其他类型',
          value: 'other',
          description: '请在后续说明具体需求',
        },
      ],
    };
  }

  /**
   * 团队评估阶段的问题
   */
  private async getTeamAssessmentQuestion(session: WizardSession): Promise<QuestionResult> {
    return {
      type: 'question',
      title: '团队规模',
      message: '了解一下你的团队情况，这会帮我设计合适的架构复杂度：',
      options: [
        {
          id: 'solo',
          text: '👤 个人开发者',
          value: '1',
          description: '我一个人，希望快速实现',
          implications: ['简化架构', '减少抽象', '使用成熟方案'],
        },
        {
          id: 'small',
          text: '👥 小团队 (2-5人)',
          value: '3',
          description: '小团队协作，需要一定规范',
          implications: ['模块化设计', '基础规范', '简单分工'],
        },
        {
          id: 'medium',
          text: '🏢 中型团队 (6-15人)',
          value: '10',
          description: '多人协作，需要清晰架构',
          implications: ['明确分层', '接口定义', '完整文档'],
        },
        {
          id: 'large',
          text: '🏗️ 大团队 (15+人)',
          value: '20',
          description: '大规模团队，需要严格规范',
          implications: ['微前端', '模块自治', '完整流程'],
        },
      ],
    };
  }

  /**
   * 功能收集阶段的问题
   */
  private async getFeatureCollectionQuestion(session: WizardSession): Promise<QuestionResult> {
    // 基于项目类型推荐功能
    const recommendedFeatures = this.getRecommendedFeatures(session.requirements.projectType);
    
    return {
      type: 'question',
      title: '核心功能',
      message: `基于你选择的${this.getProjectTypeName(session.requirements.projectType)}，我推荐以下功能。请选择你需要的：`,
      options: recommendedFeatures.map(feature => ({
        id: feature.id,
        text: feature.name,
        value: feature.id,
        description: feature.description,
        implications: [`预计开发：${feature.estimatedEffort}小时`],
      })),
    };
  }

  /**
   * 盲点检测阶段的问题
   */
  private async getBlindSpotQuestion(session: WizardSession): Promise<QuestionResult> {
    const blindSpots = await this.intelligenceEngine.detectBlindSpots(session);
    
    if (blindSpots.length === 0) {
      // 没有发现盲点，进入下一阶段
      return {
        type: 'confirmation',
        title: '盲点检查',
        message: '✅ 很好！你的需求考虑得比较全面，没有发现明显的盲点。',
      };
    }

    const firstBlindSpot = blindSpots[0];
    return {
      type: 'blind-spot',
      title: `💡 ${firstBlindSpot.title}`,
      message: `我注意到一个你可能没考虑到的重要问题：\n\n${firstBlindSpot.description}\n\n${firstBlindSpot.suggestion || ''}`,
      options: [
        {
          id: 'address',
          text: '是的，我需要考虑这个',
          value: 'address',
        },
        {
          id: 'skip',
          text: '暂时跳过，后面再处理',
          value: 'skip',
        },
        {
          id: 'not_needed',
          text: '不需要，我有其他方案',
          value: 'not_needed',
        },
      ],
    };
  }

  /**
   * 矛盾解决阶段的问题
   */
  private async getContradictionQuestion(session: WizardSession): Promise<QuestionResult> {
    const contradictions = await this.intelligenceEngine.detectContradictions(session);
    
    if (contradictions.length === 0) {
      return {
        type: 'confirmation',
        title: '矛盾检查',
        message: '✅ 你的需求很合理，没有发现矛盾之处。',
      };
    }

    const firstContradiction = contradictions[0];
    return {
      type: 'contradiction',
      title: '⚠️ 需求矛盾',
      message: `我发现一个潜在问题需要讨论：\n\n${firstContradiction.description}\n\n建议的解决方案：`,
      options: firstContradiction.solutions?.map((solution, index) => ({
        id: `solution_${index}`,
        text: solution.title,
        value: solution.id,
        description: solution.description,
      })) || [],
    };
  }

  /**
   * 方案确认阶段的问题
   */
  private async getSolutionConfirmationQuestion(session: WizardSession): Promise<QuestionResult> {
    const summary = this.generateRequirementsSummary(session);
    
    return {
      type: 'confirmation',
      title: '方案确认',
      message: `让我总结一下我的理解，确保我们的想法一致：\n\n${summary}\n\n你确认这些信息正确吗？`,
      options: [
        {
          id: 'confirm',
          text: '✅ 完全正确，开始生成架构',
          value: 'confirm',
        },
        {
          id: 'modify',
          text: '🔧 基本正确，但想调整某些地方',
          value: 'modify',
        },
        {
          id: 'restart',
          text: '🔄 我想重新考虑某些部分',
          value: 'restart',
        },
      ],
    };
  }

  // =============================================================================
  // 辅助方法
  // =============================================================================

  private needsCompetitorAnalysis(session: WizardSession): boolean {
    return session.requirements.projectType === 'other';
  }

  private extractCompetitorName(message: string): string | null {
    const match = message.match(/像\s*(\w+)\s*一样/);
    return match ? match[1] : null;
  }

  private async createDecision(session: WizardSession, answer: string): Promise<Decision> {
    return {
      id: uuidv4(),
      stage: session.stage,
      question: `${session.stage}阶段的回答`,
      answer,
      reasoning: '用户选择',
      confidence: 0.9,
      timestamp: new Date(),
    };
  }

  private async updateRequirements(session: WizardSession, decision: Decision): Promise<any> {
    const requirements = { ...session.requirements };
    
    switch (session.stage) {
      case 'project_positioning':
        requirements.projectType = decision.answer as any;
        break;
      case 'team_assessment':
        requirements.teamSize = parseInt(decision.answer);
        break;
      case 'feature_collection':
        // 处理功能选择
        requirements.features = requirements.features || [];
        break;
      // 其他阶段的处理...
    }

    return requirements;
  }

  private async checkNeedsClarification(session: WizardSession, answer: string): Promise<QuestionResult | null> {
    // 检查模糊回答
    if (['都行', '随便', '你看着办', '不确定'].includes(answer.trim())) {
      return {
        type: 'clarification',
        title: '需要更明确的选择',
        message: '为了给你最合适的架构建议，我需要更明确的信息。请从选项中选择一个最接近你想法的：',
      };
    }

    return null;
  }

  private getNextStage(currentStage: WizardStage, requirements: any): WizardStage {
    const stageOrder: WizardStage[] = [
      'project_positioning',
      'team_assessment', 
      'feature_collection',
      'blind_spot_detection',
      'contradiction_resolution',
      'solution_confirmation',
      'architecture_generation',
      'completed'
    ];

    const currentIndex = stageOrder.indexOf(currentStage);
    return stageOrder[currentIndex + 1] || 'completed';
  }

  private calculateProgress(stage: WizardStage): number {
    const stageProgress: Record<WizardStage, number> = {
      'project_positioning': 15,
      'team_assessment': 30,
      'feature_collection': 50,
      'blind_spot_detection': 65,
      'contradiction_resolution': 80,
      'solution_confirmation': 90,
      'architecture_generation': 95,
      'completed': 100,
    };

    return stageProgress[stage] || 0;
  }

  private getRecommendedFeatures(projectType: string): any[] {
    const featureMap: Record<string, any[]> = {
      'task_management': [
        { id: 'auth', name: '用户认证', description: '登录注册系统', estimatedEffort: 8 },
        { id: 'crud', name: '任务管理', description: '创建、编辑、删除任务', estimatedEffort: 12 },
        { id: 'realtime', name: '实时协作', description: '多人同时编辑', estimatedEffort: 20 },
        { id: 'file_upload', name: '文件上传', description: '附件管理', estimatedEffort: 6 },
      ],
      'ecommerce': [
        { id: 'auth', name: '用户系统', description: '注册登录', estimatedEffort: 8 },
        { id: 'product', name: '商品管理', description: '商品展示和管理', estimatedEffort: 16 },
        { id: 'cart', name: '购物车', description: '购物车功能', estimatedEffort: 12 },
        { id: 'payment', name: '支付系统', description: '在线支付', estimatedEffort: 24 },
      ],
      // 其他项目类型...
    };

    return featureMap[projectType] || [
      { id: 'auth', name: '用户认证', description: '基础认证功能', estimatedEffort: 8 },
    ];
  }

  private getProjectTypeName(projectType: string): string {
    const names: Record<string, string> = {
      'task_management': '任务管理系统',
      'ecommerce': '电商平台',
      'saas': 'SaaS应用',
      'dashboard': '数据看板',
      'blog': '内容站点',
      'social': '社交平台',
      'other': '自定义项目',
    };

    return names[projectType] || '未知类型';
  }

  private generateRequirementsSummary(session: WizardSession): string {
    const { requirements } = session;
    
    return `📋 项目概况：
• 类型：${this.getProjectTypeName(requirements.projectType)}
• 团队规模：${requirements.teamSize}人
• 技术水平：${requirements.technicalLevel}

🎯 核心功能：
${requirements.features.map(f => `• ${f}`).join('\n') || '• 待定义'}

⚙️ 技术偏好：
${requirements.preferences.map(p => `• ${p.category}: ${p.value}`).join('\n') || '• 无特殊要求'}`;
  }
}