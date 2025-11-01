/**
 * GraphQL 查询定义文件
 *
 * 这个文件展示了前端如何定义 GraphQL 查询：
 * 1. 使用 gql 标签模板定义查询
 * 2. 使用 TypeScript 确保类型安全
 * 3. Apollo Client 会自动处理这些查询
 *
 * 查询会被 GraphQL Code Generator 处理，生成对应的 TypeScript 类型
 */

import { gql } from '@apollo/client';

/**
 * 获取当前用户信息
 *
 * 使用示例：
 * const { data, loading } = useQuery(GET_ME);
 * if (loading) return <Loading />;
 * const user = data?.me;
 */
export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      username
      createdAt
    }
  }
`;

/**
 * 获取待办事项列表
 * 包含完整的待办事项信息，包括关联的分类
 */
export const GET_TODOS = gql`
  query GetTodos {
    todos {
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
  }
`;

export const GET_TODO = gql`
  query GetTodo($id: ID!) {
    todo(id: $id) {
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
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      description
      color
      icon
      createdAt
      updatedAt
    }
  }
`;

export const GET_CATEGORY_STATS = gql`
  query GetCategoryStats {
    categoryStats {
      id
      name
      color
      icon
      todoCount
      completedCount
    }
  }
`;
