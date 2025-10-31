import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getApiInfo() {
    return {
      name: 'Learning NestJS + Next.js API',
      version: '1.0.0',
      description: '一个现代化的全栈待办事项管理应用 API',
      endpoints: {
        graphql: '/graphql',
        playground: '/graphql (在浏览器中访问)',
      },
      features: [
        '用户认证和授权',
        '待办事项管理',
        '分类管理',
        'GraphQL API',
        'JWT 认证',
        'PostgreSQL 数据库',
      ],
      documentation: {
        graphql_playground: 'http://localhost:4000/graphql',
        frontend: 'http://localhost:3000',
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
