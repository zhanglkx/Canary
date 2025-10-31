import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(loginInput: { email: $email, password: $password }) {
      accessToken
      user {
        id
        email
        username
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($email: String!, $username: String!, $password: String!) {
    register(registerInput: { email: $email, username: $username, password: $password }) {
      accessToken
      user {
        id
        email
        username
      }
    }
  }
`;

export const CREATE_TODO = gql`
  mutation CreateTodo($title: String!, $description: String) {
    createTodo(createTodoInput: { title: $title, description: $description }) {
      id
      title
      description
      completed
      createdAt
    }
  }
`;

export const UPDATE_TODO = gql`
  mutation UpdateTodo($id: ID!, $title: String, $description: String, $completed: Boolean) {
    updateTodo(
      id: $id
      updateTodoInput: { title: $title, description: $description, completed: $completed }
    ) {
      id
      title
      description
      completed
      updatedAt
    }
  }
`;

export const REMOVE_TODO = gql`
  mutation RemoveTodo($id: ID!) {
    removeTodo(id: $id)
  }
`;
