/**
 * 产品种子数据CLI命令
 *
 * 提供命令行接口用于填充和管理产品数据
 * 支持 NestJS 的 CLI runner
 *
 * 使用方式:
 * - npm run seed:products              # 填充产品数据
 * - npm run seed:products -- --reseed  # 清空并重新填充
 * - npm run seed:products -- --clear   # 清空所有产品数据
 *
 * @author Claude
 * @module Common/Commands
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ProductSeederService } from '../seeders/product-seeder.service';

/**
 * 执行产品种子数据命令
 */
async function runSeeder() {
  try {
    // 创建 NestJS 应用上下文
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('ProductSeeder');

    // 获取种子数据服务
    const seederService = app.get(ProductSeederService);

    // 解析命令行参数
    const args = process.argv.slice(2);
    const hasReseed = args.includes('--reseed');
    const hasClear = args.includes('--clear');

    if (hasClear) {
      logger.log('清空所有产品数据...');
      await seederService.clearProducts();
      logger.log('✓ 清空完成');
    } else if (hasReseed) {
      logger.log('重新种子化（先清空再填充）...');
      const count = await seederService.reseed();
      logger.log(`✓ 重新种子化完成，创建了 ${count} 个产品`);
    } else {
      logger.log('填充产品数据...');
      const count = await seederService.seed();
      logger.log(`✓ 种子化完成，创建了 ${count} 个产品`);
    }

    await app.close();
    process.exit(0);
  } catch (error) {
    const logger = new Logger('ProductSeeder');
    logger.error(`命令执行失败: ${error.message}`);
    logger.debug(error.stack);
    process.exit(1);
  }
}

// 执行命令
runSeeder();
