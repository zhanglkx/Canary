import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class ApolloStudioController {
  @Get('apollo-studio')
  getApolloStudio(@Res() res: Response) {
    // 提供 Apollo Studio 界面
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
