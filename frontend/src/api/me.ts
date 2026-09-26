import { useQuery } from '@tanstack/react-query'
import { useAuth } from 'react-oidc-context'
import { api } from './api.ts'
import type { components } from './schema'

export type Me = components['schemas']['MeResponse']
export type Role = NonNullable<Me['roles']>[number]

// Who the API thinks the caller is. Roles come from here, never from the token.
export function useMe() {
  const auth = useAuth()
  return useQuery({
    queryKey: ['me', auth.user?.profile.sub],
    enabled: auth.isAuthenticated,
    queryFn: async () => {
      const { data, response } = await api.GET('/api/v1/me')
      if (!data) throw new Error(`GET /api/v1/me failed with ${response.status}`)
      return data
    },
  })
}
