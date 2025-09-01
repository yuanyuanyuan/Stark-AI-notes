# 🚢 部署架构和CI/CD指南

> **从代码提交到生产部署的完整自动化流程**

## 📋 概述

本指南提供完整的部署架构设计和CI/CD流程实施方案，包括环境管理、自动化部署、灰度发布、回滚策略等，确保应用安全、快速、可靠地部署到生产环境。

## 🎯 核心原则

1. **自动化优先**: 减少人工介入，提高效率
2. **快速反馈**: 尽早发现问题，快速修复
3. **安全可靠**: 多重检查，确保质量
4. **可回滚性**: 问题发生时快速恢复
5. **可观测性**: 全程监控，问题可追踪

## 🏗️ CI/CD流水线设计

### 1. GitHub Actions完整配置

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop, release/*]
  pull_request:
    branches: [main, develop]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deploy environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - development
          - staging
          - production

env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8'

jobs:
  # 1. 代码质量检查
  code-quality:
    name: Code Quality Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # 获取完整历史用于分析

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint code
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

      - name: Check formatting
        run: pnpm format:check

      - name: Security audit
        run: pnpm audit

  # 2. 测试阶段
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    needs: code-quality
    strategy:
      matrix:
        test-suite: [unit, integration, e2e]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ${{ matrix.test-suite }} tests
        run: pnpm test:${{ matrix.test-suite }}

      - name: Upload coverage
        if: matrix.test-suite == 'unit'
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unit-tests

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.test-suite }}
          path: test-results/

  # 3. 构建阶段
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: test
    strategy:
      matrix:
        environment: [development, staging, production]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build for ${{ matrix.environment }}
        run: pnpm build:${{ matrix.environment }}
        env:
          REACT_APP_ENV: ${{ matrix.environment }}
          REACT_APP_API_URL: ${{ secrets[format('API_URL_{0}', matrix.environment)] }}
          REACT_APP_VERSION: ${{ github.sha }}

      - name: Optimize build
        run: |
          # 压缩静态资源
          find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) \
            -exec gzip -9 -k {} \;
          
          # 生成构建信息
          echo '{
            "version": "${{ github.sha }}",
            "buildTime": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
            "environment": "${{ matrix.environment }}"
          }' > dist/build-info.json

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-${{ matrix.environment }}
          path: dist/
          retention-days: 7

  # 4. Docker镜像构建
  docker:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/heads/release/')
    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-production
          path: dist/

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ secrets.REGISTRY_URL }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ secrets.REGISTRY_URL }}/myapp
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

  # 5. 部署到各环境
  deploy:
    name: Deploy to ${{ matrix.environment }}
    runs-on: ubuntu-latest
    needs: docker
    if: github.ref == 'refs/heads/main' || github.event_name == 'workflow_dispatch'
    strategy:
      matrix:
        environment: [staging, production]
    environment:
      name: ${{ matrix.environment }}
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'latest'

      - name: Configure kubectl
        run: |
          echo "${{ secrets[format('KUBE_CONFIG_{0}', matrix.environment)] }}" | base64 -d > kubeconfig
          export KUBECONFIG=$(pwd)/kubeconfig

      - name: Deploy to Kubernetes
        id: deploy
        run: |
          # 更新镜像
          kubectl set image deployment/app \
            app=${{ secrets.REGISTRY_URL }}/myapp:${{ github.sha }} \
            -n ${{ matrix.environment }}
          
          # 等待部署完成
          kubectl rollout status deployment/app -n ${{ matrix.environment }}
          
          # 获取部署URL
          URL=$(kubectl get ingress app -n ${{ matrix.environment }} -o jsonpath='{.spec.rules[0].host}')
          echo "url=https://$URL" >> $GITHUB_OUTPUT

      - name: Smoke test
        run: |
          # 等待应用启动
          sleep 30
          
          # 健康检查
          curl -f ${{ steps.deploy.outputs.url }}/health || exit 1
          
          # 版本验证
          VERSION=$(curl -s ${{ steps.deploy.outputs.url }}/api/version | jq -r '.version')
          if [ "$VERSION" != "${{ github.sha }}" ]; then
            echo "Version mismatch! Expected ${{ github.sha }}, got $VERSION"
            exit 1
          fi

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Deployment to ${{ matrix.environment }} ${{ job.status }}
            URL: ${{ steps.deploy.outputs.url }}
            Version: ${{ github.sha }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### 2. GitLab CI/CD配置

```yaml
# .gitlab-ci.yml
stages:
  - quality
  - test
  - build
  - deploy
  - release

variables:
  NODE_VERSION: "18"
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

# 缓存配置
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .pnpm-store/

# 质量检查
quality:lint:
  stage: quality
  image: node:${NODE_VERSION}
  script:
    - npm install -g pnpm
    - pnpm install --frozen-lockfile
    - pnpm lint
  only:
    - merge_requests
    - main
    - develop

quality:security:
  stage: quality
  image: node:${NODE_VERSION}
  script:
    - npm install -g pnpm
    - pnpm install --frozen-lockfile
    - pnpm audit
  allow_failure: true

# 测试阶段
test:unit:
  stage: test
  image: node:${NODE_VERSION}
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  script:
    - npm install -g pnpm
    - pnpm install --frozen-lockfile
    - pnpm test:unit --coverage
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
      junit: junit.xml

test:e2e:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  script:
    - npm install -g pnpm
    - pnpm install --frozen-lockfile
    - pnpm test:e2e
  artifacts:
    when: always
    paths:
      - playwright-report/
    expire_in: 1 week

# 构建阶段
build:app:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - npm install -g pnpm
    - pnpm install --frozen-lockfile
    - pnpm build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

build:docker:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest
  only:
    - main
    - tags

# 部署阶段
deploy:staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/app app=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -n staging
    - kubectl rollout status deployment/app -n staging
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - main

deploy:production:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/app app=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -n production
    - kubectl rollout status deployment/app -n production
  environment:
    name: production
    url: https://example.com
  when: manual
  only:
    - tags
```

## 🐳 容器化部署

### 1. 多阶段Dockerfile

```dockerfile
# Dockerfile
# 阶段1: 依赖安装
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制包管理文件
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 阶段2: 构建应用
FROM node:18-alpine AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用
ARG BUILD_ENV=production
ENV NODE_ENV=production
RUN npm run build:${BUILD_ENV}

# 阶段3: 生产镜像
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# 安装必要工具
RUN apk add --no-cache curl

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/dist .

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# 非root用户运行
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /usr/share/nginx/html

USER nextjs

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Kubernetes部署配置

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  namespace: production
  labels:
    app: myapp
    version: v1
spec:
  replicas: 3
  revisionHistoryLimit: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - myapp
              topologyKey: kubernetes.io/hostname
      containers:
      - name: app
        image: registry.example.com/myapp:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 80
          name: http
        - containerPort: 9090
          name: metrics
        env:
        - name: NODE_ENV
          value: "production"
        - name: API_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: api-url
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
      volumes:
      - name: config
        configMap:
          name: app-config
      imagePullSecrets:
      - name: registry-secret

---
apiVersion: v1
kind: Service
metadata:
  name: app
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
    name: http
  - port: 9090
    targetPort: 9090
    protocol: TCP
    name: metrics

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app
  namespace: production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - example.com
    secretName: app-tls
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app
            port:
              number: 80

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 🔄 灰度发布和回滚

### 1. 蓝绿部署

```yaml
# scripts/blue-green-deploy.sh
#!/bin/bash

set -e

# 配置
NAMESPACE="production"
APP_NAME="myapp"
NEW_VERSION=$1
OLD_VERSION=$(kubectl get deployment ${APP_NAME}-blue -n ${NAMESPACE} -o jsonpath='{.spec.template.spec.containers[0].image}' | cut -d: -f2)

echo "Starting blue-green deployment"
echo "Old version: ${OLD_VERSION}"
echo "New version: ${NEW_VERSION}"

# 1. 部署到green环境
echo "Deploying to green environment..."
kubectl set image deployment/${APP_NAME}-green \
  app=registry.example.com/${APP_NAME}:${NEW_VERSION} \
  -n ${NAMESPACE}

# 2. 等待green环境就绪
echo "Waiting for green deployment to be ready..."
kubectl rollout status deployment/${APP_NAME}-green -n ${NAMESPACE}

# 3. 运行smoke测试
echo "Running smoke tests..."
./scripts/smoke-test.sh green

# 4. 切换流量到green
echo "Switching traffic to green..."
kubectl patch service ${APP_NAME} \
  -p '{"spec":{"selector":{"version":"green"}}}' \
  -n ${NAMESPACE}

# 5. 监控错误率
echo "Monitoring for errors (30 seconds)..."
sleep 30

ERROR_RATE=$(curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~'5..'}[1m])" | jq '.data.result[0].value[1]' | bc)

if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
  echo "High error rate detected! Rolling back..."
  kubectl patch service ${APP_NAME} \
    -p '{"spec":{"selector":{"version":"blue"}}}' \
    -n ${NAMESPACE}
  exit 1
fi

# 6. 更新blue环境（为下次部署准备）
echo "Updating blue environment for next deployment..."
kubectl set image deployment/${APP_NAME}-blue \
  app=registry.example.com/${APP_NAME}:${NEW_VERSION} \
  -n ${NAMESPACE}

echo "Blue-green deployment completed successfully!"
```

### 2. 金丝雀发布

```yaml
# k8s/canary-deployment.yaml
apiVersion: v1
kind: Service
metadata:
  name: app-canary
spec:
  selector:
    app: myapp
    version: canary
  ports:
  - port: 80
    targetPort: 80

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10" # 10%流量
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-canary
            port:
              number: 80
```

### 3. 自动回滚策略

```typescript
// rollback/auto-rollback.ts
export class AutoRollback {
  private metrics: MetricsCollector;
  private deployment: DeploymentManager;

  async monitorDeployment(deploymentId: string): Promise<void> {
    const baseline = await this.metrics.getBaseline();
    const thresholds = {
      errorRate: baseline.errorRate * 1.5, // 错误率增加50%
      responseTime: baseline.responseTime * 2, // 响应时间翻倍
      availability: 0.995, // 可用性低于99.5%
    };

    // 持续监控
    const interval = setInterval(async () => {
      const current = await this.metrics.getCurrent();
      
      if (this.shouldRollback(current, thresholds)) {
        clearInterval(interval);
        await this.performRollback(deploymentId);
      }
    }, 10000); // 每10秒检查一次

    // 30分钟后停止监控
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  }

  private shouldRollback(current: Metrics, thresholds: Thresholds): boolean {
    return (
      current.errorRate > thresholds.errorRate ||
      current.responseTime > thresholds.responseTime ||
      current.availability < thresholds.availability
    );
  }

  private async performRollback(deploymentId: string): Promise<void> {
    console.log(`Triggering automatic rollback for deployment ${deploymentId}`);
    
    // 1. 获取上一个稳定版本
    const previousVersion = await this.deployment.getPreviousStableVersion();
    
    // 2. 执行回滚
    await this.deployment.rollback(previousVersion);
    
    // 3. 发送告警
    await this.notifyTeam({
      type: 'ROLLBACK',
      deploymentId,
      reason: 'Automatic rollback due to degraded metrics',
      previousVersion,
    });
  }
}
```

## 📊 环境管理

### 1. 多环境配置

```typescript
// config/environment.config.ts
export interface EnvironmentConfig {
  name: string;
  apiUrl: string;
  cdnUrl: string;
  features: FeatureFlags;
  monitoring: MonitoringConfig;
}

const configs: Record<string, EnvironmentConfig> = {
  development: {
    name: 'Development',
    apiUrl: 'http://localhost:3000',
    cdnUrl: 'http://localhost:8080',
    features: {
      newFeature: true,
      experimentalApi: true,
      debugMode: true,
    },
    monitoring: {
      enabled: false,
      sampleRate: 1.0,
    },
  },
  
  staging: {
    name: 'Staging',
    apiUrl: 'https://api-staging.example.com',
    cdnUrl: 'https://cdn-staging.example.com',
    features: {
      newFeature: true,
      experimentalApi: false,
      debugMode: false,
    },
    monitoring: {
      enabled: true,
      sampleRate: 0.1,
    },
  },
  
  production: {
    name: 'Production',
    apiUrl: 'https://api.example.com',
    cdnUrl: 'https://cdn.example.com',
    features: {
      newFeature: false,
      experimentalApi: false,
      debugMode: false,
    },
    monitoring: {
      enabled: true,
      sampleRate: 0.01,
    },
  },
};

export function getConfig(): EnvironmentConfig {
  const env = process.env.REACT_APP_ENV || 'development';
  return configs[env] || configs.development;
}
```

### 2. 特性开关管理

```typescript
// features/feature-flags.ts
export class FeatureFlags {
  private flags: Map<string, boolean> = new Map();
  private remoteFlags: Map<string, boolean> = new Map();

  async initialize(): Promise<void> {
    // 加载远程特性开关
    try {
      const response = await fetch('/api/feature-flags');
      const flags = await response.json();
      
      Object.entries(flags).forEach(([key, value]) => {
        this.remoteFlags.set(key, value as boolean);
      });
    } catch (error) {
      console.error('Failed to load remote feature flags:', error);
    }
  }

  isEnabled(feature: string): boolean {
    // 优先使用远程配置
    if (this.remoteFlags.has(feature)) {
      return this.remoteFlags.get(feature)!;
    }
    
    // 降级到本地配置
    return this.flags.get(feature) || false;
  }

  // React Hook
  useFeature(feature: string): boolean {
    const [enabled, setEnabled] = useState(false);
    
    useEffect(() => {
      setEnabled(this.isEnabled(feature));
      
      // 监听远程更新
      const unsubscribe = this.subscribe(feature, setEnabled);
      return unsubscribe;
    }, [feature]);
    
    return enabled;
  }
}

// 使用示例
function MyComponent() {
  const newFeatureEnabled = featureFlags.useFeature('newFeature');
  
  return (
    <div>
      {newFeatureEnabled && <NewFeature />}
    </div>
  );
}
```

## 🎯 部署检查清单

### 部署前检查
- [ ] 所有测试通过
- [ ] 代码审查完成
- [ ] 安全扫描通过
- [ ] 性能基准测试
- [ ] 文档更新
- [ ] 数据库迁移准备

### 部署中监控
- [ ] 健康检查正常
- [ ] 错误率监控
- [ ] 响应时间监控
- [ ] 资源使用监控
- [ ] 日志实时查看
- [ ] 告警系统就绪

### 部署后验证
- [ ] Smoke测试通过
- [ ] 关键功能验证
- [ ] 性能指标正常
- [ ] 用户反馈收集
- [ ] 回滚计划就绪
- [ ] 文档发布

---

**记住：自动化部署是提升开发效率和可靠性的关键！** 🚀