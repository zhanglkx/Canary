import { gql } from '@apollo/client';

/**
 * Product GraphQL Operations
 * Queries and mutations for product catalog
 */

/**
 * Query to get products with filtering and pagination
 */
export const GET_PRODUCTS = gql`
  query GetProducts($filter: ProductFilterInput!) {
    products(filter: $filter) {
      data {
        id
        name
        description
        basePrice
        status
        category {
          id
          name
        }
        images {
          id
          url
          alt
          displayOrder
        }
        skus {
          id
          skuCode
          stock
          price
          isActive
        }
        isAvailable
        createdAt
        updatedAt
      }
      total
      page
      limit
      pages
    }
  }
`;

/**
 * Query to get product detail by ID
 */
export const GET_PRODUCT_DETAIL = gql`
  query GetProductDetail($id: String!) {
    productDetail(id: $id) {
      id
      name
      description
      basePrice
      status
      category {
        id
        name
      }
      images {
        id
        url
        alt
        displayOrder
      }
      skus {
        id
        skuCode
        stock
        price
        isActive
        attributes {
          id
          name
          value
        }
      }
      attributes {
        id
        name
        values {
          id
          value
        }
      }
      isAvailable
      salesCount
      viewCount
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to search products by keyword
 */
export const SEARCH_PRODUCTS = gql`
  query SearchProducts($keyword: String!, $filter: ProductFilterInput) {
    searchProducts(keyword: $keyword, filter: $filter) {
      data {
        id
        name
        description
        basePrice
        status
        category {
          id
          name
        }
        images {
          id
          url
          alt
          displayOrder
        }
        skus {
          id
          skuCode
          stock
          price
          isActive
        }
        isAvailable
        createdAt
        updatedAt
      }
      total
      page
      limit
      pages
    }
  }
`;

/**
 * Query to check product inventory
 */
export const CHECK_INVENTORY = gql`
  query CheckInventory($productId: String!) {
    checkInventory(productId: $productId)
  }
`;

/**
 * Query to get product stats (sales, views, ratings)
 */
export const GET_PRODUCT_STATS = gql`
  query GetProductStats($productId: String!) {
    productStats(productId: $productId)
  }
`;

/**
 * Mutation to create a product (admin only)
 */
export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      basePrice
      status
      category {
        id
        name
      }
      images {
        id
        url
        alt
        displayOrder
      }
      skus {
        id
        skuCode
        stock
        price
        isActive
      }
      isAvailable
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to update a product (admin only)
 */
export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: String!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      basePrice
      status
      category {
        id
        name
      }
      images {
        id
        url
        alt
        displayOrder
      }
      skus {
        id
        skuCode
        stock
        price
        isActive
      }
      isAvailable
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to delete a product (admin only)
 */
export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: String!) {
    deleteProduct(id: $id)
  }
`;

/**
 * Mutation to set product active/inactive status (admin only)
 */
export const SET_PRODUCT_ACTIVE = gql`
  mutation SetProductActive($id: String!, $isActive: Boolean!) {
    setProductActive(id: $id, isActive: $isActive) {
      id
      name
      description
      basePrice
      status
      category {
        id
        name
      }
      images {
        id
        url
        alt
        displayOrder
      }
      skus {
        id
        skuCode
        stock
        price
        isActive
      }
      isAvailable
      createdAt
      updatedAt
    }
  }
`;
