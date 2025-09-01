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

## ☁️ 多云平台CI/CD支持

### 1. AWS CodePipeline配置

```yaml
# aws/buildspec.yml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Installing dependencies...
      - npm install -g pnpm
      - pnpm install --frozen-lockfile
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      
  build:
    commands:
      - echo Build started on `date`
      - echo Running tests...
      - pnpm test:unit
      - pnpm test:integration
      - echo Building the application...
      - pnpm build
      - echo Building Docker image...
      - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
      
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing Docker image...
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"app","imageUri":"%s"}]' $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
    - dist/**/*
    - k8s/**/*

cache:
  paths:
    - node_modules/**/*
    - .pnpm-store/**/*
```

#### AWS ECS部署配置

```json
// aws/task-definition.json
{
  "family": "app-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/myapp:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account-id:secret:api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/app",
          "awslogs-region": "${AWS_DEFAULT_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### AWS CDK部署脚本

```typescript
// aws/cdk-deploy.ts
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

export class AppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ECR仓库
    const repository = new ecr.Repository(this, 'AppRepository', {
      repositoryName: 'myapp',
      lifecycleRules: [{
        maxImageCount: 10,
      }],
    });

    // ECS集群
    const cluster = new ecs.Cluster(this, 'AppCluster', {
      clusterName: 'app-cluster',
      containerInsights: true,
    });

    // Fargate服务
    const fargateService = new ecs.FargateService(this, 'AppService', {
      cluster,
      taskDefinition: new ecs.FargateTaskDefinition(this, 'AppTaskDef', {
        memoryLimitMiB: 1024,
        cpu: 512,
      }),
      desiredCount: 3,
      assignPublicIp: true,
    });

    // 应用负载均衡器
    const alb = new elbv2.ApplicationLoadBalancer(this, 'AppALB', {
      vpc: cluster.vpc,
      internetFacing: true,
    });

    const listener = alb.addListener('AppListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    listener.addTargets('AppTargets', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [fargateService],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
      },
    });

    // 自动扩展
    const scaling = fargateService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
    });

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'AppPipeline', {
      pipelineName: 'app-pipeline',
    });

    // 构建项目
    const buildProject = new codebuild.PipelineProject(this, 'AppBuild', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true,
      },
      environmentVariables: {
        AWS_ACCOUNT_ID: { value: cdk.Aws.ACCOUNT_ID },
        AWS_DEFAULT_REGION: { value: cdk.Aws.REGION },
        IMAGE_REPO_NAME: { value: repository.repositoryName },
        IMAGE_TAG: { value: 'latest' },
      },
    });

    // 添加ECR权限
    repository.grantPullPush(buildProject);
  }
}
```

### 2. Azure DevOps Pipeline配置

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
      - develop
      - release/*

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: app-variables
  - name: dockerRegistryServiceConnection
    value: 'acr-connection'
  - name: imageRepository
    value: 'myapp'
  - name: containerRegistry
    value: 'myregistry.azurecr.io'
  - name: dockerfilePath
    value: '$(Build.SourcesDirectory)/Dockerfile'
  - name: tag
    value: '$(Build.BuildId)'

stages:
  - stage: Build
    displayName: 'Build and Test'
    jobs:
      - job: Build
        displayName: 'Build Job'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '18.x'
            displayName: 'Install Node.js'

          - script: |
              npm install -g pnpm
              pnpm install --frozen-lockfile
            displayName: 'Install dependencies'

          - script: pnpm lint
            displayName: 'Lint code'

          - script: pnpm test:unit --coverage
            displayName: 'Run unit tests'

          - task: PublishTestResults@2
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: '**/test-results.xml'
            displayName: 'Publish test results'

          - task: PublishCodeCoverageResults@1
            inputs:
              codeCoverageTool: 'Cobertura'
              summaryFileLocation: '$(System.DefaultWorkingDirectory)/**/*coverage.xml'
            displayName: 'Publish code coverage'

          - script: pnpm build
            displayName: 'Build application'

          - task: Docker@2
            inputs:
              containerRegistry: '$(dockerRegistryServiceConnection)'
              repository: '$(imageRepository)'
              command: 'buildAndPush'
              Dockerfile: '$(dockerfilePath)'
              tags: |
                $(tag)
                latest
            displayName: 'Build and push Docker image'

  - stage: DeployStaging
    displayName: 'Deploy to Staging'
    dependsOn: Build
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployToStaging
        displayName: 'Deploy to AKS Staging'
        environment: 'staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: KubernetesManifest@0
                  inputs:
                    action: 'deploy'
                    kubernetesServiceConnection: 'aks-staging'
                    namespace: 'staging'
                    manifests: |
                      $(Pipeline.Workspace)/k8s/deployment.yaml
                      $(Pipeline.Workspace)/k8s/service.yaml
                    containers: |
                      $(containerRegistry)/$(imageRepository):$(tag)

  - stage: DeployProduction
    displayName: 'Deploy to Production'
    dependsOn: DeployStaging
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployToProduction
        displayName: 'Deploy to AKS Production'
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: KubernetesManifest@0
                  inputs:
                    action: 'deploy'
                    kubernetesServiceConnection: 'aks-production'
                    namespace: 'production'
                    manifests: |
                      $(Pipeline.Workspace)/k8s/deployment.yaml
                      $(Pipeline.Workspace)/k8s/service.yaml
                    containers: |
                      $(containerRegistry)/$(imageRepository):$(tag)
                    strategy: 'canary'
                    percentage: 25
```

#### Azure Bicep部署模板

```bicep
// azure/main.bicep
param location string = resourceGroup().location
param appName string = 'myapp'
param environment string = 'production'

// Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2021-09-01' = {
  name: '${appName}registry'
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    adminUserEnabled: true
  }
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: '${appName}-plan-${environment}'
  location: location
  kind: 'linux'
  sku: {
    name: 'P1v2'
    tier: 'Premium'
    size: 'P1v2'
    family: 'Pv2'
    capacity: 3
  }
  properties: {
    reserved: true
  }
}

// Web App for Containers
resource webApp 'Microsoft.Web/sites@2021-02-01' = {
  name: '${appName}-${environment}'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerRegistry.name}.azurecr.io/${appName}:latest'
      alwaysOn: true
      minTlsVersion: '1.2'
      http20Enabled: true
      healthCheckPath: '/health'
    }
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-insights-${environment}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Request_Source: 'rest'
  }
}

// Auto Scaling
resource autoScale 'Microsoft.Insights/autoscalesettings@2021-05-01-preview' = {
  name: '${appName}-autoscale'
  location: location
  properties: {
    targetResourceUri: appServicePlan.id
    enabled: true
    profiles: [
      {
        name: 'Auto scale condition'
        capacity: {
          minimum: '2'
          maximum: '10'
          default: '3'
        }
        rules: [
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlan.id
              operator: 'GreaterThan'
              statistic: 'Average'
              threshold: 70
              timeAggregation: 'Average'
              timeGrain: 'PT1M'
              timeWindow: 'PT5M'
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT5M'
            }
          }
        ]
      }
    ]
  }
}
```

### 3. Google Cloud Build配置

```yaml
# cloudbuild.yaml
steps:
  # 安装依赖
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['install', '-g', 'pnpm']
    id: 'install-pnpm'

  - name: 'node:18'
    entrypoint: 'pnpm'
    args: ['install', '--frozen-lockfile']
    id: 'install-deps'
    waitFor: ['install-pnpm']

  # 运行测试
  - name: 'node:18'
    entrypoint: 'pnpm'
    args: ['test:unit']
    id: 'unit-tests'
    waitFor: ['install-deps']

  - name: 'node:18'
    entrypoint: 'pnpm'
    args: ['test:integration']
    id: 'integration-tests'
    waitFor: ['install-deps']

  # 构建应用
  - name: 'node:18'
    entrypoint: 'pnpm'
    args: ['build']
    env:
      - 'NODE_ENV=production'
    id: 'build-app'
    waitFor: ['unit-tests', 'integration-tests']

  # 构建Docker镜像
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '-t', 'gcr.io/$PROJECT_ID/myapp:$COMMIT_SHA',
      '-t', 'gcr.io/$PROJECT_ID/myapp:latest',
      '.'
    ]
    id: 'build-image'
    waitFor: ['build-app']

  # 推送到Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '--all-tags', 'gcr.io/$PROJECT_ID/myapp']
    id: 'push-image'
    waitFor: ['build-image']

  # 部署到Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args: [
      'run', 'deploy', 'myapp',
      '--image', 'gcr.io/$PROJECT_ID/myapp:$COMMIT_SHA',
      '--region', 'us-central1',
      '--platform', 'managed',
      '--allow-unauthenticated',
      '--min-instances', '2',
      '--max-instances', '10',
      '--cpu', '2',
      '--memory', '2Gi',
      '--port', '80'
    ]
    id: 'deploy-cloud-run'
    waitFor: ['push-image']

  # 部署到GKE
  - name: 'gcr.io/cloud-builders/kubectl'
    args: [
      'set', 'image',
      'deployment/app',
      'app=gcr.io/$PROJECT_ID/myapp:$COMMIT_SHA',
      '-n', 'production'
    ]
    env:
      - 'CLOUDSDK_COMPUTE_ZONE=us-central1-a'
      - 'CLOUDSDK_CONTAINER_CLUSTER=app-cluster'
    id: 'deploy-gke'
    waitFor: ['push-image']

# 构建配置
options:
  machineType: 'E2_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY
  
timeout: '1200s'

# 构建触发器
trigger:
  branch:
    name: '^main$'
  included_files:
    - 'src/**'
    - 'package.json'
    - 'Dockerfile'
```

#### GCP Terraform配置

```hcl
# gcp/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud Run服务
resource "google_cloud_run_service" "app" {
  name     = "myapp"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/myapp:latest"
        
        resources {
          limits = {
            cpu    = "2000m"
            memory = "2Gi"
          }
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        ports {
          container_port = 80
        }
      }

      service_account_name = google_service_account.app.email
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "2"
        "autoscaling.knative.dev/maxScale" = "100"
        "run.googleapis.com/cpu-throttling" = "false"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# GKE集群
resource "google_container_cluster" "app_cluster" {
  name     = "app-cluster"
  location = var.region

  initial_node_count = 3

  node_config {
    machine_type = "e2-standard-4"
    
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }

  # 自动扩展
  cluster_autoscaling {
    enabled = true
    
    resource_limits {
      resource_type = "cpu"
      minimum       = 4
      maximum       = 32
    }
    
    resource_limits {
      resource_type = "memory"
      minimum       = 16
      maximum       = 128
    }
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
}

# Cloud Load Balancing
resource "google_compute_global_address" "app_ip" {
  name = "app-ip"
}

resource "google_compute_global_forwarding_rule" "app_forwarding" {
  name       = "app-forwarding-rule"
  target     = google_compute_target_https_proxy.app_proxy.id
  port_range = "443"
  ip_address = google_compute_global_address.app_ip.address
}

# Cloud CDN
resource "google_compute_backend_service" "app_backend" {
  name = "app-backend"
  
  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl     = 86400
  }
  
  health_checks = [google_compute_health_check.app_health.id]
}
```

### 4. 阿里云DevOps配置

```yaml
# aliyun/pipeline.yml
version: '1.0'
name: app-pipeline

# 触发器
triggers:
  - type: push
    branches:
      - main
      - develop
      - release/*

# 环境变量
env:
  REGION: cn-shanghai
  REGISTRY: registry.cn-shanghai.aliyuncs.com
  NAMESPACE: myapp
  IMAGE_NAME: app

# 阶段定义
stages:
  - name: build
    jobs:
      - name: build-and-test
        runs-on: ubuntu-latest
        steps:
          - name: 检出代码
            uses: checkout@v1
            
          - name: 设置Node环境
            uses: setup-node@v1
            with:
              node-version: 18
              
          - name: 安装依赖
            run: |
              npm install -g pnpm
              pnpm install --frozen-lockfile
              
          - name: 代码检查
            run: |
              pnpm lint
              pnpm type-check
              
          - name: 运行测试
            run: |
              pnpm test:unit --coverage
              pnpm test:integration
              
          - name: 构建应用
            run: pnpm build
            env:
              NODE_ENV: production
              
          - name: 构建镜像
            run: |
              docker build -t $REGISTRY/$NAMESPACE/$IMAGE_NAME:$CI_COMMIT_SHA .
              docker tag $REGISTRY/$NAMESPACE/$IMAGE_NAME:$CI_COMMIT_SHA $REGISTRY/$NAMESPACE/$IMAGE_NAME:latest
              
          - name: 推送镜像
            run: |
              echo $REGISTRY_PASSWORD | docker login $REGISTRY -u $REGISTRY_USERNAME --password-stdin
              docker push $REGISTRY/$NAMESPACE/$IMAGE_NAME:$CI_COMMIT_SHA
              docker push $REGISTRY/$NAMESPACE/$IMAGE_NAME:latest

  - name: deploy-staging
    jobs:
      - name: deploy-to-ack
        runs-on: ubuntu-latest
        needs: [build]
        if: branch == 'main'
        steps:
          - name: 配置kubectl
            run: |
              echo "$KUBE_CONFIG" | base64 -d > kubeconfig
              export KUBECONFIG=$(pwd)/kubeconfig
              
          - name: 部署到ACK
            run: |
              kubectl set image deployment/app app=$REGISTRY/$NAMESPACE/$IMAGE_NAME:$CI_COMMIT_SHA -n staging
              kubectl rollout status deployment/app -n staging
              
          - name: 健康检查
            run: |
              sleep 30
              curl -f https://staging.example.com/health || exit 1

  - name: deploy-production
    jobs:
      - name: deploy-to-production
        runs-on: ubuntu-latest
        needs: [deploy-staging]
        if: branch == 'main'
        when: manual
        steps:
          - name: 蓝绿部署
            run: |
              ./scripts/blue-green-deploy.sh $CI_COMMIT_SHA
```

#### 阿里云Serverless应用配置

```yaml
# aliyun/serverless.yml
edition: 1.0.0
name: myapp
access: default

services:
  # 函数计算配置
  app-api:
    component: fc
    props:
      region: cn-shanghai
      service:
        name: app-service
        description: 'Application API Service'
      function:
        name: app-function
        runtime: nodejs18
        codeUri: ./dist
        handler: index.handler
        memorySize: 1024
        timeout: 60
        environment:
          NODE_ENV: production
        
  # API网关配置  
  app-gateway:
    component: apigateway
    props:
      region: cn-shanghai
      apis:
        - name: app-api
          description: 'Application API'
          requestConfig:
            path: /*
            method: ANY
          serviceConfig:
            servicePath: /*
            serviceHttpMethod: ANY
            serviceAddress: http://${services.app-api.props.function.name}.${services.app-api.props.region}.fc.aliyuncs.com
            
  # 对象存储配置
  app-storage:
    component: oss
    props:
      region: cn-shanghai
      bucket: myapp-assets
      acl: public-read
      website:
        index: index.html
        error: error.html
```

#### 阿里云Terraform配置

```hcl
# aliyun/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    alicloud = {
      source  = "aliyun/alicloud"
      version = "~> 1.200"
    }
  }
}

provider "alicloud" {
  region = var.region
}

# ACK托管集群
resource "alicloud_cs_managed_kubernetes" "app_cluster" {
  name               = "app-cluster"
  cluster_spec       = "ack.pro.small"
  version            = "1.24.6-aliyun.1"
  pod_vswitch_ids    = [alicloud_vswitch.app_vswitch.id]
  service_cidr       = "172.16.0.0/16"
  
  addons {
    name = "nginx-ingress-controller"
  }
  
  addons {
    name = "metrics-server"
  }
}

# ECS实例组
resource "alicloud_ess_scaling_group" "app_scaling" {
  min_size           = 2
  max_size           = 10
  scaling_group_name = "app-scaling-group"
  vswitch_ids        = [alicloud_vswitch.app_vswitch.id]
  
  multi_az_policy = "BALANCE"
  
  lifecycle {
    ignore_changes = [min_size, max_size]
  }
}

# SLB负载均衡
resource "alicloud_slb_load_balancer" "app_slb" {
  load_balancer_name = "app-slb"
  address_type       = "internet"
  load_balancer_spec = "slb.s2.small"
  vswitch_id         = alicloud_vswitch.app_vswitch.id
}

# CDN加速
resource "alicloud_cdn_domain_new" "app_cdn" {
  domain_name = "cdn.example.com"
  cdn_type    = "web"
  scope       = "domestic"
  
  sources {
    content  = alicloud_slb_load_balancer.app_slb.address
    type     = "ipaddr"
    priority = 20
    port     = 80
  }
  
  certificate_config {
    server_certificate = var.ssl_certificate
    private_key        = var.ssl_private_key
  }
}

# RDS数据库
resource "alicloud_db_instance" "app_db" {
  engine               = "MySQL"
  engine_version       = "8.0"
  instance_type        = "mysql.n2.medium.2c"
  instance_storage     = 100
  instance_charge_type = "Postpaid"
  
  security_ips = [alicloud_vswitch.app_vswitch.cidr_block]
  
  parameters {
    name  = "max_connections"
    value = "1000"
  }
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

### 多云平台部署检查
- [ ] AWS: ECR镜像推送成功，ECS/EKS部署正常
- [ ] Azure: ACR镜像推送成功，AKS部署正常
- [ ] GCP: GCR镜像推送成功，Cloud Run/GKE部署正常
- [ ] 阿里云: ACR镜像推送成功，ACK/SAE部署正常
- [ ] 跨云负载均衡配置
- [ ] 多云监控集成

---

**记住：自动化部署是提升开发效率和可靠性的关键！** 🚀