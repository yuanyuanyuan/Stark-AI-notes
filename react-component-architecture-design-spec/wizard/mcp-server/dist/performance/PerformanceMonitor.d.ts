/**
 * 性能监控器 - 监控系统性能，识别瓶颈，提供优化建议
 * 支持实时监控、性能分析和自动优化建议
 */
interface PerformanceMetric {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
    tags?: string[];
}
interface PerformanceProfile {
    id: string;
    name: string;
    metrics: PerformanceMetric[];
    startTime: number;
    endTime?: number;
    totalDuration?: number;
    memoryUsage?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
}
interface PerformanceStats {
    totalProfiles: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
    topSlowOperations: Array<{
        name: string;
        avgDuration: number;
        count: number;
    }>;
    memoryTrend: Array<{
        timestamp: number;
        heapUsed: number;
    }>;
}
interface PerformanceAlert {
    type: 'slow_operation' | 'memory_leak' | 'high_cpu' | 'bottleneck';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metric: string;
    value: number;
    threshold: number;
    timestamp: number;
    suggestions: string[];
}
interface PerformanceConfig {
    enableProfiling: boolean;
    slowOperationThreshold: number;
    memoryLeakThreshold: number;
    maxProfiles: number;
    alertThresholds: {
        slowOperation: number;
        memoryUsage: number;
        cpuUsage: number;
    };
    persistMetrics: boolean;
    metricsPath: string;
}
export declare class PerformanceMonitor {
    private activeMetrics;
    private completedProfiles;
    private config;
    private alerts;
    private memoryBaseline;
    constructor(config?: Partial<PerformanceConfig>);
    /**
     * 初始化监控系统
     */
    private initializeMonitoring;
    /**
     * 开始性能分析
     */
    startProfile(name: string, metadata?: Record<string, any>): string;
    /**
     * 结束性能分析
     */
    endProfile(id: string): PerformanceMetric | null;
    /**
     * 性能装饰器
     */
    profile(name?: string, options?: {
        threshold?: number;
        tags?: string[];
    }): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
    /**
     * 创建性能分析会话
     */
    createProfile(name: string): PerformanceProfile;
    /**
     * 完成性能分析会话
     */
    completeProfile(profile: PerformanceProfile): void;
    /**
     * 添加自定义指标
     */
    addMetric(name: string, value: number, unit?: string, tags?: string[]): void;
    /**
     * 测量异步操作性能
     */
    measureAsync<T>(name: string, operation: () => Promise<T>, options?: {
        threshold?: number;
        tags?: string[];
    }): Promise<T>;
    /**
     * 获取性能统计信息
     */
    getStats(): PerformanceStats;
    /**
     * 获取性能警告
     */
    getAlerts(severity?: PerformanceAlert['severity']): PerformanceAlert[];
    /**
     * 清除警告
     */
    clearAlerts(): void;
    /**
     * 生成性能报告
     */
    generateReport(): {
        summary: any;
        details: any;
        recommendations: string[];
    };
    /**
     * 启用/禁用性能分析
     */
    setProfilingEnabled(enabled: boolean): void;
    /**
     * 处理性能指标
     */
    private processMetric;
    /**
     * 添加性能警告
     */
    private addAlert;
    /**
     * 检查内存使用情况
     */
    private checkMemoryUsage;
    /**
     * 获取内存使用情况
     */
    private getMemoryUsage;
    /**
     * 获取内存趋势
     */
    private getMemoryTrend;
    /**
     * 生成优化建议
     */
    private generateOptimizationSuggestions;
    /**
     * 生成全局优化建议
     */
    private generateGlobalRecommendations;
    /**
     * 持久化性能分析
     */
    private persistProfile;
    /**
     * 加载持久化的指标
     */
    private loadPersistedMetrics;
    /**
     * 析构函数
     */
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=PerformanceMonitor.d.ts.map