# 服务端组件最佳实践和模式

> 基于 Next.js App Router 的服务端组件开发最佳实践和常见模式

## 📋 概述

本文档提供了 Next.js App Router 服务端组件开发的最佳实践和常见模式，帮助开发者构建高性能、SEO 友好的服务端组件。

## 🎯 核心原则

### 1. 服务端组件默认原则

```tsx
// ✅ 正确：默认就是服务端组件，无需 'use server'
import React from 'react';
import { db } from '@/lib/db';

interface ServerComponentProps {
  userId: string;
  filters?: Record<string, any>;
}

export const ServerComponent: React.FC<ServerComponentProps> = async ({ userId, filters }) => {
  // 可以直接访问数据库
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  // 服务端逻辑处理
  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};
```

### 2. 最小化客户端边界

```tsx
// ✅ 好的做法：只在需要交互的地方使用客户端组件
// ServerComponent.tsx (服务端组件)
import React from 'react';
import { InteractiveWidget } from './InteractiveWidget';

export const ServerComponent = async () => {
  const data = await fetchData();
  
  return (
    <div>
      <h1>Static Content</h1>
      <p>{data.description}</p>
      
      {/* 只在需要交互的地方使用客户端组件 */}
      <InteractiveWidget data={data.interactive} />
    </div>
  );
};

// InteractiveWidget.tsx (客户端组件)
'use client';
export const InteractiveWidget = ({ data }) => {
  // 交互逻辑
};
```

## 🏗️ 常见模式

### 1. 数据获取模式

#### 1.1 基础数据获取

```tsx
// app/users/[id]/page.tsx
import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface UserPageProps {
  params: {
    id: string;
  };
}

export default async function UserPage({ params }: UserPageProps) {
  const user = await db.user.findUnique({
    where: { id: params.id },
    include: {
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="user-page">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      
      <div className="posts">
        <h2>Recent Posts</h2>
        {user.posts.map(post => (
          <article key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
```

#### 1.2 并行数据获取

```tsx
// app/dashboard/page.tsx
import React from 'react';
import { db } from '@/lib/db';
import { getUser, getPosts, getAnalytics } from '@/lib/data';

export default async function DashboardPage() {
  // 并行获取数据，避免瀑布式请求
  const [user, posts, analytics] = await Promise.all([
    getUser(),
    getPosts(),
    getAnalytics(),
  ]);

  return (
    <div className="dashboard">
      <header>
        <h1>Welcome, {user.name}</h1>
      </header>
      
      <div className="stats">
        <h2>Analytics</h2>
        <p>Total Posts: {analytics.totalPosts}</p>
        <p>Total Views: {analytics.totalViews}</p>
      </div>
      
      <div className="recent-posts">
        <h2>Recent Posts</h2>
        {posts.map(post => (
          <div key={post.id}>{post.title}</div>
        ))}
      </div>
    </div>
  );
}
```

#### 1.3 条件数据获取

```tsx
// app/posts/[slug]/page.tsx
import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { cache } from 'react';

// 缓存函数
const getCachedPost = cache(async (slug: string) => {
  return await db.post.findUnique({
    where: { slug },
    include: {
      author: true,
      comments: {
        include: {
          author: true,
        },
      },
    },
  });
});

interface PostPageProps {
  params: {
    slug: string;
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await getCachedPost(params.slug);

  if (!post) {
    notFound();
  }

  // 根据条件决定是否获取相关数据
  let relatedPosts = [];
  if (post.category) {
    relatedPosts = await db.post.findMany({
      where: {
        category: post.category,
        id: { not: post.id },
      },
      take: 3,
    });
  }

  return (
    <article className="post">
      <header>
        <h1>{post.title}</h1>
        <p>By {post.author.name}</p>
      </header>
      
      <div className="content">
        {post.content}
      </div>
      
      {relatedPosts.length > 0 && (
        <section className="related-posts">
          <h2>Related Posts</h2>
          <ul>
            {relatedPosts.map(relatedPost => (
              <li key={relatedPost.id}>
                <a href={`/posts/${relatedPost.slug}`}>
                  {relatedPost.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
```

### 2. 缓存模式

#### 2.1 数据缓存

```tsx
// lib/data.ts
import { cache } from 'react';
import { db } from '@/lib/db';

// 使用 React.cache 缓存数据获取
export const getCachedUser = cache(async (id: string) => {
  return await db.user.findUnique({
    where: { id },
    include: {
      posts: true,
    },
  });
});

export const getCachedPosts = cache(async (options?: {
  limit?: number;
  category?: string;
}) => {
  const { limit = 10, category } = options || {};
  
  return await db.post.findMany({
    where: category ? { category } : {},
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
});

// 使用缓存的组件
import { getCachedUser, getCachedPosts } from '@/lib/data';

export const UserProfile = async ({ userId }: { userId: string }) => {
  const user = await getCachedUser(userId);
  const posts = await getCachedPosts({ 
    limit: 5, 
    category: user?.preferredCategory 
  });

  return (
    <div>
      {/* 用户信息和帖子 */}
    </div>
  );
};
```

#### 2.2 路由缓存

```tsx
// app/posts/page.tsx
import React from 'react';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export default async function PostsPage() {
  const posts = await db.post.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1>Posts</h1>
      
      <form action={async () => {
        'use server';
        
        // 创建新帖子
        await db.post.create({
          data: {
            title: 'New Post',
            content: 'Content',
          },
        });
        
        // 重新验证当前路径
        revalidatePath('/posts');
      }}>
        <button type="submit">Create Post</button>
      </form>
      
      <div className="posts">
        {posts.map(post => (
          <div key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 2.3 时间缓存

```tsx
// app/products/page.tsx
import React from 'react';
import { db } from '@/lib/db';
import { unstable_cache } from 'next/cache';

// 使用 unstable_cache 设置缓存时间
const getProducts = unstable_cache(
  async () => {
    return await db.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
      },
    });
  },
  ['products'], // 缓存键
  {
    revalidate: 3600, // 1小时后重新验证
    tags: ['products'], // 缓存标签
  }
);

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="products-page">
      <h1>Products</h1>
      
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p>Category: {product.category.name}</p>
            <p>Price: ${product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. 搜索和过滤模式

#### 3.1 搜索组件

```tsx
// app/search/page.tsx
import React from 'react';
import { db } from '@/lib/db';
import { SearchParams } from '@/types';

interface SearchPageProps {
  searchParams: SearchParams;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  const category = searchParams.category || '';
  const page = parseInt(searchParams.page as string) || 1;
  const limit = 10;

  const where: any = {};
  
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }
  
  if (category) {
    where.category = category;
  }

  const [products, totalCount] = await Promise.all([
    db.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.product.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="search-page">
      <h1>Search Results</h1>
      
      <div className="search-info">
        <p>Found {totalCount} results for "{query}"</p>
      </div>
      
      <div className="results">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h2>{product.title}</h2>
            <p>{product.description}</p>
            <p>Price: ${product.price}</p>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <a
              key={pageNum}
              href={`/search?q=${query}&category=${category}&page=${pageNum}`}
              className={pageNum === page ? 'active' : ''}
            >
              {pageNum}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4. 分页模式

#### 4.1 基础分页

```tsx
// app/blog/page.tsx
import React from 'react';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Suspense } from 'react';

interface BlogPageProps {
  searchParams: {
    page?: string;
  };
}

async function BlogPosts({ page = 1 }: { page: number }) {
  const limit = 10;
  const offset = (page - 1) * limit;

  const [posts, totalCount] = await Promise.all([
    db.post.findMany({
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    db.post.count(),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="blog-posts">
      {posts.map(post => (
        <article key={post.id} className="post-card">
          <h2>
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h2>
          <p className="excerpt">{post.excerpt}</p>
          <div className="meta">
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            <span>By {post.authorName}</span>
          </div>
        </article>
      ))}
      
      {totalPages > 1 && (
        <div className="pagination">
          {page > 1 && (
            <Link href={`/blog?page=${page - 1}`}>
              Previous
            </Link>
          )}
          
          <span className="current">
            Page {page} of {totalPages}
          </span>
          
          {page < totalPages && (
            <Link href={`/blog?page=${page + 1}`}>
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const page = parseInt(searchParams.page as string) || 1;

  return (
    <div className="blog-page">
      <h1>Blog</h1>
      
      <Suspense fallback={<div>Loading posts...</div>}>
        <BlogPosts page={page} />
      </Suspense>
    </div>
  );
}
```

### 5. 动态路由模式

#### 5.1 动态路由页面

```tsx
// app/categories/[category]/page.tsx
import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
  params: {
    category: string;
  };
  searchParams: {
    page?: string;
    sort?: 'newest' | 'oldest' | 'popular';
  };
}

export default async function CategoryPage({ 
  params, 
  searchParams 
}: CategoryPageProps) {
  const category = await db.category.findUnique({
    where: { slug: params.category },
  });

  if (!category) {
    notFound();
  }

  const page = parseInt(searchParams.page as string) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;

  const orderBy: any = {};
  switch (searchParams.sort) {
    case 'oldest':
      orderBy.createdAt = 'asc';
      break;
    case 'popular':
      orderBy.views = 'desc';
      break;
    default:
      orderBy.createdAt = 'desc';
  }

  const [products, totalCount] = await Promise.all([
    db.product.findMany({
      where: { categoryId: category.id },
      orderBy,
      skip: offset,
      take: limit,
    }),
    db.product.count({
      where: { categoryId: category.id },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="category-page">
      <header>
        <h1>{category.name}</h1>
        <p>{category.description}</p>
      </header>
      
      <div className="filters">
        <div className="sort-options">
          <a href={`/categories/${params.category}?sort=newest`}>Newest</a>
          <a href={`/categories/${params.category}?sort=oldest`}>Oldest</a>
          <a href={`/categories/${params.category}?sort=popular`}>Popular</a>
        </div>
      </div>
      
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>${product.price}</p>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="pagination">
          {/* 分页导航 */}
        </div>
      )}
    </div>
  );
}
```

### 6. 布局模式

#### 6.1 嵌套布局

```tsx
// app/dashboard/layout.tsx
import React from 'react';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout">
      <DashboardHeader />
      <div className="dashboard-body">
        <DashboardNav />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}

// app/dashboard/analytics/page.tsx
export default function AnalyticsPage() {
  return (
    <div>
      <h1>Analytics</h1>
      {/* 分析内容 */}
    </div>
  );
}

// app/dashboard/settings/page.tsx
export default function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      {/* 设置内容 */}
    </div>
  );
}
```

#### 6.2 动态布局

```tsx
// app/[lang]/layout.tsx
import React from 'react';
import { dir } from 'i18next';
import { supportedLanguages } from '@/lib/i18n';

export function generateStaticParams() {
  return supportedLanguages.map(lang => ({ lang }));
}

export default function LangLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  return (
    <html lang={lang} dir={dir(lang)}>
      <body>
        <div className="app">
          {children}
        </div>
      </body>
    </html>
  );
}
```

### 7. 错误处理模式

#### 7.1 错误边界

```tsx
// app/dashboard/error.tsx
'use client';

import React from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>
        Try again
      </button>
    </div>
  );
}

// app/dashboard/not-found.tsx
export default function NotFound() {
  return (
    <div className="not-found">
      <h2>Dashboard not found</h2>
      <p>The dashboard you're looking for doesn't exist.</p>
    </div>
  );
}
```

#### 7.2 全局错误处理

```tsx
// app/global-error.tsx
'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="global-error">
          <h2>Something went wrong!</h2>
          <p>{error.message}</p>
          <button onClick={reset}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
```

### 8. 元数据模式

#### 8.1 静态元数据

```tsx
// app/about/page.tsx
import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - My Website',
  description: 'Learn more about our company and team',
  openGraph: {
    title: 'About Us',
    description: 'Learn more about our company and team',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us',
    description: 'Learn more about our company and team',
  },
};

export default function AboutPage() {
  return (
    <div>
      <h1>About Us</h1>
      {/* 页面内容 */}
    </div>
  );
}
```

#### 8.2 动态元数据

```tsx
// app/posts/[slug]/page.tsx
import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface PostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata(
  { params }: PostPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const post = await db.post.findUnique({
    where: { slug: params.slug },
  });

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} - My Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await db.post.findUnique({
    where: { slug: params.slug },
  });

  if (!post) {
    notFound();
  }

  return (
    <article>
      <h1>{post.title}</h1>
      {/* 文章内容 */}
    </article>
  );
}
```

### 9. 流式渲染模式

#### 9.1 使用 Suspense

```tsx
// app/dashboard/page.tsx
import React from 'react';
import { Suspense } from 'react';
import { UserStats } from '@/components/dashboard/UserStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { RevenueChart } from '@/components/dashboard/RevenueChart';

export default function DashboardPage() {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="dashboard-grid">
        <Suspense fallback={<div>Loading stats...</div>}>
          <UserStats />
        </Suspense>
        
        <Suspense fallback={<div>Loading activity...</div>}>
          <RecentActivity />
        </Suspense>
        
        <Suspense fallback={<div>Loading chart...</div>}>
          <RevenueChart />
        </Suspense>
      </div>
    </div>
  );
}

// components/dashboard/UserStats.tsx
export const UserStats = async () => {
  const stats = await getUserStats();
  
  return (
    <div className="stats-card">
      <h2>User Statistics</h2>
      <div className="stats-grid">
        <div>Total Users: {stats.totalUsers}</div>
        <div>Active Users: {stats.activeUsers}</div>
        <div>New Users: {stats.newUsers}</div>
      </div>
    </div>
  );
};
```

### 10. 服务器动作模式

#### 10.1 表单处理

```tsx
// app/contact/page.tsx
import React from 'react';

export default function ContactPage() {
  return (
    <div className="contact-page">
      <h1>Contact Us</h1>
      
      <form action={submitContactForm}>
        <div>
          <label htmlFor="name">Name</label>
          <input type="text" id="name" name="name" required />
        </div>
        
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required />
        </div>
        
        <div>
          <label htmlFor="message">Message</label>
          <textarea id="message" name="message" required />
        </div>
        
        <button type="submit">Send Message</button>
      </form>
    </div>
  );
}

async function submitContactForm(formData: FormData) {
  'use server';
  
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;
  
  // 验证数据
  if (!name || !email || !message) {
    throw new Error('All fields are required');
  }
  
  // 保存到数据库
  await db.contactMessage.create({
    data: {
      name,
      email,
      message,
    },
  });
  
  // 发送邮件通知
  await sendEmailNotification({
    to: 'admin@example.com',
    subject: 'New Contact Form Submission',
    text: `New message from ${name} (${email}): ${message}`,
  });
  
  // 重定向到感谢页面
  redirect('/contact/thank-you');
}
```

#### 10.2 带验证的服务器动作

```tsx
// actions/contact.ts
'use server';

import { z } from 'zod';

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function submitContactForm(formData: FormData) {
  // 验证表单数据
  const validatedFields = contactFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to submit form.',
    };
  }

  const { name, email, message } = validatedFields.data;

  try {
    // 保存到数据库
    await db.contactMessage.create({
      data: {
        name,
        email,
        message,
      },
    });

    return {
      success: true,
      message: 'Form submitted successfully!',
    };
  } catch (error) {
    return {
      message: 'Database Error: Failed to submit form.',
    };
  }
}
```

## 🚀 最佳实践总结

### 1. 数据获取最佳实践
- **并行获取**：使用 `Promise.all()` 并行获取数据
- **数据缓存**：使用 `React.cache` 和 `unstable_cache` 缓存数据
- **条件获取**：只在需要时获取数据
- **错误处理**：使用 `notFound()` 和错误边界

### 2. 性能优化最佳实践
- **静态生成**：尽可能使用静态生成
- **增量静态生成**：使用 ISR 更新静态内容
- **流式渲染**：使用 Suspense 实现流式渲染
- **代码分割**：自动进行服务端组件代码分割

### 3. 缓存策略最佳实践
- **数据缓存**：缓存频繁访问的数据
- **路由缓存**：使用 `revalidatePath` 和 `revalidateTag`
- **HTTP 缓存**：设置适当的缓存头
- **CDN 缓存**：利用 CDN 缓存静态资源

### 4. SEO 最佳实践
- **元数据**：使用静态和动态元数据
- **结构化数据**：添加 JSON-LD 结构化数据
- **语义化 HTML**：使用正确的 HTML 标签
- **页面速度**：优化页面加载速度

### 5. 安全性最佳实践
- **输入验证**：验证所有用户输入
- **SQL 注入防护**：使用 ORM 或参数化查询
- **XSS 防护**：转义用户输入
- **敏感数据**：不要在客户端暴露敏感数据

### 6. 开发体验最佳实践
- **TypeScript**：使用 TypeScript 提高代码质量
- **类型安全**：定义清晰的类型
- **错误边界**：使用错误边界处理错误
- **开发工具**：使用 Next.js 开发工具

## 📚 相关资源

- [Next.js App Router 文档](https://nextjs.org/docs/app)
- [React Server Components 文档](https://react.dev/reference/rsc/server-components)
- [Next.js 缓存文档](https://nextjs.org/docs/app/building-your-application/caching)
- [Next.js 元数据文档](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)

---

*最后更新：2024年*