/**
 * 智能分析引擎 - 负责需求验证、盲点发现、矛盾解决和智能决策
 * 通过规则引擎和外部工具集成提供智能分析能力
 */
import { WizardSession, BlindSpot, ToolResult } from '../types/index.js';
import { ExternalToolsIntegrator } from '../integrators/ExternalToolsIntegrator.js';
export declare class IntelligenceEngine {
    private externalTools;
    private validationRules;
    private blindSpotPatterns;
    private learningData;
    private riskDatabase;
    private performanceModels;
    private costModels;
    constructor(externalTools: ExternalToolsIntegrator);
    /**
     * 验证需求合理性和完整性
     */
    validateRequirements(session: WizardSession): Promise<ToolResult>;
    /**
     * 检测盲点 - 用户可能忽略的重要问题
     */
    detectBlindSpots(session: WizardSession): Promise<BlindSpot[]>;
    /**
     * 检测矛盾 - 需求中的冲突或不一致性
     */
    detectContradictions(session: WizardSession): Promise<Contradiction[]>;
    /**
     * 智能推荐 - 基于分析结果提供建议
     */
    generateSmartRecommendations(session: WizardSession): Promise<SmartRecommendation[]>;
    private validateBasicRequirements;
    private validateTechnicalChoices;
    private validateArchitecturePattern;
    private validateFeatureConflicts;
    private detectTypeBasedBlindSpots;
    private detectTeamBasedBlindSpots;
    private detectTechBasedBlindSpots;
    private detectTrendBasedBlindSpots;
    private detectTeamSizeContradictions;
    private detectTechnicalContradictions;
    private detectTimeComplexityContradictions;
    private detectBudgetContradictions;
    private recommendArchitecturePattern;
    private recommendTechnologyStack;
    private recommendBestPractices;
    private initializeValidationRules;
    private initializeBlindSpotPatterns;
    private calculateValidationScore;
    private generateRecommendations;
    private deduplicateBlindSpots;
    private getImpactWeight;
    private getRecommendedPattern;
    private getPatternDisplayName;
    private getPatternReasoning;
    private getAlternativePatterns;
    private getRecommendedTechStack;
    /**
     * 初始化高级分析系统
     */
    private initializeAdvancedAnalytics;
    /**
     * 风险评估引擎 - 预测项目风险
     */
    assessProjectRisk(session: WizardSession): Promise<ToolResult>;
    /**
     * 性能预测分析 - 预测架构性能表现
     */
    predictPerformance(session: WizardSession): Promise<ToolResult>;
    /**
     * 成本效益分析 - 分析技术选择的成本效益
     */
    analyzeCostBenefit(session: WizardSession): Promise<ToolResult>;
    /**
     * 技术债务预测 - 预测未来技术债务风险
     */
    predictTechDebt(session: WizardSession): Promise<ToolResult>;
    /**
     * 智能学习系统 - 从历史决策中学习并提供自适应建议
     */
    generateAdaptiveLearning(session: WizardSession): Promise<ToolResult>;
    /**
     * 竞品智能对比分析
     */
    analyzeCompetitorIntelligently(session: WizardSession, competitorName: string): Promise<ToolResult>;
    private analyzeTechnicalRisks;
    private analyzeTeamRisks;
    private analyzeTimelineRisks;
    private analyzeBusinessRisks;
    private calculateRiskLevel;
    private calculateRiskProbability;
    private determineRiskImpact;
    private generateMitigationStrategies;
    private predictLoadTime;
    private getBaseLoadTime;
    private predictBundleSize;
    private getFrameworkSize;
    private assessScalability;
    private generatePerformanceRecommendations;
    private initializeLearningData;
    private initializeRiskDatabase;
    private initializePerformanceModels;
    private initializeCostModels;
    private calculateTechComplexity;
    private analyzeImplementationCost;
    private analyzeMaintenanceCost;
    private analyzeBenefits;
    private calculateROI;
    private analyzeTechDebtByTechnology;
    private analyzeTechDebtByArchitecture;
    private analyzeTechDebtByTeam;
    private generateTechDebtTimeline;
    private calculateTechDebtScore;
    private generateTechDebtRecommendations;
    private analyzeHistoricalPatterns;
    private identifySuccessFactors;
    private generateAdaptiveRecommendations;
    private updateLearningData;
    private extractIntelligentFeatures;
    private compareWithCurrentProject;
    private generateGapAnalysis;
    private generateCompetitiveAdvantages;
    private generateCompetitorActionItems;
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
export {};
//# sourceMappingURL=IntelligenceEngine.d.ts.map