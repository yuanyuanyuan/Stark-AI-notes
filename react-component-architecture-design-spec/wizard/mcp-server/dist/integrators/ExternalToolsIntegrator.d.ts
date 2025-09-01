/**
 * 外部工具集成器 - 负责调用外部MCP工具获取实时信息
 * 支持Context7、Exa AI、DeepWiki等外部工具的集成和编排
 * 集成缓存机制和性能监控，优化外部工具调用性能
 */
import { ExternalToolCall, ToolResult } from '../types/index.js';
export declare class ExternalToolsIntegrator {
    private config;
    private callHistory;
    private cacheManager;
    private performanceMonitor;
    constructor();
    /**
     * 获取技术栈最佳实践
     * 结合Context7和Exa搜索获取全面信息
     * 集成缓存和性能监控优化
     */
    getBestPractices(tech: string): Promise<ToolResult>;
    /**
     * 验证架构决策
     * 通过搜索类似架构的成功案例来验证决策合理性
     */
    validateArchitecture(pattern: string, features: string[]): Promise<ToolResult>;
    /**
     * 分析竞品特性
     * 当用户提到"像XX一样"时，深度分析竞品特性
     */
    analyzeCompetitor(competitorName: string): Promise<ToolResult>;
    /**
     * 获取技术趋势
     * 为用户提供当前技术趋势和建议
     */
    getTechTrends(domain: string): Promise<ToolResult>;
    /**
     * 调用Context7工具
     */
    private callContext7;
    /**
     * 调用Exa工具
     */
    private callExa;
    /**
     * 调用DeepWiki工具
     */
    private callDeepWiki;
    /**
     * 聚合多个工具的结果
     */
    private aggregateResults;
    /**
     * 提取推荐信息
     */
    private extractRecommendations;
    /**
     * 提取验证推荐信息
     */
    private extractValidationRecommendations;
    /**
     * 识别架构风险
     */
    private identifyRisks;
    /**
     * 建议替代方案
     */
    private suggestAlternatives;
    /**
     * 提取竞品特性
     */
    private extractFeatures;
    /**
     * 生成竞品分析推荐
     */
    private generateCompetitorRecommendations;
    /**
     * 提取趋势推荐
     */
    private extractTrendRecommendations;
    /**
     * 评估采用风险
     */
    private assessAdoptionRisk;
    /**
     * 生成调用ID
     */
    private generateCallId;
    /**
     * 获取调用历史
     */
    getCallHistory(): ExternalToolCall[];
    /**
     * 清理调用历史
     */
    clearCallHistory(): void;
    /**
     * 调用Context7解析库ID
     */
    private callContext7ResolveLibrary;
    /**
     * 调用Context7获取库文档
     */
    private callContext7GetDocs;
    /**
     * 调用Exa进行Web搜索
     */
    private callExaWebSearch;
    /**
     * 调用Exa进行公司研究
     */
    private callExaCompanyResearch;
    /**
     * 调用Exa进行深度研究
     */
    private callExaDeepResearch;
    /**
     * 调用DeepWiki获取仓库文档
     */
    private callDeepWikiReal;
    /**
     * 标准化库ID格式
     */
    private normalizeLibraryId;
    /**
     * 生成技术文档数据
     */
    private generateTechDocs;
    /**
     * 获取库文档内容
     */
    private getLibraryDocContent;
    /**
     * 获取库最佳实践
     */
    private getLibraryBestPractices;
    /**
     * 获取库示例代码
     */
    private getLibraryExamples;
    /**
     * 获取库最新版本
     */
    private getLatestVersion;
    /**
     * 执行Web搜索
     */
    private performWebSearch;
    /**
     * 执行公司研究
     */
    private performCompanyResearch;
    /**
     * 执行深度研究
     */
    private performDeepResearch;
    /**
     * 提取研究主题
     */
    private extractResearchTopics;
    /**
     * 生成洞察
     */
    private generateInsights;
    /**
     * 生成信息源
     */
    private generateSources;
    /**
     * 获取DeepWiki数据
     */
    private fetchDeepWikiData;
    private mockContext7Call;
    private mockExaCall;
    private mockDeepWikiCall;
    /**
     * 清理缓存
     */
    clearCache(tags?: string[]): Promise<void>;
    /**
     * 获取缓存统计信息
     */
    getCacheStats(): Promise<any>;
    /**
     * 预热缓存 - 预加载常用技术文档
     */
    warmupCache(): Promise<void>;
    /**
     * 获取性能统计信息
     */
    getPerformanceStats(): any;
    /**
     * 获取性能警告
     */
    getPerformanceAlerts(severity?: 'low' | 'medium' | 'high' | 'critical'): any;
    /**
     * 生成性能报告
     */
    generatePerformanceReport(): {
        summary: any;
        details: any;
        recommendations: string[];
    };
    /**
     * 清除性能警告
     */
    clearPerformanceAlerts(): void;
    /**
     * 启用/禁用性能分析
     */
    setProfilingEnabled(enabled: boolean): void;
    /**
     * 析构函数 - 清理资源
     */
    dispose(): Promise<void>;
}
//# sourceMappingURL=ExternalToolsIntegrator.d.ts.map