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
      createdAt
      updatedAt
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
      createdAt
      updatedAt
    }
  }
`;
