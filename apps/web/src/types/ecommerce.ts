/**
 * E-Commerce Type Definitions
 * Shared types for cart, product, order, and payment operations
 */

// ============================================
// Cart Types
// ============================================

export interface CartItem {
  id: string;
  skuId: string;
  productName: string;
  skuCode: string;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  itemDiscount: number;
  promoCode?: string;
  stockStatus: string;
  attributeSnapshot?: string;
  createdAt: string;
}

export interface Cart {
  id: string;
  status: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  isEmpty: boolean;
  isAbandoned: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Product Types
// ============================================

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  displayOrder: number;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface ProductSKU {
  id: string;
  skuCode: string;
  stock: number;
  price: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  status: string;
  category?: ProductCategory;
  images?: ProductImage[];
  skus?: ProductSKU[];
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ============================================
// Order Types
// ============================================

export interface OrderItem {
  id: string;
  skuId: string;
  productName: string;
  skuCode: string;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  itemDiscount: number;
  attributeSnapshot?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  shippingAddress: string;
  recipientName: string;
  recipientPhone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  skip: number;
  take: number;
}

export interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  deliveredOrders: number;
}
