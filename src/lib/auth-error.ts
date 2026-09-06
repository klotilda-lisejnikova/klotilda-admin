// The service layer throws a plain `Error` whose message is be-core's error name — `'Unauthorized'`
// for any 401. Wire this into the QueryClient's caches so an expired/invalid token drops the user
// back to the login screen (what the old axios response interceptor did).
export function handleAuthError(error: unknown): void {
  const isUnauthorized = error instanceof Error && error.message === 'Unauthorized'
  if (isUnauthorized && !window.location.pathname.startsWith('/login')) {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    window.location.href = '/login'
  }
}
