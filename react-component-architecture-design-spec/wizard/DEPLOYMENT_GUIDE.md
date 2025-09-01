# React架构向导 - 部署指导手册

**版本**: 1.0.0  
**更新日期**: 2025年1月6日  
**适用环境**: 生产环境和开发环境

## 📋 部署前检查清单

### 系统要求
- [x] Node.js >= 18.0.0
- [x] npm >= 8.0.0  
- [x] Git (最新版本)
- [x] 8GB+ 可用存储空间
- [x] 网络连接（用于依赖下载）

### 验证系统环境
```bash
# 检查Node.js版本
node --version  # 应显示 >= v18.0.0

# 检查npm版本  
npm --version   # 应显示 >= 8.0.0

# 检查可用内存
free -h         # Linux/Mac
systeminfo      # Windows
```

## 🚀 快速部署（推荐）

### 1. 克隆和安装
```bash
# 克隆项目
git clone <repository-url>
cd react-component-architecture-design-spec/wizard/mcp-server

# 安装依赖
npm install

# 验证安装
npm run test
```

### 2. 环境配置
```bash
# 创建环境配置文件
cp .env.example .env

# 编辑配置（可选）
nano .env
```

### 3. 部署验证
```bash
# 运行健康检查
npm run health-check

# 启动服务
npm start
```

## 🏗️ 多环境部署方案

### Claude Code 集成部署

#### 1. 安装MCP服务器
```bash
cd react-component-architecture-design-spec/wizard/mcp-server
npm install
npm run build
```

#### 2. 配置Claude Code
在Claude Code配置文件中添加：
```json
{
  "mcpServers": {
    "react-arch-wizard": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "./react-component-architecture-design-spec/wizard/mcp-server",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### 3. 验证集成
1. 重启Claude Code
2. 运行测试命令：`我想创建一个电商网站项目`
3. 确认向导启动

### Cursor IDE 集成部署

#### 1. 配置Cursor
将以下配置添加到Cursor设置：
```json
{
  "mcp.servers": {
    "react-arch-wizard": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "./react-component-architecture-design-spec/wizard/mcp-server",
      "autoStart": true,
      "contextAware": true,
      "fileWatcher": {
        "patterns": [
          "package.json",
          "tsconfig.json",
          "src/**/*.{ts,tsx,js,jsx}"
        ]
      }
    }
  }
}
```

#### 2. 启用功能
- 代码生成: ✅ 自动启用
- 文件操作: ✅ 自动启用  
- 项目管理: ✅ 自动启用
- 上下文感知: ✅ 自动启用

### Continue 插件集成

#### 1. 插件配置
在Continue配置文件中添加：
```json
{
  "providers": [
    {
      "name": "React Architecture Wizard",
      "description": "React架构设计向导",
      "version": "1.0.0",
      "provider": "mcp",
      "config": {
        "server": {
          "command": "node",
          "args": ["./dist/index.js"],
          "cwd": "./react-component-architecture-design-spec/wizard/mcp-server"
        },
        "features": {
          "conversation": true,
          "codeGeneration": false,
          "fileOperations": false
        }
      }
    }
  ]
}
```

### CLI 工具部署

#### 1. 全局安装
```bash
# 构建CLI包
cd deploy/cli
npm pack

# 全局安装
npm install -g react-arch-wizard-cli-1.0.0.tgz
```

#### 2. CLI使用方法
```bash
# 交互式创建项目
react-arch-wizard start my-project --interactive

# 批量创建（使用配置文件）
react-arch-wizard start my-saas --type saas --team-size 10 --batch

# 导出现有会话
react-arch-wizard export session-id ./output --include-tests

# 验证架构合规性  
react-arch-wizard validate session-id --spec ./custom-spec.yaml
```

## 🐳 Docker 容器化部署

### 1. 构建Docker镜像
```bash
# 构建镜像
docker build -t react-arch-wizard:1.0.0 .

# 验证镜像
docker images | grep react-arch-wizard
```

### 2. 运行容器
```bash
# 开发环境
docker run -d \
  --name react-arch-wizard-dev \
  -p 3000:3000 \
  -e NODE_ENV=development \
  react-arch-wizard:1.0.0

# 生产环境
docker run -d \
  --name react-arch-wizard-prod \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --restart=always \
  react-arch-wizard:1.0.0
```

### 3. Docker Compose 部署
```yaml
# docker-compose.yml
version: '3.8'

services:
  react-arch-wizard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - wizard-data:/app/.wizard
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  wizard-data:
```

```bash
# 启动服务栈
docker-compose up -d

# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## ⚙️ 配置管理

### 环境变量配置
```bash
# 生产环境配置
NODE_ENV=production
LOG_LEVEL=info
CACHE_TTL=3600000
MAX_CONCURRENT_SESSIONS=100
PERFORMANCE_MONITORING=true

# 开发环境配置
NODE_ENV=development  
LOG_LEVEL=debug
CACHE_TTL=300000
MAX_CONCURRENT_SESSIONS=10
PERFORMANCE_MONITORING=false
```

### 高级配置选项
```bash
# 外部工具配置
CONTEXT7_ENABLED=true
EXA_ENABLED=true
DEEPWIKI_ENABLED=true

# 缓存配置
CACHE_MAX_ENTRIES=1000
CACHE_PERSISTENT_PATH=.wizard/cache

# 性能监控配置
PERF_SLOW_THRESHOLD=2000
PERF_ALERT_MEMORY=100MB
PERF_METRICS_PATH=.wizard/metrics
```

## 📊 监控和维护

### 健康检查端点
```bash
# 基础健康检查
curl http://localhost:3000/health

# 详细状态检查
curl http://localhost:3000/status

# 性能指标
curl http://localhost:3000/metrics
```

### 日志管理
```bash
# 查看实时日志
tail -f .wizard/logs/wizard.log

# 按级别筛选日志
grep "ERROR" .wizard/logs/wizard.log

# 日志轮转配置
logrotate /etc/logrotate.d/react-arch-wizard
```

### 性能监控
```bash
# 检查系统资源使用
htop

# 监控进程状态
pm2 status react-arch-wizard

# 查看性能报告
curl http://localhost:3000/performance/report
```

## 🔧 故障排除

### 常见问题解决

#### 1. 端口占用问题
```bash
# 查找占用进程
lsof -i :3000

# 终止占用进程
kill -9 <PID>

# 使用其他端口
PORT=3001 npm start
```

#### 2. 依赖安装失败
```bash
# 清理npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 3. 权限问题
```bash
# 修改文件权限
chmod -R 755 .wizard/

# 检查用户权限
id -u nodejs
```

#### 4. 内存泄漏检查
```bash
# 使用Node.js检查器
node --inspect=0.0.0.0:9229 dist/index.js

# 使用htop监控内存使用
htop -p $(pgrep -f "react-arch-wizard")
```

### 日志分析
```bash
# 错误日志统计
grep -c "ERROR" .wizard/logs/wizard.log

# 性能慢查询
grep "SLOW" .wizard/logs/wizard.log

# 用户活动统计
grep "SESSION_CREATED" .wizard/logs/wizard.log | wc -l
```

## 📈 性能优化

### 生产环境优化配置
```bash
# 启用生产模式
NODE_ENV=production

# 优化内存使用
NODE_OPTIONS="--max-old-space-size=2048"

# 启用集群模式
PM2_INSTANCES=4
```

### 缓存优化
```bash
# Redis缓存配置（可选）
REDIS_URL=redis://localhost:6379
CACHE_BACKEND=redis

# 内存缓存优化
CACHE_MAX_MEMORY=512MB
CACHE_CLEANUP_INTERVAL=300000
```

## 🔄 更新和回滚

### 版本更新流程
```bash
# 1. 备份当前版本
cp -r current-version backup-$(date +%Y%m%d)

# 2. 拉取新版本
git pull origin main

# 3. 更新依赖
npm install

# 4. 运行测试
npm test

# 5. 重启服务
pm2 restart react-arch-wizard
```

### 紧急回滚
```bash
# 1. 停止当前服务
pm2 stop react-arch-wizard

# 2. 恢复备份版本
rm -rf current-version
mv backup-20250106 current-version

# 3. 重启服务
pm2 start current-version/ecosystem.config.js
```

## 📚 部署最佳实践

### 安全建议
1. **环境隔离** - 生产和开发环境完全分离
2. **访问控制** - 限制服务端口访问权限
3. **日志安全** - 避免记录敏感信息
4. **依赖审计** - 定期检查依赖包安全性

### 可靠性建议
1. **自动重启** - 使用PM2或systemd管理进程
2. **健康检查** - 配置定时健康检查
3. **备份策略** - 定期备份会话和配置数据
4. **监控告警** - 设置系统和应用级监控

### 性能建议
1. **负载均衡** - 多实例部署处理高并发
2. **缓存策略** - 合理配置缓存TTL
3. **资源限制** - 设置合理的内存和CPU限制
4. **数据清理** - 定期清理过期会话和缓存

---

## 🆘 技术支持

**遇到部署问题？**
1. 首先查看[故障排除](#-故障排除)部分
2. 检查[GitHub Issues](https://github.com/your-org/react-architecture-design-spec/issues)
3. 查看[开发者文档](docs/developer-guide.md)
4. 提交新的Issue描述问题

**部署成功标志**:
- ✅ 服务启动无错误
- ✅ 健康检查通过  
- ✅ 测试用例通过
- ✅ 日志输出正常
- ✅ 功能验证成功

祝您部署顺利！🚀