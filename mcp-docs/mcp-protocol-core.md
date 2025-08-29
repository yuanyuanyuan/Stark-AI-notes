# MCP 协议核心实现指南

## 🎯 目标
确保 MCP 协议层的精准实现，严格遵循官方规范，提供可靠的通信基础。

## 📋 协议要求

### 传输协议支持（必须全部实现）

**1. stdio 传输协议**
```typescript
// 基于子进程的标准输入输出
interface StdioTransport {
  startProcess(command: string, args: string[]): Promise<ChildProcess>;
  handleStdout(data: Buffer): void;
  handleStderr(data: Buffer): void;
  writeToStdin(message: string): Promise<void>;
}
```

**2. SSE (Server-Sent Events) 传输协议**
```typescript
// 基于 HTTP SSE 的连接管理
interface SSETransport {
  connect(url: string, headers?: Record<string, string>): Promise<EventSource>;
  handleMessage(event: MessageEvent): void;
  handleError(error: Event): void;
  close(): void;
}
```

**3. WebSocket 传输协议**
```typescript
// WebSocket 连接管理
interface WebSocketTransport {
  connect(url: string): Promise<WebSocket>;
  sendMessage(message: string): Promise<void>;
  handleMessage(event: MessageEvent): void;
  handleClose(event: CloseEvent): void;
}
```

## 🛠️ 核心实现

### JSON-RPC 2.0 协议实现

**消息结构（严格遵循规范）:**
```typescript
interface RPCRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: any;
}

interface RPCResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: RPCError;
}

interface RPCError {
  code: number;
  message: string;
  data?: any;
}
```

**消息处理核心:**
```typescript
class MessageHandler {
  // 消息序列化
  serialize(message: RPCMessage): string {
    return JSON.stringify(message);
  }
  
  // 消息反序列化
  deserialize(data: string): RPCMessage {
    const message = JSON.parse(data);
    this.validateMessage(message);
    return message;
  }
  
  // 消息验证
  private validateMessage(message: any): void {
    if (message.jsonrpc !== "2.0") {
      throw new Error("Invalid JSON-RPC version");
    }
    // 其他验证逻辑...
  }
}
```

### 连接管理

**连接状态机:**
```typescript
enum ConnectionState {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
  ERROR,
  RECONNECTING
}

class ConnectionManager {
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  async connect(config: ConnectionConfig): Promise<void> {
    this.state = ConnectionState.CONNECTING;
    try {
      await this.establishConnection(config);
      this.state = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
    } catch (error) {
      this.handleConnectionError(error);
    }
  }
  
  private async establishConnection(config: ConnectionConfig): Promise<void> {
    // 根据配置选择传输协议
    switch (config.transport) {
      case 'stdio':
        return this.connectStdio(config);
      case 'sse':
        return this.connectSSE(config);
      case 'websocket':
        return this.connectWebSocket(config);
    }
  }
}
```

### 协议版本协商

**初始化协商流程:**
```typescript
class ProtocolNegotiator {
  async negotiate(session: MCPSession): Promise<NegotiationResult> {
    const request: InitializeRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025.06.18",
        capabilities: {
          client: {
            // 客户端能力声明
          }
        }
      }
    };
    
    const response = await session.request(request);
    return this.processNegotiationResponse(response);
  }
  
  private processNegotiationResponse(response: RPCResponse): NegotiationResult {
    // 处理服务器响应，确定最终协议版本和能力
  }
}
```

## 🔧 心跳和健康检查

```typescript
class HeartbeatManager {
  private intervalId?: NodeJS.Timeout;
  private lastHeartbeatTime = 0;
  
  startHeartbeat(session: MCPSession, intervalMs = 30000): void {
    this.intervalId = setInterval(async () => {
      try {
        await session.request({
          jsonrpc: "2.0",
          id: `heartbeat-${Date.now()}`,
          method: "ping",
          params: {}
        });
        this.lastHeartbeatTime = Date.now();
      } catch (error) {
        this.handleHeartbeatFailure(error);
      }
    }, intervalMs);
  }
  
  stopHeartbeat(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
```

## 🚨 错误处理

**协议层错误分类:**
```typescript
enum ProtocolError {
  // 连接错误
  CONNECTION_FAILED = 1000,
  CONNECTION_TIMEOUT = 1001,
  
  // 消息错误
  INVALID_MESSAGE_FORMAT = 2000,
  UNSUPPORTED_PROTOCOL_VERSION = 2001,
  
  // 传输错误
  TRANSPORT_ERROR = 3000,
  HEARTBEAT_FAILED = 3001
}

class ProtocolErrorHandler {
  handleError(error: Error): RPCError {
    if (error instanceof ConnectionError) {
      return {
        code: ProtocolError.CONNECTION_FAILED,
        message: "Connection failed",
        data: { originalError: error.message }
      };
    }
    // 其他错误处理...
  }
}
```

## 📊 性能优化

**消息批处理:**
```typescript
class MessageBatcher {
  private batch: RPCRequest[] = [];
  private batchSize = 10;
  private batchTimeout = 100; // ms
  
  async sendMessage(message: RPCRequest): Promise<RPCResponse> {
    this.batch.push(message);
    
    if (this.batch.length >= this.batchSize) {
      return this.flushBatch();
    }
    
    // 设置超时刷新
    if (this.batch.length === 1) {
      setTimeout(() => this.flushBatch(), this.batchTimeout);
    }
    
    // 返回承诺，在批处理完成后解析
  }
  
  private async flushBatch(): Promise<RPCResponse> {
    const batchRequest = this.createBatchRequest(this.batch);
    this.batch = [];
    
    try {
      const response = await this.transport.send(batchRequest);
      return this.processBatchResponse(response, batchRequest);
    } catch (error) {
      throw this.handleBatchError(error, batchRequest);
    }
  }
}
```

## ✅ 验收标准

### 协议兼容性
- [ ] 100% 符合 JSON-RPC 2.0 规范
- [ ] 支持所有官方传输协议
- [ ] 正确处理协议版本协商
- [ ] 完整的心跳和连接保持机制

### 可靠性
- [ ] 消息丢失率 < 0.01%
- [ ] 自动重连机制完善
- [ ] 错误恢复成功率 > 99.9%

### 性能
- [ ] 消息处理延迟 < 10ms
- [ ] 连接建立时间 < 1s
- [ ] 内存使用优化

### 测试覆盖
- [ ] 单元测试覆盖率 > 95%
- [ ] 集成测试场景完整
- [ ] 压力测试通过

---

*基于 MCP 官方规范 2025-06-18 版本*  
*最后更新: 2025-01-01*