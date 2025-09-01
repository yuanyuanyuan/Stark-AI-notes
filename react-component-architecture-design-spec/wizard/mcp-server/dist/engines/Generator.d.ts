/**
 * 代码生成引擎 - 负责架构生成、代码模板渲染和项目导出
 * 基于Handlebars模板引擎，支持自定义模板和增量生成
 */
import { WizardSession, ToolResult, CustomTemplate } from '../types/index.js';
export declare class Generator {
    private templates;
    private handlebars;
    private builtinTemplatesPath;
    constructor();
    /**
     * 生成完整的React项目架构
     */
    generateArchitecture(session: WizardSession): Promise<ToolResult>;
    /**
     * 导出完整项目到指定目录
     */
    exportProject(session: WizardSession, outputPath: string, options?: {
        includeTests?: boolean;
        includeExamples?: boolean;
    }): Promise<ToolResult>;
    /**
     * 渲染自定义模板
     */
    renderTemplate(templateName: string, data: Record<string, any>, customTemplates?: CustomTemplate[]): Promise<string>;
    /**
     * 注册自定义模板到会话
     */
    registerCustomTemplate(session: WizardSession, customTemplate: CustomTemplate): Promise<void>;
    /**
     * 获取可用模板列表
     */
    getAvailableTemplates(customTemplates?: CustomTemplate[]): string[];
    /**
     * 处理模板继承（支持extends语法）
     */
    private processTemplateInheritance;
    /**
     * 提取模板中的块定义
     */
    private extractTemplateBlocks;
    /**
     * 生成架构模式特定的组件
     */
    private generateArchitectureSpecificComponents;
    /**
     * 转换为PascalCase
     */
    private toPascalCase;
    private determineArchitecturePattern;
    private generateFolderStructure;
    private generateComponentHierarchy;
    private generatePageComponents;
    private generateLayoutComponents;
    private generateBusinessComponents;
    private generateCommonComponents;
    private generateBaseComponents;
    private generateDependencyGraph;
    private determineTechnologyStack;
    private generateDocumentationSpec;
    private generateConfigFiles;
    private createFolderStructure;
    private generateComponentFiles;
    private generateStyleFiles;
    private generateToolConfigFiles;
    private generateDocumentationFiles;
    private generateExampleFiles;
    private generateReadmeContent;
    private generateArchitectureDoc;
    private generateComponentDocs;
    private generateDeploymentDoc;
    private initializeHandlebars;
    private loadBuiltinTemplates;
    private getComponentPath;
    private generateDirectoryTree;
    private generateComponentsMarkdown;
    private extractLayersFromPattern;
    private countComponents;
    private calculateDirectorySize;
}
//# sourceMappingURL=Generator.d.ts.map