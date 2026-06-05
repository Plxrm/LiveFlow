import type { Database } from './database'

// Extract table definitions
type Tables = Database['public']['Tables']

// Base Models (Row types)
export type Customer = Tables['customers']['Row']
export type Product = Tables['products']['Row']
export type ProductKey = Tables['product_keys']['Row']
export type LiveSession = Tables['live_sessions']['Row']
export type LiveProduct = Tables['live_products']['Row']
export type Order = Tables['orders']['Row']
export type OrderItem = Tables['order_items']['Row']
export type Payment = Tables['payments']['Row']
export type CfLog = Tables['cf_logs']['Row']

// Enums (extracted from types)
export type LiveSessionStatus = LiveSession['status']
export type OrderStatus = Order['status']
export type PaymentMethod = Payment['method']
export type PaymentStatus = Payment['status']
export type ProductKeyStatus = ProductKey['status']
