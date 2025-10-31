'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { NoSSR } from '@/components/ui/no-ssr';

const features = [
  {
    icon: '📋',
    title: '智能任务管理',
    description: '创建、编辑和跟踪你的待办事项，支持优先级和截止日期设置',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: '📁',
    title: '分类组织',
    description: '使用自定义分类和颜色标签来组织你的任务，让工作更有条理',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: '📊',
    title: '数据洞察',
    description: '通过详细的统计和可视化图表了解你的工作效率和进度',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: '🔍',
    title: '强大搜索',
    description: '快速搜索和过滤功能，轻松找到你需要的任务和信息',
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    icon: '🎨',
    title: '个性化体验',
    description: '支持深色模式和自定义主题，打造专属于你的工作环境',
    color: 'from-pink-500 to-pink-600',
  },
  {
    icon: '⚡',
    title: '实时同步',
    description: '数据实时同步，在任何设备上都能访问最新的任务状态',
    color: 'from-indigo-500 to-indigo-600',
  },
];

const stats = [
  { label: '活跃用户', value: '10K+', icon: '👥' },
  { label: '完成任务', value: '50K+', icon: '✅' },
  { label: '创建分类', value: '5K+', icon: '📁' },
  { label: '用户满意度', value: '98%', icon: '⭐' },
];

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/5 dark:to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              让效率
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                触手可及
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              一个现代化的待办事项管理应用，帮助你组织任务、提升效率、实现目标。
              使用 NestJS、Next.js 和 GraphQL 构建的全栈解决方案。
            </p>

            <NoSSR fallback={<div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      <span className="mr-2">📊</span>
                      查看仪表板
                    </Link>
                    <Link
                      href="/todos"
                      className="inline-flex items-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transform hover:scale-105 transition-all duration-200 shadow-lg border border-gray-200 dark:border-gray-700"
                    >
                      <span className="mr-2">📋</span>
                      管理任务
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      <span className="mr-2">🚀</span>
                      开始使用
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex items-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transform hover:scale-105 transition-all duration-200 shadow-lg border border-gray-200 dark:border-gray-700"
                    >
                      <span className="mr-2">👋</span>
                      立即登录
                    </Link>
                  </>
                )}
              </div>
            </NoSSR>

            {isAuthenticated && (
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-blue-800 dark:text-blue-200">
                  欢迎回来，<span className="font-semibold">{user?.username}</span>！
                  继续管理你的任务，保持高效工作。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              强大功能，简单易用
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              我们精心设计了每一个功能，让你的工作更加高效和愉悦
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} text-white text-2xl mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access Section */}
      {isAuthenticated && (
        <div className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                快速访问
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                直接跳转到你最常用的功能
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link
                href="/dashboard"
                className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-all duration-200 border border-blue-200 dark:border-blue-800"
              >
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">仪表板</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">查看统计和数据洞察</p>
              </Link>

              <Link
                href="/todos"
                className="group p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 transition-all duration-200 border border-green-200 dark:border-green-800"
              >
                <div className="text-3xl mb-3">📋</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">待办事项</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">管理你的任务列表</p>
              </Link>

              <Link
                href="/categories"
                className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 transition-all duration-200 border border-purple-200 dark:border-purple-800"
              >
                <div className="text-3xl mb-3">📁</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">分类管理</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">组织和管理分类</p>
              </Link>

              <Link
                href="/profile"
                className="group p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl hover:from-yellow-100 hover:to-yellow-200 dark:hover:from-yellow-800/30 dark:hover:to-yellow-700/30 transition-all duration-200 border border-yellow-200 dark:border-yellow-800"
              >
                <div className="text-3xl mb-3">👤</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">个人资料</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">管理账户和设置</p>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Technology Stack */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              现代技术栈
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              使用最新的技术构建，确保性能和可靠性
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[
              { name: 'Next.js 15', icon: '⚛️' },
              { name: 'NestJS 10', icon: '🐱' },
              { name: 'GraphQL', icon: '🚀' },
              { name: 'TypeScript', icon: '📘' },
              { name: 'PostgreSQL', icon: '🐘' },
              { name: 'Tailwind CSS', icon: '🎨' },
            ].map((tech, index) => (
              <div key={index} className="text-center group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  {tech.icon}
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {tech.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              准备好提升你的效率了吗？
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              加入我们，开始你的高效工作之旅
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <span className="mr-2">🚀</span>
                免费注册
              </Link>
              <a
                href="http://localhost:4000/graphql"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-200"
              >
                <span className="mr-2">🔧</span>
                GraphQL Playground
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Learning NestJS + Next.js</h3>
            <p className="text-gray-400 mb-6">
              一个现代化的全栈待办事项管理应用
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <span>Built with ❤️ using modern technologies</span>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-500">
              © 2024 Learning Project. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}