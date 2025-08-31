/**
 * 服务端组件示例 - BlogPost
 * 
 * 展示了一个完整的服务端组件实现
 * 包含了数据获取、缓存、SEO优化、服务端计算等服务端特性
 * 
 * @author Claude
 * @created 2024-01-01
 * @updated 2024-01-01
 */

import React from 'react';
import { db } from '@/lib/db';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

// ==================== 类型定义 ====================

/** 博客文章类型 */
export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  author: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  publishedAt: Date;
  updatedAt: Date;
  readTime: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

/** 相关文章类型 */
export type RelatedPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  publishedAt: Date;
  readTime: number;
};

/** 服务端组件Props */
export interface BlogPostProps {
  slug: string;
  relatedPostsLimit?: number;
  showComments?: boolean;
  enableTableOfContents?: boolean;
}

// ==================== 数据获取函数 ====================

/**
 * 缓存的博客文章获取函数
 * 使用React.cache进行数据缓存
 */
const getCachedPost = cache(async (slug: string): Promise<BlogPost | null> => {
  try {
    const post = await db.blogPost.findUnique({
      where: { 
        slug,
        published: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!post) {
      return null;
    }

    // 计算阅读时间
    const readTime = Math.ceil(post.content.length / 200);

    // 获取统计数据
    const [viewCount, likeCount, commentCount] = await Promise.all([
      db.postView.count({ where: { postId: post.id } }),
      db.postLike.count({ where: { postId: post.id } }),
      db.comment.count({ where: { postId: post.id, approved: true } }),
    ]);

    return {
      ...post,
      readTime,
      viewCount,
      likeCount,
      commentCount,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
});

/**
 * 获取相关文章
 */
const getRelatedPosts = cache(async (
  postId: string,
  categoryId: string,
  limit: number = 3
): Promise<RelatedPost[]> => {
  try {
    const posts = await db.blogPost.findMany({
      where: {
        id: { not: postId },
        categoryId,
        published: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        publishedAt: true,
      },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: limit,
    });

    return posts.map(post => ({
      ...post,
      readTime: Math.ceil(post.excerpt.length / 200),
      publishedAt: post.publishedAt,
    }));
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
});

/**
 * 获取文章评论
 */
const getPostComments = cache(async (postId: string) => {
  try {
    return await db.comment.findMany({
      where: {
        postId,
        approved: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
});

/**
 * 增加文章浏览量
 */
const incrementViewCount = async (postId: string) => {
  try {
    await db.postView.create({
      data: {
        postId,
        ipAddress: '', // 在实际应用中可以获取客户端IP
        userAgent: '', // 在实际应用中可以获取用户代理
      },
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
};

// ==================== 元数据生成 ====================

/**
 * 生成页面元数据
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getCachedPost(params.slug);

  if (!post) {
    return {
      title: '文章未找到',
      description: '您查找的文章不存在或已被删除。',
    };
  }

  const publishedTime = post.publishedAt.toISOString();
  const modifiedTime = post.updatedAt.toISOString();

  return {
    title: `${post.title} - 我的博客`,
    description: post.excerpt,
    keywords: post.tags.map(tag => tag.name).join(', '),
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors: [post.author.name],
      tags: post.tags.map(tag => tag.name),
      images: post.featuredImage ? [post.featuredImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

// ==================== 辅助组件 ====================

/**
 * 文章目录组件
 */
const TableOfContents: React.FC<{ content: string }> = ({ content }) => {
  // 从内容中提取标题生成目录
  const headings = React.useMemo(() => {
    const regex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/g;
    const matches = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        level: parseInt(match[1]),
        text: match[2].replace(/<[^>]*>/g, ''),
        id: match[2].toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      });
    }
    
    return matches;
  }, [content]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="table-of-contents" aria-label="文章目录">
      <h3>目录</h3>
      <ul>
        {headings.map((heading, index) => (
          <li key={index} style={{ marginLeft: `${(heading.level - 1) * 16}px` }}>
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

/**
 * 文章信息组件
 */
const PostMeta: React.FC<{ post: BlogPost }> = ({ post }) => {
  return (
    <div className="post-meta">
      <div className="post-author">
        {post.author.avatar && (
          <Image
            src={post.author.avatar}
            alt={post.author.name}
            width={40}
            height={40}
            className="author-avatar"
          />
        )}
        <div className="author-info">
          <span className="author-name">{post.author.name}</span>
          <time className="publish-date" dateTime={post.publishedAt.toISOString()}>
            {post.publishedAt.toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>
      </div>
      
      <div className="post-stats">
        <span className="read-time">{post.readTime} 分钟阅读</span>
        <span className="view-count">{post.viewCount} 次浏览</span>
        <span className="like-count">{post.likeCount} 个赞</span>
        <span className="comment-count">{post.commentCount} 条评论</span>
      </div>
    </div>
  );
};

/**
 * 标签组件
 */
const Tags: React.FC<{ tags: BlogPost['tags'] }> = ({ tags }) => {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="post-tags">
      <span className="tags-label">标签：</span>
      {tags.map(tag => (
        <Link
          key={tag.id}
          href={`/blog/tags/${tag.slug}`}
          className="tag"
        >
          {tag.name}
        </Link>
      ))}
    </div>
  );
};

/**
 * 相关文章组件
 */
const RelatedPosts: React.FC<{ posts: RelatedPost[] }> = ({ posts }) => {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="related-posts">
      <h3>相关文章</h3>
      <div className="related-posts-grid">
        {posts.map(post => (
          <article key={post.id} className="related-post-card">
            {post.featuredImage && (
              <Link href={`/blog/${post.slug}`}>
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  width={200}
                  height={120}
                  className="related-post-image"
                />
              </Link>
            )}
            <div className="related-post-content">
              <h4>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h4>
              <p className="related-post-excerpt">{post.excerpt}</p>
              <div className="related-post-meta">
                <time>{post.publishedAt.toLocaleDateString('zh-CN')}</time>
                <span>{post.readTime} 分钟阅读</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

/**
 * 评论组件
 */
const CommentsSection: React.FC<{ postId: string }> = ({ postId }) => {
  const comments = getPostComments(postId);

  return (
    <section className="comments-section">
      <h3>评论 ({(await comments).length})</h3>
      
      <div className="comments-list">
        {(await comments).map(comment => (
          <article key={comment.id} className="comment">
            <div className="comment-header">
              {comment.author.avatar && (
                <Image
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  width={32}
                  height={32}
                  className="comment-author-avatar"
                />
              )}
              <div className="comment-meta">
                <span className="comment-author">{comment.author.name}</span>
                <time className="comment-date">
                  {comment.createdAt.toLocaleDateString('zh-CN')}
                </time>
              </div>
            </div>
            <div className="comment-content">
              {comment.content}
            </div>
          </article>
        ))}
      </div>
      
      {/* 评论表单 - 这里使用客户端组件 */}
      <CommentForm postId={postId} />
    </section>
  );
};

/**
 * 评论表单组件（客户端组件边界）
 */
const CommentForm: React.FC<{ postId: string }> = ({ postId }) => {
  return (
    <div className="comment-form-container">
      {/* 这里应该是一个客户端组件，用于处理评论提交 */}
      <p className="comment-form-placeholder">
        评论功能需要JavaScript支持
      </p>
    </div>
  );
};

// ==================== 主组件 ====================

/**
 * BlogPost 组件
 * 
 * 一个完整的服务端博客文章组件
 * 
 * @component
 * @example
 * <BlogPost 
 *   slug="my-first-blog-post" 
 *   relatedPostsLimit={3}
 *   showComments={true}
 *   enableTableOfContents={true}
 * />
 */
export const BlogPost: React.FC<BlogPostProps> = async ({
  slug,
  relatedPostsLimit = 3,
  showComments = true,
  enableTableOfContents = true,
}) => {
  // 并行获取数据
  const [post, relatedPosts] = await Promise.all([
    getCachedPost(slug),
    getRelatedPosts(slug, '', relatedPostsLimit),
  ]);

  if (!post) {
    notFound();
  }

  // 异步增加浏览量（不阻塞渲染）
  incrementViewCount(post.id).catch(console.error);

  // 结构化数据
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Person',
      name: post.author.name,
    },
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    image: post.featuredImage || undefined,
    publisher: {
      '@type': 'Organization',
      name: '我的博客',
      logo: {
        '@type': 'ImageObject',
        url: '/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`,
    },
  };

  return (
    <article className="blog-post" itemScope itemType="https://schema.org/BlogPosting">
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* 文章头部 */}
      <header className="post-header">
        <div className="post-category">
          <Link href={`/blog/categories/${post.category.slug}`}>
            {post.category.name}
          </Link>
        </div>
        
        <h1 itemProp="headline">{post.title}</h1>
        
        <PostMeta post={post} />
        
        {post.featuredImage && (
          <div className="featured-image">
            <Image
              src={post.featuredImage}
              alt={post.title}
              width={800}
              height={400}
              className="post-image"
              priority
            />
          </div>
        )}
      </header>
      
      {/* 文章内容 */}
      <div className="post-content-wrapper">
        {enableTableOfContents && (
          <aside className="post-sidebar">
            <Suspense fallback={<div>加载目录...</div>}>
              <TableOfContents content={post.content} />
            </Suspense>
          </aside>
        )}
        
        <div 
          className="post-content"
          itemProp="articleBody"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
      
      {/* 文章底部 */}
      <footer className="post-footer">
        <Tags tags={post.tags} />
        
        <div className="post-sharing">
          <h4>分享文章</h4>
          {/* 分享按钮 - 这里应该使用客户端组件 */}
          <div className="sharing-placeholder">
            分享功能需要JavaScript支持
          </div>
        </div>
      </footer>
      
      {/* 相关文章 */}
      <Suspense fallback={<div>加载相关文章...</div>}>
        <RelatedPosts posts={relatedPosts} />
      </Suspense>
      
      {/* 评论区 */}
      {showComments && (
        <Suspense fallback={<div>加载评论...</div>}>
          <CommentsSection postId={post.id} />
        </Suspense>
      )}
    </article>
  );
};

// ==================== 静态生成支持 ====================

/**
 * 生成静态参数
 * 用于静态生成
 */
export async function generateStaticParams() {
  try {
    const posts = await db.blogPost.findMany({
      where: { published: true },
      select: { slug: true },
    });

    return posts.map(post => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// ==================== 类型导出 ====================

export type { BlogPostProps, BlogPost, RelatedPost };

// ==================== 默认导出 ====================

export default BlogPost;

// ==================== 样式定义（CSS示例） ====================

/*
.blog-post {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  line-height: 1.6;
}

.post-header {
  margin-bottom: 2rem;
}

.post-category {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #f3f4f6;
  color: #374151;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.post-category a {
  color: inherit;
  text-decoration: none;
}

.post-category a:hover {
  color: #1f2937;
}

.post-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1rem;
  color: #111827;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  border-radius: 50%;
  object-fit: cover;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  color: #111827;
}

.publish-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.post-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.featured-image {
  margin: 2rem 0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.post-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.post-content-wrapper {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
  margin: 2rem 0;
}

.post-sidebar {
  position: sticky;
  top: 2rem;
  height: fit-content;
}

.table-of-contents {
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.table-of-contents h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.table-of-contents ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.table-of-contents li {
  margin: 0.5rem 0;
}

.table-of-contents a {
  color: #4b5563;
  text-decoration: none;
  font-size: 0.875rem;
  line-height: 1.4;
}

.table-of-contents a:hover {
  color: #1f2937;
}

.post-content {
  font-size: 1.125rem;
  line-height: 1.8;
  color: #374151;
}

.post-content h1,
.post-content h2,
.post-content h3,
.post-content h4,
.post-content h5,
.post-content h6 {
  margin: 2rem 0 1rem 0;
  font-weight: 600;
  color: #111827;
}

.post-content h1 { font-size: 2rem; }
.post-content h2 { font-size: 1.5rem; }
.post-content h3 { font-size: 1.25rem; }

.post-content p {
  margin: 1rem 0;
}

.post-content ul,
.post-content ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.post-content li {
  margin: 0.5rem 0;
}

.post-content blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin: 2rem 0;
  font-style: italic;
  color: #6b7280;
}

.post-content code {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', monospace;
}

.post-content pre {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 2rem 0;
}

.post-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.post-tags {
  margin-bottom: 2rem;
}

.tags-label {
  font-weight: 600;
  margin-right: 0.5rem;
}

.tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #eff6ff;
  color: #1d4ed8;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  text-decoration: none;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.tag:hover {
  background-color: #dbeafe;
}

.post-sharing {
  margin-top: 2rem;
}

.related-posts {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.related-posts h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.related-posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.related-post-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.related-post-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.related-post-content {
  padding: 1rem;
}

.related-post-content h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.related-post-content h4 a {
  color: #111827;
  text-decoration: none;
}

.related-post-content h4 a:hover {
  color: #3b82f6;
}

.related-post-excerpt {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.related-post-meta {
  font-size: 0.75rem;
  color: #9ca3af;
  display: flex;
  justify-content: space-between;
}

.comments-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.comments-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.comment {
  border-bottom: 1px solid #f3f4f6;
  padding: 1rem 0;
}

.comment:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.comment-author-avatar {
  border-radius: 50%;
  object-fit: cover;
}

.comment-meta {
  display: flex;
  flex-direction: column;
}

.comment-author {
  font-weight: 600;
  color: #111827;
}

.comment-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.comment-content {
  margin-left: 3.25rem;
  color: #374151;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .post-content-wrapper {
    grid-template-columns: 1fr;
  }
  
  .post-sidebar {
    position: static;
    margin-bottom: 2rem;
  }
  
  .post-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .post-stats {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .related-posts-grid {
    grid-template-columns: 1fr;
  }
}
*/