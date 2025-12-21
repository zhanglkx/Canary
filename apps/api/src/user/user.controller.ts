/**
 * UserController - 用户管理控制器
 *
 * 提供 RESTful 用户接口：
 * - GET /api/users/me - 获取当前用户
 * - GET /api/users/:id - 获取指定用户
 * - PUT /api/users/:id - 更新用户信息
 * - GET /api/users/stats - 获取用户统计信息
 */

import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET /api/users/me
   * 获取当前用户信息
   */
  @Get('me')
  async getCurrentUser(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  /**
   * GET /api/users/:id
   * 获取指定用户信息（仅限自己的资料）
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<User> {
    // 只允许用户查看自己的资料
    if (id !== user.id) {
      throw new Error('Unauthorized: You can only view your own profile');
    }
    return this.userService.findOne(id);
  }

  /**
   * PUT /api/users/:id
   * 更新用户信息
   */
  @Put(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: User,
  ): Promise<User> {
    // 只允许用户更新自己的资料
    if (id !== user.id) {
      throw new Error('Unauthorized: You can only update your own profile');
    }
    return this.userService.update(id, updateUserDto);
  }

  /**
   * GET /api/users/stats
   * 获取用户统计信息
   */
  @Get('stats')
  async userStats(@CurrentUser() user: User): Promise<any> {
    return this.userService.getUserStats(user.id);
  }
}
