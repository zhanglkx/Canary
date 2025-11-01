/**
 * Apollo Studio 控制器 (ApolloStudioController)
 *
 * 核心功能：
 * 为开发者提供一个可视化的 GraphQL IDE（集成开发环境）
 * 在这里你可以：
 * - 编写和测试 GraphQL 查询、变更、订阅
 * - 查看 API 文档和数据类型定义
 * - 查看查询结果和错误信息
 * - 管理 HTTP 头部和环境变量（用于认证）
 *
 * 访问地址：http://localhost:4000/apollo-studio
 *
 * 技术说明：
 * - 这是一个简单的 HTTP 控制器，返回包含 Apollo Studio 嵌入脚本的 HTML
 * - Apollo Studio 是一个由 Apollo 官方提供的 GraphQL 开发工具
 * - 它通过 CDN 加载，所以需要网络连接
 *
 * 对于初学者：
 * Apollo Studio 就像是给 GraphQL API 的"测试工具"，类似于 Postman 对 REST API 的作用
 */
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

/**
 * @Controller() 装饰器
 * 标记这个类为 NestJS 控制器
 * 所有 @Get 装饰的方法都会处理 HTTP GET 请求
 */
@Controller()
export class ApolloStudioController {
  /**
   * GET /apollo-studio 路由处理器
   *
   * @Res() res: Response - 获取 Express Response 对象，用于手动控制响应
   *
   * 功能：
   * 1. 返回包含 Apollo Studio 脚本的 HTML 页面
   * 2. Apollo Studio 会自动连接到 /graphql 端点
   * 3. 设置深色主题和其他开发友好的选项
   * 4. 显示 API 文档（通过 GraphQL introspection）
   */
  @Get('apollo-studio')
  getApolloStudio(@Res() res: Response) {
    // 创建 Apollo Studio 的 HTML 页面内容
    // 这个 HTML 包含了 Apollo 官方提供的 Studio 应用
    const apolloStudioHTML = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'nonce-apollo-studio' https://apollo-server-landing-page.cdn.apollographql.com https://embeddable-sandbox.cdn.apollographql.com https://embeddable-explorer.cdn.apollographql.com; style-src 'nonce-apollo-studio' https://apollo-server-landing-page.cdn.apollographql.com https://embeddable-sandbox.cdn.apollographql.com https://embeddable-explorer.cdn.apollographql.com https://fonts.googleapis.com; img-src https://apollo-server-landing-page.cdn.apollographql.com; manifest-src https://apollo-server-landing-page.cdn.apollographql.com; frame-src https://explorer.embed.apollographql.com https://sandbox.embed.apollographql.com" />
    <link rel="icon" href="https://apollo-server-landing-page.cdn.apollographql.com/_latest/assets/favicon.png" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="preconnect" href="https://fonts.gstatic.com" />
    <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,400;0,600;1,400;1,600&display=swap" rel="stylesheet" />
    <title>🚀 待办事项管理系统 GraphQL API</title>
  </head>
  <body style="margin: 0; overflow-x: hidden; overflow-y: hidden">
    <div id="react-root">
      <style nonce="apollo-studio">
        .fallback {
          opacity: 0;
          animation: fadeIn 0.30s ease-in-out forwards;
          margin: 2rem;
          font-family: 'Source Sans Pro', sans-serif;
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
      </style>
      <div class="fallback">
        <h1>🚀 待办事项管理系统 GraphQL API</h1>
        <p>正在加载 Apollo Studio...</p>
        <p>如果界面没有加载，请检查网络连接。</p>
      </div>
    </div>
    <script nonce="apollo-studio" src="https://apollo-server-landing-page.cdn.apollographql.com/_latest/static/js/main.js"></script>
    <script nonce="apollo-studio">
      window.landingPage = {
        version: 1,
        config: {
          displayOptions: {
            showHeadersAndEnvVars: true,
            docsPanelState: "open",
            theme: "dark"
          },
          persistExplorerState: true,
          embed: {
            endpointUrl: window.location.origin + "/graphql",
            displayOptions: {
              showHeadersAndEnvVars: true,
              docsPanelState: "open", 
              theme: "dark"
            }
          },
          graphRef: "",
          routerConfig: {
            title: "🚀 待办事项管理系统",
            subtitle: "现代化的 GraphQL API - 支持用户认证、待办事项管理和分类功能"
          }
        }
      };
    </script>
  </body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(apolloStudioHTML);
  }
}
