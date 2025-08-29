## 📋 文件摘要

本文档是DevOps专业领域的资源中心，包含CI/CD流水线、容器化技术、监控告警、云原生架构等完整的DevOps实践体系。覆盖从基础设施即代码到自动化部署，从监控运维到安全防护，从传统运维到云原生技术的全方位DevOps资源。

## 📑 目录索引

- [📋 文件摘要](#-文件摘要)
- [🎯 DevOps核心领域](#devops核心领域)
- [🔄 CI/CD流水线](#cicd流水线)
- [🐳 容器化技术](#容器化技术)
- [📊 监控告警](#监控告警)
- [☁️ 云原生架构](#云原生架构)
- [🔧 基础设施即代码](#基础设施即代码)
- [🔒 DevSecOps实践](#devsecops实践)
- [🚀 部署策略](#部署策略)
- [📈 性能优化](#性能优化)
- [🎯 学习路径建议](#学习路径建议)

---

## 🎯 DevOps核心领域

### 📊 DevOps技术栈覆盖

| 技术类别 | 主要技术 | 资源类型 | 难度级别 |
|----------|----------|----------|----------|
| **CI/CD** | GitHub Actions, Jenkins, GitLab CI | 流水线模板、最佳实践 | 中级 |
| **容器化** | Docker, Kubernetes, Podman | 容器配置、编排方案 | 高级 |
| **监控** | Prometheus, Grafana, ELK Stack | 监控配置、告警策略 | 高级 |
| **云原生** | AWS, Azure, GCP, Serverless | 云架构、部署方案 | 高级 |
| **IaC** | Terraform, Ansible, CloudFormation | 基础设施代码、配置管理 | 中级 |
| **安全** | OWASP, 安全扫描, 合规检查 | 安全策略、防护方案 | 高级 |

### 🔥 热门DevOps专题

#### CI/CD自动化
- **GitHub Actions**：现代化的CI/CD流水线
- **Jenkins流水线**：企业级持续集成
- **GitLab CI/CD**：一体化DevOps平台
- **Argo CD**：GitOps持续部署

#### 容器化与编排
- **Docker容器化**：应用容器化最佳实践
- **Kubernetes编排**：容器集群管理
- **服务网格**：Istio, Linkerd服务治理
- **容器安全**：容器安全策略和最佳实践

#### 监控与可观测性
- **指标监控**：Prometheus + Grafana
- **日志管理**：ELK Stack, Loki
- **分布式追踪**：Jaeger, Zipkin
- **APM监控**：应用性能监控

---

## 🔄 CI/CD流水线

### 🎯 GitHub Actions实战

#### 基础工作流配置
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18.x'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm run test
      env:
        CI: true
    
    - name: Generate coverage
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  security:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Run security audit
      run: npm audit --audit-level moderate
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
        command: test

  deploy:
    needs: [build, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # 部署脚本
        curl -X POST "${{ secrets.DEPLOY_WEBHOOK }}" \
          -H "Content-Type: application/json" \
          -d '{"action": "deploy", "image": "${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest"}'
```

#### 多环境部署策略
```yaml
# .github/workflows/deploy.yml
name: Multi-Environment Deployment

on:
  workflow_run:
    workflows: ["CI/CD Pipeline"]
    types:
      - completed
    branches: [main]

jobs:
  deploy-staging:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
    - name: Download build artifacts
      uses: actions/github-script@v7
      with:
        script: |
          const artifacts = await github.rest.actions.listWorkflowRunArtifacts({
            owner: context.repo.owner,
            repo: context.repo.repo,
            run_id: ${{ github.event.workflow_run.id }}
          });
          
          const matchArtifact = artifacts.data.artifacts.find((artifact) => {
            return artifact.name === "build-artifacts"
          });
          
          const download = await github.rest.actions.downloadArtifact({
            owner: context.repo.owner,
            repo: context.repo.repo,
            artifact_id: matchArtifact.id,
            archive_format: 'zip'
          });
          
          const fs = require('fs');
          fs.writeFileSync(`${process.env.GITHUB_WORKSPACE}/build-artifacts.zip`, Buffer.from(download.data));
    
    - name: Extract artifacts
      run: unzip build-artifacts.zip -d ./dist
    
    - name: Deploy to staging
      run: |
        # 部署到预发布环境
        kubectl set image deployment/myapp \
          myapp=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
          -n staging
        kubectl rollout status deployment/myapp -n staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    
    steps:
    - name: Approval check
      run: echo "Waiting for manual approval..."
    
    - name: Deploy to production
      run: |
        # 健康检查
        curl -f https://staging.example.com/health || exit 1
        
        # 部署到生产环境
        kubectl set image deployment/myapp \
          myapp=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
          -n production
        kubectl rollout status deployment/myapp -n production
        
        # 验证部署
        curl -f https://api.example.com/health || exit 1
```

### 🎯 Jenkins流水线配置

#### Jenkinsfile示例
```groovy
// Jenkinsfile
pipeline {
    agent any
    environment {
        NODE_VERSION = '18'
        DOCKER_REGISTRY = 'registry.example.com'
        APP_NAME = 'myapp'
    }
    
    options {
        timeout(time: 1, unit: 'HOURS')
        retry(3)
        disableConcurrentBuilds()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup Environment') {
            steps {
                sh 'node --version'
                sh 'npm --version'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                    }
                }
                
                stage('Security Scan') {
                    steps {
                        sh 'npm audit --audit-level moderate'
                    }
                }
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm run test'
                sh 'npm run test:coverage'
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    def image = docker.build("${env.APP_NAME}:${env.BUILD_ID}")
                    docker.withRegistry("https://${env.DOCKER_REGISTRY}", 'docker-registry-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    kubectl set image deployment/${env.APP_NAME} \
                    ${env.APP_NAME}=${env.DOCKER_REGISTRY}/${env.APP_NAME}:${env.BUILD_ID} \
                    -n staging
                    kubectl rollout status deployment/${env.APP_NAME} -n staging
                '''
            }
        }
        
        stage('Integration Tests') {
            when {
                branch 'main'
            }
            steps {
                sh 'npm run test:integration'
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            input {
                message "Deploy to Production?"
                ok "Yes, deploy"
            }
            steps {
                sh '''
                    kubectl set image deployment/${env.APP_NAME} \
                    ${env.APP_NAME}=${env.DOCKER_REGISTRY}/${env.APP_NAME}:${env.BUILD_ID} \
                    -n production
                    kubectl rollout status deployment/${env.APP_NAME} -n production
                '''
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        
        success {
            emailext (
                subject: "Build Success: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: """
                    <p>Build successful!</p>
                    <p>Job: ${env.JOB_NAME}</p>
                    <p>Build Number: ${env.BUILD_NUMBER}</p>
                    <p>Build URL: ${env.BUILD_URL}</p>
                """,
                to: "${env.CHANGE_AUTHOR_EMAIL}, dev-team@example.com"
            )
        }
        
        failure {
            emailext (
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: """
                    <p>Build failed!</p>
                    <p>Job: ${env.JOB_NAME}</p>
                    <p>Build Number: ${env.BUILD_NUMBER}</p>
                    <p>Build URL: ${env.BUILD_URL}</p>
                """,
                to: "${env.CHANGE_AUTHOR_EMAIL}, dev-team@example.com"
            )
        }
    }
}
```

---

## 🐳 容器化技术

### 🎯 Docker容器化最佳实践

#### Dockerfile优化
```dockerfile
# 多阶段构建
FROM node:18-alpine AS builder
WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产镜像
FROM node:18-alpine AS production
WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 切换用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "server.js"]
```

#### Docker Compose配置
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - app-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

#### Kubernetes部署配置
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
        version: v1
    spec:
      containers:
      - name: myapp
        image: registry.example.com/myapp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: myapp-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: myapp-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
      volumes:
      - name: config-volume
        configMap:
          name: myapp-config
---
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - myapp.example.com
    secretName: myapp-tls
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp-service
            port:
              number: 80
```

---

## 📊 监控告警

### 🎯 Prometheus + Grafana监控栈

#### Prometheus配置
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'myapp'
    static_configs:
      - targets: ['myapp-service:80']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
```

#### 告警规则配置
```yaml
# alert_rules.yml
groups:
  - name: myapp-alerts
    rules:
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value }} errors per second"

    - alert: HighMemoryUsage
      expr: (container_memory_usage_bytes{container="myapp"} / container_spec_memory_limit_bytes{container="myapp"}) * 100 > 80
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage"
        description: "Memory usage is above 80%"

    - alert: ServiceDown
      expr: up{job="myapp"} == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "Service is down"
        description: "Service {{ $labels.instance }} is down"

    - alert: HighResponseTime
      expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High response time"
        description: "95th percentile response time is above 1 second"
```

#### Grafana仪表板配置
```json
{
  "dashboard": {
    "id": null,
    "title": "MyApp Monitoring",
    "tags": ["myapp", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "HTTP Requests",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{ method }} {{ status }}"
          }
        ],
        "yaxes": [
          {
            "label": "Requests per second"
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "yaxes": [
          {
            "label": "Seconds"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "Error rate"
          }
        ],
        "thresholds": "0.1,0.5",
        "colors": ["#299c46", "#rgba(237, 129, 40, 0.89)", "#d44a3a"]
      },
      {
        "id": 4,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "container_memory_usage_bytes{container=\"myapp\"}",
            "legendFormat": "Memory usage"
          }
        ],
        "yaxes": [
          {
            "label": "Bytes"
          }
        ]
      }
    ]
  }
}
```

### 🎯 日志管理 (ELK Stack)

#### Logstash配置
```ruby
# logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "myapp" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:log}" }
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    if [level] == "ERROR" {
      aggregate {
        task_id => "%{host}%{timestamp}"
        code => "
          map['error_count'] ||= 0
          map['error_count'] += 1
        "
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "myapp-%{+YYYY.MM.dd}"
  }
  
  if [level] == "ERROR" {
    slack {
      url => "${SLACK_WEBHOOK_URL}"
      channel => "#alerts"
      username => "logstash"
      message => "Error detected in %{[fields][service]}: %{message}"
    }
  }
}
```

---

## ☁️ 云原生架构

### 🎯 AWS云服务部署

#### Terraform基础设施配置
```hcl
# main.tf
provider "aws" {
  region = var.aws_region
}

# VPC配置
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

# 公共子网
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "${var.project_name}-public-${count.index}"
    Environment = var.environment
    Type        = "Public"
  }
}

# 私有子网
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name        = "${var.project_name}-private-${count.index}"
    Environment = var.environment
    Type        = "Private"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name        = "${var.project_name}-igw"
    Environment = var.environment
  }
}

# NAT Gateway
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  vpc    = true
}

resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name        = "${var.project_name}-nat-${count.index}"
    Environment = var.environment
  }
}

# EKS集群
resource "aws_eks_cluster" "main" {
  name     = "${var.project_name}-cluster"
  role_arn = aws_iam_role.cluster.arn
  
  vpc_config {
    subnet_ids = concat(aws_subnet.public[*].id, aws_subnet.private[*].id)
  }
  
  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
  ]
}

# EKS节点组
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.project_name}-nodes"
  node_role_arn   = aws_iam_role.nodes.arn
  subnet_ids      = aws_subnet.private[*].id
  
  scaling_config {
    desired_size = var.desired_capacity
    max_size     = var.max_capacity
    min_size     = var.min_capacity
  }
  
  instance_types = [var.instance_type]
  
  depends_on = [
    aws_iam_role_policy_attachment.nodes_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.nodes_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.nodes_AmazonEC2ContainerRegistryReadOnly,
  ]
}
```

#### Serverless函数配置
```yaml
# serverless.yml
service: myapp

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    NODE_ENV: production
    DATABASE_URL: ${env:DATABASE_URL}
    REDIS_URL: ${env:REDIS_URL}

functions:
  api:
    handler: src/handlers/api.handler
    events:
      - httpApi:
          path: /{proxy+}
          method: ANY
    environment:
      TABLE_NAME: !Ref DataTable
    iamRoleStatements:
      - Effect: "Allow"
        Action:
          - "dynamodb:GetItem"
          - "dynamodb:PutItem"
          - "dynamodb:UpdateItem"
          - "dynamodb:DeleteItem"
        Resource:
          - !GetAtt DataTable.Arn

  webhook:
    handler: src/handlers/webhook.handler
    events:
      - httpApi:
          path: /webhook
          method: post

  scheduled:
    handler: src/handlers/scheduled.handler
    events:
      - schedule:
          rate: rate(5 minutes)
          input:
            type: 'cleanup'

resources:
  Resources:
    DataTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.DATA_TABLE}
        AttributeDefinitions:
          - AttributeName: PK
            AttributeType: S
          - AttributeName: SK
            AttributeType: S
        KeySchema:
          - AttributeName: PK
            KeyType: HASH
          - AttributeName: SK
            KeyType: RANGE
        BillingMode: PAY_PER_REQUEST
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES

plugins:
  - serverless-offline
  - serverless-dotenv-plugin
  - serverless-plugin-optimize
  - serverless-prune-plugin

custom:
  prune:
    automatic: true
    number: 3
  optimize:
    external: ['swagger']
  dotenv:
    path: ./.env
```

---

## 🔧 基础设施即代码

### 🎯 Ansible配置管理

#### Playbook示例
```yaml
# site.yml
---
- name: Configure application server
  hosts: app_servers
  become: yes
  vars_files:
    - vars/main.yml
  
  tasks:
    - name: Update system packages
      apt:
        update_cache: yes
        upgrade: dist
    
    - name: Install required packages
      apt:
        name:
          - nginx
          - nodejs
          - npm
          - postgresql-client
          - redis-tools
        state: present
    
    - name: Create application user
      user:
        name: "{{ app_user }}"
        shell: /bin/bash
        create_home: yes
    
    - name: Create application directory
      file:
        path: "{{ app_dir }}"
        state: directory
        owner: "{{ app_user }}"
        group: "{{ app_user }}"
        mode: '0755'
    
    - name: Configure nginx
      template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/sites-available/{{ app_name }}
      notify: Restart nginx
    
    - name: Enable nginx site
      file:
        src: /etc/nginx/sites-available/{{ app_name }}
        dest: /etc/nginx/sites-enabled/{{ app_name }}
        state: link
      notify: Restart nginx
    
    - name: Deploy application
      copy:
        src: ../dist/
        dest: "{{ app_dir }}"
        owner: "{{ app_user }}"
        group: "{{ app_user }}"
        mode: '0755'
    
    - name: Install application dependencies
      npm:
        path: "{{ app_dir }}"
        production: yes
    
    - name: Configure systemd service
      template:
        src: templates/app.service.j2
        dest: /etc/systemd/system/{{ app_name }}.service
      notify: Restart app
    
    - name: Enable and start service
      systemd:
        name: "{{ app_name }}"
        enabled: yes
        state: started
  
  handlers:
    - name: Restart nginx
      service:
        name: nginx
        state: restarted
    
    - name: Restart app
      systemd:
        name: "{{ app_name }}"
        state: restarted

- name: Configure database server
  hosts: db_servers
  become: yes
  vars_files:
    - vars/main.yml
  
  tasks:
    - name: Install PostgreSQL
      apt:
        name:
          - postgresql
          - postgresql-contrib
        state: present
    
    - name: Start PostgreSQL service
      service:
        name: postgresql
        state: started
        enabled: yes
    
    - name: Create database
      postgresql_db:
        name: "{{ db_name }}"
        state: present
    
    - name: Create database user
      postgresql_user:
        db: "{{ db_name }}"
        name: "{{ db_user }}"
        password: "{{ db_password }}"
        priv: "ALL"
        state: present
    
    - name: Configure PostgreSQL
      template:
        src: templates/postgresql.conf.j2
        dest: /etc/postgresql/12/main/postgresql.conf
      notify: Restart postgresql
  
  handlers:
    - name: Restart postgresql
      service:
        name: postgresql
        state: restarted
```

---

## 🔒 DevSecOps实践

### 🎯 安全扫描与合规

#### OWASP ZAP扫描配置
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  zap-scan:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: OWASP ZAP Baseline Scan
      uses: zaproxy/action-baseline@v0.10.0
      with:
        target: 'http://localhost:3000'
        rules_file_name: '.zap/rules.tsv'
        cmd_options: '-a -j -d'
    
    - name: Upload ZAP report
      uses: actions/upload-artifact@v3
      with:
        name: zap-report
        path: report.html

  dependency-check:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Java
      uses: actions/setup-java@v4
      with:
        distribution: 'temurin'
        java-version: '17'
    
    - name: Download OWASP Dependency-Check
      run: |
        curl -L -o dependency-check.zip https://github.com/jeremylong/DependencyCheck/releases/download/v8.2.1/dependency-check-8.2.1-release.zip
        unzip dependency-check.zip
    
    - name: Run dependency check
      run: |
        ./dependency-check/bin/dependency-check --project "MyApp" --scan "./" --format "ALL" --out "reports"
    
    - name: Upload reports
      uses: actions/upload-artifact@v3
      with:
        name: dependency-check-reports
        path: reports/

  container-scan:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Build Docker image
      run: docker build -t temp-app .
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'temp-app'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'
```

---

## 🚀 部署策略

### 🎯 蓝绿部署
```yaml
# k8s/blue-green-deployment.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
    version: blue  # 初始指向蓝色环境
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-blue
  labels:
    app: myapp
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: blue
  template:
    metadata:
      labels:
        app: myapp
        version: blue
    spec:
      containers:
      - name: myapp
        image: registry.example.com/myapp:blue
        ports:
        - containerPort: 3000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-green
  labels:
    app: myapp
    version: green
spec:
  replicas: 0  # 初始不启动绿色环境
  selector:
    matchLabels:
      app: myapp
      version: green
  template:
    metadata:
      labels:
        app: myapp
        version: green
    spec:
      containers:
      - name: myapp
        image: registry.example.com/myapp:green
        ports:
        - containerPort: 3000
```

#### 部署脚本
```bash
#!/bin/bash
# deploy-blue-green.sh

set -e

# 配置
APP_NAME="myapp"
NAMESPACE="default"
NEW_VERSION="green"
OLD_VERSION="blue"

echo "🚀 开始蓝绿部署..."

# 1. 部署新版本
echo "📦 部署新版本 ($NEW_VERSION)..."
kubectl scale deployment $APP_NAME-$NEW_VERSION --replicas=3 -n $NAMESPACE

# 2. 等待新版本就绪
echo "⏳ 等待新版本就绪..."
kubectl wait --for=condition=available deployment/$APP_NAME-$NEW_VERSION -n $NAMESPACE --timeout=300s

# 3. 健康检查
echo "🏥 执行健康检查..."
kubectl get pods -l app=$APP_NAME,version=$NEW_VERSION -n $NAMESPACE

# 4. 切换流量
echo "🔄 切换流量到新版本..."
kubectl patch service $APP_NAME-service -n $NAMESPACE --type='json' -p='[{"op": "replace", "path": "/spec/selector/version", "value": "'$NEW_VERSION'"}]'

# 5. 验证切换
echo "✅ 验证部署..."
sleep 10
curl -f http://$APP_NAME.example.com/health

# 6. 停止旧版本
echo "🛑 停止旧版本 ($OLD_VERSION)..."
kubectl scale deployment $APP_NAME-$OLD_VERSION --replicas=0 -n $NAMESPACE

echo "🎉 蓝绿部署完成！"
```

---

## 📈 性能优化

### 🎯 性能监控与调优

#### 应用性能监控
```javascript
// APM监控中间件
const apm = require('elastic-apm-node').start({
  serviceName: 'myapp',
  secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
  serverUrl: process.env.ELASTIC_APM_SERVER_URL,
  environment: process.env.NODE_ENV
});

// 性能监控中间件
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // 记录响应时间
    apm.setTransactionName(`${req.method} ${req.path}`);
    
    // 记录自定义指标
    apm.addLabels({
      'http.method': req.method,
      'http.status_code': res.statusCode,
      'url.path': req.path
    });
    
    // 发送自定义指标
    if (duration > 1000) {
      apm.captureError(new Error(`Slow request: ${duration}ms`), {
        tags: {
          'slow.request': true,
          'duration': duration
        }
      });
    }
  });
  
  next();
};

// 内存监控
const memoryMonitor = () => {
  const used = process.memoryUsage();
  const total = require('os').totalmem();
  const percent = (used.heapUsed / total) * 100;
  
  apm.addLabels({
    'memory.used': used.heapUsed,
    'memory.total': total,
    'memory.percent': percent
  });
  
  if (percent > 80) {
    apm.captureError(new Error(`High memory usage: ${percent.toFixed(2)}%`), {
      tags: {
        'memory.warning': true,
        'memory.percent': percent
      }
    });
  }
};

// 定期监控
setInterval(memoryMonitor, 30000);
```

---

## 🎯 学习路径建议

### 🌱 入门路径（2-3个月）
1. **基础概念**：DevOps理念、CI/CD基础
2. **版本控制**：Git高级用法、分支策略
3. **容器化**：Docker基础、容器概念
4. **简单项目**：个人项目的自动化部署

### 🌿 中级路径（3-6个月）
1. **CI/CD流水线**：GitHub Actions、Jenkins
2. **容器编排**：Kubernetes基础概念
3. **监控告警**：Prometheus、Grafana基础
4. **项目实战**：中型应用的DevOps实践

### 🌳 高级路径（6-12个月）
1. **云原生**：AWS、Azure、GCP云服务
2. **基础设施即代码**：Terraform、Ansible
3. **DevSecOps**：安全扫描、合规检查
4. **技术领导**：DevOps团队管理、最佳实践

---

## 📊 资源统计

- **CI/CD配置**：GitHub Actions、Jenkins完整流水线
- **容器化技术**：Docker、Kubernetes配置和最佳实践
- **监控方案**：Prometheus、Grafana、ELK Stack配置
- **云原生架构**：AWS、Serverless、Terraform配置
- **安全实践**：OWASP ZAP、Trivy安全扫描配置
- **部署策略**：蓝绿部署、滚动部署、金丝雀部署

---

*DevOps专区提供了从入门到精通的完整DevOps学习路径，每个技术点都有详细的配置文件和最佳实践。选择适合您的技术水平，开始构建高效的DevOps流程！* 🚀✨