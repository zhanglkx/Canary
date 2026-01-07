/**
 * 购物车种子数据CLI命令
 *
 * 提供命令行接口用于填充购物车数据
 *
 * 使用方式:
 * - npm run seed:carts              # 填充购物车数据（默认10个）
 * - npm run seed:carts -- --count=5  # 填充指定数量的购物车
 * - npm run seed:carts -- --reseed   # 清空并重新填充
 * - npm run seed:carts -- --clear    # 清空所有购物车数据
 *
 * @author Claude
 * @module Common/Commands
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CartSeederService } from '../seeders/cart-seeder.service';

/**
 * 执行购物车种子数据命令
 */
async function runSeeder() {
  try {
    // 创建 NestJS 应用上下文
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('CartSeeder');

    // 获取种子数据服务
    const seederService = app.get(CartSeederService);

    // 解析命令行参数
    const args = process.argv.slice(2);
    const hasReseed = args.includes('--reseed');
    const hasClear = args.includes('--clear');
    
    // 解析数量参数
    const countArg = args.find(arg => arg.startsWith('--count='));
    const count = countArg ? parseInt(countArg.split('=')[1], 10) : 10;

    if (hasClear) {
      logger.log('清空所有购物车数据...');
      await seederService.clear();
      logger.log('✓ 清空完成');
    } else if (hasReseed) {
      logger.log(`重新种子化（先清空再填充 ${count} 个购物车）...`);
      const cartCount = await seederService.reseed(count);
      logger.log(`✓ 重新种子化完成，创建了 ${cartCount} 个购物车`);
    } else {
      logger.log(`填充购物车数据（${count} 个）...`);
      const cartCount = await seederService.seed(count);
      logger.log(`✓ 种子化完成，创建了 ${cartCount} 个购物车`);
    }

    await app.close();
    process.exit(0);
  } catch (error) {
    const logger = new Logger('CartSeeder');
    logger.error(`命令执行失败: ${error.message}`);
    logger.debug(error.stack);
    process.exit(1);
  }
}

// 执行命令
runSeeder();
