# MCP 工具系统质量实现指南

## 🎯 目标
实现可靠、安全、高性能的工具发现和执行机制，严格遵循 MCP 官方规范。

## 📋 核心功能要求

### 工具发现 (`tools/list`)

**官方规范要求（docs.txt:3779, 3894, 7931）:**
```typescript
interface ToolDiscovery {
  // 发现可用工具
  listTools(cursor?: string): Promise<ListToolsResult>;
  
  // 处理工具变更通知
  handleToolsListChanged(): Promise<void>;
  
  // 支持分页和游标
  supportsPagination: boolean;
}
```

**质量实现:**
```typescript
class QualityToolManager implements ToolDiscovery {
  private toolsCache = new Map<string, Tool[]>();
  private lastDiscoveryTime = 0;
  private cacheTTL = 30000; // 30秒缓存
  
  async listTools(cursor?: string): Promise<ListToolsResult> {
    // 检查缓存有效性
    if (this.isCacheValid() && !cursor) {
      return this.getCachedTools();
    }
    
    const request: RPCRequest = {
      jsonrpc: "2.0",
      id: this.generateRequestId(),
      method: "tools/list",
      params: cursor ? { cursor } : {}
    };
    
    try {
      const response = await this.session.request(request);
      const result = this.validateListToolsResponse(response);
      
      // 更新缓存
      this.updateToolsCache(result.tools);
      this.lastDiscoveryTime = Date.now();
      
      return result;
    } catch (error) {
      throw this.handleDiscoveryError(error);
    }
  }
  
  private validateListToolsResponse(response: RPCResponse): ListToolsResult {
    // 严格的响应验证
    if (!response.result || !Array.isArray(response.result.tools)) {
      throw new Error("Invalid tools/list response format");
    }
    
    const tools = response.result.tools;
    for (const tool of tools) {
      this.validateToolDefinition(tool);
    }
    
    return {
      tools,
      nextCursor: response.result.nextCursor,
      prevCursor: response.result.prevCursor
    };
  }
}
```

### 工具执行 (`tools/call`)

**官方规范要求（docs.txt:3778, 7932, 3983）:**
```typescript
interface ToolExecution {
  // 执行工具调用
  callTool(name: string, args: any): Promise<CallToolResult>;
  
  // 参数验证和类型检查
  validateArguments(tool: Tool, args: any): ValidationResult;
  
  // 超时和取消支持
  withTimeout(ms: number): ToolExecution;
}
```

**质量实现:**
```typescript
class QualityToolExecutor implements ToolExecution {
  private timeoutMs = 30000; // 默认30秒超时
  
  async callTool(name: string, args: any): Promise<CallToolResult> {
    // 1. 获取工具定义（验证工具存在）
    const tool = await this.getToolDefinition(name);
    
    // 2. 参数验证
    const validation = this.validateArguments(tool, args);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }
    
    // 3. 准备请求
    const request: RPCRequest = {
      jsonrpc: "2.0",
      id: this.generateRequestId(),
      method: "tools/call",
      params: {
        name: tool.name,
        arguments: this.sanitizeArguments(args)
      }
    };
    
    // 4. 执行调用（带超时）
    try {
      const response = await Promise.race([
        this.session.request(request),
        this.createTimeoutPromise()
      ]);
      
      return this.processToolResponse(response, tool);
    } catch (error) {
      throw this.handleExecutionError(error, tool, args);
    }
  }
  
  private validateArguments(tool: Tool, args: any): ValidationResult {
    const errors: string[] = [];
    const schema = tool.inputSchema;
    
    // 检查必需参数
    if (schema.required) {
      for (const param of schema.required) {
        if (args[param] === undefined || args[param] === null) {
          errors.push(`Missing required parameter: ${param}`);
        }
      }
    }
    
    // 类型检查
    for (const [param, value] of Object.entries(args)) {
      const paramSchema = schema.properties?.[param];
      if (paramSchema) {
        const typeError = this.checkType(param, value, paramSchema);
        if (typeError) errors.push(typeError);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

## 🛡️ 安全实现

### 参数消毒和验证
```typescript
class ArgumentSanitizer {
  sanitizeArguments(args: any, tool: Tool): any {
    const sanitized: any = {};
    const schema = tool.inputSchema;
    
    for (const [key, value] of Object.entries(args)) {
      if (schema.properties?.[key]) {
        sanitized[key] = this.sanitizeValue(value, schema.properties[key]);
      }
    }
    
    return sanitized;
  }
  
  private sanitizeValue(value: any, schema: JSONSchema): any {
    switch (schema.type) {
      case 'string':
        return this.sanitizeString(value);
      case 'number':
        return this.sanitizeNumber(value);
      case 'boolean':
        return Boolean(value);
      case 'array':
        return this.sanitizeArray(value, schema);
      case 'object':
        return this.sanitizeObject(value, schema);
      default:
        return value;
    }
  }
  
  private sanitizeString(value: any): string {
    if (typeof value !== 'string') {
      value = String(value);
    }
    // 防止 XSS 和其他注入攻击
    return value.replace(/[<>\"\']/g, '');
  }
}
```

### 访问控制和权限管理
```typescript
class ToolAccessController {
  private permissionMap = new Map<string, string[]>();
  
  async checkToolAccess(toolName: string, context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.permissionMap.get(toolName) || [];
    
    if (requiredPermissions.length === 0) {
      return true; // 无权限要求
    }
    
    const userPermissions = await this.getUserPermissions(context.userId);
    return requiredPermissions.every(perm => userPermissions.includes(perm));
  }
  
  async validateToolExecution(toolName: string, args: any, context: ExecutionContext): Promise<void> {
    // 检查访问权限
    const hasAccess = await this.checkToolAccess(toolName, context);
    if (!hasAccess) {
      throw new PermissionError(`Access denied for tool: ${toolName}`);
    }
    
    // 检查速率限制
    const isRateLimited = await this.checkRateLimit(toolName, context);
    if (isRateLimited) {
      throw new RateLimitError(`Rate limit exceeded for tool: ${toolName}`);
    }
    
    // 检查资源配额
    const hasQuota = await this.checkResourceQuota(toolName, context);
    if (!hasQuota) {
      throw new QuotaError(`Resource quota exceeded for tool: ${toolName}`);
    }
  }
}
```

## ⚡ 性能优化

### 工具缓存策略
```typescript
class ToolCacheManager {
  private cache = new Map<string, CachedTool>();
  private staticCacheTTL = 3600000; // 1小时静态缓存
  private dynamicCacheTTL = 300000;  // 5分钟动态缓存
  
  async getTool(name: string, forceRefresh = false): Promise<Tool> {
    const cached = this.cache.get(name);
    
    // 检查缓存有效性
    if (!forceRefresh && cached && !this.isCacheExpired(cached)) {
      return cached.tool;
    }
    
    // 从服务器获取最新工具定义
    const tool = await this.fetchToolFromServer(name);
    this.cache.set(name, {
      tool,
      timestamp: Date.now(),
      ttl: tool.static ? this.staticCacheTTL : this.dynamicCacheTTL
    });
    
    return tool;
  }
  
  private isCacheExpired(cached: CachedTool): boolean {
    return Date.now() - cached.timestamp > cached.ttl;
  }
}
```

### 批量工具调用
```typescript
class BatchToolExecutor {
  private batchSize = 5;
  private concurrencyLimit = 3;
  
  async executeBatch(requests: ToolRequest[]): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    const batches = this.createBatches(requests);
    
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(req => this.executeSingle(req))
      );
      
      results.push(...this.processBatchResults(batchResults));
    }
    
    return results;
  }
  
  private createBatches(requests: ToolRequest[]): ToolRequest[][] {
    const batches: ToolRequest[][] = [];
    for (let i = 0; i < requests.length; i += this.batchSize) {
      batches.push(requests.slice(i, i + this.batchSize));
    }
    return batches;
  }
}
```

## 🚨 错误处理

### 工具执行错误分类
```typescript
enum ToolError {
  // 验证错误
  VALIDATION_FAILED = 4000,
  INVALID_ARGUMENTS = 4001,
  
  // 执行错误
  EXECUTION_TIMEOUT = 5000,
  EXECUTION_FAILED = 5001,
  
  // 权限错误
  PERMISSION_DENIED = 6000,
  RATE_LIMIT_EXCEEDED = 6001,
  QUOTA_EXCEEDED = 6002
}

class ToolErrorHandler {
  handleExecutionError(error: Error, tool: Tool, args: any): ToolError {
    if (error instanceof TimeoutError) {
      return {
        code: ToolError.EXECUTION_TIMEOUT,
        message: `Tool execution timeout: ${tool.name}`,
        data: { tool: tool.name, timeout: this.timeoutMs }
      };
    }
    
    if (error instanceof PermissionError) {
      return {
        code: ToolError.PERMISSION_DENIED,
        message: `Permission denied for tool: ${tool.name}`,
        data: { tool: tool.name, requiredPermissions: tool.requiredPermissions }
      };
    }
    
    // 默认错误
    return {
      code: ToolError.EXECUTION_FAILED,
      message: `Tool execution failed: ${error.message}`,
      data: { 
        tool: tool.name, 
        arguments: args,
        originalError: error.message 
      }
    };
  }
}
```

## ✅ 验收标准

### 功能完整性
- [ ] 100% 实现 `tools/list` 和 `tools/call`
- [ ] 支持分页和游标参数
- [ ] 处理动态工具变更通知
- [ ] 完整的参数验证和类型安全

### 可靠性
- [ ] 工具执行成功率 > 99.9%
- [ ] 自动重试机制完善
- [ ] 错误恢复和处理完整

### 安全性
- [ ] 参数消毒和验证完备
- [ ] 访问控制和权限管理
- [ ] 防注入攻击措施
- [ ] 速率限制和配额管理

### 性能
- [ ] 工具发现响应时间 < 100ms
- [ ] 工具执行延迟 < 500ms
- [ ] 缓存命中率 > 80%
- [ ] 支持批量执行

### 测试覆盖
- [ ] 单元测试覆盖率 > 90%
- [ ] 错误场景全面测试
- [ ] 性能基准测试通过
- [ ] 安全漏洞扫描通过

---

*基于 MCP 官方规范 2025-06-18 版本*  
*最后更新: 2025-01-01*