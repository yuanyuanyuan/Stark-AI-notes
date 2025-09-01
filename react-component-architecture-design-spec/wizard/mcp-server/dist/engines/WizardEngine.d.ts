/**
 * 向导引擎 - 管理对话流程和阶段转换的核心引擎
 * 实现6阶段对话流程：项目定位、团队评估、功能收集、盲点发现、矛盾解决、方案确认
 */
import { WizardSession, WizardStage, QuestionResult, ToolResult } from '../types/index.js';
import { SessionManager } from '../managers/SessionManager.js';
import { IntelligenceEngine } from './IntelligenceEngine.js';
import { Generator } from './Generator.js';
import { ExternalToolsIntegrator } from '../integrators/ExternalToolsIntegrator.js';
export declare class WizardEngine {
    private sessionManager;
    private intelligenceEngine;
    private generator;
    private externalTools;
    constructor(sessionManager: SessionManager, intelligenceEngine: IntelligenceEngine, generator: Generator, externalTools: ExternalToolsIntegrator);
    /**
     * 启动新的架构设计向导
     */
    startWizard(projectName: string, reset?: boolean): Promise<WizardSession>;
    /**
     * 获取下一个问题
     */
    getNextQuestion(sessionId: string): Promise<QuestionResult>;
    /**
     * 处理用户回答
     */
    processAnswer(sessionId: string, answer: string): Promise<{
        type: string;
        message: string;
        question?: QuestionResult;
        stage: WizardStage;
        progress: number;
    }>;
    /**
     * 验证需求合理性
     */
    validateRequirements(sessionId: string): Promise<ToolResult>;
    /**
     * 生成架构
     */
    generateArchitecture(sessionId: string, confirm?: boolean): Promise<ToolResult>;
    /**
     * 导出项目
     */
    exportProject(sessionId: string, outputPath: string, options?: {
        includeTests?: boolean;
        includeExamples?: boolean;
    }): Promise<ToolResult>;
    /**
     * 项目定位阶段的问题
     */
    private getProjectPositioningQuestion;
    /**
     * 团队评估阶段的问题
     */
    private getTeamAssessmentQuestion;
    /**
     * 功能收集阶段的问题
     */
    private getFeatureCollectionQuestion;
    /**
     * 盲点检测阶段的问题
     */
    private getBlindSpotQuestion;
    /**
     * 矛盾解决阶段的问题
     */
    private getContradictionQuestion;
    /**
     * 方案确认阶段的问题
     */
    private getSolutionConfirmationQuestion;
    private needsCompetitorAnalysis;
    private extractCompetitorName;
    private createDecision;
    private updateRequirements;
    private checkNeedsClarification;
    private getNextStage;
    private calculateProgress;
    private getRecommendedFeatures;
    private getProjectTypeName;
    private generateRequirementsSummary;
}
//# sourceMappingURL=WizardEngine.d.ts.map