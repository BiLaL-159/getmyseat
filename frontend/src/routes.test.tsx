import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetAuth, setAuth, signedIn, signinRedirect } from '@/test/fakeAuth.ts'
import { renderRoute } from '@/test/renderRoute.tsx'

vi.mock('react-oidc-context', () => import('@/test/fakeAuth.ts'))
// The landing's imperative layer needs WebGL and layout, which jsdom lacks.
vi.mock('./landing/mountLanding.ts', () => ({ mountLanding: () => () => {} }))

beforeEach(resetAuth)

describe('landing', () => {
  it('renders the landing page at /', async () => {
    renderRoute('/')
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('starts the real sign-in from "Sign in"', async () => {
    const user = userEvent.setup()
    renderRoute('/')

    await user.click(await screen.findByRole('link', { name: /sign in/i }))
    expect(signinRedirect).toHaveBeenCalled()
  })

  it('links a signed-in visitor to the app instead', async () => {
    setAuth(signedIn())
    renderRoute('/')

    expect(await screen.findByRole('link', { name: /your account/i })).toHaveAttribute('href', '/app')
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument()
  })
})
