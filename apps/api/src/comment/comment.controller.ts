/**
 * CommentController - 评论控制器
 */

import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';

export class CreateCommentDto {
  content: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('todos/:todoId/comments')
  async create(
    @Param('todoId') todoId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentService.create(todoId, createCommentDto.content, user.id);
  }

  @Get('todos/:todoId/comments')
  async findByTodo(@Param('todoId') todoId: string, @CurrentUser() user: User) {
    return this.commentService.findByTodo(todoId, user.id);
  }

  @Delete('comments/:id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.commentService.remove(id, user.id);
    return { success: true };
  }
}
