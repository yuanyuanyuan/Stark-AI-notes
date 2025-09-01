"use strict";
/**
 * 性能监控器 - 监控系统性能，识别瓶颈，提供优化建议
 * 支持实时监控、性能分析和自动优化建议
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
const perf_hooks_1 = require("perf_hooks");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class PerformanceMonitor {
    activeMetrics = new Map();
    completedProfiles = [];
    config;
    alerts = [];
    memoryBaseline = 0;
    constructor(config) {
        this.config = {
            enableProfiling: true,
            slowOperationThreshold: 1000, // 1秒
            memoryLeakThreshold: 50 * 1024 * 1024, // 50MB
            maxProfiles: 100,
            alertThresholds: {
                slowOperation: 2000, // 2秒
                memoryUsage: 100 * 1024 * 1024, // 100MB
                cpuUsage: 80, // 80%
            },
            persistMetrics: true,
            metricsPath: '.wizard/metrics/',
            ...config,
        };
        this.initializeMonitoring();
    }
    /**
     * 初始化监控系统
     */
    async initializeMonitoring() {
        if (!this.config.enableProfiling)
            return;
        this.memoryBaseline = process.memoryUsage().heapUsed;
        if (this.config.persistMetrics) {
            try {
                await fs_extra_1.default.ensureDir(this.config.metricsPath);
                await this.loadPersistedMetrics();
            }
            catch (error) {
                console.error('初始化性能监控失败:', error);
            }
        }
        // 定期检查内存使用情况
        setInterval(() => {
            this.checkMemoryUsage();
        }, 30000); // 30秒检查一次
        console.log('性能监控系统已启动');
    }
    /**
     * 开始性能分析
     */
    startProfile(name, metadata) {
        if (!this.config.enableProfiling)
            return '';
        const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const metric = {
            name,
            startTime: perf_hooks_1.performance.now(),
            metadata,
            tags: metadata?.tags,
        };
        this.activeMetrics.set(id, metric);
        return id;
    }
    /**
     * 结束性能分析
     */
    endProfile(id) {
        const metric = this.activeMetrics.get(id);
        if (!metric)
            return null;
        metric.endTime = perf_hooks_1.performance.now();
        metric.duration = metric.endTime - metric.startTime;
        this.activeMetrics.delete(id);
        this.processMetric(metric);
        return metric;
    }
    /**
     * 性能装饰器
     */
    profile(name, options) {
        return (target, propertyKey, descriptor) => {
            const originalMethod = descriptor.value;
            const profileName = name || `${target.constructor.name}.${propertyKey}`;
            descriptor.value = async function (...args) {
                const monitor = this.performanceMonitor || global.performanceMonitor;
                if (!monitor) {
                    return originalMethod.apply(this, args);
                }
                const profileId = monitor.startProfile(profileName, {
                    args: args.length,
                    tags: options?.tags,
                });
                try {
                    const result = await originalMethod.apply(this, args);
                    const metric = monitor.endProfile(profileId);
                    // 检查是否超过阈值
                    if (options?.threshold && metric && metric.duration > options.threshold) {
                        monitor.addAlert({
                            type: 'slow_operation',
                            message: `方法 ${profileName} 执行时间过长`,
                            severity: 'medium',
                            metric: profileName,
                            value: metric.duration,
                            threshold: options.threshold,
                            timestamp: Date.now(),
                            suggestions: [
                                '考虑添加缓存机制',
                                '优化算法复杂度',
                                '使用异步处理',
                                '拆分为更小的方法',
                            ],
                        });
                    }
                    return result;
                }
                catch (error) {
                    monitor.endProfile(profileId);
                    throw error;
                }
            };
        };
    }
    /**
     * 创建性能分析会话
     */
    createProfile(name) {
        const profile = {
            id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            metrics: [],
            startTime: perf_hooks_1.performance.now(),
            memoryUsage: this.getMemoryUsage(),
        };
        return profile;
    }
    /**
     * 完成性能分析会话
     */
    completeProfile(profile) {
        profile.endTime = perf_hooks_1.performance.now();
        profile.totalDuration = profile.endTime - profile.startTime;
        // 保持最近的分析记录
        this.completedProfiles.push(profile);
        if (this.completedProfiles.length > this.config.maxProfiles) {
            this.completedProfiles = this.completedProfiles.slice(-this.config.maxProfiles);
        }
        // 检查慢操作
        if (profile.totalDuration > this.config.alertThresholds.slowOperation) {
            this.addAlert({
                type: 'slow_operation',
                message: `性能分析会话 ${profile.name} 执行时间过长`,
                severity: profile.totalDuration > this.config.alertThresholds.slowOperation * 2 ? 'high' : 'medium',
                metric: profile.name,
                value: profile.totalDuration,
                threshold: this.config.alertThresholds.slowOperation,
                timestamp: Date.now(),
                suggestions: this.generateOptimizationSuggestions(profile),
            });
        }
        // 持久化
        if (this.config.persistMetrics) {
            this.persistProfile(profile);
        }
    }
    /**
     * 添加自定义指标
     */
    addMetric(name, value, unit = 'ms', tags) {
        const metric = {
            name,
            startTime: perf_hooks_1.performance.now(),
            endTime: perf_hooks_1.performance.now(),
            duration: value,
            metadata: { unit, value },
            tags,
        };
        this.processMetric(metric);
    }
    /**
     * 测量异步操作性能
     */
    async measureAsync(name, operation, options) {
        const profileId = this.startProfile(name, { tags: options?.tags });
        try {
            const result = await operation();
            const metric = this.endProfile(profileId);
            if (options?.threshold && metric && metric.duration > options.threshold) {
                this.addAlert({
                    type: 'slow_operation',
                    message: `异步操作 ${name} 执行时间过长`,
                    severity: 'medium',
                    metric: name,
                    value: metric.duration,
                    threshold: options.threshold,
                    timestamp: Date.now(),
                    suggestions: [
                        '考虑使用缓存',
                        '优化数据库查询',
                        '减少网络请求',
                        '使用批处理',
                    ],
                });
            }
            return result;
        }
        catch (error) {
            this.endProfile(profileId);
            throw error;
        }
    }
    /**
     * 获取性能统计信息
     */
    getStats() {
        const durations = this.completedProfiles.map(p => p.totalDuration).filter(d => d > 0);
        // 按操作类型聚合
        const operationStats = new Map();
        this.completedProfiles.forEach(profile => {
            profile.metrics.forEach(metric => {
                if (metric.duration) {
                    const existing = operationStats.get(metric.name) || { totalDuration: 0, count: 0 };
                    existing.totalDuration += metric.duration;
                    existing.count += 1;
                    operationStats.set(metric.name, existing);
                }
            });
        });
        const topSlowOperations = Array.from(operationStats.entries())
            .map(([name, stats]) => ({
            name,
            avgDuration: stats.totalDuration / stats.count,
            count: stats.count,
        }))
            .sort((a, b) => b.avgDuration - a.avgDuration)
            .slice(0, 10);
        return {
            totalProfiles: this.completedProfiles.length,
            avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
            maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
            minDuration: durations.length > 0 ? Math.min(...durations) : 0,
            topSlowOperations,
            memoryTrend: this.getMemoryTrend(),
        };
    }
    /**
     * 获取性能警告
     */
    getAlerts(severity) {
        if (severity) {
            return this.alerts.filter(alert => alert.severity === severity);
        }
        return [...this.alerts];
    }
    /**
     * 清除警告
     */
    clearAlerts() {
        this.alerts = [];
    }
    /**
     * 生成性能报告
     */
    generateReport() {
        const stats = this.getStats();
        const alerts = this.getAlerts();
        const summary = {
            profilesAnalyzed: stats.totalProfiles,
            averageResponseTime: Math.round(stats.avgDuration),
            slowestOperation: stats.topSlowOperations[0]?.name || 'N/A',
            alertsCount: alerts.length,
            memoryUsage: this.getMemoryUsage(),
        };
        const details = {
            stats,
            alerts,
            topSlowOperations: stats.topSlowOperations.slice(0, 5),
            recentProfiles: this.completedProfiles.slice(-5).map(p => ({
                name: p.name,
                duration: p.totalDuration,
                timestamp: new Date(Date.now() - (perf_hooks_1.performance.now() - p.startTime)).toISOString(),
            })),
        };
        const recommendations = this.generateGlobalRecommendations(stats, alerts);
        return { summary, details, recommendations };
    }
    /**
     * 启用/禁用性能分析
     */
    setProfilingEnabled(enabled) {
        this.config.enableProfiling = enabled;
        console.log(`性能分析已${enabled ? '启用' : '禁用'}`);
    }
    // =============================================================================
    // 私有方法
    // =============================================================================
    /**
     * 处理性能指标
     */
    processMetric(metric) {
        // 检查是否为慢操作
        if (metric.duration && metric.duration > this.config.slowOperationThreshold) {
            this.addAlert({
                type: 'slow_operation',
                message: `操作 ${metric.name} 执行时间过长: ${Math.round(metric.duration)}ms`,
                severity: metric.duration > this.config.alertThresholds.slowOperation ? 'high' : 'medium',
                metric: metric.name,
                value: metric.duration,
                threshold: this.config.slowOperationThreshold,
                timestamp: Date.now(),
                suggestions: [
                    '检查是否可以添加缓存',
                    '优化算法或查询',
                    '考虑异步处理',
                    '检查是否有不必要的计算',
                ],
            });
        }
    }
    /**
     * 添加性能警告
     */
    addAlert(alert) {
        this.alerts.push(alert);
        // 保持最近100个警告
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-100);
        }
        // 输出关键警告到控制台
        if (alert.severity === 'high' || alert.severity === 'critical') {
            console.warn(`性能警告 [${alert.severity.toUpperCase()}]: ${alert.message}`);
        }
    }
    /**
     * 检查内存使用情况
     */
    checkMemoryUsage() {
        const memoryUsage = process.memoryUsage();
        const currentHeapUsed = memoryUsage.heapUsed;
        // 检查内存泄漏
        if (currentHeapUsed - this.memoryBaseline > this.config.memoryLeakThreshold) {
            this.addAlert({
                type: 'memory_leak',
                message: `检测到可能的内存泄漏，内存使用量增加了 ${Math.round((currentHeapUsed - this.memoryBaseline) / 1024 / 1024)}MB`,
                severity: 'high',
                metric: 'memory_usage',
                value: currentHeapUsed,
                threshold: this.memoryBaseline + this.config.memoryLeakThreshold,
                timestamp: Date.now(),
                suggestions: [
                    '检查是否有未清理的定时器',
                    '检查缓存是否正确清理',
                    '检查是否有循环引用',
                    '使用内存分析工具进行详细检查',
                ],
            });
        }
        // 检查高内存使用
        if (currentHeapUsed > this.config.alertThresholds.memoryUsage) {
            this.addAlert({
                type: 'high_cpu',
                message: `内存使用量过高: ${Math.round(currentHeapUsed / 1024 / 1024)}MB`,
                severity: 'medium',
                metric: 'memory_usage',
                value: currentHeapUsed,
                threshold: this.config.alertThresholds.memoryUsage,
                timestamp: Date.now(),
                suggestions: [
                    '清理缓存',
                    '优化数据结构',
                    '减少内存占用的操作',
                ],
            });
        }
    }
    /**
     * 获取内存使用情况
     */
    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external,
            rss: usage.rss,
        };
    }
    /**
     * 获取内存趋势
     */
    getMemoryTrend() {
        // 简化实现：返回最近的内存使用记录
        const now = Date.now();
        return Array.from({ length: 10 }, (_, i) => ({
            timestamp: now - (9 - i) * 60000, // 每分钟一个点
            heapUsed: process.memoryUsage().heapUsed + Math.random() * 1000000, // 模拟数据
        }));
    }
    /**
     * 生成优化建议
     */
    generateOptimizationSuggestions(profile) {
        const suggestions = [];
        // 基于执行时间的建议
        if (profile.totalDuration && profile.totalDuration > 5000) {
            suggestions.push('考虑将长时间运行的操作拆分为多个步骤');
            suggestions.push('使用进度指示器改善用户体验');
        }
        // 基于指标数量的建议
        if (profile.metrics.length > 20) {
            suggestions.push('操作步骤较多，考虑优化流程');
            suggestions.push('检查是否有重复的计算');
        }
        // 通用建议
        suggestions.push('添加适当的缓存机制');
        suggestions.push('使用异步处理减少阻塞');
        suggestions.push('考虑数据预处理和预加载');
        return suggestions;
    }
    /**
     * 生成全局优化建议
     */
    generateGlobalRecommendations(stats, alerts) {
        const recommendations = [];
        if (stats.avgDuration > 2000) {
            recommendations.push('系统整体响应时间较慢，建议进行全面性能优化');
        }
        if (alerts.filter(a => a.type === 'slow_operation').length > 5) {
            recommendations.push('存在多个慢操作，建议实施缓存策略');
        }
        if (alerts.filter(a => a.type === 'memory_leak').length > 0) {
            recommendations.push('检测到内存问题，建议进行内存使用审查');
        }
        if (stats.topSlowOperations.length > 0) {
            const slowestOp = stats.topSlowOperations[0];
            recommendations.push(`最慢的操作是 "${slowestOp.name}"，建议优先优化`);
        }
        return recommendations;
    }
    /**
     * 持久化性能分析
     */
    async persistProfile(profile) {
        try {
            const filePath = path_1.default.join(this.config.metricsPath, `profile_${Date.now()}.json`);
            await fs_extra_1.default.writeJson(filePath, profile, { spaces: 2 });
        }
        catch (error) {
            console.error('持久化性能分析失败:', error);
        }
    }
    /**
     * 加载持久化的指标
     */
    async loadPersistedMetrics() {
        try {
            const files = await fs_extra_1.default.readdir(this.config.metricsPath);
            const profileFiles = files.filter(f => f.startsWith('profile_') && f.endsWith('.json'));
            // 只加载最近的文件
            const recentFiles = profileFiles
                .sort((a, b) => b.localeCompare(a))
                .slice(0, this.config.maxProfiles);
            for (const file of recentFiles) {
                try {
                    const filePath = path_1.default.join(this.config.metricsPath, file);
                    const profile = await fs_extra_1.default.readJson(filePath);
                    this.completedProfiles.push(profile);
                }
                catch (error) {
                    // 删除损坏的文件
                    await fs_extra_1.default.remove(path_1.default.join(this.config.metricsPath, file));
                }
            }
            console.log(`加载了 ${this.completedProfiles.length} 个历史性能分析`);
        }
        catch (error) {
            console.error('加载持久化指标失败:', error);
        }
    }
    /**
     * 析构函数
     */
    async dispose() {
        // 保存当前活跃的指标
        for (const [id, metric] of this.activeMetrics) {
            this.endProfile(id);
        }
        console.log('性能监控器已释放资源');
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
