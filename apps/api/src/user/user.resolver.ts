import { Resolver, Query, Args, ID, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from './user.entity';
import { UserService } from './user.service';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => User, { name: 'currentUser' })
  @UseGuards(GqlAuthGuard)
  async getCurrentUser(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Query(() => User, { name: 'user' })
  @UseGuards(GqlAuthGuard)
  async findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<User> {
    // Only allow users to view their own profile or implement admin check
    if (id !== user.id) {
      throw new Error('Unauthorized: You can only view your own profile');
    }
    return this.userService.findOne(id);
  }

  /**
   * Mutation: 更新用户信息
   *
   * GraphQL 变更示例：
   * mutation {
   *   updateProfile(updateUserInput: {
   *     username: "newusername"
   *     email: "newemail@example.com"
   *   }) {
   *     id
   *     username
   *     email
   *   }
   * }
   */
  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  async updateProfile(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @CurrentUser() user: User,
  ): Promise<User> {
    return this.userService.update(user.id, updateUserInput);
  }

  /**
   * Query: 获取用户统计信息（Todo 统计、标签数等）
   *
   * GraphQL 查询示例：
   * query {
   *   userStats {
   *     totalTodos
   *     completedTodos
   *     totalCategories
   *     totalTags
   *   }
   * }
   */
  @Query(() => String, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async userStats(@CurrentUser() user: User): Promise<string> {
    const stats = await this.userService.getUserStats(user.id);
    return JSON.stringify(stats);
  }
}
