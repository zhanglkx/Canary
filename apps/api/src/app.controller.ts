/**
 * 应用控制器 - AppController
 *
 * 作用：为根路径提供简单的 HTML 首页，方便开发者快速查看服务状态和打开调试工具（Apollo Studio / GraphQL Playground）。
 * 说明：该控制器仅用于开发体验，不承担业务逻辑。页面以静态 HTML 返回，不依赖前端框架。
 * 主要导出：AppController
 */
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  getHomePage(@Res() res: Response) {
    const homePageHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>🚀 待办事项管理系统 API</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }
      .container {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 3rem;
        max-width: 600px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        background: linear-gradient(45deg, #fff, #f0f0f0);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .description {
        font-size: 1.2rem;
        margin-bottom: 2rem;
        opacity: 0.9;
        line-height: 1.6;
      }
      .buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 2rem;
      }
      .btn {
        padding: 1rem 2rem;
        border: none;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.3s ease;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      .btn-primary {
        background: linear-gradient(45deg, #ff6b6b, #ee5a24);
        color: white;
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
      }
      .btn-secondary {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }
      .features {
        text-align: left;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 1.5rem;
        margin-top: 2rem;
      }
      .features h3 {
        margin-bottom: 1rem;
        color: #fff;
      }
      .features ul {
        list-style: none;
      }
      .features li {
        padding: 0.5rem 0;
        opacity: 0.9;
      }
      .features li::before {
        content: "✅ ";
        margin-right: 0.5rem;
      }
      .status {
        margin-top: 2rem;
        padding: 1rem;
        background: rgba(76, 175, 80, 0.2);
        border-radius: 10px;
        border: 1px solid rgba(76, 175, 80, 0.3);
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🚀 待办事项管理系统</h1>
      <p class="description">
        现代化的全栈待办事项管理应用 API<br>
        基于 NestJS + GraphQL + PostgreSQL 构建
      </p>
      
      <div class="buttons">
        <a href="/apollo-studio" class="btn btn-primary">
          🎯 打开 Apollo Studio
        </a>
        <a href="/graphql" class="btn btn-secondary">
          📊 GraphQL Playground
        </a>
        <a href="/api" class="btn btn-secondary">
          📋 API 信息
        </a>
      </div>

      <div class="features">
        <h3>🌟 主要功能</h3>
        <ul>
          <li>用户认证和授权</li>
          <li>待办事项管理</li>
          <li>分类管理</li>
          <li>GraphQL API</li>
          <li>JWT 认证</li>
          <li>PostgreSQL 数据库</li>
          <li>Apollo Studio 集成</li>
        </ul>
      </div>

      <div class="status">
        <strong>🟢 服务状态：运行中</strong><br>
        <small>最后更新：${new Date().toLocaleString('zh-CN')}</small>
      </div>
    </div>
  </body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(homePageHTML);
  }

  @Get('api')
  getApiInfo() {
    return {
      name: 'Learning NestJS + Next.js API',
      version: '1.0.0',
      description: '一个现代化的全栈待办事项管理应用 API',
      endpoints: {
        graphql: '/graphql',
        apolloStudio: '/apollo-studio (现代化的 GraphQL IDE)',
      },
      features: [
        '用户认证和授权',
        '待办事项管理',
        '分类管理',
        'GraphQL API',
        'JWT 认证',
        'PostgreSQL 数据库',
        'Apollo Studio 集成',
      ],
      documentation: {
        apolloStudio: 'http://localhost:4000/apollo-studio',
        graphqlPlayground: 'http://localhost:4000/graphql',
        frontend: 'http://localhost:3000',
        guide: '查看 apollo-studio-examples.md 获取使用指南',
      },
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
