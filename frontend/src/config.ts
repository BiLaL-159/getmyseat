// Defaults point at the docker-compose stack; see .env.example to override.
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  oidcAuthority: import.meta.env.VITE_OIDC_AUTHORITY ?? 'http://localhost:8180/realms/getmyseat',
  oidcClientId: import.meta.env.VITE_OIDC_CLIENT_ID ?? 'getmyseat-frontend',
}
