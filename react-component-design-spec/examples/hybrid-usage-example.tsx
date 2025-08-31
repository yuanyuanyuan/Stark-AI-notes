/**
 * 混合使用示例 - UserDashboard
 * 
 * 展示了客户端组件和服务端组件的混合使用
 * 包含了服务端数据获取、客户端交互、状态管理等完整示例
 * 
 * @author Claude
 * @created 2024-01-01
 * @updated 2024-01-01
 */

import React from 'react';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { UserDashboardClient } from '@/components/UserDashboardClient';
import { UserStats } from '@/components/UserStats';
import { RecentActivity } from '@/components/RecentActivity';
import { NotificationsPanel } from '@/components/NotificationsPanel';

// ==================== 类型定义 ====================

/** 用户信息类型 */
export type UserInfo = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: 'user' | 'admin' | 'moderator';
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
};

/** 用户统计数据类型 */
export type UserStatsData = {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalViews: number;
  followersCount: number;
  followingCount: number;
  joinDate: Date;
};

/** 最近活动类型 */
export type RecentActivityItem = {
  id: string;
  type: 'post' | 'comment' | 'like' | 'follow' | 'login';
  title: string;
  description: string;
  createdAt: Date;
  targetUrl?: string;
  isPublic: boolean;
};

/** 通知类型 */
export type Notification = {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
};

/** 服务端组件Props */
export interface UserDashboardProps {
  userId: string;
  activeTab?: string;
  timeRange?: 'day' | 'week' | 'month' | 'year';
}

// ==================== 数据获取函数 ====================

/**
 * 获取用户信息
 */
const getUserInfo = async (userId: string): Promise<UserInfo | null> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        isActive: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      role: user.role as 'user' | 'admin' | 'moderator',
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
};

/**
 * 获取用户统计数据
 */
const getUserStats = async (userId: string): Promise<UserStatsData> => {
  try {
    const [
      totalPosts,
      totalComments,
      totalLikes,
      totalViews,
      followersCount,
      followingCount,
      user,
    ] = await Promise.all([
      db.post.count({ where: { authorId: userId, published: true } }),
      db.comment.count({ where: { authorId: userId, approved: true } }),
      db.postLike.count({ where: { userId } }),
      db.postView.count({ where: { post: { authorId: userId } } }),
      db.follow.count({ where: { followingId: userId } }),
      db.follow.count({ where: { followerId: userId } }),
      db.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      }),
    ]);

    return {
      totalPosts,
      totalComments,
      totalLikes,
      totalViews,
      followersCount,
      followingCount,
      joinDate: user?.createdAt || new Date(),
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      totalPosts: 0,
      totalComments: 0,
      totalLikes: 0,
      totalViews: 0,
      followersCount: 0,
      followingCount: 0,
      joinDate: new Date(),
    };
  }
};

/**
 * 获取最近活动
 */
const getRecentActivity = async (
  userId: string,
  limit: number = 10
): Promise<RecentActivityItem[]> => {
  try {
    // 获取用户的各种活动记录
    const [posts, comments, likes, follows, logins] = await Promise.all([
      db.post.findMany({
        where: { authorId: userId, published: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          createdAt: true,
          publishedAt: true,
        },
      }),
      db.comment.findMany({
        where: { authorId: userId, approved: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          post: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      db.postLike.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          createdAt: true,
          post: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      db.follow.findMany({
        where: { followerId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          createdAt: true,
          following: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      db.userLogin.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          createdAt: true,
        },
      }),
    ]);

    // 合并和格式化活动记录
    const activities: RecentActivityItem[] = [];

    // 发布文章
    posts.forEach(post => {
      activities.push({
        id: `post-${post.id}`,
        type: 'post',
        title: '发布了新文章',
        description: post.title,
        createdAt: post.publishedAt || post.createdAt,
        targetUrl: `/blog/${post.id}`,
        isPublic: true,
      });
    });

    // 发表评论
    comments.forEach(comment => {
      activities.push({
        id: `comment-${comment.id}`,
        type: 'comment',
        title: '发表了评论',
        description: `在《${comment.post.title}》中发表了评论`,
        createdAt: comment.createdAt,
        targetUrl: `/blog/${comment.post.id}#comment-${comment.id}`,
        isPublic: true,
      });
    });

    // 点赞文章
    likes.forEach(like => {
      activities.push({
        id: `like-${like.id}`,
        type: 'like',
        title: '点赞了文章',
        description: `点赞了《${like.post.title}》`,
        createdAt: like.createdAt,
        targetUrl: `/blog/${like.post.id}`,
        isPublic: true,
      });
    });

    // 关注用户
    follows.forEach(follow => {
      activities.push({
        id: `follow-${follow.id}`,
        type: 'follow',
        title: '关注了用户',
        description: `关注了 ${follow.following.name}`,
        createdAt: follow.createdAt,
        targetUrl: `/users/${follow.following.id}`,
        isPublic: true,
      });
    });

    // 登录记录
    logins.forEach(login => {
      activities.push({
        id: `login-${login.id}`,
        type: 'login',
        title: '登录了系统',
        description: '成功登录系统',
        createdAt: login.createdAt,
        isPublic: false,
      });
    });

    // 按时间排序并限制数量
    return activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
};

/**
 * 获取用户通知
 */
const getUserNotifications = async (
  userId: string,
  unreadOnly: boolean = false
): Promise<Notification[]> => {
  try {
    const notifications = await db.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return notifications.map(notification => ({
      ...notification,
      type: notification.type as 'info' | 'warning' | 'error' | 'success',
      createdAt: notification.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// ==================== 服务端组件 ====================

/**
 * UserDashboard 组件
 * 
 * 用户仪表板的服务端组件
 * 负责数据获取、静态内容渲染和客户端组件包装
 * 
 * @component
 * @example
 * <UserDashboard 
 *   userId="user-123" 
 *   activeTab="overview"
 *   timeRange="week"
 * />
 */
export const UserDashboard: React.FC<UserDashboardProps> = async ({
  userId,
  activeTab = 'overview',
  timeRange = 'week',
}) => {
  // 并行获取所有数据
  const [userInfo, userStats, recentActivity, notifications] = await Promise.all([
    getUserInfo(userId),
    getUserStats(userId),
    getRecentActivity(userId, 10),
    getUserNotifications(userId, true),
  ]);

  if (!userInfo) {
    notFound();
  }

  // 计算一些派生数据
  const engagementRate = userStats.totalPosts > 0 
    ? Math.round(((userStats.totalLikes + userStats.totalComments) / userStats.totalPosts) * 100) / 100
    : 0;

  const accountAge = Math.floor(
    (Date.now() - userInfo.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 准备传递给客户端组件的数据
  const clientData = {
    user: userInfo,
    stats: {
      ...userStats,
      engagementRate,
      accountAge,
    },
    recentActivity,
    notifications,
    activeTab,
    timeRange,
  };

  return (
    <div className="user-dashboard">
      {/* 仪表板头部 - 服务端渲染 */}
      <header className="dashboard-header">
        <div className="user-info-section">
          <div className="user-avatar">
            {userInfo.avatar ? (
              <img
                src={userInfo.avatar}
                alt={userInfo.name}
                width={80}
                height={80}
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">
                {userInfo.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="user-details">
            <h1>{userInfo.name}</h1>
            <p className="user-email">{userInfo.email}</p>
            <div className="user-meta">
              <span className={`role-badge ${userInfo.role}`}>
                {userInfo.role}
              </span>
              <span className={`status-badge ${userInfo.isActive ? 'active' : 'inactive'}`}>
                {userInfo.isActive ? '活跃' : '非活跃'}
              </span>
              <span className="join-date">
                加入于 {userInfo.createdAt.toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
        </div>
        
        {/* 快速统计 - 服务端渲染 */}
        <div className="quick-stats">
          <div className="stat-item">
            <div className="stat-value">{userStats.totalPosts}</div>
            <div className="stat-label">文章</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{userStats.followersCount}</div>
            <div className="stat-label">粉丝</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{engagementRate.toFixed(1)}%</div>
            <div className="stat-label">参与度</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{accountAge}</div>
            <div className="stat-label">天数</div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="dashboard-content">
        {/* 侧边栏 - 服务端渲染 */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <a 
              href={`/dashboard/${userId}?tab=overview`}
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            >
              概览
            </a>
            <a 
              href={`/dashboard/${userId}?tab=posts`}
              className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`}
            >
              我的文章
            </a>
            <a 
              href={`/dashboard/${userId}?tab=comments`}
              className={`nav-item ${activeTab === 'comments' ? 'active' : ''}`}
            >
              我的评论
            </a>
            <a 
              href={`/dashboard/${userId}?tab=settings`}
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            >
              设置
            </a>
          </nav>
          
          {/* 时间范围选择器 - 服务端渲染 */}
          <div className="time-range-selector">
            <h3>时间范围</h3>
            <div className="time-range-options">
              <a 
                href={`/dashboard/${userId}?tab=${activeTab}&range=day`}
                className={`range-option ${timeRange === 'day' ? 'active' : ''}`}
              >
                今日
              </a>
              <a 
                href={`/dashboard/${userId}?tab=${activeTab}&range=week`}
                className={`range-option ${timeRange === 'week' ? 'active' : ''}`}
              >
                本周
              </a>
              <a 
                href={`/dashboard/${userId}?tab=${activeTab}&range=month`}
                className={`range-option ${timeRange === 'month' ? 'active' : ''}`}
              >
                本月
              </a>
              <a 
                href={`/dashboard/${userId}?tab=${activeTab}&range=year`}
                className={`range-option ${timeRange === 'year' ? 'active' : ''}`}
              >
                今年
              </a>
            </div>
          </div>
        </aside>

        {/* 主要内容区域 - 客户端组件处理交互 */}
        <main className="dashboard-main">
          <UserDashboardClient initialData={clientData} />
        </main>
      </div>

      {/* 通知面板 - 服务端渲染静态部分 */}
      <div className="notifications-section">
        <Suspense fallback={<div>加载通知...</div>}>
          <NotificationsPanel 
            userId={userId}
            initialNotifications={notifications}
          />
        </Suspense>
      </div>
    </div>
  );
};

// ==================== 辅助服务端组件 ====================

/**
 * 用户统计组件
 */
export const UserStatsComponent: React.FC<{ 
  userId: string;
  timeRange: string;
}> = async ({ userId, timeRange }) => {
  const stats = await getUserStats(userId);
  
  return (
    <div className="user-stats-server">
      <UserStats stats={stats} timeRange={timeRange} />
    </div>
  );
};

/**
 * 最近活动组件
 */
export const RecentActivityComponent: React.FC<{ 
  userId: string;
}> = async ({ userId }) => {
  const activities = await getRecentActivity(userId, 5);
  
  return (
    <div className="recent-activity-server">
      <RecentActivity activities={activities} />
    </div>
  );
};

// ==================== 静态生成支持 ====================

/**
 * 生成静态参数
 * 仅用于静态生成用户仪表板页面
 */
export async function generateStaticParams() {
  try {
    // 在实际应用中，这里可能只生成活跃用户的页面
    const users = await db.user.findMany({
      where: { isActive: true },
      select: { id: true },
      take: 100, // 限制生成的页面数量
    });

    return users.map(user => ({
      userId: user.id,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// ==================== 类型导出 ====================

export type { 
  UserDashboardProps, 
  UserInfo, 
  UserStatsData, 
  RecentActivityItem, 
  Notification 
};

// ==================== 默认导出 ====================

export default UserDashboard;

// ==================== 样式定义（CSS示例） ====================

/*
.user-dashboard {
  min-height: 100vh;
  background-color: #f8fafc;
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  margin-bottom: 2rem;
}

.user-info-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.user-avatar {
  flex-shrink: 0;
}

.avatar-image {
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.user-details h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
}

.user-email {
  margin: 0 0 1rem 0;
  opacity: 0.9;
}

.user-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.role-badge,
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.role-badge.admin {
  background-color: #ef4444;
}

.role-badge.moderator {
  background-color: #f59e0b;
}

.role-badge.user {
  background-color: #10b981;
}

.status-badge.active {
  background-color: #10b981;
}

.status-badge.inactive {
  background-color: #6b7280;
}

.join-date {
  font-size: 0.875rem;
  opacity: 0.8;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-item {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
  backdrop-filter: blur(10px);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.dashboard-sidebar {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  height: fit-content;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sidebar-nav {
  margin-bottom: 2rem;
}

.nav-item {
  display: block;
  padding: 0.75rem 1rem;
  color: #6b7280;
  text-decoration: none;
  border-radius: 0.375rem;
  margin-bottom: 0.25rem;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.nav-item.active {
  background-color: #3b82f6;
  color: white;
}

.time-range-selector h3 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
}

.time-range-options {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.range-option {
  padding: 0.5rem 0.75rem;
  color: #6b7280;
  text-decoration: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.range-option:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.range-option.active {
  background-color: #eff6ff;
  color: #1d4ed8;
}

.dashboard-main {
  background-color: white;
  border-radius: 0.5rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.notifications-section {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

@media (max-width: 768px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .dashboard-sidebar {
    order: 2;
  }
  
  .user-info-section {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .user-meta {
    justify-content: center;
  }
}
*/