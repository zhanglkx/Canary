/**
 * 通用的 GraphQL 查询片段
 * 用于在多个查询中复用字段定义
 */
export const TODO_FIELDS = `
  fragment TodoFields on Todo {
    id
    title
    description
    completed
    priority
    dueDate
    createdAt
    updatedAt
    category {
      id
      name
      color
      icon
    }
  }
`;

/**
 * 用户分类统计信息片段
 */
export const CATEGORY_STATS_FIELDS = `
  fragment CategoryStatsFields on CategoryStats {
    id
    name
    color
    icon
    todoCount
    completedCount
  }
`;
