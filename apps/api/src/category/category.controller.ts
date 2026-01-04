/**
 * CategoryController - 分类控制器
 */

import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';

export class CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export class UpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto, @CurrentUser() user: User) {
    return this.categoryService.create(createCategoryDto, user.id);
  }

  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.categoryService.findAll(user.id);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: User) {
    return this.categoryService.getCategoryStats(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.categoryService.findOne(id, user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() user: User,
  ) {
    return this.categoryService.update(id, updateCategoryDto, user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.categoryService.remove(id, user.id);
    return { success: true };
  }
}
