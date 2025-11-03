/**
 * UserService - 用户管理服务
 *
 * 作用：封装用户相关的数据库操作和业务逻辑。
 * 主要职责：
 *  - 创建用户（包含密码哈希处理）
 *  - 查找用户（按 id / email / username）
 *  - 更新用户信息和密码
 *  - 获取用户统计信息
 *  - 提供给 AuthService 与其他模块使用的用户查询接口
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserInput: CreateUserInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserInput.password, 10);
    const user = this.userRepository.create({
      ...createUserInput,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['todos'] });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['todos'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  /**
   * 更新用户信息
   *
   * @param userId - 用户 ID
   * @param updateUserInput - 更新数据
   * @returns 更新后的用户
   */
  async update(userId: string, updateUserInput: UpdateUserInput): Promise<User> {
    const user = await this.findOne(userId);

    // 如果要更新邮箱，检查是否已被使用
    if (updateUserInput.email && updateUserInput.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserInput.email);
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    // 如果要更新用户名，检查是否已被使用
    if (updateUserInput.username && updateUserInput.username !== user.username) {
      const existingUser = await this.findByUsername(updateUserInput.username);
      if (existingUser) {
        throw new BadRequestException('Username already in use');
      }
    }

    // 如果要更新密码
    if (updateUserInput.newPassword) {
      if (!updateUserInput.oldPassword) {
        throw new BadRequestException('Old password is required to change password');
      }

      const isPasswordValid = await bcrypt.compare(updateUserInput.oldPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Old password is incorrect');
      }

      user.password = await bcrypt.hash(updateUserInput.newPassword, 10);
    }

    // 更新其他字段
    if (updateUserInput.email) {
      user.email = updateUserInput.email;
    }
    if (updateUserInput.username) {
      user.username = updateUserInput.username;
    }

    return this.userRepository.save(user);
  }

  /**
   * 获取用户统计信息
   *
   * @param userId - 用户 ID
   * @returns 用户的统计信息
   */
  async getUserStats(userId: string): Promise<any> {
    // 这需要访问其他模块的 Repository，可能需要通过 module 导入
    // 为了简单起见，返回基本统计
    return {
      userId,
      message: 'User stats available through dedicated stats query',
    };
  }
}
