/**
 * 会话管理器 - 负责会话的创建、存储、恢复和生命周期管理
 * 实现本地JSON持久化存储，支持会话版本控制和自动保存
 */
import { WizardSession } from '../types/index.js';
export declare class SessionManager {
    private sessions;
    private config;
    private autoSaveTimer?;
    constructor();
    /**
     * 初始化存储目录
     */
    private initializeStorage;
    /**
     * 加载已存在的会话
     */
    private loadExistingSessions;
    /**
     * 创建新会话
     */
    createSession(projectName: string): Promise<WizardSession>;
    /**
     * 获取会话
     */
    getSession(sessionId: string): Promise<WizardSession | null>;
    /**
     * 更新会话
     */
    updateSession(sessionId: string, updates: Partial<WizardSession>): Promise<WizardSession>;
    /**
     * 删除会话
     */
    deleteSession(sessionId: string): Promise<boolean>;
    /**
     * 列出所有会话
     */
    listSessions(): Promise<WizardSession[]>;
    /**
     * 恢复会话到指定检查点
     */
    restoreSession(sessionId: string, checkpointId: string): Promise<WizardSession>;
    /**
     * 保存会话到磁盘
     */
    private saveSession;
    /**
     * 备份会话
     */
    private backupSession;
    /**
     * 迁移旧版本会话数据
     */
    private migrateSession;
    /**
     * 启动自动保存
     */
    private startAutoSave;
    /**
     * 停止自动保存
     */
    stopAutoSave(): void;
    /**
     * 清理过期会话
     */
    cleanupExpiredSessions(maxAge?: number): Promise<void>;
    /**
     * 获取存储统计信息
     */
    getStorageStats(): Promise<{
        totalSessions: number;
        totalSize: number;
        oldestSession?: Date;
        newestSession?: Date;
    }>;
    /**
     * 析构函数 - 确保保存所有会话
     */
    dispose(): Promise<void>;
}
//# sourceMappingURL=SessionManager.d.ts.map