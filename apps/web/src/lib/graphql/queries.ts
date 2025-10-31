import { gql } from '@apollo/client';

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
