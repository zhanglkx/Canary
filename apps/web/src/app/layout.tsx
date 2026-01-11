import type { Metadata } from 'next';
import '@/styles/globals.scss';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/navbar';
import { ErrorBoundary } from '@/components/error-boundary';

export const metadata: Metadata = {
  title: '牛逼之路',
  description: 'A learning project with NestJS, Next.js, and REST API',
};

// 获取构建信息（服务端组件中可以直接访问环境变量）
function getBuildInfo() {
  try {
    const buildInfo = process.env.BUILD_INFO
      ? JSON.parse(process.env.BUILD_INFO)
      : {
        buildId: 'development',
        buildTime: getChinaTime(),
        gitCommit: 'dev',
        gitBranch: 'dev',
        gitTag: 'dev',
      };
    return buildInfo;
  } catch (error) {
    return {
      buildId: 'unknown',
      buildTime: getChinaTime(),
      gitCommit: 'unknown',
      gitBranch: 'unknown',
      gitTag: 'unknown',
    };
  }
}

// 获取中国时区时间
function getChinaTime() {
  const now = new Date();
  const chinaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return chinaTime.toISOString().replace('Z', '+08:00');
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const buildInfo = getBuildInfo();

  // 转义 JSON 字符串，防止 XSS
  const buildInfoJson = JSON.stringify(buildInfo).replace(/</g, '\\u003c');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 防止暗色模式闪烁：在 HTML 渲染前设置主题类 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 在页面渲染前检测并应用主题，防止 FOUC（闪烁）
                  const stored = localStorage.getItem('theme');
                  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                  const prefersDark = mediaQuery.matches;
                  
                  // 如果用户已保存主题偏好，使用保存的值；否则使用系统偏好
                  if (stored === 'dark' || (!stored && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  // 如果出错，默认使用浅色模式
                  console.error('Failed to set theme:', e);
                }
              })();
            `,
          }}
        />
        {/* 将构建信息注入到 window 对象，供客户端使用 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  window.buildInfo = ${buildInfoJson};
                  window.buildId = '${buildInfo.buildId}';
                  if (typeof console !== 'undefined' && console.log) {
                    // 将构建时间转换为中国时区的可读格式
                    const buildTimeStr = '${buildInfo.buildTime}';
                    const buildDate = new Date(buildTimeStr);
                    const chinaTimeStr = buildDate.toLocaleString('zh-CN', {
                      timeZone: 'Asia/Shanghai',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    });
                    
                    console.log('%c🚀 Build Info', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
                    console.log('Build ID:', window.buildId);
                    console.log('Build Time (China):', chinaTimeStr + ' (UTC+8)');
                    console.log('Build Time (ISO):', buildTimeStr);
                    console.log('Git Commit:', '${buildInfo.gitCommit}');
                    console.log('Git Branch:', '${buildInfo.gitBranch}');
                    console.log('Git Tag:', '${buildInfo.gitTag}');
                    console.log('Full Info:', window.buildInfo);
                  }
                } catch (e) {
                  console.error('Failed to set build info:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning={true}>
        <ErrorBoundary>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
