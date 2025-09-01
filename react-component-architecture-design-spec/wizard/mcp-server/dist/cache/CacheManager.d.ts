/**
 * 缓存管理器 - 提供多层缓存机制，支持内存缓存和持久化缓存
 * 优化外部工具调用和复杂计算的性能表现
 */
interface CacheConfig {
    maxMemoryEntries: number;
    defaultTTL: number;
    persistentCachePath: string;
    enablePersistentCache: boolean;
    cleanupInterval: number;
}
interface CacheStats {
    memoryEntries: number;
    persistentEntries: number;
    totalEntries: number;
    hitRate: number;
    totalRequests: number;
    totalHits: number;
    memoryUsage: number;
}
export declare class CacheManager {
    private memoryCache;
    private config;
    private cleanupTimer?;
    private stats;
    constructor(config?: Partial<CacheConfig>);
    /**
     * 初始化缓存系统
     */
    private initializeCache;
    /**
     * 生成缓存键
     */
    private generateKey;
    /**
     * 设置缓存
     */
    set<T>(namespace: string, key: string, value: T, options?: {
        ttl?: number;
        tags?: string[];
        params?: any;
    }): Promise<void>;
    /**
     * 获取缓存
     */
    get<T>(namespace: string, key: string, params?: any): Promise<T | null>;
    /**
     * 删除缓存
     */
    delete(namespace: string, key: string, params?: any): Promise<boolean>;
    /**
     * 批量删除（按标签）
     */
    deleteByTags(tags: string[]): Promise<number>;
    /**
     * 清空所有缓存
     */
    clear(): Promise<void>;
    /**
     * 获取缓存统计信息
     */
    getStats(): Promise<CacheStats>;
    /**
     * 手动触发清理过期缓存
     */
    cleanup(): Promise<{
        memoryCleared: number;
        persistentCleared: number;
    }>;
    /**
     * 缓存装饰器 - 用于方法缓存
     */
    cached<T extends (...args: any[]) => Promise<any>>(namespace: string, ttl?: number, keyGenerator?: (...args: Parameters<T>) => string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
    /**
     * 预热缓存 - 批量加载常用数据
     */
    warmup(tasks: Array<{
        namespace: string;
        key: string;
        loader: () => Promise<any>;
        ttl?: number;
        params?: any;
    }>): Promise<void>;
    /**
     * 清理最少使用的缓存条目
     */
    private evictLeastUsed;
    /**
     * 获取缓存文件路径
     */
    private getCacheFilePath;
    /**
     * 保存到持久化缓存
     */
    private saveToPersistentCache;
    /**
     * 从持久化缓存加载
     */
    private loadFromPersistentCache;
    /**
     * 加载所有持久化缓存到内存
     */
    private loadPersistentCache;
    /**
     * 计算内存使用量（估算）
     */
    private calculateMemoryUsage;
    /**
     * 启动清理定时器
     */
    private startCleanupTimer;
    /**
     * 停止清理定时器
     */
    stopCleanup(): void;
    /**
     * 析构函数
     */
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=CacheManager.d.ts.map