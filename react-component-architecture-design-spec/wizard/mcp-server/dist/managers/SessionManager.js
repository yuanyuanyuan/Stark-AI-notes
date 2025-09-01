"use strict";
/**
 * 会话管理器 - 负责会话的创建、存储、恢复和生命周期管理
 * 实现本地JSON持久化存储，支持会话版本控制和自动保存
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
class SessionManager {
    sessions = new Map();
    config;
    autoSaveTimer;
    constructor() {
        this.config = {
            storagePath: '.wizard/sessions/',
            autoSave: {
                enabled: true,
                interval: 30000, // 30秒
                onStateChange: true,
            },
            format: {
                type: 'json',
                compressed: false,
                encrypted: false,
            },
            versioning: {
                maxVersions: 10,
                migration: true,
            },
        };
        this.initializeStorage();
        this.loadExistingSessions();
        this.startAutoSave();
    }
    /**
     * 初始化存储目录
     */
    async initializeStorage() {
        try {
            await fs_extra_1.default.ensureDir(this.config.storagePath);
            await fs_extra_1.default.ensureDir(path_1.default.join(this.config.storagePath, 'backups'));
            console.error('会话存储目录初始化完成');
        }
        catch (error) {
            console.error('初始化存储目录失败:', error);
            throw error;
        }
    }
    /**
     * 加载已存在的会话
     */
    async loadExistingSessions() {
        try {
            const files = await fs_extra_1.default.readdir(this.config.storagePath);
            const sessionFiles = files.filter(file => file.endsWith('.json') && !file.startsWith('backup_'));
            for (const file of sessionFiles) {
                try {
                    const sessionPath = path_1.default.join(this.config.storagePath, file);
                    const sessionData = await fs_extra_1.default.readJson(sessionPath);
                    // 验证和迁移会话数据
                    const session = this.migrateSession(sessionData);
                    this.sessions.set(session.id, session);
                    console.error(`加载会话: ${session.projectName} (${session.id})`);
                }
                catch (error) {
                    console.error(`加载会话文件 ${file} 失败:`, error);
                }
            }
            console.error(`成功加载 ${this.sessions.size} 个会话`);
        }
        catch (error) {
            console.error('加载已存在会话失败:', error);
        }
    }
    /**
     * 创建新会话
     */
    async createSession(projectName) {
        const session = {
            id: (0, uuid_1.v4)(),
            projectName,
            stage: 'project_positioning',
            requirements: {
                projectType: 'other',
                teamSize: 1,
                features: [],
                constraints: [],
                preferences: [],
                technicalLevel: 'intermediate',
            },
            history: [],
            decisions: [],
            blindSpots: [],
            progress: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            // 持久化相关
            version: '1.0.0',
            checkpoints: [],
            autoSaveEnabled: true,
            // 外部工具调用记录
            externalCalls: [],
            // 自定义模板
            customTemplates: [],
        };
        // 创建初始检查点 - 避免循环引用
        const checkpoint = {
            id: (0, uuid_1.v4)(),
            stage: session.stage,
            timestamp: new Date(),
            data: {
                id: session.id,
                projectName: session.projectName,
                stage: session.stage,
                requirements: { ...session.requirements },
                progress: session.progress,
            },
            description: '会话创建',
        };
        session.checkpoints.push(checkpoint);
        this.sessions.set(session.id, session);
        // 立即保存新会话
        await this.saveSession(session.id);
        console.error(`创建新会话: ${projectName} (${session.id})`);
        return session;
    }
    /**
     * 获取会话
     */
    async getSession(sessionId) {
        return this.sessions.get(sessionId) || null;
    }
    /**
     * 更新会话
     */
    async updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`会话 ${sessionId} 不存在`);
        }
        // 创建检查点（如果阶段发生变化）
        if (updates.stage && updates.stage !== session.stage) {
            const checkpoint = {
                id: (0, uuid_1.v4)(),
                stage: updates.stage,
                timestamp: new Date(),
                data: {
                    id: session.id,
                    projectName: session.projectName,
                    stage: updates.stage,
                    requirements: { ...session.requirements, ...updates.requirements },
                    progress: updates.progress || session.progress,
                },
                description: `阶段转换: ${session.stage} -> ${updates.stage}`,
            };
            // 保持最近10个检查点
            if (session.checkpoints.length >= this.config.versioning.maxVersions) {
                session.checkpoints = session.checkpoints.slice(-this.config.versioning.maxVersions + 1);
            }
            session.checkpoints.push(checkpoint);
        }
        // 更新会话数据
        Object.assign(session, updates);
        session.updatedAt = new Date();
        // 如果启用状态变化时保存，则立即保存
        if (this.config.autoSave.onStateChange) {
            await this.saveSession(sessionId);
        }
        return session;
    }
    /**
     * 删除会话
     */
    async deleteSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        // 创建备份
        await this.backupSession(session);
        // 删除文件和内存中的会话
        try {
            const sessionPath = path_1.default.join(this.config.storagePath, `${sessionId}.json`);
            await fs_extra_1.default.remove(sessionPath);
            this.sessions.delete(sessionId);
            console.error(`删除会话: ${session.projectName} (${sessionId})`);
            return true;
        }
        catch (error) {
            console.error(`删除会话文件失败:`, error);
            return false;
        }
    }
    /**
     * 列出所有会话
     */
    async listSessions() {
        return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    /**
     * 恢复会话到指定检查点
     */
    async restoreSession(sessionId, checkpointId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`会话 ${sessionId} 不存在`);
        }
        const checkpoint = session.checkpoints.find(cp => cp.id === checkpointId);
        if (!checkpoint) {
            throw new Error(`检查点 ${checkpointId} 不存在`);
        }
        // 恢复到检查点数据
        const restoredData = { ...checkpoint.data };
        restoredData.updatedAt = new Date();
        this.sessions.set(sessionId, restoredData);
        await this.saveSession(sessionId);
        console.error(`恢复会话到检查点: ${checkpoint.description}`);
        return restoredData;
    }
    /**
     * 保存会话到磁盘
     */
    async saveSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`会话 ${sessionId} 不存在`);
        }
        try {
            const sessionPath = path_1.default.join(this.config.storagePath, `${sessionId}.json`);
            const sessionData = {
                ...session,
                lastSavedAt: new Date(),
            };
            await fs_extra_1.default.writeJson(sessionPath, sessionData, { spaces: 2 });
        }
        catch (error) {
            console.error(`保存会话 ${sessionId} 失败:`, error);
            throw error;
        }
    }
    /**
     * 备份会话
     */
    async backupSession(session) {
        try {
            const backupPath = path_1.default.join(this.config.storagePath, 'backups', `backup_${session.id}_${Date.now()}.json`);
            await fs_extra_1.default.writeJson(backupPath, session, { spaces: 2 });
        }
        catch (error) {
            console.error(`备份会话失败:`, error);
        }
    }
    /**
     * 迁移旧版本会话数据
     */
    migrateSession(sessionData) {
        // 确保必需字段存在
        const session = {
            id: sessionData.id || (0, uuid_1.v4)(),
            projectName: sessionData.projectName || 'Unnamed Project',
            stage: sessionData.stage || 'project_positioning',
            requirements: sessionData.requirements || {
                projectType: 'other',
                teamSize: 1,
                features: [],
                constraints: [],
                preferences: [],
                technicalLevel: 'intermediate',
            },
            history: sessionData.history || [],
            decisions: sessionData.decisions || [],
            blindSpots: sessionData.blindSpots || [],
            architecture: sessionData.architecture,
            components: sessionData.components,
            progress: sessionData.progress || 0,
            createdAt: sessionData.createdAt ? new Date(sessionData.createdAt) : new Date(),
            updatedAt: sessionData.updatedAt ? new Date(sessionData.updatedAt) : new Date(),
            // 新字段的默认值
            version: sessionData.version || '1.0.0',
            checkpoints: sessionData.checkpoints || [],
            autoSaveEnabled: sessionData.autoSaveEnabled ?? true,
            lastSavedAt: sessionData.lastSavedAt ? new Date(sessionData.lastSavedAt) : undefined,
            externalCalls: sessionData.externalCalls || [],
            customTemplates: sessionData.customTemplates || [],
        };
        return session;
    }
    /**
     * 启动自动保存
     */
    startAutoSave() {
        if (!this.config.autoSave.enabled) {
            return;
        }
        this.autoSaveTimer = setInterval(async () => {
            try {
                // 保存所有会话
                const promises = Array.from(this.sessions.keys()).map(sessionId => this.saveSession(sessionId));
                await Promise.all(promises);
                console.error(`自动保存 ${this.sessions.size} 个会话完成`);
            }
            catch (error) {
                console.error('自动保存失败:', error);
            }
        }, this.config.autoSave.interval);
    }
    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = undefined;
        }
    }
    /**
     * 清理过期会话
     */
    async cleanupExpiredSessions(maxAge = 30 * 24 * 60 * 60 * 1000) {
        const now = new Date().getTime();
        const expiredSessions = [];
        for (const [sessionId, session] of this.sessions) {
            if (now - session.updatedAt.getTime() > maxAge) {
                expiredSessions.push(sessionId);
            }
        }
        for (const sessionId of expiredSessions) {
            await this.deleteSession(sessionId);
        }
        console.error(`清理 ${expiredSessions.length} 个过期会话`);
    }
    /**
     * 获取存储统计信息
     */
    async getStorageStats() {
        const sessions = Array.from(this.sessions.values());
        const totalSessions = sessions.length;
        let totalSize = 0;
        try {
            const files = await fs_extra_1.default.readdir(this.config.storagePath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path_1.default.join(this.config.storagePath, file);
                    const stats = await fs_extra_1.default.stat(filePath);
                    totalSize += stats.size;
                }
            }
        }
        catch (error) {
            console.error('计算存储大小失败:', error);
        }
        const dates = sessions.map(s => s.createdAt);
        const oldestSession = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : undefined;
        const newestSession = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : undefined;
        return {
            totalSessions,
            totalSize,
            oldestSession,
            newestSession,
        };
    }
    /**
     * 析构函数 - 确保保存所有会话
     */
    async dispose() {
        this.stopAutoSave();
        // 保存所有未保存的会话
        const promises = Array.from(this.sessions.keys()).map(sessionId => this.saveSession(sessionId).catch(error => console.error(`最终保存会话 ${sessionId} 失败:`, error)));
        await Promise.all(promises);
        console.error('会话管理器已释放资源');
    }
}
exports.SessionManager = SessionManager;
