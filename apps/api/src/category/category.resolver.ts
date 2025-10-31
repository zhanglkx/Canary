import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Category } from './category.entity';
import { CategoryService } from './category.service';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';

@Resolver(() => Category)
@UseGuards(GqlAuthGuard)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Mutation(() => Category, { description: '创建新分类' })
  async createCategory(
    @Args('createCategoryInput') createCategoryInput: CreateCategoryInput,
    @CurrentUser() user: User,
  ): Promise<Category> {
    return this.categoryService.create(createCategoryInput, user.id);
  }

  @Query(() => [Category], { name: 'categories', description: '获取用户所有分类' })
  async findAll(@CurrentUser() user: User): Promise<Category[]> {
    return this.categoryService.findAll(user.id);
  }

  @Query(() => Category, { name: 'category', description: '根据ID获取分类详情' })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Category> {
    return this.categoryService.findOne(id, user.id);
  }

  @Mutation(() => Category, { description: '更新分类信息' })
  async updateCategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateCategoryInput') updateCategoryInput: UpdateCategoryInput,
    @CurrentUser() user: User,
  ): Promise<Category> {
    return this.categoryService.update(id, updateCategoryInput, user.id);
  }

  @Mutation(() => Boolean, { description: '删除分类' })
  async removeCategory(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.categoryService.remove(id, user.id);
  }

  @Query(() => [Category], { name: 'categoryStats', description: '获取分类统计信息' })
  async getCategoryStats(@CurrentUser() user: User) {
    return this.categoryService.getCategoryStats(user.id);
  }
}
