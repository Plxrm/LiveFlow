/**
 * Application-wide constants for Pluem Live
 */

// ─── App Info ────────────────────────────────────────────────────────────────

export const APP_NAME = 'Pluem Live'
export const APP_DESCRIPTION = 'ระบบจัดการ Live Commerce'
export const APP_VERSION = '0.1.0'

// ─── Navigation ──────────────────────────────────────────────────────────────

export const ADMIN_ROUTES = {
  dashboard: '/admin/dashboard',
  products: '/admin/products',
  live: '/admin/live',
  orders: '/admin/orders',
  customers: '/admin/customers',
} as const

// ─── Pagination ──────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// ─── Currency & Locale ───────────────────────────────────────────────────────

export const DEFAULT_CURRENCY = 'THB'
export const DEFAULT_LOCALE = 'th-TH'
export const DEFAULT_TIMEZONE = 'Asia/Bangkok'

// ─── LINE ────────────────────────────────────────────────────────────────────

export const LINE_WEBHOOK_PATH = '/api/line/webhook'

// ─── Order Status ────────────────────────────────────────────────────────────

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

// ─── Live Session Status ──────────────────────────────────────────────────────

export const LIVE_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  ENDED: 'ended',
} as const

export type LiveStatus = (typeof LIVE_STATUS)[keyof typeof LIVE_STATUS]
