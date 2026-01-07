'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { NoSSR } from '@/components/ui/no-ssr';
import styles from './page.module.less';

const features = [
  {
    icon: '📋',
    title: '智能任务管理',
    description: '创建、编辑和跟踪你的待办事项，支持优先级和截止日期设置',
    colorClass: 'featureIconBlue',
  },
  {
    icon: '📁',
    title: '分类组织',
    description: '使用自定义分类和颜色标签来组织你的任务，让工作更有条理',
    colorClass: 'featureIconPurple',
  },
  {
    icon: '📊',
    title: '数据洞察',
    description: '通过详细的统计和可视化图表了解你的工作效率和进度',
    colorClass: 'featureIconGreen',
  },
  {
    icon: '🔍',
    title: '强大搜索',
    description: '快速搜索和过滤功能，轻松找到你需要的任务和信息',
    colorClass: 'featureIconYellow',
  },
  {
    icon: '🎨',
    title: '个性化体验',
    description: '支持深色模式和自定义主题，打造专属于你的工作环境',
    colorClass: 'featureIconPink',
  },
  {
    icon: '⚡',
    title: '实时同步',
    description: '数据实时同步，在任何设备上都能访问最新的任务状态',
    colorClass: 'featureIconIndigo',
  },
];

const stats = [
  { label: '活跃用户', value: '10K+', icon: '👥' },
  { label: '完成任务', value: '50K+', icon: '✅' },
  { label: '创建分类', value: '5K+', icon: '📁' },
  { label: '用户满意度', value: '98%', icon: '⭐' },
];

const techStack = [
  { name: 'Next.js 16', icon: '⚛️' },
  { name: 'NestJS 11', icon: '🐱' },
  { name: 'REST API', icon: '🚀' },
  { name: 'TypeScript', icon: '📘' },
  { name: 'PostgreSQL', icon: '🐘' },
  { name: 'Less + CSS Modules', icon: '🎨' },
];

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroBackground}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            让效率1
            <span className={styles.gradient}>触手可及</span>
          </h1>
          <p className={styles.description}>
            一个现代化的待办事项管理应用，帮助你组织任务、提升效率、实现目标。
            使用 NestJS、Next.js 和 REST API 构建的全栈解决方案。
          </p>

          <NoSSR fallback={<div style={{ height: '48px', background: '#e5e7eb', borderRadius: '8px' }}></div>}>
            <div className={styles.buttonGroup}>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className={styles.buttonPrimary}>
                    <span style={{ marginRight: '8px' }}>📊</span>
                    查看仪表板
                  </Link>
                  <Link href="/todos" className={styles.buttonSecondary}>
                    <span style={{ marginRight: '8px' }}>📋</span>
                    管理任务
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register" className={styles.buttonPrimary}>
                    <span style={{ marginRight: '8px' }}>🚀</span>
                    开始使用
                  </Link>
                  <Link href="/login" className={styles.buttonSecondary}>
                    <span style={{ marginRight: '8px' }}>👋</span>
                    立即登录
                  </Link>
                </>
              )}
            </div>
          </NoSSR>

          {isAuthenticated && (
            <div className={styles.welcomeMessage}>
              <p>
                欢迎回来，<span className={styles.username}>{user?.username}</span>！
                继续管理你的任务，保持高效工作。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className={styles.statsSection}>
        <div className={styles.statsContainer}>
          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statItem}>
                <div className={styles.statIcon}>{stat.icon}</div>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={styles.featuresSection}>
        <div className={styles.statsContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>强大功能，简单易用</h2>
            <p className={styles.sectionDescription}>
              我们精心设计了每一个功能，让你的工作更加高效和愉悦
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles[feature.colorClass]}>
                  {feature.icon}
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access Section */}
      {isAuthenticated && (
        <div className={styles.quickAccessSection}>
          <div className={styles.statsContainer}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>快速访问</h2>
              <p className={styles.sectionDescription}>直接跳转到你最常用的功能</p>
            </div>

            <div className={styles.quickAccessGrid}>
              <Link href="/dashboard" className={styles.quickAccessCardBlue}>
                <div className={styles.quickAccessIcon}>📊</div>
                <h3 className={styles.quickAccessTitle}>仪表板</h3>
                <p className={styles.quickAccessDescription}>查看统计和数据洞察</p>
              </Link>

              <Link href="/todos" className={styles.quickAccessCardGreen}>
                <div className={styles.quickAccessIcon}>📋</div>
                <h3 className={styles.quickAccessTitle}>待办事项</h3>
                <p className={styles.quickAccessDescription}>管理你的任务列表</p>
              </Link>

              <Link href="/categories" className={styles.quickAccessCardPurple}>
                <div className={styles.quickAccessIcon}>📁</div>
                <h3 className={styles.quickAccessTitle}>分类管理</h3>
                <p className={styles.quickAccessDescription}>组织和管理分类</p>
              </Link>

              <Link href="/profile" className={styles.quickAccessCardYellow}>
                <div className={styles.quickAccessIcon}>👤</div>
                <h3 className={styles.quickAccessTitle}>个人资料</h3>
                <p className={styles.quickAccessDescription}>管理账户和设置</p>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Technology Stack */}
      <div className={styles.techSection}>
        <div className={styles.statsContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>现代技术栈</h2>
            <p className={styles.sectionDescription}>
              使用最新的技术构建，确保性能和可靠性
            </p>
          </div>

          <div className={styles.techGrid}>
            {techStack.map((tech, index) => (
              <div key={index} className={styles.techItem}>
                <div className={styles.techIcon}>{tech.icon}</div>
                <div className={styles.techName}>{tech.name}</div>
              </div>
            ))}
          </div>

          {/* Developer Tools */}
          <div>
            <h3 className={styles.devToolsHeader}>开发者工具</h3>
            <div className={styles.devToolsButtons}>
              <a
                href="http://localhost:4000/api"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.devToolButtonBlue}
              >
                <span style={{ marginRight: '8px' }}>🔧</span>
                API 文档
              </a>
              <a
                href="http://localhost:4000"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.devToolButtonGreen}
              >
                <span style={{ marginRight: '8px' }}>📋</span>
                API 信息
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className={styles.ctaSection}>
          <div className={styles.ctaContainer}>
            <h2 className={styles.ctaTitle}>准备好提升你的效率了吗？</h2>
            <p className={styles.ctaDescription}>加入我们，开始你的高效工作之旅</p>
            <div className={styles.ctaButtons}>
              <Link href="/register" className={styles.ctaButtonWhite}>
                <span style={{ marginRight: '8px' }}>🚀</span>
                免费注册
              </Link>
              <a
                href="http://localhost:4000/api"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaButtonBorder}
              >
                <span style={{ marginRight: '8px' }}>🔧</span>
                API 文档
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <h3 className={styles.footerTitle}>Learning NestJS + Next.js</h3>
          <p className={styles.footerDescription}>一个现代化的全栈待办事项管理应用</p>
          <div className={styles.footerMeta}>
            <span>Built with ❤️ using modern technologies</span>
          </div>
          <div className={styles.footerCopyright}>
            © 2024 Learning Project. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
