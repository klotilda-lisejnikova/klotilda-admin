import { createServiceContainer } from '@eleansphere/entity-core'
import {
  productEntity,
  galleryItemEntity,
  orderEntity,
  AuthService,
} from '@klotilda-lisejnikova/klotilda-service'

// The entity service classes build paths like `/api/products`, so the container needs the API
// origin without the `/api` suffix. `VITE_API_URL` historically included it.
const origin = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/api\/?$/, '')

export const services = createServiceContainer(
  {
    products: productEntity,
    gallery: galleryItemEntity,
    orders: orderEntity,
    auth: AuthService,
  },
  origin,
  () => localStorage.getItem('token'),
)
