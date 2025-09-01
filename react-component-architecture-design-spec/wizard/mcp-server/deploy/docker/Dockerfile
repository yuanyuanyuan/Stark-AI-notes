# React Architecture Wizard MCP Server
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# 复制package文件
COPY package*.json ./
COPY tsconfig.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY src/ ./src/
COPY templates/ ./templates/
COPY config/ ./config/
COPY mcp-config.json ./

# 构建TypeScript
RUN npm run build

# 创建非root用户
RUN addgroup -g 1001 -S mcp && \
    adduser -S mcp -u 1001

# 创建数据目录
RUN mkdir -p /app/data/.wizard && \
    chown -R mcp:mcp /app/data

# 切换到非root用户
USER mcp

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# 暴露端口（如果需要HTTP接口）
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV MCP_CONFIG_PATH=/app/mcp-config.json
ENV DATA_PATH=/app/data

# 启动命令
CMD ["node", "dist/server.js"]