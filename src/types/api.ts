export type Category = 'keramika' | 'textil' | 'vysivky'

export interface Product {
  id: string
  name_cs: string
  name_en: string
  description_cs: string
  description_en: string
  price: number
  category: Category
  stockCount: number
  active: boolean
}

export type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type ShippingMethod = 'zasilkovna' | 'ceska_posta' | 'osobni_odber'
export type PaymentMethod = 'card' | 'qr'

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  street: string
  city: string
  zip: string
  shippingMethod: ShippingMethod
  shippingPrice: number
  items: OrderItem[]
  totalAmount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  comgateTransactionId: string
  notes: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface LoginResponse {
  token: string
  email: string
}
