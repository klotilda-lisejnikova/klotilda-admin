// Types now come from the shared package instead of being hand-duplicated here. Kept as a
// re-export barrel so page imports (`from '../types/api'`) don't all need to change.
import type { orderEntity } from '@klotilda-lisejnikova/klotilda-service'

export type {
  ProductCategory as Category,
  ProductDto as Product,
  ProductImage as FileDto,
  GalleryItemDto as GalleryItem,
  GalleryRow,
  ShippingMethod,
  PaymentStatus,
  OrderStatus,
  CartItem as OrderItem,
  LoginResponse,
} from '@klotilda-lisejnikova/klotilda-service'

export type { PaginatedResponse } from '@eleansphere/entity-core'

/** Read shape of an order. `items` arrives as a JSON string (the API's `TEXT` column). */
export type Order = InstanceType<typeof orderEntity.Dto>
