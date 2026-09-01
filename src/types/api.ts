export type Category = 'keramika' | 'vysivka' | 'linoryt'

/** A file served by the be-core file service (`/api/files`). */
export interface FileDto {
  id: string
  url: string
  originalName: string | null
  mimeType: string
  size: number
  role: string | null
  refId: string | null
  sortOrder: number
  createdAt: string
}

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
  /** Image files, ordered by `sortOrder`. Attached by the API. */
  images: FileDto[]
}

/** Landing-page gallery is laid out in two fixed rows; each item is pinned to row 1 or 2. */
export type GalleryRow = 1 | 2

export interface GalleryItem {
  id: string
  title_cs: string
  title_en: string
  category: Category | ''
  row: GalleryRow
  sortOrder: number
  active: boolean
  /** Image files (in practice exactly one). Attached by the API. */
  images: FileDto[]
}

export type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type ShippingMethod = 'zasilkovna' | 'ceska_posta' | 'osobni_odber'

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
  variableSymbol: string
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
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
