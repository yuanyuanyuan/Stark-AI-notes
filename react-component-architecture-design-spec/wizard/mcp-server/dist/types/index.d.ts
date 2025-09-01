/**
 * React架构向导 - 核心类型定义
 * 基于技术设计方案MCP版本
 */
export type ProjectType = 'task_management' | 'ecommerce' | 'saas' | 'blog' | 'dashboard' | 'social' | 'enterprise' | 'other';
export type WizardStage = 'project_positioning' | 'team_assessment' | 'feature_collection' | 'blind_spot_detection' | 'contradiction_resolution' | 'solution_confirmation' | 'architecture_generation' | 'completed';
export type ArchitecturePattern = 'modular' | 'feature-based' | 'layered' | 'micro-frontend' | 'atomic';
export type TechnicalLevel = 'beginner' | 'intermediate' | 'advanced';
export interface WizardSession {
    id: string;
    projectName: string;
    stage: WizardStage;
    requirements: RequirementModel;
    history: ConversationHistory[];
    decisions: Decision[];
    blindSpots: BlindSpot[];
    architecture?: ArchitectureSpec;
    components?: ComponentSpec[];
    progress: number;
    createdAt: Date;
    updatedAt: Date;
    version: string;
    checkpoints: Checkpoint[];
    autoSaveEnabled: boolean;
    lastSavedAt?: Date;
    externalCalls: ExternalToolCall[];
    customTemplates?: CustomTemplate[];
}
export interface RequirementModel {
    projectType: ProjectType;
    teamSize: number;
    features: Feature[];
    constraints: Constraint[];
    preferences: Preference[];
    technicalLevel: TechnicalLevel;
    timeline?: string;
    budget?: string;
    deployment?: DeploymentTarget;
}
export interface ConversationHistory {
    id: string;
    timestamp: Date;
    role: 'user' | 'assistant';
    message: string;
    metadata?: Record<string, any>;
}
export interface Decision {
    id: string;
    stage: WizardStage;
    question: string;
    answer: string;
    reasoning?: string;
    confidence: number;
    timestamp: Date;
}
export interface BlindSpot {
    id: string;
    category: 'infrastructure' | 'security' | 'performance' | 'scalability' | 'maintenance';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    suggestion?: string;
    addressed: boolean;
}
export interface Checkpoint {
    id: string;
    stage: WizardStage;
    timestamp: Date;
    data: Partial<WizardSession>;
    description: string;
}
export interface ArchitectureSpec {
    id: string;
    name: string;
    pattern: ArchitecturePattern;
    structure: FolderStructure;
    components: ComponentHierarchy;
    dependencies: DependencyGraph;
    technologies: Technology[];
    documentation: DocumentationSpec;
}
export interface FolderStructure {
    [path: string]: {
        type: 'folder' | 'file';
        description: string;
        children?: FolderStructure;
    };
}
export interface ComponentHierarchy {
    pages: ComponentSpec[];
    layouts: ComponentSpec[];
    business: ComponentSpec[];
    common: ComponentSpec[];
    base: ComponentSpec[];
}
export interface ComponentSpec {
    id: string;
    name: string;
    type: 'page' | 'layout' | 'business' | 'common' | 'base';
    description: string;
    props: PropSpec[];
    dependencies: string[];
    template?: string;
    tests?: TestSpec[];
}
export interface PropSpec {
    name: string;
    type: string;
    required: boolean;
    description?: string;
    defaultValue?: any;
}
export interface DependencyGraph {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
}
export interface DependencyNode {
    id: string;
    name: string;
    type: 'component' | 'utility' | 'service' | 'external';
}
export interface DependencyEdge {
    from: string;
    to: string;
    type: 'imports' | 'uses' | 'extends';
}
export interface Technology {
    name: string;
    version?: string;
    category: 'framework' | 'library' | 'tool' | 'service';
    purpose: string;
    alternatives?: string[];
}
export interface DocumentationSpec {
    readme: string;
    architecture: string;
    components: ComponentDoc[];
    deployment: string;
}
export interface ComponentDoc {
    name: string;
    purpose: string;
    usage: string;
    examples: string[];
}
export interface Feature {
    id: string;
    name: string;
    category: 'core' | 'recommended' | 'optional';
    description: string;
    dependencies?: string[];
    conflicts?: string[];
    estimatedEffort: number;
    priority: 'must-have' | 'should-have' | 'could-have' | 'wont-have';
}
export interface Constraint {
    id: string;
    type: 'technical' | 'business' | 'resource' | 'timeline';
    description: string;
    impact: 'low' | 'medium' | 'high';
}
export interface Preference {
    id: string;
    category: 'technology' | 'pattern' | 'style' | 'deployment';
    value: string;
    reasoning?: string;
}
export type DeploymentTarget = 'vercel' | 'netlify' | 'aws' | 'azure' | 'gcp' | 'heroku' | 'self-hosted' | 'serverless';
export interface ExternalToolCall {
    id: string;
    tool: 'context7' | 'exa' | 'deepwiki' | 'spec-workflow';
    method: string;
    params: Record<string, any>;
    response: any;
    timestamp: Date;
    duration: number;
    success: boolean;
    error?: string;
}
export interface ExternalToolConfig {
    context7: {
        enabled: boolean;
        tools: string[];
        usage: string;
    };
    deepwiki: {
        enabled: boolean;
        tools: string[];
        usage: string;
    };
    exa: {
        enabled: boolean;
        tools: string[];
        usage: string;
    };
    specWorkflow: {
        enabled: boolean;
        tools: string[];
        usage: string;
    };
}
export interface CustomTemplate {
    id: string;
    name: string;
    category: 'component' | 'page' | 'layout' | 'utility' | 'config';
    description: string;
    template: string;
    variables: TemplateVariable[];
    extends?: string;
    overrides?: Record<string, any>;
    author?: string;
    version: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface TemplateVariable {
    name: string;
    type: 'string' | 'boolean' | 'number' | 'array' | 'object';
    required: boolean;
    description: string;
    defaultValue?: any;
}
export interface SessionPersistence {
    storagePath: string;
    autoSave: {
        enabled: boolean;
        interval: number;
        onStateChange: boolean;
    };
    format: {
        type: 'json';
        compressed: boolean;
        encrypted: boolean;
    };
    versioning: {
        maxVersions: number;
        migration: boolean;
    };
}
export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: Record<string, any>;
}
export interface QuestionResult {
    type: 'question' | 'clarification' | 'blind-spot' | 'contradiction' | 'confirmation';
    title: string;
    message: string;
    options?: QuestionOption[];
    metadata?: Record<string, any>;
}
export interface QuestionOption {
    id: string;
    text: string;
    value: any;
    description?: string;
    implications?: string[];
}
export interface TestSpec {
    name: string;
    type: 'unit' | 'integration' | 'e2e';
    description: string;
    template?: string;
}
export interface ValidationRule {
    id: string;
    name: string;
    description: string;
    condition: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    suggestion?: string;
}
export interface ValidationResult {
    valid: boolean;
    issues: ValidationIssue[];
    suggestions: string[];
}
export interface ValidationIssue {
    rule: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    suggestion?: string;
    location?: string;
}
//# sourceMappingURL=index.d.ts.map