/**
 * 缓存管理器 - 提供多层缓存机制，支持内存缓存和持久化缓存
 * 优化外部工具调用和复杂计算的性能表现
 */

import fs from 'fs-extra';
import path from 'path';
import { createHash } from 'crypto';

interface CacheEntry<T = any> {
  key: string;
  value: T;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  ttl?: number; // Time to live in milliseconds
  tags?: string[];
}

interface CacheConfig {
  maxMemoryEntries: number;
  defaultTTL: number; // 默认缓存时间 (ms)
  persistentCachePath: string;
  enablePersistentCache: boolean;
  cleanupInterval: number; // 清理间隔 (ms)
}

interface CacheStats {
  memoryEntries: number;
  persistentEntries: number;
  totalEntries: number; // 新增：总条目数，用于测试
  hitRate: number;
  totalRequests: number;
  totalHits: number;
  memoryUsage: number;
}

export class CacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private stats = {
    totalRequests: 0,
    totalHits: 0,
  };

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxMemoryEntries: 1000,
      defaultTTL: 60 * 60 * 1000, // 1小时
      persistentCachePath: '.wizard/cache/',
      enablePersistentCache: true,
      cleanupInterval: 5 * 60 * 1000, // 5分钟
      ...config,
    };

    this.initializeCache();
    this.startCleanupTimer();
  }

  /**
   * 初始化缓存系统
   */
  private async initializeCache(): Promise<void> {
    if (this.config.enablePersistentCache) {
      try {
        await fs.ensureDir(this.config.persistentCachePath);
        await this.loadPersistentCache();
        console.log('缓存系统初始化完成');
      } catch (error) {
        console.error('缓存系统初始化失败:', error);
      }
    }
  }

  /**
   * 生成缓存键
   */
  private generateKey(namespace: string, key: string, params?: any): string {
    const baseKey = `${namespace}:${key}`;
    if (!params) return baseKey;

    const paramsStr = typeof params === 'string' ? params : JSON.stringify(params);
    const hash = createHash('md5').update(paramsStr).digest('hex').substring(0, 8);
    return `${baseKey}:${hash}`;
  }

  /**
   * 设置缓存
   */
  async set<T>(
    namespace: string,
    key: string,
    value: T,
    options?: {
      ttl?: number;
      tags?: string[];
      params?: any;
    }
  ): Promise<void> {
    const cacheKey = this.generateKey(namespace, key, options?.params);
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      key: cacheKey,
      value,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0,
      ttl: options?.ttl || this.config.defaultTTL,
      tags: options?.tags,
    };

    // 内存缓存
    this.memoryCache.set(cacheKey, entry);

    // 如果超过内存限制，清理最少使用的条目
    if (this.memoryCache.size > this.config.maxMemoryEntries) {
      await this.evictLeastUsed();
    }

    // 持久化缓存
    if (this.config.enablePersistentCache) {
      await this.saveToPersistentCache(cacheKey, entry);
    }
  }

  /**
   * 获取缓存
   */
  async get<T>(
    namespace: string,
    key: string,
    params?: any
  ): Promise<T | null> {
    const cacheKey = this.generateKey(namespace, key, params);
    this.stats.totalRequests++;

    // 先检查内存缓存
    let entry = this.memoryCache.get(cacheKey);
    
    // 如果内存中没有，检查持久化缓存
    if (!entry && this.config.enablePersistentCache) {
      entry = await this.loadFromPersistentCache(cacheKey);
      if (entry) {
        // 将持久化缓存加载到内存中
        this.memoryCache.set(cacheKey, entry);
      }
    }

    if (!entry) {
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (entry.ttl && (now - entry.createdAt) > entry.ttl) {
      await this.delete(namespace, key, params);
      return null;
    }

    // 更新访问信息
    entry.lastAccessed = now;
    entry.accessCount++;
    this.stats.totalHits++;

    return entry.value as T;
  }

  /**
   * 删除缓存
   */
  async delete(namespace: string, key: string, params?: any): Promise<boolean> {
    const cacheKey = this.generateKey(namespace, key, params);
    
    // 从内存缓存删除
    const memoryDeleted = this.memoryCache.delete(cacheKey);
    
    // 从持久化缓存删除
    let persistentDeleted = false;
    if (this.config.enablePersistentCache) {
      try {
        const filePath = this.getCacheFilePath(cacheKey);
        await fs.remove(filePath);
        persistentDeleted = true;
      } catch (error) {
        // 文件可能不存在，忽略错误
      }
    }

    return memoryDeleted || persistentDeleted;
  }

  /**
   * 批量删除（按标签）
   */
  async deleteByTags(tags: string[]): Promise<number> {
    let deleted = 0;
    
    // 内存缓存
    for (const [key, entry] of this.memoryCache) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        this.memoryCache.delete(key);
        deleted++;
      }
    }

    // 持久化缓存（简化实现，完整实现需要索引）
    if (this.config.enablePersistentCache) {
      // TODO: 实现基于标签的持久化缓存删除
    }

    return deleted;
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (this.config.enablePersistentCache) {
      try {
        await fs.emptyDir(this.config.persistentCachePath);
      } catch (error) {
        console.error('清空持久化缓存失败:', error);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<CacheStats> {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.totalHits / this.stats.totalRequests) * 100 
      : 0;

    let persistentEntries = 0;
    if (this.config.enablePersistentCache) {
      try {
        const files = await fs.readdir(this.config.persistentCachePath);
        persistentEntries = files.filter(f => f.endsWith('.cache')).length;
      } catch (error) {
        // 忽略错误
      }
    }

    return {
      memoryEntries: this.memoryCache.size,
      persistentEntries,
      totalEntries: this.memoryCache.size + persistentEntries, // 新增：总条目数
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests: this.stats.totalRequests,
      totalHits: this.stats.totalHits,
      memoryUsage: this.calculateMemoryUsage(),
    };
  }

  /**
   * 手动触发清理过期缓存
   */
  async cleanup(): Promise<{ memoryCleared: number; persistentCleared: number }> {
    const now = Date.now();
    let memoryCleared = 0;
    let persistentCleared = 0;

    // 清理内存缓存
    for (const [key, entry] of this.memoryCache) {
      if (entry.ttl && (now - entry.createdAt) > entry.ttl) {
        this.memoryCache.delete(key);
        memoryCleared++;
      }
    }

    // 清理持久化缓存
    if (this.config.enablePersistentCache) {
      try {
        const files = await fs.readdir(this.config.persistentCachePath);
        for (const file of files) {
          if (file.endsWith('.cache')) {
            const filePath = path.join(this.config.persistentCachePath, file);
            try {
              const entry = await fs.readJson(filePath) as CacheEntry;
              if (entry.ttl && (now - entry.createdAt) > entry.ttl) {
                await fs.remove(filePath);
                persistentCleared++;
              }
            } catch (error) {
              // 损坏的缓存文件，删除
              await fs.remove(filePath);
              persistentCleared++;
            }
          }
        }
      } catch (error) {
        console.error('清理持久化缓存失败:', error);
      }
    }

    return { memoryCleared, persistentCleared };
  }

  /**
   * 缓存装饰器 - 用于方法缓存
   */
  cached<T extends (...args: any[]) => Promise<any>>(
    namespace: string,
    ttl?: number,
    keyGenerator?: (...args: Parameters<T>) => string
  ) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: Parameters<T>) {
        const key = keyGenerator ? keyGenerator(...args) : propertyKey;
        const params = args.length > 0 ? args : undefined;

        // 尝试从缓存获取
        const cached = await this.cacheManager.get(namespace, key, params);
        if (cached !== null) {
          return cached;
        }

        // 执行原方法
        const result = await originalMethod.apply(this, args);

        // 缓存结果
        await this.cacheManager.set(namespace, key, result, { ttl, params });

        return result;
      };
    };
  }

  /**
   * 预热缓存 - 批量加载常用数据
   */
  async warmup(tasks: Array<{
    namespace: string;
    key: string;
    loader: () => Promise<any>;
    ttl?: number;
    params?: any;
  }>): Promise<void> {
    console.log(`开始预热缓存，共 ${tasks.length} 个任务`);
    
    const promises = tasks.map(async (task) => {
      try {
        const existing = await this.get(task.namespace, task.key, task.params);
        if (existing === null) {
          const value = await task.loader();
          await this.set(task.namespace, task.key, value, { 
            ttl: task.ttl, 
            params: task.params 
          });
        }
      } catch (error) {
        console.error(`预热缓存失败 ${task.namespace}:${task.key}:`, error);
      }
    });

    await Promise.all(promises);
    console.log('缓存预热完成');
  }

  // =============================================================================
  // 私有方法
  // =============================================================================

  /**
   * 清理最少使用的缓存条目
   */
  private async evictLeastUsed(): Promise<void> {
    const entries = Array.from(this.memoryCache.entries());
    
    // 按访问次数和最后访问时间排序
    entries.sort(([, a], [, b]) => {
      if (a.accessCount !== b.accessCount) {
        return a.accessCount - b.accessCount;
      }
      return a.lastAccessed - b.lastAccessed;
    });

    // 删除最少使用的10%
    const toDelete = Math.max(1, Math.floor(entries.length * 0.1));
    for (let i = 0; i < toDelete; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
  }

  /**
   * 获取缓存文件路径
   */
  private getCacheFilePath(key: string): string {
    const hash = createHash('md5').update(key).digest('hex');
    return path.join(this.config.persistentCachePath, `${hash}.cache`);
  }

  /**
   * 保存到持久化缓存
   */
  private async saveToPersistentCache(key: string, entry: CacheEntry): Promise<void> {
    try {
      const filePath = this.getCacheFilePath(key);
      await fs.writeJson(filePath, entry, { spaces: 0 });
    } catch (error) {
      console.error('保存持久化缓存失败:', error);
    }
  }

  /**
   * 从持久化缓存加载
   */
  private async loadFromPersistentCache(key: string): Promise<CacheEntry | null> {
    try {
      const filePath = this.getCacheFilePath(key);
      const entry = await fs.readJson(filePath) as CacheEntry;
      return entry;
    } catch (error) {
      return null;
    }
  }

  /**
   * 加载所有持久化缓存到内存
   */
  private async loadPersistentCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.persistentCachePath);
      const cacheFiles = files.filter(f => f.endsWith('.cache'));
      
      let loaded = 0;
      for (const file of cacheFiles) {
        try {
          const filePath = path.join(this.config.persistentCachePath, file);
          const entry = await fs.readJson(filePath) as CacheEntry;
          
          // 检查是否过期
          const now = Date.now();
          if (!entry.ttl || (now - entry.createdAt) <= entry.ttl) {
            this.memoryCache.set(entry.key, entry);
            loaded++;
          } else {
            // 删除过期的持久化缓存
            await fs.remove(filePath);
          }
        } catch (error) {
          // 删除损坏的缓存文件
          await fs.remove(path.join(this.config.persistentCachePath, file));
        }
      }
      
      console.log(`从持久化缓存加载 ${loaded} 个条目`);
    } catch (error) {
      console.error('加载持久化缓存失败:', error);
    }
  }

  /**
   * 计算内存使用量（估算）
   */
  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.memoryCache.values()) {
      try {
        // 简单估算：JSON序列化后的大小
        totalSize += JSON.stringify(entry).length * 2; // 假设每个字符2字节
      } catch (error) {
        // 忽略无法序列化的条目
      }
    }
    return totalSize;
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        const { memoryCleared, persistentCleared } = await this.cleanup();
        if (memoryCleared > 0 || persistentCleared > 0) {
          console.log(`自动清理过期缓存: 内存 ${memoryCleared}, 持久化 ${persistentCleared}`);
        }
      } catch (error) {
        console.error('自动清理缓存失败:', error);
      }
    }, this.config.cleanupInterval);
  }

  /**
   * 停止清理定时器
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * 析构函数
   */
  async dispose(): Promise<void> {
    this.stopCleanup();
    
    // 保存内存缓存到持久化存储
    if (this.config.enablePersistentCache) {
      const promises = Array.from(this.memoryCache.entries()).map(([key, entry]) =>
        this.saveToPersistentCache(key, entry).catch(error =>
          console.error(`保存缓存条目 ${key} 失败:`, error)
        )
      );
      await Promise.all(promises);
    }
    
    this.memoryCache.clear();
    console.log('缓存管理器已释放资源');
  }
}