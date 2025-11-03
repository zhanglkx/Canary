import { gql } from '@apollo/client';

/**
 * Order GraphQL Operations
 * Queries and mutations for order management
 */

/**
 * Query to get a specific order by ID
 */
export const GET_ORDER = gql`
  query GetOrder($id: String!) {
    order(id: $id) {
      id
      orderNumber
      userId
      status
      paymentMethod
      shippingAddress
      recipientName
      recipientPhone
      items {
        id
        skuId
        productName
        skuCode
        quantity
        unitPrice
        itemTotal
        itemDiscountCents
        attributeSnapshot
      }
      subtotalCents
      taxCents
      discountCents
      totalCents
      notes
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to get my orders list with pagination
 */
export const GET_MY_ORDERS = gql`
  query GetMyOrders($skip: Int, $take: Int) {
    myOrders(skip: $skip, take: $take) {
      orders {
        id
        orderNumber
        userId
        status
        paymentMethod
        shippingAddress
        recipientName
        recipientPhone
        items {
          id
          skuId
          productName
          skuCode
          quantity
          unitPrice
          itemTotal
          itemDiscountCents
          attributeSnapshot
        }
        subtotalCents
        taxCents
        discountCents
        totalCents
        notes
        createdAt
        updatedAt
      }
      total
    }
  }
`;

/**
 * Query to get my orders filtered by status
 */
export const GET_MY_ORDERS_BY_STATUS = gql`
  query GetMyOrdersByStatus($status: OrderStatus!) {
    myOrdersByStatus(status: $status) {
      id
      orderNumber
      userId
      status
      paymentMethod
      shippingAddress
      recipientName
      recipientPhone
      items {
        id
        skuId
        productName
        skuCode
        quantity
        unitPrice
        itemTotal
        itemDiscountCents
        attributeSnapshot
      }
      subtotalCents
      taxCents
      discountCents
      totalCents
      notes
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to get my order statistics
 */
export const GET_MY_ORDER_STATS = gql`
  query GetMyOrderStats {
    myOrderStats {
      totalOrders
      totalSpent
      pendingOrders
      shippedOrders
      deliveredOrders
    }
  }
`;

/**
 * Query to get order by order number
 */
export const GET_ORDER_BY_NUMBER = gql`
  query GetOrderByNumber($orderNumber: String!) {
    orderByNumber(orderNumber: $orderNumber) {
      id
      orderNumber
      userId
      status
      paymentMethod
      shippingAddress
      recipientName
      recipientPhone
      items {
        id
        skuId
        productName
        skuCode
        quantity
        unitPrice
        itemTotal
        itemDiscountCents
        attributeSnapshot
      }
      subtotalCents
      taxCents
      discountCents
      totalCents
      notes
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to search my orders by keyword
 */
export const SEARCH_MY_ORDERS = gql`
  query SearchMyOrders($keyword: String!, $skip: Int, $take: Int) {
    searchMyOrders(keyword: $keyword, skip: $skip, take: $take) {
      orders {
        id
        orderNumber
        userId
        status
        paymentMethod
        shippingAddress
        recipientName
        recipientPhone
        items {
          id
          skuId
          productName
          skuCode
          quantity
          unitPrice
          itemTotal
          itemDiscountCents
          attributeSnapshot
        }
        subtotalCents
        taxCents
        discountCents
        totalCents
        notes
        createdAt
        updatedAt
      }
      total
    }
  }
`;

/**
 * Query to get order analysis by date range
 */
export const GET_ORDER_ANALYSIS = gql`
  query GetOrderAnalysis($startDate: String!, $endDate: String!) {
    orderAnalysisByDateRange(startDate: $startDate, endDate: $endDate) {
      period
      ordersCreated
      ordersPaid
      ordersShipped
      ordersDelivered
      ordersCancelled
      revenue
    }
  }
`;

/**
 * Mutation to create order from cart
 */
export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      orderNumber
      userId
      status
      paymentMethod
      shippingAddress
      recipientName
      recipientPhone
      items {
        id
        skuId
        productName
        skuCode
        quantity
        unitPrice
        itemTotal
        itemDiscountCents
        attributeSnapshot
      }
      subtotalCents
      taxCents
      discountCents
      totalCents
      notes
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to confirm order payment
 */
export const CONFIRM_ORDER_PAYMENT = gql`
  mutation ConfirmOrderPayment($orderId: String!, $paymentMethod: PaymentMethod!) {
    confirmOrderPayment(orderId: $orderId, paymentMethod: $paymentMethod) {
      id
      orderNumber
      userId
      status
      paymentMethod
      shippingAddress
      recipientName
      recipientPhone
      items {
        id
        skuId
        productName
        skuCode
        quantity
        unitPrice
        itemTotal
        itemDiscountCents
        attributeSnapshot
      }
      subtotalCents
      taxCents
      discountCents
      totalCents
      notes
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to mark order as shipped
 */
export const SHIP_ORDER = gql`
  mutation ShipOrder($orderId: String!) {
    shipOrder(orderId: $orderId) {
      id
      orderNumber
      userId
      status
      paymentMethod
      shippingAddress
      recipientName
      recipientPhone
      items {
        id
        skuId
        productName
        skuCode
        quantity
        unitPrice
        itemTotal
        itemDiscountCents
        attributeSnapshot
      }
      subtotalCents
      taxCents
      discountCents
      totalCents
      notes
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to mark order as delivered
 */
export const DELIVER_ORDER = gql`
  mutation DeliverOrder($orderId: String!) {
    deliverOrder(orderId: $orderId) {
      id
      orderNumber
      userId
      status
      paymentMethod
      shippingAddress
      recipientName
      recipientPhone
      items {
        id
        skuId
        productName
        skuCode
        quantity
        unitPrice
        itemTotal
        itemDiscountCents
        attributeSnapshot
      }
      subtotalCents
      taxCents
      discountCents
      totalCents
      notes
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to cancel order
 */
export const CANCEL_ORDER = gql`
  mutation CancelOrder($orderId: String!) {
    cancelOrder(orderId: $orderId) {
      id
      orderNumber
      userId
      status
      paymentMethod
      shippingAddress
      recipientName
      recipientPhone
      items {
        id
        skuId
        productName
        skuCode
        quantity
        unitPrice
        itemTotal
        itemDiscountCents
        attributeSnapshot
      }
      subtotalCents
      taxCents
      discountCents
      totalCents
      notes
      createdAt
      updatedAt
    }
  }
`;
