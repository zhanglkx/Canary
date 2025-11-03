import { gql } from '@apollo/client';

/**
 * Inventory GraphQL Operations
 * Queries for inventory tracking and stock management
 */

/**
 * Query to check inventory for a specific SKU
 */
export const CHECK_SKU_INVENTORY = gql`
  query CheckSkuInventory($skuId: String!) {
    skuInventory(skuId: $skuId) {
      id
      skuId
      quantity
      reservedQuantity
      availableQuantity
      status
      lastRestockDate
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to get all inventory records with pagination
 */
export const GET_ALL_INVENTORY = gql`
  query GetAllInventory($skip: Int, $take: Int) {
    inventory(skip: $skip, take: $take) {
      items {
        id
        skuId
        quantity
        reservedQuantity
        availableQuantity
        status
        lastRestockDate
        createdAt
        updatedAt
      }
      total
    }
  }
`;

/**
 * Query to get low stock items
 */
export const GET_LOW_STOCK_ITEMS = gql`
  query GetLowStockItems($threshold: Int) {
    lowStockItems(threshold: $threshold) {
      id
      skuId
      quantity
      reservedQuantity
      availableQuantity
      status
      lastRestockDate
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to get out of stock items
 */
export const GET_OUT_OF_STOCK_ITEMS = gql`
  query GetOutOfStockItems($skip: Int, $take: Int) {
    outOfStockItems(skip: $skip, take: $take) {
      items {
        id
        skuId
        quantity
        reservedQuantity
        availableQuantity
        status
        lastRestockDate
        createdAt
        updatedAt
      }
      total
    }
  }
`;

/**
 * Query to get inventory statistics
 */
export const GET_INVENTORY_STATS = gql`
  query GetInventoryStats {
    inventoryStats {
      totalSkus
      totalQuantity
      totalReserved
      totalAvailable
      outOfStockCount
      lowStockCount
    }
  }
`;

/**
 * Query to search inventory by SKU code
 */
export const SEARCH_INVENTORY = gql`
  query SearchInventory($keyword: String!, $skip: Int, $take: Int) {
    searchInventory(keyword: $keyword, skip: $skip, take: $take) {
      items {
        id
        skuId
        quantity
        reservedQuantity
        availableQuantity
        status
        lastRestockDate
        createdAt
        updatedAt
      }
      total
    }
  }
`;

/**
 * Query to get inventory locks for a specific SKU
 */
export const GET_INVENTORY_LOCKS = gql`
  query GetInventoryLocks($skuId: String!) {
    inventoryLocks(skuId: $skuId) {
      id
      inventoryId
      skuId
      cartId
      quantity
      reason
      expiresAt
      createdAt
    }
  }
`;

/**
 * Query to get active locks for a cart
 */
export const GET_CART_LOCKS = gql`
  query GetCartLocks($cartId: String!) {
    cartInventoryLocks(cartId: $cartId) {
      id
      inventoryId
      skuId
      cartId
      quantity
      reason
      expiresAt
      createdAt
    }
  }
`;

/**
 * Mutation to update inventory quantity (admin only)
 */
export const UPDATE_INVENTORY = gql`
  mutation UpdateInventory($skuId: String!, $quantity: Int!) {
    updateInventory(skuId: $skuId, quantity: $quantity) {
      id
      skuId
      quantity
      reservedQuantity
      availableQuantity
      status
      lastRestockDate
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to adjust inventory quantity (admin only)
 */
export const ADJUST_INVENTORY = gql`
  mutation AdjustInventory($skuId: String!, $adjustment: Int!, $reason: String) {
    adjustInventory(skuId: $skuId, adjustment: $adjustment, reason: $reason) {
      id
      skuId
      quantity
      reservedQuantity
      availableQuantity
      status
      lastRestockDate
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to lock inventory quantity
 */
export const LOCK_INVENTORY = gql`
  mutation LockInventory(
    $skuId: String!
    $quantity: Int!
    $cartId: String!
    $reason: String
  ) {
    lockInventory(
      skuId: $skuId
      quantity: $quantity
      cartId: $cartId
      reason: $reason
    ) {
      id
      inventoryId
      skuId
      cartId
      quantity
      reason
      expiresAt
      createdAt
    }
  }
`;

/**
 * Mutation to unlock inventory (release hold)
 */
export const UNLOCK_INVENTORY = gql`
  mutation UnlockInventory($lockId: String!) {
    unlockInventory(lockId: $lockId)
  }
`;

/**
 * Mutation to unlock all inventory for a cart
 */
export const UNLOCK_CART_INVENTORY = gql`
  mutation UnlockCartInventory($cartId: String!) {
    unlockCartInventory(cartId: $cartId)
  }
`;

/**
 * Mutation to restock inventory (admin only)
 */
export const RESTOCK_INVENTORY = gql`
  mutation RestockInventory($skuId: String!, $quantity: Int!, $notes: String) {
    restockInventory(skuId: $skuId, quantity: $quantity, notes: $notes) {
      id
      skuId
      quantity
      reservedQuantity
      availableQuantity
      status
      lastRestockDate
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to consume inventory (complete order/purchase)
 */
export const CONSUME_INVENTORY = gql`
  mutation ConsumeInventory($skuId: String!, $quantity: Int!) {
    consumeInventory(skuId: $skuId, quantity: $quantity) {
      id
      skuId
      quantity
      reservedQuantity
      availableQuantity
      status
      lastRestockDate
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to restore inventory (cancel order/refund)
 */
export const RESTORE_INVENTORY = gql`
  mutation RestoreInventory($skuId: String!, $quantity: Int!, $reason: String) {
    restoreInventory(skuId: $skuId, quantity: $quantity, reason: $reason) {
      id
      skuId
      quantity
      reservedQuantity
      availableQuantity
      status
      lastRestockDate
      createdAt
      updatedAt
    }
  }
`;
