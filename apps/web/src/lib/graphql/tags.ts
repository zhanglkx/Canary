/**
 * 标签模块 GraphQL 操作
 *
 * 这个文件定义了所有与标签相关的 GraphQL 查询和变更操作。
 *
 * 学习点 - 多对多关系：
 * 1. 一个标签可以被多个 Todo 使用
 * 2. 一个 Todo 可以有多个标签
 * 3. 前端需要支持批量添加/移除标签
 * 4. 标签管理和 Todo 标签关联是两个独立的操作
 *
 * 对应后端：
 * - TagResolver (apps/api/src/tag/tag.resolver.ts)
 * - TagService (apps/api/src/tag/tag.service.ts)
 * - Todo Entity 的 @ManyToMany(() => Tag) 关系
 */

import { gql } from '@apollo/client';

/**
 * 获取当前用户的所有标签
 *
 * GraphQL 查询概览：
 * - 参数：无
 * - 返回：标签列表数组
 *
 * 数据结构：
 * {
 *   id: 标签的唯一标识
 *   name: 标签名称（如 "紧急"、"后端"）
 *   color: 标签颜色（十六进制，如 "#FF5733"）
 *   todos: 使用该标签的所有待办事项
 *   createdAt: 创建时间
 * }
 *
 * 使用场景：
 * 1. 初始化标签列表
 * 2. 显示标签管理界面
 * 3. 填充标签选择器的选项
 *
 * 使用示例：
 * ```
 * const { data, loading } = useQuery(GET_TAGS);
 *
 * if (loading) return <Loading />;
 * const tags = data?.tags;
 *
 * tags.map(tag => (
 *   <TagOption key={tag.id} label={tag.name} color={tag.color} />
 * ))
 * ```
 *
 * 对应后端：
 * @Query(() => [Tag])
 * @UseGuards(GqlAuthGuard)
 * async tags(@CurrentUser() user: User): Promise<Tag[]>
 */
export const GET_TAGS = gql`
  query GetTags {
    /**
     * tags: 返回当前用户的所有标签
     * 后端会自动过滤只返回该用户创建的标签
     */
    tags {
      id
      name
      color
      /**
       * todos 字段是可选的，显示该标签被用于哪些 Todo
       * 这样可以在标签管理页面显示每个标签的使用情况
       */
      todos {
        id
        title
      }
      createdAt
    }
  }
`;

/**
 * 创建新标签
 *
 * GraphQL Mutation 概览：
 * - 参数：name（标签名称）、color（标签颜色，可选）
 * - 作用：在数据库中创建新的标签
 * - 返回：新创建的标签对象
 *
 * 权限控制：
 * - 后端使用 @UseGuards(GqlAuthGuard) 确保用户已登录
 * - 自动将 userId 设置为当前认证用户
 * - 用户只能创建属于自己的标签
 *
 * 业务规则：
 * - 标签名称必须唯一（在同一用户内）
 * - 颜色是可选的，可以由前端默认设置
 * - 创建后可以立即用于添加到 Todo
 *
 * 使用示例：
 * ```
 * const [createTag] = useMutation(CREATE_TAG);
 *
 * await createTag({
 *   variables: {
 *     name: '紧急',
 *     color: '#FF5733'
 *   },
 *   refetchQueries: [{ query: GET_TAGS }]  // 刷新标签列表
 * });
 * ```
 *
 * 对应后端：
 * @Mutation(() => Tag)
 * @UseGuards(GqlAuthGuard)
 * async createTag(
 *   @Args('createTagInput') createTagInput: CreateTagInput,
 *   @CurrentUser() user: User
 * ): Promise<Tag>
 */
export const CREATE_TAG = gql`
  mutation CreateTag($name: String!, $color: String) {
    /**
     * createTag: 创建标签的 Mutation
     * 返回新创建的标签对象
     */
    createTag(createTagInput: { name: $name, color: $color }) {
      id
      name
      color
      createdAt
    }
  }
`;

/**
 * 为 Todo 添加标签
 *
 * GraphQL Mutation 概览：
 * - 参数：tagId（标签 ID）、todoId（待办事项 ID）
 * - 作用：在 Todo 和 Tag 之间建立多对多关联
 * - 返回：更新后的 Todo 对象（包括所有标签）
 *
 * 多对多关系说明：
 * - 这个操作建立了 Todo 和 Tag 的关联
 * - 同一个 Todo 可以调用多次，添加多个标签
 * - 同一个 Tag 也可以被添加到多个 Todo
 * - TypeORM 自动管理联接表（todos_tags）
 *
 * 权限控制：
 * - 后端验证该 Todo 属于当前用户
 * - 后端验证该 Tag 属于当前用户
 * - 防止用户修改其他用户的 Todo 或使用其他用户的标签
 *
 * 使用示例：
 * ```
 * const [addTagToTodo] = useMutation(ADD_TAG_TO_TODO);
 *
 * await addTagToTodo({
 *   variables: {
 *     tagId: 'tag-123',
 *     todoId: 'todo-456'
 *   }
 * });
 * ```
 *
 * 对应后端：
 * @Mutation(() => Todo)
 * @UseGuards(GqlAuthGuard)
 * async addTagToTodo(
 *   @Args('tagId') tagId: string,
 *   @Args('todoId') todoId: string,
 *   @CurrentUser() user: User
 * ): Promise<Todo>
 */
export const ADD_TAG_TO_TODO = gql`
  mutation AddTagToTodo($tagId: ID!, $todoId: ID!) {
    /**
     * addTagToTodo: 添加标签到 Todo 的 Mutation
     * 返回关联标签后的完整 Todo 对象
     */
    addTagToTodo(tagId: $tagId, todoId: $todoId) {
      id
      title
      /**
       * 返回更新后的所有标签
       * 前端可以立即显示新添加的标签
       */
      tags {
        id
        name
        color
      }
    }
  }
`;

/**
 * 从 Todo 移除标签
 *
 * GraphQL Mutation 概览：
 * - 参数：tagId（标签 ID）、todoId（待办事项 ID）
 * - 作用：删除 Todo 和 Tag 之间的关联
 * - 返回：更新后的 Todo 对象
 *
 * 重要说明：
 * - 这只是移除关联，不会删除标签本身
 * - 标签可以继续被其他 Todo 使用
 * - 如果要删除标签，使用 DELETE_TAG
 *
 * 使用示例：
 * ```
 * const [removeTagFromTodo] = useMutation(REMOVE_TAG_FROM_TODO);
 *
 * await removeTagFromTodo({
 *   variables: {
 *     tagId: 'tag-123',
 *     todoId: 'todo-456'
 *   }
 * });
 * ```
 *
 * 对应后端：
 * @Mutation(() => Todo)
 * @UseGuards(GqlAuthGuard)
 * async removeTagFromTodo(
 *   @Args('tagId') tagId: string,
 *   @Args('todoId') todoId: string,
 *   @CurrentUser() user: User
 * ): Promise<Todo>
 */
export const REMOVE_TAG_FROM_TODO = gql`
  mutation RemoveTagFromTodo($tagId: ID!, $todoId: ID!) {
    /**
     * removeTagFromTodo: 从 Todo 移除标签的 Mutation
     */
    removeTagFromTodo(tagId: $tagId, todoId: $todoId) {
      id
      title
      tags {
        id
        name
        color
      }
    }
  }
`;

/**
 * 删除标签
 *
 * GraphQL Mutation 概览：
 * - 参数：id（标签 ID）
 * - 作用：从数据库中删除指定的标签
 * - 返回：布尔值（true 表示删除成功）
 *
 * 级联影响：
 * - 删除标签时会自动删除所有关联的 Todo-Tag 关系
 * - 关联的 Todo 仍然存在，只是标签关联被移除
 * - 这是数据库级别的级联操作
 *
 * 权限控制：
 * - 后端验证该标签属于当前用户
 * - 只有标签所有者才能删除
 * - 防止用户删除其他用户的标签
 *
 * 使用示例：
 * ```
 * const [deleteTag] = useMutation(DELETE_TAG);
 *
 * await deleteTag({
 *   variables: {
 *     id: 'tag-123'
 *   },
 *   refetchQueries: [{ query: GET_TAGS }]  // 刷新标签列表
 * });
 * ```
 *
 * 对应后端：
 * @Mutation(() => Boolean)
 * @UseGuards(GqlAuthGuard)
 * async deleteTag(
 *   @Args('id') id: string,
 *   @CurrentUser() user: User
 * ): Promise<boolean>
 */
export const DELETE_TAG = gql`
  mutation DeleteTag($id: ID!) {
    /**
     * deleteTag: 删除标签的 Mutation
     * 返回删除是否成功
     */
    deleteTag(id: $id)
  }
`;
