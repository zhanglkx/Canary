/**
 * 用户种子数据服务
 *
 * 在应用启动时自动创建初始管理员用户
 * 如果用户已存在，则跳过创建
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/user.entity';
import { UserService } from '../../user/user.service';

@Injectable()
export class UserSeederService implements OnModuleInit {
  private readonly logger = new Logger(UserSeederService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userService: UserService,
  ) {}

  /**
   * 模块初始化时自动执行
   */
  async onModuleInit() {
    await this.seed();
  }

  /**
   * 创建初始用户
   */
  async seed(): Promise<void> {
    try {
      // 检查是否已存在管理员用户
      const existingUser = await this.userRepository.findOne({
        where: { email: 'admin@admin.com' },
      });

      if (existingUser) {
        this.logger.log('初始管理员用户已存在，跳过创建');
        return;
      }

      // 创建初始管理员用户
      const createUserInput = {
        email: 'admin@admin.com',
        username: 'admin',
        password: 'password',
      };
      await this.userService.create(createUserInput);

      this.logger.log('✓ 初始管理员用户创建成功');
      this.logger.log('  邮箱: admin@admin.com');
      this.logger.log('  密码: password');
    } catch (error) {
      this.logger.error(`用户种子数据创建失败: ${error.message}`);
      // 不抛出错误，避免阻止应用启动
    }
  }
}
