# PayTR Integration Documentation

## Overview
This implementation provides a complete PayTR payment integration following the official PayTR iFrame API documentation.

## Features
- ✅ Step 1: Payment token generation and iFrame integration
- ✅ Step 2: Payment notification handling (webhook)
- ✅ Hash verification for security
- ✅ Order status tracking
- ✅ Duplicate notification handling

## Environment Variables
Add these to your `.env` file:

```env
PAYTR_MERCHANT_ID=your_merchant_id_here
PAYTR_MERCHANT_KEY=your_merchant_key_here
PAYTR_MERCHANT_SALT=your_merchant_salt_here
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### 1. Create Payment Token
**Endpoint:** `POST /rpc/paytrRouter.createPaymentToken`

**Input:**
```typescript
{
  totalPrice: number;
  email: string;
  name: string;
  products: Array<{
    name: string;
    price: string;
    quantity: number;
  }>;
  phone: string;
  address: string;
  userIp?: string;
}
```

**Output:**
```typescript
{
  paymentUrl: string; // URL to redirect user for payment
  orderId: string;    // Order ID for tracking
}
```

### 2. Payment Notification (Webhook)
**Endpoint:** `POST /api/paytr/notification`

This endpoint is called by PayTR after payment completion. It's automatically handled and doesn't require manual implementation.

### 3. Get Order Status
**Endpoint:** `POST /rpc/paytrRouter.getOrderStatus`

**Input:**
```typescript
{
  orderId: string;
}
```

**Output:**
```typescript
{
  id: string;
  status: OrderStatus;
  totalAmount: number;
  paidAmount?: number;
  paymentType?: string;
  paymentDate?: Date;
  failureReason?: string;
  items: OrderItem[];
}
```

## Frontend Integration Example

```typescript
// 1. Create payment
const createPayment = async (orderData) => {
  const response = await fetch('/rpc/paytrRouter.createPaymentToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'paytrRouter.createPaymentToken',
      params: [orderData]
    })
  });
  
  const result = await response.json();
  
  // Redirect user to payment URL
  window.location.href = result.paymentUrl;
};

// 2. Check order status
const checkOrderStatus = async (orderId) => {
  const response = await fetch('/rpc/paytrRouter.getOrderStatus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'paytrRouter.getOrderStatus',
      params: [{ orderId }]
    })
  });
  
  return await response.json();
};
```

## PayTR Merchant Panel Configuration

1. Login to your PayTR Merchant Panel
2. Go to **Support & Setup** → **Settings**
3. Set **Notification URL** to: `https://yourdomain.com/api/paytr/notification`
4. Set **Success URL** to: `https://yourdomain.com/payment/success`
5. Set **Fail URL** to: `https://yourdomain.com/payment/failed`

## Security Features

- ✅ Hash verification on all notifications
- ✅ Duplicate notification handling
- ✅ Order status validation
- ✅ User authentication for order queries

## Order Status Flow

1. **PENDING** - Order created, payment not completed
2. **COMPLETED** - Payment successful
3. **FAILED** - Payment failed
4. **PROCESSING** - Order being processed (manual status)
5. **SHIPPED** - Order shipped (manual status)
6. **DELIVERED** - Order delivered (manual status)

## Testing

1. Set `test_mode: true` in development
2. Use PayTR test credentials
3. Test with PayTR test cards
4. Verify notification handling works correctly

## Error Handling

The system handles various PayTR error codes:
- Invalid credentials
- Insufficient funds
- 3D Secure failures
- Technical integration errors

All errors are logged and stored in the order record for debugging.