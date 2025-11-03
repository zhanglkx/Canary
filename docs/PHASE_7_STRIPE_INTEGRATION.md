# Phase 7: Stripe Payment Gateway Integration

## Overview

Phase 7 completes the payment system by integrating **Stripe**, a leading payment processor. This phase implements:
- Stripe payment intent creation and confirmation
- Webhook event handling for payment status updates
- Refund processing through Stripe
- Payment method management framework
- GraphQL mutations for Stripe operations

**Build Status:** ✅ Successfully compiled
**Lines Added:** 1,135 lines
**New Files:** 3 files
**Modified Files:** 5 files

## Architecture

### Component Hierarchy

```
PaymentModule
├── StripePaymentService
│   ├── createPaymentIntent()
│   ├── confirmPaymentIntent()
│   ├── handleWebhookEvent()
│   ├── createRefund()
│   └── Error Mapping
├── StripeWebhookController
│   └── POST /webhook/stripe
├── PaymentMethodService (Framework)
│   ├── savePaymentMethod()
│   ├── getUserPaymentMethods()
│   ├── deletePaymentMethod()
│   └── setDefaultPaymentMethod()
└── PaymentResolver (Enhanced)
    ├── createStripePaymentIntent
    ├── confirmStripePaymentIntent
    └── createStripeRefund
```

## Files Structure

### 1. StripePaymentService (698 lines)
**Location:** `apps/api/src/ecommerce/payment/integrations/stripe-payment.service.ts`

**Purpose:** Core Stripe integration logic

**Key Features:**
- Payment intent lifecycle management
- Webhook event handling for 5 event types
- Refund processing
- Error code standardization

**Main Methods:**

```typescript
// Payment Intent Management
async createPaymentIntent(paymentId: string, cardToken?: string): Promise<StripePaymentResult>
async confirmPaymentIntent(paymentId: string, cardToken?: string): Promise<StripePaymentResult>
private async handlePaymentIntentStatus(payment: Payment, paymentIntent: PaymentIntent): Promise<StripePaymentResult>

// Webhook Handling
async handleWebhookEvent(rawBody: Buffer | string, signature: string): Promise<StripeWebhookResult>

// Event Handlers (Private)
private async handlePaymentIntentSucceeded(paymentIntent: PaymentIntent): Promise<StripeWebhookResult>
private async handlePaymentIntentFailed(paymentIntent: PaymentIntent): Promise<StripeWebhookResult>
private async handlePaymentIntentCanceled(paymentIntent: PaymentIntent): Promise<StripeWebhookResult>
private async handleChargeRefunded(charge: Charge): Promise<StripeWebhookResult>
private async handleDisputeCreated(dispute: Dispute): Promise<StripeWebhookResult>

// Refund Processing
async createRefund(paymentId: string, refundAmount: number): Promise<StripePaymentResult>

// Utilities
private mapStripeError(error: any): StripePaymentResult
verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean
```

**Supported Webhook Events:**
1. `payment_intent.succeeded` - Payment successful
2. `payment_intent.payment_failed` - Payment failed
3. `payment_intent.canceled` - Payment canceled
4. `charge.refunded` - Refund processed
5. `charge.dispute.created` - Chargeback/dispute filed

**Error Code Mapping:**
```typescript
{
  'card_error' → 'card_declined',
  'rate_limit_error' → 'rate_limited',
  'authentication_error' → 'auth_failed',
  'api_connection_error' → 'network_error',
  'api_error' → 'gateway_error'
}
```

**Dependencies:**
- `stripe` v14.25.0 SDK
- `ConfigService` for API keys
- `PaymentService` for state transitions
- `PaymentRepository` for data access

**Configuration Required:**
```env
STRIPE_API_KEY=sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. StripeWebhookController (62 lines)
**Location:** `apps/api/src/ecommerce/payment/integrations/stripe-webhook.controller.ts`

**Purpose:** HTTP endpoint for Stripe webhook events

**Route:** `POST /webhook/stripe`

**Key Features:**
- Raw body preservation for signature verification
- Stripe signature header validation
- Error handling and logging

**Method:**
```typescript
@Post()
async handleWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Headers('stripe-signature') signature: string,
)
```

**Request Flow:**
1. Receive POST request from Stripe
2. Extract `stripe-signature` header
3. Get raw body from request object
4. Pass to `StripePaymentService.handleWebhookEvent()`
5. Return success/failure response

**Response Format:**
```json
{
  "success": boolean,
  "eventId": string,
  "message": string
}
```

### 3. PaymentMethodService (178 lines)
**Location:** `apps/api/src/ecommerce/payment/services/payment-method.service.ts`

**Purpose:** Framework for managing saved payment methods

**Status:** Skeleton implementation with full interface definition
- Allows for future database integration
- Provides method signatures and documentation
- Ready for implementation with real storage

**Key Methods:**

```typescript
// Save/Delete
async savePaymentMethod(request: SavePaymentMethodRequest): Promise<PaymentMethodInfo>
async deletePaymentMethod(paymentMethodId: string, userId: string): Promise<boolean>

// Retrieval
async getUserPaymentMethods(userId: string): Promise<PaymentMethodListItem[]>
async getDefaultPaymentMethod(userId: string): Promise<PaymentMethodInfo | null>

// Management
async setDefaultPaymentMethod(paymentMethodId: string, userId: string): Promise<PaymentMethodInfo>
async validatePaymentMethod(paymentMethodId: string, userId: string): Promise<boolean>
```

**Supported Payment Method Types:**
- `card` - Credit/debit cards
- `bank_account` - Bank transfers
- `digital_wallet` - Digital payment methods (Apple Pay, Google Pay, etc.)

**Interfaces:**

```typescript
interface PaymentMethodInfo {
  id: string
  userId: string
  type: 'card' | 'bank_account' | 'digital_wallet'
  last4: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  stripePaymentMethodId?: string
  createdAt: Date
  updatedAt: Date
}

interface SavePaymentMethodRequest {
  userId: string
  token: string        // Stripe token
  type: string
  isDefault?: boolean
  description?: string
}
```

### 4. Enhanced PaymentResolver (102 new lines)
**Location:** `apps/api/src/ecommerce/payment/resolvers/payment.resolver.ts`

**New GraphQL Mutations:**

#### `createStripePaymentIntent`
```graphql
mutation {
  createStripePaymentIntent(
    paymentId: ID!
    cardToken: String
  ): String! # JSON response
}
```

**Parameters:**
- `paymentId` (required): Payment record ID
- `cardToken` (optional): Stripe token from Stripe.js

**Returns:** JSON string containing:
- `success: boolean`
- `paymentIntentId?: string`
- `clientSecret?: string` (for 3D Secure)
- `requiresAction?: boolean`
- `errorCode?: string`
- `errorMessage?: string`

**Authorization:** Requires authentication, user must own payment

#### `confirmStripePaymentIntent`
```graphql
mutation {
  confirmStripePaymentIntent(
    paymentId: ID!
    cardToken: String
  ): String! # JSON response
}
```

**Purpose:** Confirm a payment intent with card token

**Authorization:** Requires authentication, user must own payment

#### `createStripeRefund`
```graphql
mutation {
  createStripeRefund(
    paymentId: ID!
    refundAmount: Int!
  ): String! # JSON response
}
```

**Parameters:**
- `paymentId` (required): Payment to refund
- `refundAmount` (required): Amount in cents

**Authorization:** Requires authentication, user must own payment

**Return Format:**
```json
{
  "success": boolean,
  "paymentIntentId": string,
  "status": string,
  "errorCode"?: string,
  "errorMessage"?: string
}
```

### 5. PaymentRepository Enhancement (+9 lines)
**Location:** `apps/api/src/ecommerce/payment/repositories/payment.repository.ts`

**New Public Method:**
```typescript
async save(payment: Payment): Promise<Payment>
```

**Purpose:** Allow StripePaymentService to persist payment intent IDs and metadata

**Usage:**
```typescript
payment.intentId = paymentIntent.id
await this.paymentRepository.save(payment)
```

## Integration Flow

### Payment Creation Flow

```
Client (Stripe.js)
    ↓
1. Collect card → Get Stripe Token
    ↓
Frontend
    ↓
2. GraphQL: createStripePaymentIntent(paymentId, cardToken)
    ↓
PaymentResolver (GqlAuthGuard checks JWT)
    ↓
StripePaymentService.createPaymentIntent()
    ↓
3. Stripe API: Create PaymentIntent
    ↓
4. Stripe Returns: PaymentIntent with client_secret
    ↓
5. Save intentId to Payment record
    ↓
Return to Frontend
    ↓
6. Frontend: Use clientSecret for 3D Secure
    ↓
7. GraphQL: confirmStripePaymentIntent(paymentId, cardToken)
    ↓
StripePaymentService.confirmPaymentIntent()
    ↓
8. Stripe API: Confirm PaymentIntent
    ↓
Stripe Returns: Confirmed PaymentIntent
    ↓
9. Create PaymentTransaction record
    ↓
10. Mark Payment as SUCCEEDED
    ↓
Return success to frontend
```

### Webhook Flow

```
Stripe Webhooks Service
    ↓
1. Create webhook event (e.g., payment_intent.succeeded)
    ↓
2. Sign event with STRIPE_WEBHOOK_SECRET
    ↓
3. POST to /webhook/stripe with signature header
    ↓
StripeWebhookController
    ↓
4. Extract raw body and signature
    ↓
5. Call StripePaymentService.handleWebhookEvent()
    ↓
6. Verify webhook signature
    ↓
7. Parse event and route to handler:
    - handlePaymentIntentSucceeded()
    - handlePaymentIntentFailed()
    - handlePaymentIntentCanceled()
    - handleChargeRefunded()
    - handleDisputeCreated()
    ↓
8. Each handler:
    - Find Payment record by metadata
    - Create PaymentTransaction
    - Update Payment status
    - Log results
    ↓
9. Return success response to Stripe
```

### Refund Flow

```
Frontend (Authenticated User)
    ↓
GraphQL: createStripeRefund(paymentId, refundAmount)
    ↓
PaymentResolver (Authorization check)
    ↓
StripePaymentService.createRefund()
    ↓
1. Validate payment exists and belongs to user
    ↓
2. Get payment's transactionId (Stripe PaymentIntent ID)
    ↓
3. Stripe API: Create Refund
    ↓
4. Stripe Returns: Refund object
    ↓
5. (Future) Track refund in database
    ↓
Return refund status to frontend
```

## Configuration

### Environment Variables

Add to `.env` in `apps/api/`:

```env
# Stripe Configuration
STRIPE_API_KEY=sk_test_...    # Test key during development
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe dashboard
```

### Module Registration

The `PaymentModule` now includes:
- `StripePaymentService` (provider)
- `StripeWebhookController` (controller)
- `PaymentMethodService` (provider)

```typescript
@Module({
  providers: [
    PaymentService,
    PaymentRepository,
    PaymentMethodService,
    PaymentResolver,
    StripePaymentService,
  ],
  controllers: [StripeWebhookController],
  exports: [PaymentService, PaymentRepository, PaymentMethodService, StripePaymentService],
})
```

## Stripe API Details

### Stripe SDK Version
- **Package:** `stripe` v14.25.0
- **API Version:** 2024-04-10

### Payment Intent States

```
PENDING → PROCESSING → SUCCEEDED ✓
   ↓         ↓
FAILED ← FAILED

Can also be:
- REQUIRES_PAYMENT_METHOD: Need card token
- REQUIRES_ACTION: 3D Secure challenge needed
- CANCELLED: User or system canceled
```

### Payment Intent Metadata

StripePaymentService stores:
```json
{
  "paymentId": "uuid-from-our-system",
  "orderId": "uuid-from-order",
  "userId": "uuid-of-payment-owner"
}
```

This allows webhooks to reconcile Stripe events with our database records.

## Security Considerations

### 1. Webhook Signature Verification
- All incoming webhooks verified using Stripe secret
- Prevents spoofing from unauthorized sources
- Uses raw body (not parsed JSON) for signature

### 2. Authentication
- All GraphQL mutations require JWT authentication
- User can only operate on their own payments
- Authorization checks in resolver

### 3. API Key Management
- API keys stored in environment variables
- Never committed to repository
- Separate test/production keys

### 4. State Machine Enforcement
- Payment status transitions validated in PaymentService
- Prevents invalid state changes
- Logs all transitions for audit trail

## Database Integration

### New Fields in Payment Entity

```typescript
@Column({ name: 'intent_id', nullable: true })
intentId: string  // Stripe PaymentIntent ID

@Column({ name: 'gateway', type: 'enum', enum: PaymentGateway })
gateway: PaymentGateway  // STRIPE, PAYPAL, ALIPAY, WECHAT_PAY
```

### PaymentTransaction Records

Each payment attempt creates a transaction:
- Type: CHARGE, REFUND, AUTHORIZE, CAPTURE
- Stores request/response data
- Tracks 3D Secure results

## Testing Guide

### 1. Local Testing with Stripe Test Keys

```bash
# Get test keys from Stripe Dashboard
# https://dashboard.stripe.com/test/apikeys

STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### 2. Test Payment Cards

Visa:
- Number: `4242 4242 4242 4242`
- Expiry: `12/25`
- CVC: `123`

Visa (3D Secure):
- Number: `4000 0025 0000 0003`
- Expiry: `12/25`
- CVC: `123`

Declined:
- Number: `4000 0000 0000 0002`
- Expiry: `12/25`
- CVC: `123`

### 3. Webhook Testing

Use Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to localhost:4000/webhook/stripe
```

This provides a test webhook signing secret.

### 4. GraphQL Mutations

```graphql
# 1. Create payment first (via initiatePayment mutation)
mutation {
  initiatePayment(input: {
    orderId: "order-123"
    amount: 9999
    currency: "USD"
    methodType: CREDIT_CARD
    gateway: STRIPE
  }) {
    id
    amount
    status
    gateway
  }
}

# 2. Create payment intent
mutation {
  createStripePaymentIntent(
    paymentId: "payment-id-from-above"
    cardToken: "tok_visa"  # From Stripe.js
  )
}

# 3. Confirm payment
mutation {
  confirmStripePaymentIntent(
    paymentId: "payment-id"
    cardToken: "tok_visa"
  )
}

# 4. Process refund
mutation {
  createStripeRefund(
    paymentId: "payment-id"
    refundAmount: 9999  # 100% refund
  )
}
```

## Future Enhancements

### Phase 8 (Planned)
1. **PayPal Integration**
   - Similar to Stripe pattern
   - Separate PayPalPaymentService
   - Webhook handling for PayPal IPN

2. **Alipay Integration**
   - Chinese market payment processing
   - QR code scanning
   - Mobile app integration

3. **WeChat Pay Integration**
   - Chinese market (like Alipay)
   - In-app payments
   - Mini-program support

### Immediate TODOs
1. Configure webhook raw body middleware
2. Implement actual PaymentMethodService database layer
3. Add 3D Secure challenge handling
4. Implement payment retry scheduler
5. Add payment reconciliation job
6. Create Stripe payment dashboard
7. Implement transaction export/reporting

## Error Handling

### Stripe SDK Errors

Handled error types:
- `CardError` → `card_declined`
- `RateLimitError` → `rate_limited`
- `AuthenticationError` → `auth_failed`
- `APIConnectionError` → `network_error`
- `APIError` → `gateway_error`

All errors logged with context:
- Error code
- Error message
- Payment ID
- User ID (if available)
- Timestamp

### Retry Logic

Payment service includes retry support:
- Max 3 retries for failed payments
- Exponential backoff (configurable)
- Automatic webhook-triggered reprocessing

## API References

- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe.js Documentation](https://stripe.com/docs/stripe-js)
- [Webhook Events](https://stripe.com/docs/api/events)
- [Error Types](https://stripe.com/docs/error-codes)

## Deployment Checklist

- [ ] Add `stripe` package to dependencies
- [ ] Configure STRIPE_API_KEY in production environment
- [ ] Configure STRIPE_WEBHOOK_SECRET in production environment
- [ ] Update Stripe dashboard with production webhook endpoint
- [ ] Test webhooks with real Stripe events
- [ ] Configure CORS for Stripe.js
- [ ] Review security settings
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Document payment flow for support team

## Summary

Phase 7 successfully integrates Stripe payment processing into the e-commerce platform. The implementation follows NestJS best practices with:
- Service-based architecture
- Dependency injection
- Error handling and logging
- Webhook integration
- Security-first design

The system is now ready for:
1. Environment configuration
2. Frontend Stripe.js integration
3. End-to-end payment flow testing
4. Additional gateway integrations (PayPal, Alipay, WeChat Pay)
