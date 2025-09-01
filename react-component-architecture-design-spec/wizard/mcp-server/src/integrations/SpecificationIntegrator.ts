/**
 * 规范集成器 - 与现有React架构规范的集成
 * 确保向导生成的结果完全符合现有规范标准
 */

import { WizardSession, ArchitectureSpec, ToolResult } from '../types/index.js';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

export interface SpecificationConfig {
  version: string;
  compatibility: {
    minWizardVersion: string;
    maxWizardVersion: string;
  };
  patterns: ArchitecturePattern[];
  layers: LayerDefinition[];
  conventions: NamingConventions;
  validation: ValidationRules;
}

export interface ArchitecturePattern {
  name: string;
  displayName: string;
  description: string;
  suitableFor: {
    teamSize: { min: number; max: number };
    complexity: 'low' | 'medium' | 'high';
    projectTypes: string[];
  };
  structure: {
    layers: string[];
    dependencies: DependencyRule[];
  };
  templates: string[];
}

export interface LayerDefinition {
  name: string;
  description: string;
  purpose: string;
  conventions: {
    naming: string;
    location: string;
    imports: string[];
    exports: string[];
  };
  allowedDependencies: string[];
  restrictions: string[];
}

export interface NamingConventions {
  components: {
    files: string;
    classes: string;
    interfaces: string;
    props: string;
  };
  directories: {
    components: string;
    pages: string;
    services: string;
    types: string;
  };
  constants: {
    actions: string;
    configs: string;
  };
}

export interface ValidationRules {
  architecture: ArchitectureRule[];
  components: ComponentRule[];
  dependencies: DependencyRule[];
  naming: NamingRule[];
}

export interface ArchitectureRule {
  id: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  check: (architecture: ArchitectureSpec) => boolean;
  message: string;
}

export interface ComponentRule {
  id: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  check: (component: any) => boolean;
  message: string;
}

export interface DependencyRule {
  from: string;
  to: string;
  allowed: boolean;
  reason?: string;
}

export interface NamingRule {
  target: 'component' | 'file' | 'directory' | 'interface';
  pattern: RegExp;
  message: string;
}

export class SpecificationIntegrator {
  private config: SpecificationConfig;
  private specPath: string;

  constructor(specPath?: string) {
    this.specPath = specPath || this.getDefaultSpecPath();
    this.config = this.loadConfiguration();
  }

  /**
   * 获取默认规范路径
   */
  private getDefaultSpecPath(): string {
    // 向上查找规范文件
    let currentDir = process.cwd();
    while (currentDir !== path.dirname(currentDir)) {
      const specFile = path.join(currentDir, 'react-component-architecture-design-spec');
      if (fs.existsSync(specFile)) {
        return specFile;
      }
      currentDir = path.dirname(currentDir);
    }
    
    // 如果找不到，使用相对路径
    return path.join(__dirname, '../../../../');
  }

  /**
   * 加载规范配置
   */
  private loadConfiguration(): SpecificationConfig {
    try {
      const configPath = path.join(this.specPath, 'wizard/config/specification.yaml');
      
      if (!fs.existsSync(configPath)) {
        // 如果配置文件不存在，创建默认配置
        this.createDefaultConfiguration(configPath);
      }
      
      const configContent = fs.readFileSync(configPath, 'utf-8');
      return yaml.load(configContent) as SpecificationConfig;
    } catch (error) {
      console.warn('Failed to load specification config, using defaults:', error);
      return this.getDefaultConfiguration();
    }
  }

  /**
   * 创建默认配置文件
   */
  private createDefaultConfiguration(configPath: string): void {
    const defaultConfig = this.getDefaultConfiguration();
    
    // 确保目录存在
    fs.ensureDirSync(path.dirname(configPath));
    
    // 写入配置文件
    const yamlContent = yaml.dump(defaultConfig, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
    
    fs.writeFileSync(configPath, yamlContent, 'utf-8');
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfiguration(): SpecificationConfig {
    return {
      version: '1.0.0',
      compatibility: {
        minWizardVersion: '1.0.0',
        maxWizardVersion: '2.0.0'
      },
      patterns: [
        {
          name: 'modular',
          displayName: '模块化架构',
          description: '适合小到中型团队，组件按功能模块组织',
          suitableFor: {
            teamSize: { min: 1, max: 10 },
            complexity: 'medium',
            projectTypes: ['spa', 'dashboard', 'cms']
          },
          structure: {
            layers: ['pages', 'business', 'common', 'base'],
            dependencies: [
              { from: 'pages', to: 'business', allowed: true },
              { from: 'pages', to: 'common', allowed: true },
              { from: 'business', to: 'common', allowed: true },
              { from: 'business', to: 'base', allowed: true },
              { from: 'common', to: 'base', allowed: true }
            ]
          },
          templates: ['modular-component', 'modular-page', 'modular-service']
        },
        {
          name: 'feature-based',
          displayName: '功能域架构',
          description: '适合中型团队，按业务功能域划分',
          suitableFor: {
            teamSize: { min: 5, max: 15 },
            complexity: 'medium',
            projectTypes: ['ecommerce', 'saas', 'enterprise']
          },
          structure: {
            layers: ['features', 'shared', 'core'],
            dependencies: [
              { from: 'features', to: 'shared', allowed: true },
              { from: 'features', to: 'core', allowed: true },
              { from: 'shared', to: 'core', allowed: true }
            ]
          },
          templates: ['feature-component', 'feature-page', 'feature-service']
        },
        {
          name: 'layered',
          displayName: '分层架构',
          description: '适合大型团队，严格的分层结构',
          suitableFor: {
            teamSize: { min: 10, max: 50 },
            complexity: 'high',
            projectTypes: ['enterprise', 'platform']
          },
          structure: {
            layers: ['presentation', 'application', 'domain', 'infrastructure'],
            dependencies: [
              { from: 'presentation', to: 'application', allowed: true },
              { from: 'application', to: 'domain', allowed: true },
              { from: 'application', to: 'infrastructure', allowed: true },
              { from: 'domain', to: 'infrastructure', allowed: false, reason: '领域层不应依赖基础设施层' }
            ]
          },
          templates: ['layered-component', 'layered-service', 'layered-repository']
        }
      ],
      layers: [
        {
          name: 'pages',
          description: '页面组件层',
          purpose: '组织页面级组件，处理路由和页面状态',
          conventions: {
            naming: 'PascalCase + Page后缀',
            location: 'src/pages',
            imports: ['business/*', 'common/*'],
            exports: ['default']
          },
          allowedDependencies: ['business', 'common', 'base'],
          restrictions: ['不可被其他层直接导入']
        },
        {
          name: 'business',
          description: '业务组件层',
          purpose: '业务逻辑组件，实现具体业务功能',
          conventions: {
            naming: 'PascalCase',
            location: 'src/components/business',
            imports: ['common/*', 'base/*'],
            exports: ['named', 'default']
          },
          allowedDependencies: ['common', 'base'],
          restrictions: ['不可循环依赖']
        },
        {
          name: 'common',
          description: '通用组件层',
          purpose: '可复用的通用组件',
          conventions: {
            naming: 'PascalCase',
            location: 'src/components/common',
            imports: ['base/*'],
            exports: ['named', 'default']
          },
          allowedDependencies: ['base'],
          restrictions: ['不可包含业务逻辑']
        },
        {
          name: 'base',
          description: '基础组件层',
          purpose: '最基础的UI组件，不依赖其他层',
          conventions: {
            naming: 'PascalCase',
            location: 'src/components/base',
            imports: ['react', '@/*'],
            exports: ['named', 'default']
          },
          allowedDependencies: [],
          restrictions: ['不可依赖其他业务层']
        }
      ],
      conventions: {
        components: {
          files: 'PascalCase.tsx',
          classes: 'PascalCase',
          interfaces: 'PascalCase + Props/State后缀',
          props: 'camelCase'
        },
        directories: {
          components: 'camelCase',
          pages: 'kebab-case',
          services: 'camelCase',
          types: 'camelCase'
        },
        constants: {
          actions: 'UPPER_SNAKE_CASE',
          configs: 'UPPER_SNAKE_CASE'
        }
      },
      validation: {
        architecture: [],
        components: [],
        dependencies: [],
        naming: []
      }
    };
  }

  /**
   * 验证架构是否符合规范
   */
  async validateArchitecture(architecture: ArchitectureSpec): Promise<ToolResult> {
    try {
      const issues: any[] = [];
      const warnings: any[] = [];
      const suggestions: string[] = [];

      // 1. 验证架构模式
      const patternValidation = this.validateArchitecturePattern(architecture);
      issues.push(...patternValidation.issues);
      warnings.push(...patternValidation.warnings);

      // 2. 验证分层结构
      const layerValidation = this.validateLayerStructure(architecture);
      issues.push(...layerValidation.issues);
      warnings.push(...layerValidation.warnings);

      // 3. 验证组件命名
      const namingValidation = this.validateNaming(architecture);
      issues.push(...namingValidation.issues);
      warnings.push(...namingValidation.warnings);

      // 4. 验证依赖关系
      const dependencyValidation = this.validateDependencies(architecture);
      issues.push(...dependencyValidation.issues);
      warnings.push(...dependencyValidation.warnings);

      // 生成建议
      suggestions.push(...this.generateComplianceSuggestions(architecture, issues, warnings));

      return {
        success: true,
        data: {
          valid: issues.length === 0,
          issues,
          warnings,
          suggestions,
          score: this.calculateComplianceScore(issues, warnings),
          compliance: this.generateComplianceReport(architecture, issues, warnings)
        },
        metadata: {
          specificationVersion: this.config.version,
          validationRules: this.config.validation.architecture.length + 
                             this.config.validation.components.length + 
                             this.config.validation.dependencies.length + 
                             this.config.validation.naming.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '规范验证失败'
      };
    }
  }

  /**
   * 验证架构模式
   */
  private validateArchitecturePattern(architecture: ArchitectureSpec): { issues: any[]; warnings: any[] } {
    const issues: any[] = [];
    const warnings: any[] = [];

    const pattern = this.config.patterns.find(p => p.name === architecture.pattern);
    if (!pattern) {
      issues.push({
        rule: 'unknown_pattern',
        severity: 'error',
        message: `未知的架构模式: ${architecture.pattern}`,
        suggestion: `请使用支持的模式: ${this.config.patterns.map(p => p.name).join(', ')}`
      });
      return { issues, warnings };
    }

    // 验证分层结构是否符合模式要求
    const expectedLayers = pattern.structure.layers;
    const actualLayers = Object.keys(architecture.components || {});
    
    expectedLayers.forEach(expectedLayer => {
      if (!actualLayers.includes(expectedLayer)) {
        issues.push({
          rule: 'missing_layer',
          severity: 'error',
          message: `缺少必需的层: ${expectedLayer}`,
          suggestion: `${pattern.name}模式需要包含${expectedLayer}层`
        });
      }
    });

    // 验证额外的层
    actualLayers.forEach(actualLayer => {
      if (!expectedLayers.includes(actualLayer)) {
        warnings.push({
          rule: 'extra_layer',
          severity: 'warning',
          message: `包含额外的层: ${actualLayer}`,
          suggestion: `${pattern.name}模式通常不包含${actualLayer}层，请确认是否必要`
        });
      }
    });

    return { issues, warnings };
  }

  /**
   * 验证分层结构
   */
  private validateLayerStructure(architecture: ArchitectureSpec): { issues: any[]; warnings: any[] } {
    const issues: any[] = [];
    const warnings: any[] = [];

    Object.entries(architecture.components || {}).forEach(([layerName, components]) => {
      const layerDef = this.config.layers.find(l => l.name === layerName);
      if (!layerDef) {
        warnings.push({
          rule: 'undefined_layer',
          severity: 'warning',
          message: `未定义的层: ${layerName}`,
          suggestion: '请确认这个层是否符合架构规范'
        });
        return;
      }

      // 验证组件结构
      if (!Array.isArray(components)) {
        issues.push({
          rule: 'invalid_layer_structure',
          severity: 'error',
          message: `层${layerName}的结构无效`,
          suggestion: '每个层应该包含组件数组'
        });
        return;
      }

      // 验证组件命名
      components.forEach((component: any) => {
        if (!component.name || typeof component.name !== 'string') {
          issues.push({
            rule: 'invalid_component_name',
            severity: 'error',
            message: `层${layerName}中的组件缺少有效名称`,
            suggestion: '每个组件都需要有效的名称'
          });
        }
      });
    });

    return { issues, warnings };
  }

  /**
   * 验证命名约定
   */
  private validateNaming(architecture: ArchitectureSpec): { issues: any[]; warnings: any[] } {
    const issues: any[] = [];
    const warnings: any[] = [];

    Object.entries(architecture.components || {}).forEach(([layerName, components]) => {
      if (!Array.isArray(components)) return;

      components.forEach((component: any) => {
        if (!component.name) return;

        // 验证组件命名是否符合PascalCase
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(component.name)) {
          issues.push({
            rule: 'invalid_component_naming',
            severity: 'error',
            message: `组件${component.name}的命名不符合PascalCase约定`,
            suggestion: '组件名应使用PascalCase格式，如: UserProfile, TaskList'
          });
        }

        // 验证页面组件是否有Page后缀
        if (layerName === 'pages' && !component.name.endsWith('Page')) {
          warnings.push({
            rule: 'page_naming_convention',
            severity: 'warning',
            message: `页面组件${component.name}建议添加Page后缀`,
            suggestion: '页面组件建议使用xxxPage的命名格式'
          });
        }
      });
    });

    return { issues, warnings };
  }

  /**
   * 验证依赖关系
   */
  private validateDependencies(architecture: ArchitectureSpec): { issues: any[]; warnings: any[] } {
    const issues: any[] = [];
    const warnings: any[] = [];

    const dependencies = architecture.dependencies?.internal || [];
    
    dependencies.forEach((dep: any) => {
      const fromLayer = this.extractLayerFromPath(dep.from);
      const toLayer = this.extractLayerFromPath(dep.to);
      
      if (!fromLayer || !toLayer) return;

      // 查找对应的架构模式
      const pattern = this.config.patterns.find(p => p.name === architecture.pattern);
      if (!pattern) return;

      // 检查依赖是否被允许
      const dependencyRule = pattern.structure.dependencies.find(
        rule => rule.from === fromLayer && rule.to === toLayer
      );

      if (dependencyRule && !dependencyRule.allowed) {
        issues.push({
          rule: 'forbidden_dependency',
          severity: 'error',
          message: `禁止的依赖关系: ${fromLayer} -> ${toLayer}`,
          suggestion: dependencyRule.reason || '请重新组织代码结构避免这种依赖'
        });
      }

      // 检查循环依赖
      if (this.hasCyclicDependency(dependencies, dep)) {
        issues.push({
          rule: 'cyclic_dependency',
          severity: 'error',
          message: `检测到循环依赖: ${dep.from} <-> ${dep.to}`,
          suggestion: '请重构代码消除循环依赖'
        });
      }
    });

    return { issues, warnings };
  }

  /**
   * 从路径中提取层名称
   */
  private extractLayerFromPath(filePath: string): string | null {
    const parts = filePath.split('/');
    const layerNames = this.config.layers.map(l => l.name);
    
    for (const part of parts) {
      if (layerNames.includes(part)) {
        return part;
      }
    }
    
    return null;
  }

  /**
   * 检查循环依赖
   */
  private hasCyclicDependency(dependencies: any[], currentDep: any): boolean {
    // 简单的循环依赖检测
    const reverseDep = dependencies.find(
      dep => dep.from === currentDep.to && dep.to === currentDep.from
    );
    return !!reverseDep;
  }

  /**
   * 计算合规得分
   */
  private calculateComplianceScore(issues: any[], warnings: any[]): number {
    const errorWeight = -10;
    const warningWeight = -2;
    
    const baseScore = 100;
    const deduction = issues.length * errorWeight + warnings.length * warningWeight;
    
    return Math.max(0, Math.min(100, baseScore + deduction));
  }

  /**
   * 生成合规建议
   */
  private generateComplianceSuggestions(
    architecture: ArchitectureSpec, 
    issues: any[], 
    warnings: any[]
  ): string[] {
    const suggestions: string[] = [];

    if (issues.length > 0) {
      suggestions.push('请优先修复所有错误问题以确保架构合规性');
    }

    if (warnings.length > 3) {
      suggestions.push('建议处理警告问题以提高架构质量');
    }

    if (issues.length === 0 && warnings.length === 0) {
      suggestions.push('架构完全符合规范，可以开始实施');
    }

    return suggestions;
  }

  /**
   * 生成合规报告
   */
  private generateComplianceReport(
    architecture: ArchitectureSpec, 
    issues: any[], 
    warnings: any[]
  ): any {
    return {
      pattern: architecture.pattern,
      compliant: issues.length === 0,
      issues: {
        errors: issues.length,
        warnings: warnings.length,
        total: issues.length + warnings.length
      },
      layers: Object.keys(architecture.components || {}),
      components: Object.values(architecture.components || {}).flat().length,
      recommendations: this.getPatternRecommendations(architecture.pattern)
    };
  }

  /**
   * 获取模式推荐
   */
  private getPatternRecommendations(patternName: string): string[] {
    const pattern = this.config.patterns.find(p => p.name === patternName);
    if (!pattern) return [];

    return [
      `建议团队规模: ${pattern.suitableFor.teamSize.min}-${pattern.suitableFor.teamSize.max}人`,
      `适合复杂度: ${pattern.suitableFor.complexity}`,
      `推荐项目类型: ${pattern.suitableFor.projectTypes.join(', ')}`
    ];
  }

  /**
   * 将向导会话映射到规范结构
   */
  mapSessionToSpecification(session: WizardSession): any {
    const { requirements } = session;
    
    return {
      project: {
        name: session.projectName,
        type: this.mapProjectType(requirements.projectType),
        scale: this.mapTeamScale(requirements.teamSize),
        complexity: this.estimateComplexity(requirements.features)
      },
      architecture: {
        pattern: this.selectOptimalPattern(requirements),
        layers: this.generateLayerStructure(requirements),
        conventions: this.config.conventions
      },
      components: this.generateComponentStructure(requirements),
      validation: {
        rules: this.config.validation,
        compliance: true
      }
    };
  }

  /**
   * 映射项目类型
   */
  private mapProjectType(projectType: string): string {
    const typeMapping: Record<string, string> = {
      'task_management': 'SaaS应用',
      'ecommerce': '电商平台',
      'saas': 'SaaS应用',
      'dashboard': '数据看板',
      'blog': '内容管理',
      'social': '社交平台',
      'other': '自定义应用'
    };
    
    return typeMapping[projectType] || '未知类型';
  }

  /**
   * 映射团队规模
   */
  private mapTeamScale(teamSize: number): string {
    if (teamSize <= 2) return '小型';
    if (teamSize <= 10) return '中型';
    return '大型';
  }

  /**
   * 估算复杂度
   */
  private estimateComplexity(features: any[]): string {
    const featureCount = features.length;
    const totalEffort = features.reduce((sum, f) => sum + (f.estimatedEffort || 0), 0);
    
    if (featureCount <= 5 && totalEffort <= 100) return 'low';
    if (featureCount <= 15 && totalEffort <= 400) return 'medium';
    return 'high';
  }

  /**
   * 选择最优架构模式
   */
  private selectOptimalPattern(requirements: any): string {
    const { teamSize, projectType, features } = requirements;
    
    for (const pattern of this.config.patterns) {
      const suitableFor = pattern.suitableFor;
      
      if (teamSize >= suitableFor.teamSize.min && 
          teamSize <= suitableFor.teamSize.max &&
          suitableFor.projectTypes.includes(projectType)) {
        return pattern.name;
      }
    }
    
    // 默认返回模块化架构
    return 'modular';
  }

  /**
   * 生成分层结构
   */
  private generateLayerStructure(requirements: any): string[] {
    const pattern = this.config.patterns.find(p => 
      p.name === this.selectOptimalPattern(requirements)
    );
    
    return pattern?.structure.layers || ['pages', 'business', 'common', 'base'];
  }

  /**
   * 生成组件结构
   */
  private generateComponentStructure(requirements: any): any {
    const layers = this.generateLayerStructure(requirements);
    const { features } = requirements;
    
    const components: any = {};
    
    layers.forEach(layer => {
      components[layer] = [];
    });

    // 根据功能生成组件
    features.forEach((feature: any) => {
      const componentName = this.featureToComponent(feature.name);
      
      // 根据功能类型分配到不同层
      const layer = this.determineComponentLayer(feature, layers);
      if (components[layer]) {
        components[layer].push({
          name: componentName,
          type: feature.category || 'business',
          description: feature.description || `${feature.name}相关组件`
        });
      }
    });

    return components;
  }

  /**
   * 功能名转组件名
   */
  private featureToComponent(featureName: string): string {
    // 转换为PascalCase
    return featureName
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * 确定组件应该在哪个层
   */
  private determineComponentLayer(feature: any, availableLayers: string[]): string {
    const category = feature.category?.toLowerCase();
    
    if (category === 'page' && availableLayers.includes('pages')) {
      return 'pages';
    }
    
    if (category === 'business' && availableLayers.includes('business')) {
      return 'business';
    }
    
    if (category === 'common' && availableLayers.includes('common')) {
      return 'common';
    }
    
    if (category === 'infrastructure' && availableLayers.includes('base')) {
      return 'base';
    }
    
    // 默认分配到business层
    return availableLayers.includes('business') ? 'business' : (availableLayers[0] || 'business');
  }

  /**
   * 获取规范版本信息
   */
  getSpecificationInfo(): any {
    return {
      version: this.config.version,
      compatibility: this.config.compatibility,
      patterns: this.config.patterns.map(p => ({
        name: p.name,
        displayName: p.displayName,
        description: p.description
      })),
      layers: this.config.layers.map(l => ({
        name: l.name,
        description: l.description,
        purpose: l.purpose
      }))
    };
  }

  /**
   * 更新规范配置
   */
  async updateSpecification(updates: Partial<SpecificationConfig>): Promise<ToolResult> {
    try {
      this.config = { ...this.config, ...updates };
      
      const configPath = path.join(this.specPath, 'wizard/config/specification.yaml');
      const yamlContent = yaml.dump(this.config, {
        indent: 2,
        lineWidth: 120,
        noRefs: true
      });
      
      fs.writeFileSync(configPath, yamlContent, 'utf-8');
      
      return {
        success: true,
        data: { message: '规范配置更新成功', version: this.config.version }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新规范配置失败'
      };
    }
  }
}