import { gql } from '@apollo/client';

/**
 * Payment GraphQL Operations
 * Queries and mutations for payment processing
 */

/**
 * Query to get payment details by ID
 */
export const GET_PAYMENT = gql`
  query GetPayment($id: String!) {
    payment(id: $id) {
      id
      orderId
      amount
      currency
      status
      methodType
      gateway
      transactionId
      refundedAmount
      failureReason
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to get my payments with pagination
 */
export const GET_MY_PAYMENTS = gql`
  query GetMyPayments($skip: Int, $take: Int) {
    myPayments(skip: $skip, take: $take) {
      payments {
        id
        orderId
        amount
        currency
        status
        methodType
        gateway
        transactionId
        refundedAmount
        failureReason
        createdAt
        updatedAt
      }
      total
    }
  }
`;

/**
 * Query to get my payments filtered by status
 */
export const GET_MY_PAYMENTS_BY_STATUS = gql`
  query GetMyPaymentsByStatus($status: PaymentStatus!) {
    myPaymentsByStatus(status: $status) {
      id
      orderId
      amount
      currency
      status
      methodType
      gateway
      transactionId
      refundedAmount
      failureReason
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to get payment transactions
 */
export const GET_PAYMENT_TRANSACTIONS = gql`
  query GetPaymentTransactions($paymentId: String!) {
    paymentTransactions(paymentId: $paymentId) {
      id
      paymentId
      type
      status
      amount
      gatewayTransactionId
      errorCode
      errorMessage
      errorDetails
      attemptNumber
      threeDSecureResult
      requiresConfirmation
      confirmationToken
      completedAt
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to get my payment statistics
 */
export const GET_MY_PAYMENT_STATS = gql`
  query GetMyPaymentStats {
    myPaymentStats {
      totalPayments
      totalAmount
      successfulAmount
      failedCount
      refundedAmount
      successRate
    }
  }
`;

/**
 * Query to search my payments
 */
export const SEARCH_MY_PAYMENTS = gql`
  query SearchMyPayments($keyword: String!, $skip: Int, $take: Int) {
    searchMyPayments(keyword: $keyword, skip: $skip, take: $take) {
      payments {
        id
        orderId
        amount
        currency
        status
        methodType
        gateway
        transactionId
        refundedAmount
        failureReason
        createdAt
        updatedAt
      }
      total
    }
  }
`;

/**
 * Query to get payment analysis by date range
 */
export const GET_PAYMENT_ANALYSIS = gql`
  query GetPaymentAnalysis($startDate: String!, $endDate: String!) {
    paymentAnalysisByDateRange(startDate: $startDate, endDate: $endDate) {
      totalPayments
      successfulPayments
      failedPayments
      cancelledPayments
      totalAmount
      averageAmount
      successRate
    }
  }
`;

/**
 * Mutation to initiate payment
 */
export const INITIATE_PAYMENT = gql`
  mutation InitiatePayment($input: InitiatePaymentInput!) {
    initiatePayment(input: $input) {
      id
      orderId
      amount
      currency
      status
      methodType
      gateway
      transactionId
      refundedAmount
      failureReason
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to mark payment as processing
 */
export const MARK_PAYMENT_AS_PROCESSING = gql`
  mutation MarkPaymentAsProcessing($paymentId: String!, $transactionId: String!) {
    markPaymentAsProcessing(paymentId: $paymentId, transactionId: $transactionId) {
      id
      orderId
      amount
      currency
      status
      methodType
      gateway
      transactionId
      refundedAmount
      failureReason
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to mark payment as succeeded
 */
export const MARK_PAYMENT_AS_SUCCEEDED = gql`
  mutation MarkPaymentAsSucceeded(
    $paymentId: String!
    $transactionId: String!
    $gatewayTransactionId: String!
  ) {
    markPaymentAsSucceeded(
      paymentId: $paymentId
      transactionId: $transactionId
      gatewayTransactionId: $gatewayTransactionId
    ) {
      id
      orderId
      amount
      currency
      status
      methodType
      gateway
      transactionId
      refundedAmount
      failureReason
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to mark payment as failed
 */
export const MARK_PAYMENT_AS_FAILED = gql`
  mutation MarkPaymentAsFailed(
    $paymentId: String!
    $transactionId: String!
    $errorCode: String!
    $errorMessage: String!
  ) {
    markPaymentAsFailed(
      paymentId: $paymentId
      transactionId: $transactionId
      errorCode: $errorCode
      errorMessage: $errorMessage
    ) {
      id
      orderId
      amount
      currency
      status
      methodType
      gateway
      transactionId
      refundedAmount
      failureReason
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to cancel payment
 */
export const CANCEL_PAYMENT = gql`
  mutation CancelPayment($paymentId: String!) {
    cancelPayment(paymentId: $paymentId) {
      id
      orderId
      amount
      currency
      status
      methodType
      gateway
      transactionId
      refundedAmount
      failureReason
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to initiate refund
 */
export const INITIATE_REFUND = gql`
  mutation InitiateRefund($input: RefundRequestInput!) {
    initiateRefund(input: $input) {
      success
      refundAmount
      refundTransactionId
      message
    }
  }
`;

/**
 * Mutation to complete refund
 */
export const COMPLETE_REFUND = gql`
  mutation CompleteRefund(
    $paymentId: String!
    $refundTransactionId: String!
    $refundAmount: Float!
    $gatewayRefundId: String!
  ) {
    completeRefund(
      paymentId: $paymentId
      refundTransactionId: $refundTransactionId
      refundAmount: $refundAmount
      gatewayRefundId: $gatewayRefundId
    ) {
      success
      refundAmount
      refundTransactionId
      message
    }
  }
`;

/**
 * Mutation to create Stripe payment intent
 */
export const CREATE_STRIPE_PAYMENT_INTENT = gql`
  mutation CreateStripePaymentIntent($paymentId: String!, $cardToken: String) {
    createStripePaymentIntent(paymentId: $paymentId, cardToken: $cardToken)
  }
`;

/**
 * Mutation to confirm Stripe payment intent
 */
export const CONFIRM_STRIPE_PAYMENT_INTENT = gql`
  mutation ConfirmStripePaymentIntent($paymentId: String!, $cardToken: String) {
    confirmStripePaymentIntent(paymentId: $paymentId, cardToken: $cardToken)
  }
`;

/**
 * Mutation to create Stripe refund
 */
export const CREATE_STRIPE_REFUND = gql`
  mutation CreateStripeRefund($paymentId: String!, $refundAmount: Int!) {
    createStripeRefund(paymentId: $paymentId, refundAmount: $refundAmount)
  }
`;

/**
 * Mutation to create PayPal order
 */
export const CREATE_PAYPAL_ORDER = gql`
  mutation CreatePayPalOrder($paymentId: String!) {
    createPayPalOrder(paymentId: $paymentId)
  }
`;

/**
 * Mutation to capture PayPal order
 */
export const CAPTURE_PAYPAL_ORDER = gql`
  mutation CapturePayPalOrder($paymentId: String!, $orderId: String!) {
    capturePayPalOrder(paymentId: $paymentId, orderId: $orderId)
  }
`;

/**
 * Mutation to create PayPal refund
 */
export const CREATE_PAYPAL_REFUND = gql`
  mutation CreatePayPalRefund($paymentId: String!, $refundAmount: Int!) {
    createPayPalRefund(paymentId: $paymentId, refundAmount: $refundAmount)
  }
`;
