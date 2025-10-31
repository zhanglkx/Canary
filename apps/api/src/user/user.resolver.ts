import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from './user.entity';
import { UserService } from './user.service';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User], { name: 'users' })
  @UseGuards(GqlAuthGuard)
  async findAll() {
    return this.userService.findAll();
  }

  @Query(() => User, { name: 'user' })
  @UseGuards(GqlAuthGuard)
  async findOne(@Args('id', { type: () => ID }) id: string) {
    return this.userService.findOne(id);
  }
}
