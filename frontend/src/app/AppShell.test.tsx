import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetAuth, setAuth, signedIn, signedOut, signingIn, signinRedirect, signoutRedirect } from '@/test/fakeAuth.ts'
import { renderRoute } from '@/test/renderRoute.tsx'

vi.mock('react-oidc-context', () => import('@/test/fakeAuth.ts'))

const meResponse = vi.hoisted(() => ({ respond: (): Response => Response.json({}) }))
vi.mock('@/api/api.ts', async () => {
  const { createApiClient } = await import('@/api/client.ts')
  return {
    api: createApiClient({ baseUrl: 'http://api.test', getAccessToken: () => 'token', fetch: async () => meResponse.respond() }),
  }
})

beforeEach(() => {
  resetAuth()
  meResponse.respond = () =>
    Response.json({ subject: 'user-1', name: 'Asha Rao', email: 'asha@example.com', roles: ['CUSTOMER', 'ORGANIZER'] })
})

describe('app shell', () => {
  it('shows the name and roles from GET /me when signed in', async () => {
    setAuth(signedIn())
    renderRoute('/app')

    expect(await screen.findByRole('heading', { name: /asha rao/i })).toBeInTheDocument()
    const roles = screen.getByRole('list', { name: /roles/i })
    expect(within(roles).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Customer', 'Organizer'])
  })

  it('signs out through the identity provider', async () => {
    const user = userEvent.setup()
    setAuth(signedIn())
    renderRoute('/app')

    await user.click(await screen.findByRole('button', { name: /sign out/i }))
    expect(signoutRedirect).toHaveBeenCalled()
  })

  it('says so when /me fails', async () => {
    setAuth(signedIn())
    meResponse.respond = () => new Response(null, { status: 500 })
    renderRoute('/app')

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t load your account/i)
  })

  it('offers to sign in when signed out', async () => {
    const user = userEvent.setup()
    setAuth(signedOut())
    renderRoute('/app')

    await user.click(await screen.findByRole('button', { name: /sign in/i }))
    expect(signinRedirect).toHaveBeenCalled()
  })

  it('says so when signing in fails', async () => {
    setAuth({ ...signedOut(), error: Object.assign(new Error('network'), { source: 'unknown' as const }) })
    renderRoute('/app')

    expect(await screen.findByRole('alert')).toHaveTextContent(/sign-in didn.t work/i)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows that sign-in is in progress', async () => {
    setAuth(signingIn())
    renderRoute('/app')

    expect(await screen.findByText(/signing you in/i)).toBeInTheDocument()
  })

  it('switches the whole document between light and dark themes', async () => {
    const user = userEvent.setup()
    setAuth(signedIn())
    renderRoute('/app')

    await user.click(await screen.findByRole('button', { name: /dark theme/i }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')

    await user.click(screen.getByRole('button', { name: /light theme/i }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })
})

describe('sign-in callback', () => {
  it('shows that sign-in is in progress while the code is exchanged', async () => {
    setAuth(signingIn())
    renderRoute('/auth/callback')

    expect(await screen.findByText(/signing you in/i)).toBeInTheDocument()
  })

  it('moves on to the app once signed in', async () => {
    setAuth(signedIn())
    const router = renderRoute('/auth/callback')

    expect(await screen.findByRole('heading', { name: /asha rao/i })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/app')
  })

  it('explains a failed sign-in and links back home', async () => {
    setAuth({ ...signedOut(), error: Object.assign(new Error('invalid_grant'), { source: 'signinCallback' as const }) })
    renderRoute('/auth/callback')

    expect(await screen.findByRole('alert')).toHaveTextContent(/sign-in didn.t work/i)
    expect(screen.getByRole('link', { name: /back to getmyseat/i })).toHaveAttribute('href', '/')
  })
})
