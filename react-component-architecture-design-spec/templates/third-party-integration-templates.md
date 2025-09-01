# 🔌 第三方服务集成模板

> **常见第三方服务的标准化集成模板和最佳实践**

## 📋 概述

本文档提供常见第三方服务的集成模板，包括认证服务、支付系统、云存储、监控分析、通知服务等，帮助快速集成外部服务并保持架构一致性。

## 🎯 集成原则

### 核心设计原则
1. **服务隔离**: 通过适配器模式隔离第三方依赖
2. **错误处理**: 完善的降级和重试机制
3. **配置管理**: 环境变量和密钥安全管理
4. **监控追踪**: 集成日志和性能监控
5. **版本管理**: API版本控制和平滑升级

## 🔐 认证服务集成

### 1. Auth0 集成模板

```typescript
// services/auth/auth0.service.ts
import { Auth0Client } from '@auth0/auth0-spa-js';

export class Auth0Service implements AuthProvider {
  private client: Auth0Client;
  private initialized = false;

  constructor(private config: Auth0Config) {
    this.client = new Auth0Client({
      domain: config.domain,
      clientId: config.clientId,
      authorizationParams: {
        redirect_uri: config.redirectUri,
        audience: config.audience,
        scope: config.scope || 'openid profile email',
      },
      cacheLocation: 'localstorage',
      useRefreshTokens: true,
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // 检查是否有回调参数
      if (window.location.search.includes('code=')) {
        await this.client.handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Auth0 initialization failed:', error);
      throw new AuthenticationError('Failed to initialize Auth0', error);
    }
  }

  async login(options?: LoginOptions): Promise<void> {
    await this.initialize();
    await this.client.loginWithRedirect(options);
  }

  async logout(): Promise<void> {
    await this.client.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }

  async getUser(): Promise<User | null> {
    await this.initialize();
    
    try {
      const user = await this.client.getUser();
      if (!user) return null;
      
      return this.mapAuth0User(user);
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const token = await this.client.getTokenSilently();
      return token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  private mapAuth0User(auth0User: any): User {
    return {
      id: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name,
      picture: auth0User.picture,
      emailVerified: auth0User.email_verified,
      metadata: auth0User.user_metadata,
    };
  }
}
```

### 2. Firebase Auth 集成模板

```typescript
// services/auth/firebase-auth.service.ts
import { 
  Auth, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

export class FirebaseAuthService implements AuthProvider {
  private unsubscribe: (() => void) | null = null;

  constructor(private auth: Auth) {}

  async initialize(): Promise<void> {
    return new Promise((resolve) => {
      this.unsubscribe = onAuthStateChanged(this.auth, () => {
        resolve();
      });
    });
  }

  async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      return this.mapFirebaseUser(credential.user);
    } catch (error: any) {
      throw this.handleFirebaseError(error);
    }
  }

  async loginWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      return this.mapFirebaseUser(credential.user);
    } catch (error: any) {
      throw this.handleFirebaseError(error);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  getCurrentUser(): User | null {
    const firebaseUser = this.auth.currentUser;
    return firebaseUser ? this.mapFirebaseUser(firebaseUser) : null;
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, (firebaseUser) => {
      callback(firebaseUser ? this.mapFirebaseUser(firebaseUser) : null);
    });
  }

  private mapFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || '',
      picture: firebaseUser.photoURL || '',
      emailVerified: firebaseUser.emailVerified,
      phoneNumber: firebaseUser.phoneNumber || undefined,
    };
  }

  private handleFirebaseError(error: any): Error {
    const errorMap: Record<string, string> = {
      'auth/user-not-found': '用户不存在',
      'auth/wrong-password': '密码错误',
      'auth/invalid-email': '邮箱格式无效',
      'auth/user-disabled': '用户已被禁用',
      'auth/too-many-requests': '请求过于频繁，请稍后再试',
    };

    const message = errorMap[error.code] || '认证失败';
    return new AuthenticationError(message, error);
  }

  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
```

## 💳 支付服务集成

### 1. Stripe 集成模板

```typescript
// services/payment/stripe.service.ts
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

export class StripePaymentService implements PaymentProvider {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;

  constructor(
    private publicKey: string,
    private apiService: ApiService
  ) {}

  async initialize(): Promise<void> {
    if (this.stripe) return;
    
    this.stripe = await loadStripe(this.publicKey);
    if (!this.stripe) {
      throw new Error('Failed to load Stripe');
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<PaymentIntent> {
    const response = await this.apiService.post('/api/payment/create-intent', {
      amount,
      currency,
    });
    
    return {
      clientSecret: response.data.clientSecret,
      intentId: response.data.intentId,
      amount: response.data.amount,
      currency: response.data.currency,
    };
  }

  async createSubscription(priceId: string, customerId?: string): Promise<Subscription> {
    const response = await this.apiService.post('/api/payment/create-subscription', {
      priceId,
      customerId,
    });
    
    return {
      subscriptionId: response.data.subscriptionId,
      clientSecret: response.data.clientSecret,
      status: response.data.status,
    };
  }

  async confirmPayment(
    clientSecret: string,
    paymentElement: any,
    returnUrl: string
  ): Promise<PaymentResult> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const result = await this.stripe.confirmPayment({
      elements: paymentElement,
      clientSecret,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      paymentIntent: result.paymentIntent,
    };
  }

  async createPaymentElement(clientSecret: string): Promise<any> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    this.elements = this.stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#0570de',
          colorBackground: '#ffffff',
          colorText: '#30313d',
          colorDanger: '#df1b41',
          fontFamily: 'system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '4px',
        },
      },
    });

    return this.elements.create('payment', {
      layout: 'tabs',
      defaultValues: {
        billingDetails: {
          email: this.getCurrentUserEmail(),
        },
      },
    });
  }

  // Webhook处理
  async handleWebhook(payload: any, signature: string): Promise<void> {
    const response = await this.apiService.post('/api/payment/webhook', {
      payload,
      signature,
    });

    if (!response.data.success) {
      throw new Error('Webhook processing failed');
    }
  }

  private getCurrentUserEmail(): string {
    // 从用户上下文获取邮箱
    return '';
  }
}
```

### 2. 支付宝集成模板

```typescript
// services/payment/alipay.service.ts
export class AlipayService implements PaymentProvider {
  constructor(
    private config: AlipayConfig,
    private apiService: ApiService
  ) {}

  async createPayment(order: PaymentOrder): Promise<PaymentResponse> {
    try {
      // 1. 创建支付订单
      const response = await this.apiService.post('/api/payment/alipay/create', {
        outTradeNo: order.orderId,
        totalAmount: order.amount,
        subject: order.subject,
        body: order.description,
        returnUrl: order.returnUrl,
        notifyUrl: this.config.notifyUrl,
      });

      return {
        success: true,
        paymentUrl: response.data.paymentUrl,
        orderId: response.data.orderId,
        qrCode: response.data.qrCode, // 二维码支付
      };
    } catch (error) {
      console.error('Alipay payment creation failed:', error);
      throw new PaymentError('创建支付订单失败', error);
    }
  }

  async queryPaymentStatus(orderId: string): Promise<PaymentStatus> {
    const response = await this.apiService.get(`/api/payment/alipay/query/${orderId}`);
    
    return {
      orderId: response.data.orderId,
      status: response.data.tradeStatus,
      paidAmount: response.data.totalAmount,
      paidTime: response.data.gmtPayment,
      buyerId: response.data.buyerId,
    };
  }

  async refund(refundRequest: RefundRequest): Promise<RefundResponse> {
    const response = await this.apiService.post('/api/payment/alipay/refund', {
      outTradeNo: refundRequest.orderId,
      refundAmount: refundRequest.amount,
      refundReason: refundRequest.reason,
      outRequestNo: refundRequest.refundId,
    });

    return {
      success: response.data.success,
      refundId: response.data.refundId,
      refundAmount: response.data.refundAmount,
      refundTime: response.data.refundTime,
    };
  }

  // 验证异步通知签名
  async verifyNotification(params: any): Promise<boolean> {
    const response = await this.apiService.post('/api/payment/alipay/verify', params);
    return response.data.valid;
  }
}
```

## ☁️ 云存储服务集成

### 1. AWS S3 集成模板

```typescript
// services/storage/s3.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3StorageService implements StorageProvider {
  private client: S3Client;

  constructor(private config: S3Config) {
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(file: File, path: string): Promise<UploadResult> {
    const key = this.generateKey(path, file.name);
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: file,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.client.send(command);

      return {
        success: true,
        url: this.getPublicUrl(key),
        key,
        size: file.size,
        contentType: file.type,
      };
    } catch (error) {
      console.error('S3 upload failed:', error);
      throw new StorageError('文件上传失败', error);
    }
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async uploadWithProgress(
    file: File,
    path: string,
    onProgress: (progress: number) => void
  ): Promise<UploadResult> {
    const key = this.generateKey(path, file.name);
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    const chunks = Math.ceil(file.size / chunkSize);
    
    // 实现分片上传
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      // 上传分片
      await this.uploadChunk(key, chunk, i);
      
      // 更新进度
      const progress = ((i + 1) / chunks) * 100;
      onProgress(progress);
    }

    return {
      success: true,
      url: this.getPublicUrl(key),
      key,
      size: file.size,
      contentType: file.type,
    };
  }

  private generateKey(path: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${path}/${timestamp}-${sanitizedFilename}`;
  }

  private getPublicUrl(key: string): string {
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  private async uploadChunk(key: string, chunk: Blob, partNumber: number): Promise<void> {
    // 实现分片上传逻辑
  }
}
```

### 2. 阿里云 OSS 集成模板

```typescript
// services/storage/oss.service.ts
import OSS from 'ali-oss';

export class OSSStorageService implements StorageProvider {
  private client: OSS;

  constructor(config: OSSConfig) {
    this.client = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket,
      secure: true,
    });
  }

  async upload(file: File, path: string): Promise<UploadResult> {
    const key = this.generateObjectName(path, file.name);
    
    try {
      const result = await this.client.put(key, file, {
        headers: {
          'Content-Type': file.type,
          'x-oss-meta-original-name': file.name,
          'x-oss-meta-uploaded-at': new Date().toISOString(),
        },
      });

      return {
        success: true,
        url: result.url,
        key: result.name,
        size: file.size,
        contentType: file.type,
      };
    } catch (error) {
      console.error('OSS upload failed:', error);
      throw new StorageError('文件上传失败', error);
    }
  }

  async multipartUpload(
    file: File,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    const key = this.generateObjectName(path, file.name);
    
    try {
      const result = await this.client.multipartUpload(key, file, {
        progress: (percentage: number) => {
          if (onProgress) {
            onProgress(percentage * 100);
          }
        },
        partSize: 1024 * 1024, // 1MB per part
        headers: {
          'Content-Type': file.type,
        },
      });

      return {
        success: true,
        url: this.client.generateObjectUrl(result.name),
        key: result.name,
        size: file.size,
        contentType: file.type,
      };
    } catch (error) {
      console.error('OSS multipart upload failed:', error);
      throw new StorageError('分片上传失败', error);
    }
  }

  async getSignedUrl(key: string, expires: number = 3600): Promise<string> {
    return this.client.signatureUrl(key, { expires });
  }

  async delete(key: string): Promise<void> {
    await this.client.delete(key);
  }

  async list(prefix: string, maxKeys: number = 100): Promise<StorageObject[]> {
    const result = await this.client.list({
      prefix,
      'max-keys': maxKeys,
    });

    return result.objects.map(obj => ({
      key: obj.name,
      size: obj.size,
      lastModified: new Date(obj.lastModified),
      etag: obj.etag,
      url: this.client.generateObjectUrl(obj.name),
    }));
  }

  private generateObjectName(path: string, filename: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = date.getTime();
    const ext = filename.split('.').pop();
    
    return `${path}/${year}/${month}/${day}/${timestamp}.${ext}`;
  }
}
```

## 📊 监控分析服务集成

### 1. Google Analytics 集成模板

```typescript
// services/analytics/google-analytics.service.ts
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export class GoogleAnalyticsService implements AnalyticsProvider {
  private initialized = false;

  constructor(private measurementId: string) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 加载 gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // 初始化 dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      send_page_view: false, // 手动控制页面浏览
    });

    this.initialized = true;
  }

  trackPageView(path: string, title?: string): void {
    if (!this.initialized) return;

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    });
  }

  trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number
  ): void {
    if (!this.initialized) return;

    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }

  trackUserTiming(
    category: string,
    variable: string,
    value: number,
    label?: string
  ): void {
    if (!this.initialized) return;

    window.gtag('event', 'timing_complete', {
      event_category: category,
      name: variable,
      value: Math.round(value),
      event_label: label,
    });
  }

  setUserId(userId: string): void {
    if (!this.initialized) return;

    window.gtag('config', this.measurementId, {
      user_id: userId,
    });
  }

  trackException(description: string, fatal: boolean = false): void {
    if (!this.initialized) return;

    window.gtag('event', 'exception', {
      description,
      fatal,
    });
  }

  // 电商追踪
  trackEcommerce(action: EcommerceAction, data: EcommerceData): void {
    if (!this.initialized) return;

    switch (action) {
      case 'view_item':
        window.gtag('event', 'view_item', {
          currency: data.currency,
          value: data.value,
          items: data.items,
        });
        break;
      
      case 'add_to_cart':
        window.gtag('event', 'add_to_cart', {
          currency: data.currency,
          value: data.value,
          items: data.items,
        });
        break;
      
      case 'purchase':
        window.gtag('event', 'purchase', {
          transaction_id: data.transactionId,
          value: data.value,
          currency: data.currency,
          items: data.items,
        });
        break;
    }
  }
}
```

### 2. Sentry 错误监控集成

```typescript
// services/monitoring/sentry.service.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export class SentryMonitoringService implements MonitoringProvider {
  constructor(private config: SentryConfig) {}

  initialize(): void {
    Sentry.init({
      dsn: this.config.dsn,
      environment: this.config.environment,
      integrations: [
        new BrowserTracing({
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            React.useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes
          ),
          tracingOrigins: this.config.tracingOrigins || ['localhost', /^\//],
        }),
      ],
      tracesSampleRate: this.config.tracesSampleRate || 0.1,
      release: this.config.release,
      beforeSend: (event, hint) => {
        // 过滤敏感信息
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        
        // 开发环境打印到控制台
        if (this.config.environment === 'development') {
          console.error('Sentry Event:', event, hint);
        }
        
        return event;
      },
    });
  }

  captureException(error: Error, context?: any): void {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    Sentry.captureMessage(message, level);
  }

  setUser(user: User | null): void {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    } else {
      Sentry.setUser(null);
    }
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    Sentry.addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category,
      level: breadcrumb.level as Sentry.SeverityLevel,
      data: breadcrumb.data,
      timestamp: breadcrumb.timestamp || Date.now(),
    });
  }

  startTransaction(name: string, op: string): any {
    return Sentry.startTransaction({ name, op });
  }

  // React错误边界
  createErrorBoundary(): React.ComponentType {
    return Sentry.ErrorBoundary;
  }

  // 性能监控
  profileComponent<P extends object>(
    Component: React.ComponentType<P>,
    name: string
  ): React.ComponentType<P> {
    return Sentry.withProfiler(Component, { name });
  }
}
```

## 📧 通知服务集成

### 1. SendGrid 邮件服务集成

```typescript
// services/notification/sendgrid.service.ts
export class SendGridEmailService implements EmailProvider {
  constructor(
    private apiKey: string,
    private apiService: ApiService
  ) {}

  async sendEmail(email: EmailMessage): Promise<EmailResult> {
    try {
      const response = await this.apiService.post('/api/email/send', {
        to: email.to,
        from: email.from || this.getDefaultSender(),
        subject: email.subject,
        html: email.html,
        text: email.text,
        templateId: email.templateId,
        dynamicTemplateData: email.templateData,
        attachments: email.attachments?.map(att => ({
          content: att.content,
          filename: att.filename,
          type: att.type,
          disposition: att.disposition || 'attachment',
        })),
        categories: email.categories,
        sendAt: email.scheduledTime,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return {
        success: true,
        messageId: response.data.messageId,
        status: 'sent',
      };
    } catch (error: any) {
      console.error('SendGrid email failed:', error);
      
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.message || '邮件发送失败',
        status: 'failed',
      };
    }
  }

  async sendBulkEmails(emails: EmailMessage[]): Promise<BulkEmailResult> {
    const results = await Promise.allSettled(
      emails.map(email => this.sendEmail(email))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));

    return {
      total: emails.length,
      successful: successful.length,
      failed: failed.length,
      results: results.map((r, i) => ({
        email: emails[i].to,
        ...(r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }),
      })),
    };
  }

  async sendWithTemplate(
    templateId: string,
    recipient: string,
    data: Record<string, any>
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: recipient,
      templateId,
      templateData: data,
    });
  }

  private getDefaultSender(): string {
    return process.env.SENDGRID_DEFAULT_SENDER || 'noreply@example.com';
  }
}
```

### 2. Twilio SMS 服务集成

```typescript
// services/notification/twilio.service.ts
export class TwilioSMSService implements SMSProvider {
  constructor(
    private config: TwilioConfig,
    private apiService: ApiService
  ) {}

  async sendSMS(message: SMSMessage): Promise<SMSResult> {
    try {
      const response = await this.apiService.post('/api/sms/send', {
        to: this.formatPhoneNumber(message.to),
        from: message.from || this.config.defaultFrom,
        body: message.body,
        mediaUrl: message.mediaUrls,
        statusCallback: this.config.statusCallbackUrl,
      }, {
        auth: {
          username: this.config.accountSid,
          password: this.config.authToken,
        },
      });

      return {
        success: true,
        messageId: response.data.sid,
        status: response.data.status,
        price: response.data.price,
        priceUnit: response.data.priceUnit,
      };
    } catch (error: any) {
      console.error('Twilio SMS failed:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || '短信发送失败',
        errorCode: error.response?.data?.code,
      };
    }
  }

  async sendBulkSMS(messages: SMSMessage[]): Promise<BulkSMSResult> {
    const results = await Promise.allSettled(
      messages.map(msg => this.sendSMS(msg))
    );

    return {
      total: messages.length,
      successful: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      failed: results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length,
      results: results.map((r, i) => ({
        phone: messages[i].to,
        ...(r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }),
      })),
    };
  }

  async sendVerificationCode(phone: string, code: string): Promise<SMSResult> {
    const template = `【${this.config.appName}】您的验证码是：${code}，5分钟内有效。请勿泄露给他人。`;
    
    return this.sendSMS({
      to: phone,
      body: template,
    });
  }

  async checkDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    const response = await this.apiService.get(`/api/sms/status/${messageId}`, {
      auth: {
        username: this.config.accountSid,
        password: this.config.authToken,
      },
    });

    return {
      messageId: response.data.sid,
      status: response.data.status,
      errorCode: response.data.errorCode,
      errorMessage: response.data.errorMessage,
      dateUpdated: response.data.dateUpdated,
    };
  }

  private formatPhoneNumber(phone: string): string {
    // 格式化电话号码为E.164格式
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // 假设是中国号码
    if (phone.startsWith('1') && phone.length === 11) {
      return `+86${phone}`;
    }
    
    return phone;
  }
}
```

## 🎯 通用集成模式

### 1. 适配器模式实现

```typescript
// patterns/adapter.pattern.ts
export interface ServiceAdapter<T, R> {
  initialize(): Promise<void>;
  execute(params: T): Promise<R>;
  dispose(): void;
}

export abstract class BaseServiceAdapter<T, R> implements ServiceAdapter<T, R> {
  protected initialized = false;
  protected retryCount = 3;
  protected timeout = 30000;

  abstract initialize(): Promise<void>;
  abstract execute(params: T): Promise<R>;

  async executeWithRetry(params: T): Promise<R> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < this.retryCount; i++) {
      try {
        return await this.execute(params);
      } catch (error: any) {
        lastError = error;
        
        if (!this.shouldRetry(error)) {
          throw error;
        }
        
        await this.delay(this.calculateBackoff(i));
      }
    }
    
    throw lastError;
  }

  protected shouldRetry(error: any): boolean {
    // 判断是否应该重试
    const retryableCodes = [408, 429, 500, 502, 503, 504];
    return retryableCodes.includes(error.response?.status);
  }

  protected calculateBackoff(attempt: number): number {
    // 指数退避算法
    return Math.min(1000 * Math.pow(2, attempt), 10000);
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  dispose(): void {
    this.initialized = false;
  }
}
```

### 2. 服务工厂模式

```typescript
// patterns/service-factory.pattern.ts
export class ServiceFactory {
  private static services = new Map<string, any>();

  static register<T>(name: string, factory: () => T): void {
    this.services.set(name, factory);
  }

  static create<T>(name: string): T {
    const factory = this.services.get(name);
    
    if (!factory) {
      throw new Error(`Service ${name} not registered`);
    }
    
    return factory();
  }

  static createWithConfig<T>(name: string, config: any): T {
    const factory = this.services.get(name);
    
    if (!factory) {
      throw new Error(`Service ${name} not registered`);
    }
    
    return factory(config);
  }
}

// 注册服务
ServiceFactory.register('auth', () => {
  const provider = process.env.REACT_APP_AUTH_PROVIDER;
  
  switch (provider) {
    case 'auth0':
      return new Auth0Service(auth0Config);
    case 'firebase':
      return new FirebaseAuthService(firebaseAuth);
    default:
      throw new Error(`Unknown auth provider: ${provider}`);
  }
});

ServiceFactory.register('payment', () => {
  const provider = process.env.REACT_APP_PAYMENT_PROVIDER;
  
  switch (provider) {
    case 'stripe':
      return new StripePaymentService(stripeKey, apiService);
    case 'alipay':
      return new AlipayService(alipayConfig, apiService);
    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }
});
```

## 📝 集成检查清单

### 安全性检查
- [ ] API密钥使用环境变量管理
- [ ] 敏感信息不在前端暴露
- [ ] 使用HTTPS传输数据
- [ ] 实现请求签名验证
- [ ] 设置CORS策略
- [ ] 实现速率限制

### 可靠性检查
- [ ] 实现重试机制
- [ ] 添加超时控制
- [ ] 错误处理完善
- [ ] 降级方案准备
- [ ] 日志记录完整
- [ ] 监控告警设置

### 性能检查
- [ ] 实现缓存策略
- [ ] 批量请求优化
- [ ] 异步加载实现
- [ ] 连接池管理
- [ ] 资源懒加载
- [ ] CDN加速配置

### 维护性检查
- [ ] 接口版本管理
- [ ] 文档更新及时
- [ ] 测试用例完整
- [ ] 配置集中管理
- [ ] 依赖版本锁定
- [ ] 变更日志记录

---

**记住：良好的第三方服务集成是应用稳定性的保障！** 🔌