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
  mutation CreateTodo(
    $title: String!
    $description: String
    $categoryId: ID
    $priority: Priority
    $dueDate: String
  ) {
    createTodo(
      createTodoInput: {
        title: $title
        description: $description
        categoryId: $categoryId
        priority: $priority
        dueDate: $dueDate
      }
    ) {
      id
      title
      description
      completed
      priority
      dueDate
      createdAt
      category {
        id
        name
        color
        icon
      }
    }
  }
`;

export const UPDATE_TODO = gql`
  mutation UpdateTodo(
    $id: ID!
    $title: String
    $description: String
    $completed: Boolean
    $categoryId: ID
    $priority: Priority
    $dueDate: String
  ) {
    updateTodo(
      id: $id
      updateTodoInput: {
        title: $title
        description: $description
        completed: $completed
        categoryId: $categoryId
        priority: $priority
        dueDate: $dueDate
      }
    ) {
      id
      title
      description
      completed
      priority
      dueDate
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

export const REMOVE_TODO = gql`
  mutation RemoveTodo($id: ID!) {
    removeTodo(id: $id)
  }
`;

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($name: String!, $description: String, $color: String, $icon: String) {
    createCategory(
      createCategoryInput: { name: $name, description: $description, color: $color, icon: $icon }
    ) {
      id
      name
      description
      color
      icon
      createdAt
    }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory(
    $id: ID!
    $name: String
    $description: String
    $color: String
    $icon: String
  ) {
    updateCategory(
      id: $id
      updateCategoryInput: { name: $name, description: $description, color: $color, icon: $icon }
    ) {
      id
      name
      description
      color
      icon
      updatedAt
    }
  }
`;

export const REMOVE_CATEGORY = gql`
  mutation RemoveCategory($id: ID!) {
    removeCategory(id: $id)
  }
`;
