#!/usr/bin/env node
"use strict";
/**
 * React架构向导 MCP服务器
 * 智能对话式架构生成器的主入口
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const WizardEngine_js_1 = require("./engines/WizardEngine.js");
const SessionManager_js_1 = require("./managers/SessionManager.js");
const IntelligenceEngine_js_1 = require("./engines/IntelligenceEngine.js");
const Generator_js_1 = require("./engines/Generator.js");
const ExternalToolsIntegrator_js_1 = require("./integrators/ExternalToolsIntegrator.js");
/**
 * React架构向导MCP服务器类
 */
class ReactArchWizardServer {
    server;
    sessionManager;
    wizardEngine;
    intelligenceEngine;
    generator;
    externalTools;
    constructor() {
        // 初始化MCP服务器
        this.server = new index_js_1.Server({
            name: 'react-arch-wizard',
            version: '1.0.0',
            description: 'React架构向导 - 通过智能对话完成专业架构设计',
        }, {
            capabilities: {
                tools: {},
                resources: {},
            },
        });
        // 初始化核心引擎
        this.sessionManager = new SessionManager_js_1.SessionManager();
        this.externalTools = new ExternalToolsIntegrator_js_1.ExternalToolsIntegrator();
        this.intelligenceEngine = new IntelligenceEngine_js_1.IntelligenceEngine(this.externalTools);
        this.generator = new Generator_js_1.Generator();
        this.wizardEngine = new WizardEngine_js_1.WizardEngine(this.sessionManager, this.intelligenceEngine, this.generator, this.externalTools);
        this.setupHandlers();
    }
    /**
     * 设置MCP处理器
     */
    setupHandlers() {
        // 工具列表处理器
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            const tools = [
                {
                    name: 'start_wizard',
                    description: '启动React架构设计向导',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectName: {
                                type: 'string',
                                description: '项目名称',
                            },
                            reset: {
                                type: 'boolean',
                                description: '是否重置已存在的会话',
                                default: false,
                            },
                        },
                        required: ['projectName'],
                    },
                },
                {
                    name: 'answer_question',
                    description: '回答向导的问题',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            sessionId: {
                                type: 'string',
                                description: '会话ID',
                            },
                            answer: {
                                type: 'string',
                                description: '回答内容',
                            },
                        },
                        required: ['sessionId', 'answer'],
                    },
                },
                {
                    name: 'validate_requirements',
                    description: '验证需求的合理性和完整性',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            sessionId: {
                                type: 'string',
                                description: '会话ID',
                            },
                        },
                        required: ['sessionId'],
                    },
                },
                {
                    name: 'generate_architecture',
                    description: '生成架构设计',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            sessionId: {
                                type: 'string',
                                description: '会话ID',
                            },
                            confirm: {
                                type: 'boolean',
                                description: '是否确认生成',
                                default: false,
                            },
                        },
                        required: ['sessionId'],
                    },
                },
                {
                    name: 'export_project',
                    description: '导出项目代码到指定目录',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            sessionId: {
                                type: 'string',
                                description: '会话ID',
                            },
                            outputPath: {
                                type: 'string',
                                description: '输出路径',
                            },
                            includeTests: {
                                type: 'boolean',
                                description: '包含测试文件',
                                default: true,
                            },
                            includeExamples: {
                                type: 'boolean',
                                description: '包含示例代码',
                                default: false,
                            },
                        },
                        required: ['sessionId', 'outputPath'],
                    },
                },
                {
                    name: 'get_session_status',
                    description: '获取当前会话状态',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            sessionId: {
                                type: 'string',
                                description: '会话ID',
                            },
                        },
                        required: ['sessionId'],
                    },
                },
                {
                    name: 'list_sessions',
                    description: '列出所有会话',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            includeCompleted: {
                                type: 'boolean',
                                description: '包含已完成的会话',
                                default: false,
                            },
                        },
                    },
                },
            ];
            return { tools };
        });
        // 工具调用处理器
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                let result;
                switch (name) {
                    case 'start_wizard':
                        result = await this.handleStartWizard(args);
                        break;
                    case 'answer_question':
                        result = await this.handleAnswerQuestion(args);
                        break;
                    case 'validate_requirements':
                        result = await this.handleValidateRequirements(args);
                        break;
                    case 'generate_architecture':
                        result = await this.handleGenerateArchitecture(args);
                        break;
                    case 'export_project':
                        result = await this.handleExportProject(args);
                        break;
                    case 'get_session_status':
                        result = await this.handleGetSessionStatus(args);
                        break;
                    case 'list_sessions':
                        result = await this.handleListSessions(args);
                        break;
                    default:
                        throw new Error(`未知工具: ${name}`);
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : '未知错误';
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: false,
                                error: errorMessage,
                            }, null, 2),
                        },
                    ],
                    isError: true,
                };
            }
        });
        // 资源列表处理器
        this.server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
            const resources = [
                {
                    uri: 'wizard://patterns/list',
                    name: '架构模式列表',
                    description: '可用的架构模式和说明',
                    mimeType: 'application/json',
                },
                {
                    uri: 'wizard://templates/list',
                    name: '代码模板列表',
                    description: '可用的代码模板',
                    mimeType: 'application/json',
                },
                {
                    uri: 'wizard://rules/validation',
                    name: '验证规则',
                    description: '架构验证规则集',
                    mimeType: 'application/json',
                },
                {
                    uri: 'wizard://examples/list',
                    name: '示例项目',
                    description: '预设的示例项目配置',
                    mimeType: 'application/json',
                },
            ];
            return { resources };
        });
        // 资源读取处理器
        this.server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            // 这里会调用资源管理器来获取具体资源
            // 现在先返回占位符
            const content = await this.getResourceContent(uri);
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(content, null, 2),
                    },
                ],
            };
        });
    }
    /**
     * 处理启动向导工具
     */
    async handleStartWizard(args) {
        const { projectName, reset = false } = args;
        try {
            const session = await this.wizardEngine.startWizard(projectName, reset);
            const firstQuestion = await this.wizardEngine.getNextQuestion(session.id);
            return {
                success: true,
                data: {
                    sessionId: session.id,
                    message: `🚀 架构设计向导已启动！\n\n项目名称：${projectName}\n会话ID：${session.id}`,
                    question: firstQuestion,
                },
                metadata: {
                    sessionId: session.id,
                    stage: session.stage,
                    progress: session.progress,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '启动向导失败',
            };
        }
    }
    /**
     * 处理回答问题工具
     */
    async handleAnswerQuestion(args) {
        const { sessionId, answer } = args;
        try {
            const result = await this.wizardEngine.processAnswer(sessionId, answer);
            return {
                success: true,
                data: result,
                metadata: {
                    sessionId,
                    stage: result.stage,
                    progress: result.progress,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '处理回答失败',
            };
        }
    }
    /**
     * 处理验证需求工具
     */
    async handleValidateRequirements(args) {
        const { sessionId } = args;
        try {
            const validation = await this.wizardEngine.validateRequirements(sessionId);
            return {
                success: true,
                data: validation,
                metadata: {
                    sessionId,
                    validationTimestamp: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '需求验证失败',
            };
        }
    }
    /**
     * 处理生成架构工具
     */
    async handleGenerateArchitecture(args) {
        const { sessionId, confirm = false } = args;
        try {
            const architecture = await this.wizardEngine.generateArchitecture(sessionId, confirm);
            return {
                success: true,
                data: architecture,
                metadata: {
                    sessionId,
                    generatedAt: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '生成架构失败',
            };
        }
    }
    /**
     * 处理导出项目工具
     */
    async handleExportProject(args) {
        const { sessionId, outputPath, includeTests = true, includeExamples = false } = args;
        try {
            const exportResult = await this.wizardEngine.exportProject(sessionId, outputPath, {
                includeTests,
                includeExamples,
            });
            return {
                success: true,
                data: exportResult,
                metadata: {
                    sessionId,
                    outputPath,
                    exportedAt: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '导出项目失败',
            };
        }
    }
    /**
     * 处理获取会话状态工具
     */
    async handleGetSessionStatus(args) {
        const { sessionId } = args;
        try {
            const session = await this.sessionManager.getSession(sessionId);
            if (!session) {
                return {
                    success: false,
                    error: '会话不存在',
                };
            }
            return {
                success: true,
                data: {
                    id: session.id,
                    projectName: session.projectName,
                    stage: session.stage,
                    progress: session.progress,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt,
                    requirementsCount: session.requirements ? Object.keys(session.requirements).length : 0,
                    decisionsCount: session.decisions.length,
                    blindSpotsCount: session.blindSpots.length,
                    hasArchitecture: !!session.architecture,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '获取会话状态失败',
            };
        }
    }
    /**
     * 处理列出会话工具
     */
    async handleListSessions(args) {
        const { includeCompleted = false } = args;
        try {
            const sessions = await this.sessionManager.listSessions();
            const filteredSessions = sessions
                .filter(session => includeCompleted || session.stage !== 'completed')
                .map(session => ({
                id: session.id,
                projectName: session.projectName,
                stage: session.stage,
                progress: session.progress,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
            }));
            return {
                success: true,
                data: {
                    sessions: filteredSessions,
                    total: filteredSessions.length,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '列出会话失败',
            };
        }
    }
    /**
     * 获取资源内容
     */
    async getResourceContent(uri) {
        // 这里应该调用资源管理器，现在先返回占位符
        switch (uri) {
            case 'wizard://patterns/list':
                return {
                    patterns: [
                        {
                            id: 'modular',
                            name: '模块化架构',
                            description: '适合中小型项目的模块化组织方式',
                            applicableFor: ['saas', 'enterprise'],
                            teamSize: '3-10人',
                            complexity: 'medium',
                        },
                        {
                            id: 'feature-based',
                            name: '功能域架构',
                            description: '按业务功能组织的大型项目架构',
                            applicableFor: ['ecommerce', 'social'],
                            teamSize: '10+人',
                            complexity: 'high',
                        },
                    ],
                };
            default:
                return { message: '资源暂未实现' };
        }
    }
    /**
     * 启动服务器
     */
    async start() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error('React架构向导 MCP服务器已启动');
    }
}
// 启动服务器
if (require.main === module) {
    const server = new ReactArchWizardServer();
    server.start().catch((error) => {
        console.error('服务器启动失败:', error);
        process.exit(1);
    });
}
