# React 组件版本控制和迁移指南

> 基于 React 18.3.1 的组件版本管理和迁移最佳实践

## 📋 概述

本指南提供了完整的 React 组件版本控制和迁移策略，帮助团队有效管理组件生命周期，确保平滑升级和向后兼容性。

## 🎯 版本控制策略

### 语义化版本控制 (SemVer)

```typescript
// 版本格式：MAJOR.MINOR.PATCH
// 1.0.0 → 主版本号.次版本号.修订号

type Version = {
  major: number;  // 破坏性变更
  minor: number;  // 新功能，向后兼容
  patch: number;  // Bug修复，向后兼容
  preRelease?: string;  // 预发布版本
  build?: string;       // 构建元数据
};
```

### 版本号规范

```typescript
// 版本号验证正则
const VERSION_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

// 版本比较工具
class VersionComparator {
  static compare(version1: string, version2: string): number {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    
    return 0;
  }
  
  static isBreakingChange(oldVersion: string, newVersion: string): boolean {
    const old = oldVersion.split('.').map(Number);
    const newV = newVersion.split('.').map(Number);
    return newV[0] > old[0];
  }
}
```

## 📦 组件版本管理

### 组件版本信息

```typescript
// component-version.ts
export interface ComponentVersion {
  version: string;
  releaseDate: string;
  changelog: string[];
  breakingChanges?: string[];
  deprecatedFeatures?: string[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

// 组件版本历史
export class ComponentVersionManager {
  private versions: ComponentVersion[] = [];
  
  addVersion(version: ComponentVersion): void {
    this.versions.push(version);
    this.versions.sort((a, b) => 
      VersionComparator.compare(b.version, a.version)
    );
  }
  
  getLatestVersion(): ComponentVersion | null {
    return this.versions[0] || null;
  }
  
  getVersionHistory(): ComponentVersion[] {
    return [...this.versions];
  }
  
  findVersion(version: string): ComponentVersion | null {
    return this.versions.find(v => v.version === version) || null;
  }
}
```

### 版本兼容性检查

```typescript
// version-compatibility.ts
export interface VersionRange {
  minVersion: string;
  maxVersion?: string;
  excludeVersions?: string[];
}

export class VersionCompatibility {
  static checkCompatibility(
    componentVersion: string,
    requiredRange: VersionRange
  ): { compatible: boolean; reason?: string } {
    const { minVersion, maxVersion, excludeVersions } = requiredRange;
    
    // 检查排除版本
    if (excludeVersions?.includes(componentVersion)) {
      return {
        compatible: false,
        reason: `版本 ${componentVersion} 被明确排除`
      };
    }
    
    // 检查最小版本
    if (VersionComparator.compare(componentVersion, minVersion) < 0) {
      return {
        compatible: false,
        reason: `版本 ${componentVersion} 低于要求的最小版本 ${minVersion}`
      };
    }
    
    // 检查最大版本
    if (maxVersion && VersionComparator.compare(componentVersion, maxVersion) > 0) {
      return {
        compatible: false,
        reason: `版本 ${componentVersion} 超过允许的最大版本 ${maxVersion}`
      };
    }
    
    return { compatible: true };
  }
  
  static getCompatibleVersions(
    availableVersions: string[],
    range: VersionRange
  ): string[] {
    return availableVersions.filter(version => 
      this.checkCompatibility(version, range).compatible
    );
  }
}
```

## 🔄 迁移策略

### 迁移类型分类

```typescript
// migration-types.ts
export enum MigrationType {
  // 无需迁移 - 完全向后兼容
  NONE = 'none',
  
  // 简单迁移 - 只需更新版本号
  SIMPLE = 'simple',
  
  // 代码迁移 - 需要少量代码修改
  CODE = 'code',
  
  // 重大迁移 - 需要大量代码重构
  MAJOR = 'major',
  
  // 数据迁移 - 需要数据结构变更
  DATA = 'data'
}

export interface MigrationStep {
  type: MigrationType;
  description: string;
  codeChanges?: CodeChange[];
  dataChanges?: DataChange[];
  estimatedTime: string; // 预估时间
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CodeChange {
  filePath: string;
  oldCode: string;
  newCode: string;
  reason: string;
}

export interface DataChange {
  dataType: string;
  transformation: string;
  script?: string;
}
```

### 自动化迁移工具

```typescript
// migration-tool.ts
export class MigrationTool {
  private migrations: Map<string, MigrationStep[]> = new Map();
  
  registerMigration(fromVersion: string, toVersion: string, steps: MigrationStep[]): void {
    const key = `${fromVersion}->${toVersion}`;
    this.migrations.set(key, steps);
  }
  
  getMigrationPath(fromVersion: string, toVersion: string): MigrationStep[] {
    // 简化的迁移路径查找
    const directKey = `${fromVersion}->${toVersion}`;
    if (this.migrations.has(directKey)) {
      return this.migrations.get(directKey)!;
    }
    
    // 如果没有直接路径，返回空数组（实际项目中需要更复杂的路径查找）
    return [];
  }
  
  async executeMigration(
    fromVersion: string,
    toVersion: string,
    projectPath: string
  ): Promise<MigrationResult> {
    const steps = this.getMigrationPath(fromVersion, toVersion);
    const results: MigrationStepResult[] = [];
    
    for (const step of steps) {
      try {
        const result = await this.executeStep(step, projectPath);
        results.push(result);
      } catch (error) {
        return {
          success: false,
          error: `迁移步骤失败: ${error.message}`,
          completedSteps: results,
          failedStep: step
        };
      }
    }
    
    return {
      success: true,
      completedSteps: results
    };
  }
  
  private async executeStep(step: MigrationStep, projectPath: string): Promise<MigrationStepResult> {
    const startTime = Date.now();
    
    // 执行代码变更
    if (step.codeChanges) {
      for (const change of step.codeChanges) {
        await this.applyCodeChange(change, projectPath);
      }
    }
    
    // 执行数据变更
    if (step.dataChanges) {
      for (const change of step.dataChanges) {
        await this.applyDataChange(change, projectPath);
      }
    }
    
    return {
      step,
      success: true,
      duration: Date.now() - startTime
    };
  }
  
  private async applyCodeChange(change: CodeChange, projectPath: string): Promise<void> {
    const filePath = path.join(projectPath, change.filePath);
    
    // 使用 AST 进行精确的代码替换
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const updatedCode = sourceCode.replace(
      new RegExp(escapeRegExp(change.oldCode), 'g'),
      change.newCode
    );
    
    if (sourceCode !== updatedCode) {
      fs.writeFileSync(filePath, updatedCode, 'utf-8');
    }
  }
  
  private async applyDataChange(change: DataChange, projectPath: string): Promise<void> {
    // 实现数据迁移逻辑
    if (change.script) {
      // 执行数据迁移脚本
      const scriptPath = path.join(projectPath, change.script);
      require(scriptPath);
    }
  }
}
```

## 📊 变更日志管理

### 标准化变更日志

```typescript
// changelog-manager.ts
export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'breaking' | 'feature' | 'fix' | 'deprecation' | 'docs' | 'style' | 'refactor' | 'test';
  description: string;
  component?: string;
  prLink?: string;
  author?: string;
}

export class ChangelogManager {
  private entries: ChangelogEntry[] = [];
  
  addEntry(entry: ChangelogEntry): void {
    this.entries.push(entry);
    this.sortEntries();
  }
  
  generateMarkdown(): string {
    const groupedEntries = this.groupByVersion();
    
    let markdown = '# 变更日志\n\n';
    
    for (const [version, entries] of Object.entries(groupedEntries)) {
      const date = entries[0].date;
      markdown += `## [${version}] - ${date}\n\n`;
      
      // 按类型分组
      const typeGroups = this.groupByType(entries);
      
      for (const [type, typeEntries] of Object.entries(typeGroups)) {
        const typeTitle = this.getTypeTitle(type);
        markdown += `### ${typeTitle}\n\n`;
        
        for (const entry of typeEntries) {
          markdown += `- ${entry.description}`;
          if (entry.prLink) {
            markdown += ` ([#${entry.prLink}](${entry.prLink}))`;
          }
          if (entry.author) {
            markdown += ` (@${entry.author})`;
          }
          markdown += '\n';
        }
        
        markdown += '\n';
      }
    }
    
    return markdown;
  }
  
  private groupByVersion(): Record<string, ChangelogEntry[]> {
    return this.entries.reduce((acc, entry) => {
      if (!acc[entry.version]) {
        acc[entry.version] = [];
      }
      acc[entry.version].push(entry);
      return acc;
    }, {} as Record<string, ChangelogEntry[]>);
  }
  
  private groupByType(entries: ChangelogEntry[]): Record<string, ChangelogEntry[]> {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.type]) {
        acc[entry.type] = [];
      }
      acc[entry.type].push(entry);
      return acc;
    }, {} as Record<string, ChangelogEntry[]>);
  }
  
  private getTypeTitle(type: string): string {
    const titles = {
      breaking: '⚠️ 破坏性变更',
      feature: '✨ 新功能',
      fix: '🐛 Bug修复',
      deprecation: '🗑️ 废弃功能',
      docs: '📚 文档',
      style: '💎 代码样式',
      refactor: '🔨 重构',
      test: '🧪 测试'
    };
    return titles[type as keyof typeof titles] || type;
  }
  
  private sortEntries(): void {
    this.entries.sort((a, b) => 
      VersionComparator.compare(b.version, a.version)
    );
  }
}
```

## 🛠️ 实际应用示例

### 组件版本化实现

```typescript
// Button 组件版本化示例
import React from 'react';
import { ComponentVersionManager, VersionCompatibility } from './version-manager';

// 版本信息
const buttonVersions = new ComponentVersionManager();
buttonVersions.addVersion({
  version: '1.0.0',
  releaseDate: '2024-01-15',
  changelog: [
    '初始版本发布',
    '基础按钮功能',
    '支持主题和大小变体'
  ]
});

buttonVersions.addVersion({
  version: '1.1.0',
  releaseDate: '2024-02-01',
  changelog: [
    '新增 loading 状态',
    '添加图标准支持',
    '改进可访问性'
  ]
});

buttonVersions.addVersion({
  version: '2.0.0',
  releaseDate: '2024-03-01',
  changelog: [
    '重新设计组件 API',
    '移除废弃的 color 属性',
    '新增 variant 属性替代'
  ],
  breakingChanges: [
    'color 属性已移除，使用 variant 替代',
    'size 属性值变更：small->sm, large->lg'
  ]
});

// 版本检查 Hook
export const useComponentVersion = (componentName: string, requiredVersion: string) => {
  const [isCompatible, setIsCompatible] = React.useState(true);
  const [warning, setWarning] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const compatibility = VersionCompatibility.checkCompatibility(
      getCurrentVersion(componentName),
      { minVersion: requiredVersion }
    );
    
    setIsCompatible(compatibility.compatible);
    setWarning(compatibility.reason || null);
  }, [componentName, requiredVersion]);
  
  return { isCompatible, warning };
};

// 兼容性包装器
export const VersionCompatWrapper: React.FC<{
  component: React.ComponentType<any>;
  requiredVersion: string;
  fallback?: React.ReactNode;
}> = ({ component: Component, requiredVersion, fallback, ...props }) => {
  const { isCompatible, warning } = useComponentVersion(
    Component.displayName || Component.name,
    requiredVersion
  );
  
  if (!isCompatible) {
    console.warn(`组件版本不兼容: ${warning}`);
    return fallback || null;
  }
  
  return <Component {...props} />;
};
```

### 迁移脚本示例

```typescript
// migrate-button-v1-to-v2.js
const fs = require('fs');
const path = require('path');

const buttonMigration = {
  fromVersion: '1.0.0',
  toVersion: '2.0.0',
  steps: [
    {
      type: 'code',
      description: '将 color 属性替换为 variant',
      codeChanges: [
        {
          pattern: /color="primary"/g,
          replacement: 'variant="primary"'
        },
        {
          pattern: /color="secondary"/g,
          replacement: 'variant="secondary"'
        },
        {
          pattern: /color="danger"/g,
          replacement: 'variant="destructive"'
        }
      ]
    },
    {
      type: 'code',
      description: '更新 size 属性值',
      codeChanges: [
        {
          pattern: /size="small"/g,
          replacement: 'size="sm"'
        },
        {
          pattern: /size="large"/g,
          replacement: 'size="lg"'
        }
      ]
    }
  ]
};

async function migrateButtonUsage(projectPath) {
  const componentsDir = path.join(projectPath, 'src/components');
  
  // 递归查找所有使用 Button 组件的文件
  const files = findFilesWithButtonUsage(componentsDir);
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    
    // 应用所有迁移规则
    for (const step of buttonMigration.steps) {
      if (step.codeChanges) {
        for (const change of step.codeChanges) {
          const newContent = content.replace(change.pattern, change.replacement);
          if (newContent !== content) {
            content = newContent;
            modified = true;
          }
        }
      }
    }
    
    // 如果文件被修改，保存变更
    if (modified) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`✅ 迁移完成: ${file}`);
    }
  }
}

function findFilesWithButtonUsage(dir) {
  const results = [];
  
  function search(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        search(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('Button') && content.includes('color=')) {
          results.push(filePath);
        }
      }
    }
  }
  
  search(dir);
  return results;
}

// 运行迁移
migrateButtonUsage(process.argv[2] || '.');
```

## 📋 版本检查清单

### 发布前检查

- [ ] 版本号符合语义化版本控制规范
- [ ] 所有破坏性变更都已记录并标记
- [ ] 变更日志已更新并包含所有相关变更
- [ ] 迁移指南已为新版本准备
- [ ] 向后兼容性测试已通过
- [ ] 所有废弃功能都有适当的警告
- [ ] 文档已更新以反映新版本变更

### 迁移检查清单

- [ ] 迁移前备份完整项目
- [ ] 检查当前组件版本与目标版本的兼容性
- [ ] 审查所有破坏性变更并评估影响
- [ ] 在开发环境中运行自动化迁移脚本
- [ ] 手动验证迁移结果
- [ ] 运行完整测试套件确保功能正常
- [ ] 性能测试确认没有性能退化
- [ ] 准备回滚计划以防迁移失败

## 🔧 工具和配置

### package.json 版本管理脚本

```json
{
  "scripts": {
    "version:bump": "node scripts/bump-version.js",
    "version:check": "node scripts/check-versions.js",
    "migrate": "node scripts/migrate-components.js",
    "changelog": "node scripts/generate-changelog.js",
    "release": "npm run version:check && npm run changelog && npm version patch && npm publish"
  }
}
```

### 版本管理配置文件

```json
// .versionrc.json
{
  "types": [
    { "type": "breaking", "section": "⚠️ 破坏性变更" },
    { "type": "feature", "section": "✨ 新功能" },
    { "type": "fix", "section": "🐛 Bug修复" },
    { "type": "deprecation", "section": "🗑️ 废弃功能" },
    { "type": "docs", "section": "📚 文档" },
    { "type": "style", "section": "💎 代码样式" },
    { "type": "refactor", "section": "🔨 重构" },
    { "type": "test", "section": "🧪 测试" }
  ],
  "skip": {
    "tag": true,
    "commit": true
  }
}
```

## 🎯 最佳实践

### 版本控制最佳实践

1. **严格遵循 SemVer**：主版本号表示破坏性变更，次版本号表示新功能，修订号表示 Bug 修复
2. **保持向后兼容**：尽量避免破坏性变更，如必需则提供迁移路径
3. **提前通知**：在废弃功能时提前通知用户，给予充分的迁移时间
4. **详细文档**：为每个版本提供详细的变更日志和迁移指南

### 迁移最佳实践

1. **自动化迁移**：尽可能提供自动化迁移工具
2. **渐进式迁移**：支持新旧版本并存，允许渐进式迁移
3. **充分测试**：在正式迁移前进行充分的测试验证
4. **提供回滚**：准备好回滚方案以防迁移失败
5. **监控反馈**：迁移后监控用户反馈，及时解决问题

## 📚 总结

有效的版本控制和迁移策略是构建可维护组件系统的关键。通过：

- 严格的语义化版本控制
- 自动化的版本检查和迁移工具
- 详细的变更日志和文档
- 完善的测试和验证流程

可以确保组件的平滑升级和长期可维护性。

---

*文档版本：1.0.0*  
*最后更新：2024年*