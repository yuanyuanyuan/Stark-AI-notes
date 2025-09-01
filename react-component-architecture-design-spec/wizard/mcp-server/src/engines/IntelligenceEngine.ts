/**
 * 智能分析引擎 - 负责需求验证、盲点发现、矛盾解决和智能决策
 * 通过规则引擎和外部工具集成提供智能分析能力
 */

import { 
  WizardSession, 
  BlindSpot, 
  ValidationResult,
  ValidationIssue,
  ValidationRule,
  ToolResult,
  Feature,
  Constraint
} from '../types/index.js';
import { ExternalToolsIntegrator } from '../integrators/ExternalToolsIntegrator.js';

export class IntelligenceEngine {
  private validationRules: ValidationRule[] = [];
  private blindSpotPatterns: BlindSpotPattern[] = [];

  constructor(private externalTools: ExternalToolsIntegrator) {
    this.initializeValidationRules();
    this.initializeBlindSpotPatterns();
  }

  /**
   * 验证需求合理性和完整性
   */
  async validateRequirements(session: WizardSession): Promise<ToolResult> {
    try {
      const issues: ValidationIssue[] = [];
      const suggestions: string[] = [];

      // 1. 基础验证
      const basicValidation = this.validateBasicRequirements(session);
      issues.push(...basicValidation.issues);
      suggestions.push(...basicValidation.suggestions);

      // 2. 技术栈验证 - 通过外部工具获取最新实践
      const techValidation = await this.validateTechnicalChoices(session);
      if (techValidation.success) {
        issues.push(...(techValidation.data?.issues || []));
        suggestions.push(...(techValidation.data?.suggestions || []));
      }

      // 3. 架构模式验证
      const patternValidation = await this.validateArchitecturePattern(session);
      if (patternValidation.success) {
        issues.push(...(patternValidation.data?.issues || []));
        suggestions.push(...(patternValidation.data?.suggestions || []));
      }

      // 4. 功能冲突检测
      const conflictValidation = this.validateFeatureConflicts(session);
      issues.push(...conflictValidation.issues);
      suggestions.push(...conflictValidation.suggestions);

      const isValid = !issues.some(issue => issue.severity === 'error');

      return {
        success: true,
        data: {
          valid: isValid,
          issues,
          suggestions,
          score: this.calculateValidationScore(issues),
          recommendations: this.generateRecommendations(issues, session),
        },
        metadata: {
          validationTimestamp: new Date().toISOString(),
          rulesApplied: this.validationRules.length,
          externalToolsUsed: ['context7', 'exa'],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '需求验证失败',
      };
    }
  }

  /**
   * 检测盲点 - 用户可能忽略的重要问题
   */
  async detectBlindSpots(session: WizardSession): Promise<BlindSpot[]> {
    const blindSpots: BlindSpot[] = [];

    // 1. 基于项目类型的常见盲点
    const typeBasedSpots = this.detectTypeBasedBlindSpots(session);
    blindSpots.push(...typeBasedSpots);

    // 2. 基于团队规模的盲点
    const teamBasedSpots = this.detectTeamBasedBlindSpots(session);
    blindSpots.push(...teamBasedSpots);

    // 3. 基于技术选择的盲点
    const techBasedSpots = await this.detectTechBasedBlindSpots(session);
    blindSpots.push(...techBasedSpots);

    // 4. 基于外部趋势的盲点
    const trendBasedSpots = await this.detectTrendBasedBlindSpots(session);
    blindSpots.push(...trendBasedSpots);

    // 去重并按优先级排序
    const uniqueSpots = this.deduplicateBlindSpots(blindSpots);
    return uniqueSpots.sort((a, b) => this.getImpactWeight(b.impact) - this.getImpactWeight(a.impact));
  }

  /**
   * 检测矛盾 - 需求中的冲突或不一致性
   */
  async detectContradictions(session: WizardSession): Promise<Contradiction[]> {
    const contradictions: Contradiction[] = [];

    // 1. 功能与团队规模矛盾
    const teamSizeConflicts = this.detectTeamSizeContradictions(session);
    contradictions.push(...teamSizeConflicts);

    // 2. 技术选择矛盾
    const techConflicts = this.detectTechnicalContradictions(session);
    contradictions.push(...techConflicts);

    // 3. 时间与复杂度矛盾
    const timeComplexityConflicts = this.detectTimeComplexityContradictions(session);
    contradictions.push(...timeComplexityConflicts);

    // 4. 预算与需求矛盾
    const budgetConflicts = this.detectBudgetContradictions(session);
    contradictions.push(...budgetConflicts);

    return contradictions.filter(c => c.severity !== 'low');
  }

  /**
   * 智能推荐 - 基于分析结果提供建议
   */
  async generateSmartRecommendations(session: WizardSession): Promise<SmartRecommendation[]> {
    const recommendations: SmartRecommendation[] = [];

    // 1. 架构模式推荐
    const patternRec = await this.recommendArchitecturePattern(session);
    if (patternRec) recommendations.push(patternRec);

    // 2. 技术栈推荐
    const techRecs = await this.recommendTechnologyStack(session);
    recommendations.push(...techRecs);

    // 3. 最佳实践推荐
    const practiceRecs = await this.recommendBestPractices(session);
    recommendations.push(...practiceRecs);

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  // =============================================================================
  // 私有方法 - 验证逻辑
  // =============================================================================

  private validateBasicRequirements(session: WizardSession): ValidationResult {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    const { requirements } = session;

    // 检查必需字段
    if (!requirements.projectType || requirements.projectType === 'other') {
      if (requirements.features.length === 0) {
        issues.push({
          rule: 'project_type_required',
          severity: 'error',
          message: '项目类型未明确，且未定义核心功能',
          suggestion: '请明确项目类型或至少定义3个核心功能',
        });
      }
    }

    // 团队规模合理性
    if (requirements.teamSize <= 0) {
      issues.push({
        rule: 'team_size_invalid',
        severity: 'error',
        message: '团队规模必须大于0',
      });
    }

    // 功能数量合理性
    if (requirements.features.length === 0) {
      issues.push({
        rule: 'features_empty',
        severity: 'warning',
        message: '未定义任何功能',
        suggestion: '建议至少定义3-5个核心功能',
      });
    } else if (requirements.features.length > 20) {
      issues.push({
        rule: 'features_too_many',
        severity: 'warning',
        message: '功能过多，可能影响开发效率',
        suggestion: '建议按优先级筛选到10-15个核心功能',
      });
    }

    return { valid: issues.length === 0, issues, suggestions };
  }

  private async validateTechnicalChoices(session: WizardSession): Promise<ToolResult> {
    try {
      const preferences = session.requirements.preferences;
      const techPrefs = preferences.filter(p => p.category === 'technology');

      if (techPrefs.length === 0) {
        return { success: true, data: { issues: [], suggestions: [] } };
      }

      const issues: ValidationIssue[] = [];
      const suggestions: string[] = [];

      // 通过外部工具验证技术选择
      for (const pref of techPrefs) {
        const validation = await this.externalTools.getBestPractices(pref.value);
        if (validation.success && validation.data?.recommendations) {
          suggestions.push(...validation.data.recommendations);
        }
      }

      return {
        success: true,
        data: { issues, suggestions },
      };
    } catch (error) {
      return {
        success: false,
        error: '技术选择验证失败',
      };
    }
  }

  private async validateArchitecturePattern(session: WizardSession): Promise<ToolResult> {
    try {
      const { requirements } = session;
      const issues: ValidationIssue[] = [];
      const suggestions: string[] = [];

      // 基于团队规模推荐架构模式
      const recommendedPattern = this.getRecommendedPattern(requirements.teamSize, requirements.projectType);
      
      // 通过外部工具验证架构决策
      const patternValidation = await this.externalTools.validateArchitecture(
        recommendedPattern,
        requirements.features.map(f => f.name)
      );

      if (patternValidation.success) {
        const data = patternValidation.data;
        if (data?.validation?.recommendations) {
          suggestions.push(...data.validation.recommendations);
        }
        if (data?.validation?.risks) {
          data.validation.risks.forEach((risk: string) => {
            issues.push({
              rule: 'architecture_risk',
              severity: 'warning',
              message: risk,
            });
          });
        }
      }

      return {
        success: true,
        data: { issues, suggestions },
      };
    } catch (error) {
      return {
        success: false,
        error: '架构模式验证失败',
      };
    }
  }

  private validateFeatureConflicts(session: WizardSession): ValidationResult {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    const features = session.requirements.features;

    // 检测功能冲突
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      if (feature.conflicts) {
        for (const conflictId of feature.conflicts) {
          const conflictFeature = features.find(f => f.id === conflictId);
          if (conflictFeature) {
            issues.push({
              rule: 'feature_conflict',
              severity: 'error',
              message: `功能"${feature.name}"与"${conflictFeature.name}"存在冲突`,
              suggestion: `请选择其中一个功能，或寻找替代方案`,
            });
          }
        }
      }
    }

    return { valid: issues.length === 0, issues, suggestions };
  }

  // =============================================================================
  // 私有方法 - 盲点检测
  // =============================================================================

  private detectTypeBasedBlindSpots(session: WizardSession): BlindSpot[] {
    const blindSpots: BlindSpot[] = [];
    const { projectType, features } = session.requirements;

    const typePatterns = {
      'ecommerce': [
        {
          category: 'security' as const,
          title: '支付安全',
          description: '电商项目需要处理敏感的支付信息，必须实施严格的安全措施',
          impact: 'critical' as const,
          suggestion: '集成PCI DSS合规的支付网关，实施数据加密和安全审计',
          condition: () => !features.some(f => f.name.includes('支付') || f.name.includes('安全'))
        },
        {
          category: 'scalability' as const,
          title: '库存管理',
          description: '电商平台需要实时库存管理，避免超卖问题',
          impact: 'high' as const,
          suggestion: '实现分布式库存管理系统，考虑使用Redis等缓存方案',
          condition: () => !features.some(f => f.name.includes('库存'))
        }
      ],
      'saas': [
        {
          category: 'scalability' as const,
          title: '多租户架构',
          description: 'SaaS应用需要支持多租户，确保数据隔离和性能',
          impact: 'critical' as const,
          suggestion: '设计多租户数据架构，实施租户级别的资源隔离',
          condition: () => !features.some(f => f.name.includes('多租户') || f.name.includes('租户'))
        }
      ]
    };

    const patterns = typePatterns[projectType as keyof typeof typePatterns] || [];
    
    patterns.forEach(pattern => {
      if (pattern.condition()) {
        blindSpots.push({
          id: `${projectType}_${pattern.category}_${Date.now()}`,
          category: pattern.category,
          title: pattern.title,
          description: pattern.description,
          impact: pattern.impact,
          suggestion: pattern.suggestion,
          addressed: false,
        });
      }
    });

    return blindSpots;
  }

  private detectTeamBasedBlindSpots(session: WizardSession): BlindSpot[] {
    const blindSpots: BlindSpot[] = [];
    const { teamSize, technicalLevel } = session.requirements;

    // 大团队特有盲点
    if (teamSize > 10) {
      blindSpots.push({
        id: `team_large_coordination_${Date.now()}`,
        category: 'maintenance',
        title: '团队协作规范',
        description: '大团队开发需要严格的代码规范和协作流程',
        impact: 'high',
        suggestion: '制定详细的代码规范、PR流程和技术文档标准',
        addressed: false,
      });
    }

    // 小团队特有盲点
    if (teamSize <= 2) {
      blindSpots.push({
        id: `team_small_maintenance_${Date.now()}`,
        category: 'maintenance',
        title: '长期维护性',
        description: '小团队需要特别关注代码的可维护性和文档完整性',
        impact: 'medium',
        suggestion: '优先选择主流技术栈，编写清晰的技术文档',
        addressed: false,
      });
    }

    return blindSpots;
  }

  private async detectTechBasedBlindSpots(session: WizardSession): Promise<BlindSpot[]> {
    const blindSpots: BlindSpot[] = [];

    // 这里可以通过外部工具分析技术选择的风险
    try {
      const techPrefs = session.requirements.preferences.filter(p => p.category === 'technology');
      
      for (const pref of techPrefs) {
        const trends = await this.externalTools.getTechTrends(pref.value);
        if (trends.success && trends.data?.adoption === 'high-risk') {
          blindSpots.push({
            id: `tech_risk_${pref.value}_${Date.now()}`,
            category: 'maintenance',
            title: `${pref.value}技术风险`,
            description: '选择的技术可能存在采用风险',
            impact: 'medium',
            suggestion: '考虑更成熟的替代方案，或制定迁移计划',
            addressed: false,
          });
        }
      }
    } catch (error) {
      // 忽略外部工具错误
    }

    return blindSpots;
  }

  private async detectTrendBasedBlindSpots(session: WizardSession): Promise<BlindSpot[]> {
    const blindSpots: BlindSpot[] = [];
    
    // 基于当前技术趋势检测可能的盲点
    // 这里可以扩展更多基于趋势的分析

    return blindSpots;
  }

  // =============================================================================
  // 私有方法 - 矛盾检测
  // =============================================================================

  private detectTeamSizeContradictions(session: WizardSession): Contradiction[] {
    const contradictions: Contradiction[] = [];
    const { teamSize, features } = session.requirements;

    // 功能复杂度与团队规模不匹配
    const totalEffort = features.reduce((sum, f) => sum + f.estimatedEffort, 0);
    const avgEffortPerPerson = totalEffort / teamSize;

    if (avgEffortPerPerson > 200 && teamSize < 5) {
      contradictions.push({
        id: `team_effort_mismatch_${Date.now()}`,
        type: 'resource_constraint',
        severity: 'high',
        description: `预估工作量${totalEffort}小时，但团队仅${teamSize}人，单人工作量过大`,
        solutions: [
          {
            id: 'reduce_scope',
            title: '缩减功能范围',
            description: '优先实现核心功能，其他功能分阶段开发',
          },
          {
            id: 'extend_timeline',
            title: '延长开发周期',
            description: '调整项目时间线，确保充足的开发时间',
          },
          {
            id: 'add_members',
            title: '增加团队成员',
            description: '招聘或外包增加开发人手',
          }
        ]
      });
    }

    return contradictions;
  }

  private detectTechnicalContradictions(session: WizardSession): Contradiction[] {
    const contradictions: Contradiction[] = [];
    const { preferences, technicalLevel } = session.requirements;

    // 技术水平与技术选择不匹配
    const advancedTechs = preferences.filter(p => 
      p.category === 'technology' && 
      ['GraphQL', 'WebAssembly', 'Micro-frontend'].some(t => 
        p.value.includes(t)
      )
    );

    if (advancedTechs.length > 0 && technicalLevel === 'beginner') {
      contradictions.push({
        id: `tech_level_mismatch_${Date.now()}`,
        type: 'technical_constraint',
        severity: 'medium',
        description: '选择了高级技术，但团队技术水平为初级',
        solutions: [
          {
            id: 'simplify_tech',
            title: '简化技术栈',
            description: '选择更成熟、文档完善的技术方案',
          },
          {
            id: 'training_plan',
            title: '制定学习计划',
            description: '为团队安排相关技术培训',
          }
        ]
      });
    }

    return contradictions;
  }

  private detectTimeComplexityContradictions(session: WizardSession): Contradiction[] {
    const contradictions: Contradiction[] = [];
    
    // 这里可以基于时间线和复杂度进行分析
    // 当前为简化实现

    return contradictions;
  }

  private detectBudgetContradictions(session: WizardSession): Contradiction[] {
    const contradictions: Contradiction[] = [];
    
    // 这里可以基于预算和需求进行分析
    // 当前为简化实现

    return contradictions;
  }

  // =============================================================================
  // 私有方法 - 推荐算法
  // =============================================================================

  private async recommendArchitecturePattern(session: WizardSession): Promise<SmartRecommendation | null> {
    const { teamSize, projectType, features } = session.requirements;
    
    const pattern = this.getRecommendedPattern(teamSize, projectType);
    
    return {
      id: `pattern_${pattern}_${Date.now()}`,
      category: 'architecture',
      title: `推荐使用${this.getPatternDisplayName(pattern)}`,
      description: `基于${teamSize}人团队和${projectType}项目类型，推荐此架构模式`,
      reasoning: this.getPatternReasoning(pattern, teamSize, projectType),
      confidence: 0.8,
      implementation: `采用${pattern}架构模式组织代码结构`,
      alternatives: this.getAlternativePatterns(pattern),
    };
  }

  private async recommendTechnologyStack(session: WizardSession): Promise<SmartRecommendation[]> {
    const recommendations: SmartRecommendation[] = [];
    
    // 基于项目类型推荐技术栈
    const techStack = this.getRecommendedTechStack(session.requirements.projectType);
    
    Object.entries(techStack).forEach(([category, tech]) => {
      recommendations.push({
        id: `tech_${category}_${Date.now()}`,
        category: 'technology',
        title: `${category}推荐：${tech.name}`,
        description: tech.reason,
        reasoning: `适合${session.requirements.projectType}项目的${category}解决方案`,
        confidence: tech.confidence,
        implementation: tech.implementation,
        alternatives: tech.alternatives,
      });
    });

    return recommendations;
  }

  private async recommendBestPractices(session: WizardSession): Promise<SmartRecommendation[]> {
    const recommendations: SmartRecommendation[] = [];
    
    // 基于项目特征推荐最佳实践
    const practices = [
      {
        title: '使用TypeScript',
        description: '提供类型安全和更好的开发体验',
        condition: () => session.requirements.teamSize > 1,
        confidence: 0.9
      },
      {
        title: '实施测试驱动开发',
        description: '确保代码质量和可维护性',
        condition: () => session.requirements.technicalLevel !== 'beginner',
        confidence: 0.8
      }
    ];

    practices.forEach(practice => {
      if (practice.condition()) {
        recommendations.push({
          id: `practice_${Date.now()}`,
          category: 'best_practice',
          title: practice.title,
          description: practice.description,
          reasoning: '基于项目特征的最佳实践建议',
          confidence: practice.confidence,
          implementation: `在项目中${practice.title}`,
          alternatives: [],
        });
      }
    });

    return recommendations;
  }

  // =============================================================================
  // 辅助方法
  // =============================================================================

  private initializeValidationRules(): void {
    this.validationRules = [
      {
        id: 'project_type_required',
        name: '项目类型必需',
        description: '项目类型不能为空或其他',
        condition: 'session.requirements.projectType !== "other"',
        severity: 'error',
        message: '请明确项目类型',
      },
      // 更多验证规则...
    ];
  }

  private initializeBlindSpotPatterns(): void {
    // 初始化盲点模式
    this.blindSpotPatterns = [];
  }

  private calculateValidationScore(issues: ValidationIssue[]): number {
    const weights = { error: -10, warning: -5, info: -1 };
    const score = 100 + issues.reduce((sum, issue) => sum + weights[issue.severity], 0);
    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(issues: ValidationIssue[], session: WizardSession): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(i => i.severity === 'error')) {
      recommendations.push('请先解决所有错误问题后再继续');
    }
    
    if (issues.filter(i => i.severity === 'warning').length > 3) {
      recommendations.push('建议优先解决警告问题以提高项目质量');
    }

    return recommendations;
  }

  private deduplicateBlindSpots(blindSpots: BlindSpot[]): BlindSpot[] {
    const unique = new Map<string, BlindSpot>();
    
    blindSpots.forEach(spot => {
      const key = `${spot.category}_${spot.title}`;
      if (!unique.has(key) || unique.get(key)!.impact < spot.impact) {
        unique.set(key, spot);
      }
    });

    return Array.from(unique.values());
  }

  private getImpactWeight(impact: string): number {
    const weights = { critical: 4, high: 3, medium: 2, low: 1 };
    return weights[impact as keyof typeof weights] || 1;
  }

  private getRecommendedPattern(teamSize: number, projectType: string): string {
    if (teamSize <= 3) return 'modular';
    if (teamSize <= 10) return 'feature-based';
    return 'layered';
  }

  private getPatternDisplayName(pattern: string): string {
    const names = {
      modular: '模块化架构',
      'feature-based': '功能域架构',
      layered: '分层架构',
      'micro-frontend': '微前端架构',
      atomic: '原子化架构'
    };
    return names[pattern as keyof typeof names] || pattern;
  }

  private getPatternReasoning(pattern: string, teamSize: number, projectType: string): string {
    return `${teamSize}人团队适合${this.getPatternDisplayName(pattern)}，能够有效平衡开发效率和代码组织`;
  }

  private getAlternativePatterns(pattern: string): string[] {
    const alternatives: Record<string, string[]> = {
      modular: ['feature-based', 'layered'],
      'feature-based': ['modular', 'layered'],
      layered: ['modular', 'micro-frontend']
    };
    return alternatives[pattern] || [];
  }

  private getRecommendedTechStack(projectType: string): Record<string, TechRecommendation> {
    const stacks: Record<string, Record<string, TechRecommendation>> = {
      ecommerce: {
        'state-management': {
          name: 'Redux Toolkit',
          reason: '电商应用状态复杂，需要可预测的状态管理',
          confidence: 0.9,
          implementation: '使用RTK Query处理API调用和缓存',
          alternatives: ['Zustand', 'Context API']
        }
      },
      saas: {
        'routing': {
          name: 'React Router',
          reason: 'SaaS应用通常需要复杂的路由和权限控制',
          confidence: 0.85,
          implementation: '配置嵌套路由和路由守卫',
          alternatives: ['Next.js Router', 'Reach Router']
        }
      }
    };

    return stacks[projectType] || {};
  }
}

// =============================================================================
// 接口定义
// =============================================================================

interface BlindSpotPattern {
  category: string;
  title: string;
  description: string;
  impact: string;
  suggestion: string;
  condition: () => boolean;
}

interface Contradiction {
  id: string;
  type: 'technical_constraint' | 'resource_constraint' | 'business_constraint';
  severity: 'low' | 'medium' | 'high';
  description: string;
  solutions: ContradictionSolution[];
}

interface ContradictionSolution {
  id: string;
  title: string;
  description: string;
}

interface SmartRecommendation {
  id: string;
  category: 'architecture' | 'technology' | 'best_practice';
  title: string;
  description: string;
  reasoning: string;
  confidence: number;
  implementation: string;
  alternatives: string[];
}

interface TechRecommendation {
  name: string;
  reason: string;
  confidence: number;
  implementation: string;
  alternatives: string[];
}