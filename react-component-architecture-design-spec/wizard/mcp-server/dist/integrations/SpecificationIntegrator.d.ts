/**
 * 规范集成器 - 与现有React架构规范的集成
 * 确保向导生成的结果完全符合现有规范标准
 */
import { WizardSession, ArchitectureSpec, ToolResult } from '../types/index.js';
export interface SpecificationConfig {
    version: string;
    compatibility: {
        minWizardVersion: string;
        maxWizardVersion: string;
    };
    patterns: ArchitecturePattern[];
    layers: LayerDefinition[];
    conventions: NamingConventions;
    validation: ValidationRules;
}
export interface ArchitecturePattern {
    name: string;
    displayName: string;
    description: string;
    suitableFor: {
        teamSize: {
            min: number;
            max: number;
        };
        complexity: 'low' | 'medium' | 'high';
        projectTypes: string[];
    };
    structure: {
        layers: string[];
        dependencies: DependencyRule[];
    };
    templates: string[];
}
export interface LayerDefinition {
    name: string;
    description: string;
    purpose: string;
    conventions: {
        naming: string;
        location: string;
        imports: string[];
        exports: string[];
    };
    allowedDependencies: string[];
    restrictions: string[];
}
export interface NamingConventions {
    components: {
        files: string;
        classes: string;
        interfaces: string;
        props: string;
    };
    directories: {
        components: string;
        pages: string;
        services: string;
        types: string;
    };
    constants: {
        actions: string;
        configs: string;
    };
}
export interface ValidationRules {
    architecture: ArchitectureRule[];
    components: ComponentRule[];
    dependencies: DependencyRule[];
    naming: NamingRule[];
}
export interface ArchitectureRule {
    id: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
    check: (architecture: ArchitectureSpec) => boolean;
    message: string;
}
export interface ComponentRule {
    id: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
    check: (component: any) => boolean;
    message: string;
}
export interface DependencyRule {
    from: string;
    to: string;
    allowed: boolean;
    reason?: string;
}
export interface NamingRule {
    target: 'component' | 'file' | 'directory' | 'interface';
    pattern: RegExp;
    message: string;
}
export declare class SpecificationIntegrator {
    private config;
    private specPath;
    constructor(specPath?: string);
    /**
     * 获取默认规范路径
     */
    private getDefaultSpecPath;
    /**
     * 加载规范配置
     */
    private loadConfiguration;
    /**
     * 创建默认配置文件
     */
    private createDefaultConfiguration;
    /**
     * 获取默认配置
     */
    private getDefaultConfiguration;
    /**
     * 验证架构是否符合规范
     */
    validateArchitecture(architecture: ArchitectureSpec): Promise<ToolResult>;
    /**
     * 验证架构模式
     */
    private validateArchitecturePattern;
    /**
     * 验证分层结构
     */
    private validateLayerStructure;
    /**
     * 验证命名约定
     */
    private validateNaming;
    /**
     * 验证依赖关系
     */
    private validateDependencies;
    /**
     * 从路径中提取层名称
     */
    private extractLayerFromPath;
    /**
     * 检查循环依赖
     */
    private hasCyclicDependency;
    /**
     * 计算合规得分
     */
    private calculateComplianceScore;
    /**
     * 生成合规建议
     */
    private generateComplianceSuggestions;
    /**
     * 生成合规报告
     */
    private generateComplianceReport;
    /**
     * 获取模式推荐
     */
    private getPatternRecommendations;
    /**
     * 将向导会话映射到规范结构
     */
    mapSessionToSpecification(session: WizardSession): any;
    /**
     * 映射项目类型
     */
    private mapProjectType;
    /**
     * 映射团队规模
     */
    private mapTeamScale;
    /**
     * 估算复杂度
     */
    private estimateComplexity;
    /**
     * 选择最优架构模式
     */
    private selectOptimalPattern;
    /**
     * 生成分层结构
     */
    private generateLayerStructure;
    /**
     * 生成组件结构
     */
    private generateComponentStructure;
    /**
     * 功能名转组件名
     */
    private featureToComponent;
    /**
     * 确定组件应该在哪个层
     */
    private determineComponentLayer;
    /**
     * 获取规范版本信息
     */
    getSpecificationInfo(): any;
    /**
     * 更新规范配置
     */
    updateSpecification(updates: Partial<SpecificationConfig>): Promise<ToolResult>;
}
//# sourceMappingURL=SpecificationIntegrator.d.ts.map