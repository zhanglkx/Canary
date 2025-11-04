import { gql } from '@apollo/client';

/**
 * Shopping Cart GraphQL Operations
 * Queries and mutations for managing shopping cart
 */

/**
 * Query to get the current user's cart
 */
export const GET_MY_CART = gql`
  query GetMyCart {
    myCart {
      id
      status
      items {
        id
        skuId
        productName
        skuCode
        quantity
        unitPrice
        itemTotal
        itemDiscount
        promoCode
        stockStatus
        attributeSnapshot
        createdAt
      }
      subtotal
      taxAmount
      total
      isEmpty
      isAbandoned
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to get cart stats (totals, item count, etc.)
 */
export const GET_MY_CART_STATS = gql`
  query GetMyCartStats {
    myCartStats {
      totalItems
      totalSKUs
      subtotal
      taxAmount
      total
      isEmpty
      isAbandoned
    }
  }
`;

/**
 * Query to get cart details by ID
 */
export const GET_CART_DETAIL = gql`
  query GetCartDetail($cartId: String!) {
    cartDetail(cartId: $cartId) {
      id
      status
      items {
        id
        skuId
        productName
        skuCode
        quantity
        unitPrice
        itemTotal
        itemDiscount
        promoCode
        stockStatus
        attributeSnapshot
        createdAt
      }
      subtotal
      taxAmount
      total
      isEmpty
      isAbandoned
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to get cart stats by cart ID
 */
export const GET_CART_STATS = gql`
  query GetCartStats($cartId: String!) {
    cartStats(cartId: $cartId) {
      totalItems
      totalSKUs
      subtotal
      taxAmount
      total
      isEmpty
      isAbandoned
    }
  }
`;

/**
 * Query to validate inventory for cart items
 */
export const VALIDATE_MY_CART_INVENTORY = gql`
  query ValidateMyCartInventory {
    validateMyCartInventory {
      valid
      unavailableItems
    }
  }
`;

/**
 * Query to validate inventory for a specific cart
 */
export const VALIDATE_CART_INVENTORY = gql`
  query ValidateCartInventory($cartId: String!) {
    validateCartInventory(cartId: $cartId) {
      valid
      unavailableItems
    }
  }
`;

/**
 * Query to get active cart count (admin)
 */
export const GET_ACTIVE_CART_COUNT = gql`
  query GetActiveCartCount {
    activeCartCount
  }
`;

/**
 * Query to get abandoned cart statistics (admin)
 */
export const GET_ABANDONED_CART_STATS = gql`
  query GetAbandonedCartStats {
    abandonedCartStats {
      count
      totalValue
    }
  }
`;

/**
 * Mutation to add item to cart
 */
export const ADD_TO_CART = gql`
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      success
      message
      cart {
        id
        status
        items {
          id
          skuId
          productName
          skuCode
          quantity
          unitPrice
          itemTotal
          itemDiscount
          promoCode
          stockStatus
          attributeSnapshot
          createdAt
        }
        subtotal
        taxAmount
        total
        isEmpty
        isAbandoned
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * Mutation to remove item from cart
 */
export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($skuId: String!) {
    removeFromCart(skuId: $skuId) {
      success
      message
      cart {
        id
        status
        items {
          id
          skuId
          productName
          skuCode
          quantity
          unitPrice
          itemTotal
          itemDiscount
          promoCode
          stockStatus
          attributeSnapshot
          createdAt
        }
        subtotal
        taxAmount
        total
        isEmpty
        isAbandoned
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * Mutation to update cart item quantity
 */
export const UPDATE_CART_ITEM_QUANTITY = gql`
  mutation UpdateCartItemQuantity($input: UpdateCartItemQuantityInput!) {
    updateCartItemQuantity(input: $input) {
      success
      message
      cart {
        id
        status
        items {
          id
          skuId
          productName
          skuCode
          quantity
          unitPrice
          itemTotal
          itemDiscount
          promoCode
          stockStatus
          attributeSnapshot
          createdAt
        }
        subtotal
        taxAmount
        total
        isEmpty
        isAbandoned
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * Mutation to clear the cart
 */
export const CLEAR_CART = gql`
  mutation ClearCart {
    clearCart {
      success
      message
      cart {
        id
        status
        items {
          id
        }
        subtotal
        taxAmount
        total
        isEmpty
        isAbandoned
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * Mutation to refresh cart inventory status
 */
export const REFRESH_MY_CART_INVENTORY_STATUS = gql`
  mutation RefreshMyCartInventoryStatus {
    refreshMyCartInventoryStatus {
      success
      message
      cart {
        id
        status
        items {
          id
          skuId
          productName
          skuCode
          quantity
          unitPrice
          itemTotal
          itemDiscount
          promoCode
          stockStatus
          attributeSnapshot
          createdAt
        }
        subtotal
        taxAmount
        total
        isEmpty
        isAbandoned
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * Mutation to refresh cart inventory status by cart ID
 */
export const REFRESH_CART_INVENTORY_STATUS = gql`
  mutation RefreshCartInventoryStatus($cartId: String!) {
    refreshCartInventoryStatus(cartId: $cartId) {
      success
      message
      cart {
        id
        status
        items {
          id
          skuId
          productName
          skuCode
          quantity
          unitPrice
          itemTotal
          itemDiscount
          promoCode
          stockStatus
          attributeSnapshot
          createdAt
        }
        subtotal
        taxAmount
        total
        isEmpty
        isAbandoned
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * Mutation to mark abandoned carts (admin)
 */
export const MARK_ABANDONED_CARTS = gql`
  mutation MarkAbandonedCarts {
    markAbandonedCarts
  }
`;
