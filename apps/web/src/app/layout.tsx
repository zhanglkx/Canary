import type { Metadata } from 'next';
import '@/styles/globals.scss';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/navbar';
import { ErrorBoundary } from '@/components/error-boundary';

export const metadata: Metadata = {
  title: 'Learning NestJS + Next.js + REST API',
  description: 'A learning project with NestJS, Next.js, and REST API',
};

// 获取构建信息（服务端组件中可以直接访问环境变量）
function getBuildInfo() {
  try {
    const buildInfo = process.env.BUILD_INFO
      ? JSON.parse(process.env.BUILD_INFO)
      : {
        buildId: 'development',
        buildTime: new Date().toISOString(),
        gitCommit: 'dev',
        gitBranch: 'dev',
        gitTag: 'dev',
      };
    return buildInfo;
  } catch (error) {
    return {
      buildId: 'unknown',
      buildTime: new Date().toISOString(),
      gitCommit: 'unknown',
      gitBranch: 'unknown',
      gitTag: 'unknown',
    };
  }
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
    <html lang="en">
      <head>
        {/* 将构建信息注入到 window 对象，供客户端使用 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  window.buildInfo = ${buildInfoJson};
                  window.buildId = '${buildInfo.buildId}';
                  if (typeof console !== 'undefined' && console.log) {
                    console.log('%c🚀 Build Info', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
                    console.log('Build ID:', window.buildId);
                    console.log('Build Time:', '${buildInfo.buildTime}');
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
