/**
 * 搜索模块 GraphQL 操作
 *
 * 这个文件定义了所有与搜索和过滤相关的 GraphQL 查询。
 *
 * 学习点 - 复杂查询：
 * 1. 如何构建带有多个过滤条件的查询
 * 2. 如何使用 InputType 传递复杂的查询参数
 * 3. 前端如何处理动态搜索参数
 * 4. 后端 QueryBuilder 的强大功能
 *
 * 搜索类型：
 * 1. 简单搜索：仅按关键词搜索标题和描述
 * 2. 高级搜索：支持多条件组合过滤
 *
 * 对应后端：
 * - SearchResolver (apps/api/src/search/search.resolver.ts)
 * - SearchService (apps/api/src/search/search.service.ts)
 */

import { gql } from '@apollo/client';

/**
 * 简单搜索 - 按关键词搜索
 *
 * GraphQL 查询概览：
 * - 参数：keyword（搜索关键词）
 * - 返回：匹配的 Todo 列表
 *
 * 搜索范围：
 * - 搜索 Todo 的标题
 * - 搜索 Todo 的描述
 * - 不区分大小写（ILIKE 模糊匹配）
 *
 * 使用场景：
 * 1. 快速搜索框（如导航栏中的搜索）
 * 2. 列表页面的实时过滤
 * 3. 简单的全文搜索
 *
 * 使用示例：
 * ```
 * const { data } = useQuery(SEARCH_TODOS, {
 *   variables: { keyword: '项目' }
 * });
 *
 * // 实时搜索
 * const [keyword, setKeyword] = useState('');
 * const { data } = useQuery(SEARCH_TODOS, {
 *   variables: { keyword },
 *   skip: !keyword  // 如果关键词为空，跳过查询
 * });
 * ```
 *
 * 对应后端：
 * @Query(() => [Todo])
 * @UseGuards(GqlAuthGuard)
 * async searchTodos(
 *   @Args('keyword') keyword: string,
 *   @CurrentUser() user: User
 * ): Promise<Todo[]>
 */
export const SEARCH_TODOS = gql`
  query SearchTodos($keyword: String!) {
    /**
     * searchTodos: 简单搜索查询
     * - 返回标题或描述包含关键词的所有 Todo
     * - 按相关性或创建时间排序
     */
    searchTodos(keyword: $keyword) {
      id
      title
      description
      priority
      completed
      dueDate
      category {
        id
        name
        color
      }
      tags {
        id
        name
        color
      }
      createdAt
    }
  }
`;

/**
 * 高级搜索 - 复杂条件组合
 *
 * GraphQL 查询概览：
 * - 参数：多个可选的过滤条件
 * - 返回：匹配所有条件的 Todo 列表
 *
 * 支持的过滤条件：
 * 1. keyword: 搜索关键词（可选）
 * 2. priority: 优先级列表（可选）
 * 3. completed: 完成状态（可选）
 * 4. categoryId: 特定分类（可选）
 * 5. tagIds: 标签列表（可选，AND 逻辑）
 * 6. dueDateFrom: 截止日期范围开始（可选）
 * 7. dueDateTo: 截止日期范围结束（可选）
 * 8. sortBy: 排序字段（可选）
 *
 * 实际应用：
 * - 显示所有 HIGH 和 URGENT 优先级的未完成任务
 * - 搜索特定分类中包含特定标签的任务
 * - 查找即将到期的任务
 * - 高级过滤和报表生成
 *
 * 业务逻辑（AND 关系）：
 * - 如果同时指定 priority 和 completed，返回既满足优先级又满足完成状态的任务
 * - 如果指定多个标签，返回包含所有这些标签的任务
 * - 组合条件可以大大缩小搜索范围
 *
 * 使用示例：
 * ```
 * // 查找所有紧急或高优先级的未完成任务
 * const { data } = useQuery(ADVANCED_SEARCH, {
 *   variables: {
 *     priorities: ['HIGH', 'URGENT'],
 *     completed: false,
 *     sortBy: 'dueDate'
 *   }
 * });
 *
 * // 复杂的业务查询示例
 * const { data } = useQuery(ADVANCED_SEARCH, {
 *   variables: {
 *     keyword: '项目',
 *     categoryId: 'category-123',
 *     tagIds: ['tag-urgent', 'tag-backend'],
 *     completed: false,
 *     priority: ['HIGH', 'URGENT']
 *   }
 * });
 * ```
 *
 * 对应后端：
 * @Query(() => [Todo])
 * @UseGuards(GqlAuthGuard)
 * async advancedSearch(
 *   @Args('searchFilter') searchFilter: SearchFilterInput,
 *   @CurrentUser() user: User
 * ): Promise<Todo[]>
 */
export const ADVANCED_SEARCH = gql`
  query AdvancedSearch(
    $keyword: String
    $priorities: [Priority!]
    $completed: Boolean
    $categoryId: ID
    $tagIds: [ID!]
    $sortBy: String
  ) {
    /**
     * advancedSearch: 高级搜索查询
     * 所有参数都是可选的
     * 只有提供的条件才会被用于过滤
     */
    advancedSearch(
      searchFilter: {
        keyword: $keyword
        priorities: $priorities
        completed: $completed
        categoryId: $categoryId
        tagIds: $tagIds
        sortBy: $sortBy
      }
    ) {
      id
      title
      description
      completed
      priority
      dueDate
      user {
        id
        username
      }
      category {
        id
        name
        color
      }
      tags {
        id
        name
        color
      }
      comments {
        id
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * 搜索页面专用 - 获取搜索建议
 *
 * 这个查询用于在用户输入时提供搜索建议，
 * 帮助用户快速找到相关的 Todo。
 *
 * 返回的数据：
 * - 最近搜索的 Todo（基于用户浏览历史）
 * - 热门标签
 * - 常用的分类
 *
 * 这可以大大改善用户体验。
 */
export const GET_SEARCH_SUGGESTIONS = gql`
  query GetSearchSuggestions($keyword: String!) {
    /**
     * 获取搜索建议和自动完成选项
     * 这通常在用户输入关键词时实时调用
     */
    searchSuggestions(keyword: $keyword) {
      todos {
        id
        title
      }
      tags {
        id
        name
      }
      categories {
        id
        name
      }
    }
  }
`;
