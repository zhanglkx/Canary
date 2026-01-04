/**
 * TagController - 标签控制器
 */

import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TagService } from './tag.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';

export class CreateTagDto {
  name: string;
  color?: string;
}

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  async create(@Body() createTagDto: CreateTagDto, @CurrentUser() user: User) {
    return this.tagService.create(createTagDto, user);
  }

  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.tagService.findByUser(user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.tagService.remove(id, user.id);
    return { success: true };
  }
}
