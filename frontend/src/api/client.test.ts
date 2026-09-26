import { describe, expect, it, vi } from 'vitest'
import { createApiClient } from './client.ts'

function recordingFetch() {
  const requests: Request[] = []
  const fetch = vi.fn(async (request: Request) => {
    requests.push(request)
    return Response.json({ name: 'Asha', roles: ['CUSTOMER'] })
  })
  return { fetch, requests }
}

describe('createApiClient', () => {
  it('attaches the current access token as a bearer token', async () => {
    const { fetch, requests } = recordingFetch()
    const api = createApiClient({ baseUrl: 'http://api.test', getAccessToken: () => 'token-123', fetch })

    await api.GET('/api/v1/me')

    expect(requests[0].headers.get('Authorization')).toBe('Bearer token-123')
  })

  it('reads the token on every request, so a renewed token is used', async () => {
    const { fetch, requests } = recordingFetch()
    let token = 'first'
    const api = createApiClient({ baseUrl: 'http://api.test', getAccessToken: async () => token, fetch })

    await api.GET('/api/v1/me')
    token = 'renewed'
    await api.GET('/api/v1/me')

    expect(requests.map((r) => r.headers.get('Authorization'))).toEqual(['Bearer first', 'Bearer renewed'])
  })

  it('sends no Authorization header when signed out', async () => {
    const { fetch, requests } = recordingFetch()
    const api = createApiClient({ baseUrl: 'http://api.test', getAccessToken: () => undefined, fetch })

    await api.GET('/api/v1/me')

    expect(requests[0].headers.has('Authorization')).toBe(false)
  })

  it('calls the API at the configured base URL', async () => {
    const { fetch, requests } = recordingFetch()
    const api = createApiClient({ baseUrl: 'http://api.test', getAccessToken: () => 'token', fetch })

    const { data } = await api.GET('/api/v1/me')

    expect(requests[0].url).toBe('http://api.test/api/v1/me')
    expect(data).toEqual({ name: 'Asha', roles: ['CUSTOMER'] })
  })
})
