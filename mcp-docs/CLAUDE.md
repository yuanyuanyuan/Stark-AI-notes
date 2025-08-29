# CLAUDE.md

[根目录](../CLAUDE.md) > **mcp-docs**

## 🎯 模块职责

mcp-docs 模块提供 Model Context Protocol (MCP) 的完整文档和实现指南。MCP 是一个用于 AI 模型与外部工具和服务通信的标准化协议，该模块为开发者提供协议规范、实现指南和最佳实践。

### 核心功能
- **协议规范**: 完整的 MCP 协议规范文档
- **实现指南**: 从基础到高级的实现指导
- **质量标准**: MCP 工具和资源的质量指南
- **客户端模板**: 标准化的 MCP 客户端实现模板

## 📚 入口与启动

### 核心文档入口
- **mcp-protocol-core.md**: MCP 协议核心实现指南
- **mcp-quality-guide.md**: MCP 质量标准和最佳实践
- **mcp-implementation-roadmap.md**: MCP 实现路线图
- **mcp-client-index-template.md**: MCP 客户端模板

### 使用方式
1. **理解协议**: 先阅读协议核心文档
2. **规划实现**: 参考实现路线图
3. **开发客户端**: 使用客户端模板
4. **质量保证**: 遵循质量指南

## 🔌 对外接口

### MCP 协议接口
```typescript
interface MCPProtocol {
  version: string;
  transports: Transport[];
  capabilities: Capabilities;
  messageFormat: MessageFormat;
}

interface Transport {
  type: 'stdio' | 'sse' | 'websocket';
  config: TransportConfig;
  handlers: TransportHandlers;
}
```

### 客户端接口
```typescript
interface MCPClient {
  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  sendRequest(request: MCPRequest): Promise<MCPResponse>;
  listen(): AsyncIterable<MCPMessage>;
}
```

## 📦 关键依赖与配置

### 文档结构
```
mcp-docs/
├── mcp-protocol-core.md
├── mcp-quality-guide.md
├── mcp-implementation-roadmap.md
├── mcp-tools-quality.md
├── mcp-resources-best-practices.md
├── mcp-prompts-quality.md
├── mcp-cli-professional.md
└── mcp-client-index-template.md
```

### 技术依赖
- **传输协议**: stdio、SSE、WebSocket
- **消息格式**: JSON-RPC 2.0
- **编程语言**: TypeScript (主要)、支持多语言
- **工具链**: Node.js、现代 Web 技术

## 🗃️ 数据模型

### MCP 消息模型
```json
{
  "jsonrpc": "2.0",
  "id": "string | number | null",
  "method": "string",
  "params": {
    "protocolVersion": "2025.06.18",
    "capabilities": {
      "client": {},
      "server": {}
    }
  }
}
```

### 连接配置模型
```json
{
  "connection": {
    "transport": "stdio | sse | websocket",
    "config": {
      "command": "string",
      "args": "string[]",
      "url": "string",
      "headers": "Record<string, string>"
    },
    "capabilities": {
      "tools": boolean,
      "resources": boolean,
      "prompts": boolean
    }
  }
}
```

## 🧪 测试与质量

### 协议兼容性测试
- **消息格式验证**: 确保符合 JSON-RPC 2.0 规范
- **传输协议测试**: 验证所有传输协议的实现
- **版本协商**: 测试协议版本协商机制

### 性能和可靠性测试
- **消息处理延迟**: < 10ms 延迟要求
- **连接稳定性**: 自动重连机制测试
- **错误处理**: 完整的错误处理和恢复

## ❓ 常见问题 (FAQ)

### Q: 如何选择合适的传输协议？
A: stdio 适合本地进程通信，SSE 适合 HTTP 环境，WebSocket 适合实时双向通信。

### Q: MCP 协议的版本兼容性如何处理？
A: 通过版本协商机制，客户端和服务器协商支持的协议版本。

### Q: 如何保证 MCP 工具的质量？
A: 遵循 mcp-quality-guide.md 中的质量标准和最佳实践。

## 📁 相关文件清单

### 核心协议文档
- `mcp-protocol-core.md` - 协议核心实现指南
- `mcp-quality-guide.md` - 质量标准和最佳实践
- `mcp-implementation-roadmap.md` - 实现路线图

### 专项指南
- `mcp-tools-quality.md` - 工具质量指南
- `mcp-resources-best-practices.md` - 资源最佳实践
- `mcp-prompts-quality.md` - 提示质量指南
- `mcp-cli-professional.md` - CLI 专业实现指南

### 模板文件
- `mcp-client-index-template.md` - 客户端实现模板

## 📈 变更记录 (Changelog)

### 2025-08-29
- **feat**: 完成AI上下文初始化扫描
- **feat**: 添加模块文档和接口定义
- **feat**: 建立MCP协议数据模型
- **feat**: 完善质量保证和测试策略

### 历史变更
- **feat**: 添加MCP协议核心文档
- **feat**: 完善质量标准和最佳实践
- **feat**: 添加客户端实现模板
- **feat**: 增强工具和资源指南

## 🔄 覆盖率统计

### 扫描覆盖情况
- **总文件数**: 8个文件
- **已扫描文件**: 8个文件 (100%)
- **协议文档**: 完整协议规范 (100%)
- **实现指南**: 全流程覆盖 (100%)

### 主要缺口
- 无发现的重要缺口
- 所有关键文档均已完整覆盖

### 下一步建议
- [ ] 添加更多编程语言的实现示例
- [ ] 扩展高级使用场景和模式
- [ ] 增加故障排除和调试指南
- [ ] 完善安全性和隐私保护指南