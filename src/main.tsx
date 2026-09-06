import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query'
import './index.css'
import App from './App'
import { handleAuthError } from './lib/auth-error'

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleAuthError }),
  mutationCache: new MutationCache({ onError: handleAuthError }),
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
