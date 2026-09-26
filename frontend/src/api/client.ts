import createClient from 'openapi-fetch'
import type { paths } from './schema'

type ApiClientOptions = {
  baseUrl: string
  // Read on every request, so a silently renewed token is picked up.
  getAccessToken: () => string | undefined | Promise<string | undefined>
  fetch?: (request: Request) => Promise<Response>
}

export function createApiClient({ baseUrl, getAccessToken, fetch }: ApiClientOptions) {
  const client = createClient<paths>({ baseUrl, fetch })
  client.use({
    async onRequest({ request }) {
      const token = await getAccessToken()
      if (token) request.headers.set('Authorization', `Bearer ${token}`)
      return request
    },
  })
  return client
}
