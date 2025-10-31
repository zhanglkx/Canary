import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Todo } from './todo.entity';
import { TodoService } from './todo.service';
import { CreateTodoInput } from './dto/create-todo.input';
import { UpdateTodoInput } from './dto/update-todo.input';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';

@Resolver(() => Todo)
@UseGuards(GqlAuthGuard)
export class TodoResolver {
  constructor(private readonly todoService: TodoService) {}

  @Mutation(() => Todo)
  async createTodo(
    @Args('createTodoInput') createTodoInput: CreateTodoInput,
    @CurrentUser() user: User,
  ) {
    return this.todoService.create(createTodoInput, user.id);
  }

  @Query(() => [Todo], { name: 'todos' })
  async findAll(@CurrentUser() user: User) {
    return this.todoService.findAll(user.id);
  }

  @Query(() => Todo, { name: 'todo' })
  async findOne(@Args('id', { type: () => ID }) id: string, @CurrentUser() user: User) {
    return this.todoService.findOne(id, user.id);
  }

  @Mutation(() => Todo)
  async updateTodo(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateTodoInput') updateTodoInput: UpdateTodoInput,
    @CurrentUser() user: User,
  ) {
    return this.todoService.update(id, updateTodoInput, user.id);
  }

  @Mutation(() => Boolean)
  async removeTodo(@Args('id', { type: () => ID }) id: string, @CurrentUser() user: User) {
    return this.todoService.remove(id, user.id);
  }
}
