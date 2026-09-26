import { useCallback, useSyncExternalStore } from 'react'
import { useAuth } from 'react-oidc-context'
import { userManager } from './userManager.ts'

// Tokens live in memory only, so every page load starts signed out. restoreSession asks Keycloak,
// in a hidden iframe (prompt=none), whether the browser still has a session, and loads the user
// if so. Until it settles the session is 'signingIn', so nothing flashes "Sign in" meanwhile.
let restoring = false
const listeners = new Set<() => void>()

function setRestoring(value: boolean) {
  restoring = value
  listeners.forEach((listener) => listener())
}

export async function restoreSession() {
  setRestoring(true)
  try {
    await userManager.signinSilent()
  } catch {
    // login_required (no Keycloak session) or Keycloak unreachable: stay signed out.
  } finally {
    setRestoring(false)
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export type SessionStatus = 'signedOut' | 'signingIn' | 'signedIn'

export function useSession() {
  const auth = useAuth()
  const isRestoring = useSyncExternalStore(subscribe, () => restoring)
  const { signinRedirect, signoutRedirect } = auth
  const signIn = useCallback((returnTo: string) => void signinRedirect({ state: { returnTo } }), [signinRedirect])
  const signOut = useCallback(() => void signoutRedirect(), [signoutRedirect])

  const status: SessionStatus = auth.isAuthenticated
    ? 'signedIn'
    : isRestoring || auth.isLoading || auth.activeNavigator
      ? 'signingIn'
      : 'signedOut'

  return {
    status,
    // For display only; roles come from GET /api/v1/me.
    firstName: auth.user?.profile.given_name ?? auth.user?.profile.name,
    error: auth.error,
    // Where the callback should land once Keycloak sends the visitor back.
    returnTo: returnToOf(auth.user?.state),
    signIn,
    signOut,
  }
}

// Only same-site paths, so a crafted state can't send the visitor elsewhere.
function returnToOf(state: unknown) {
  const returnTo = (state as { returnTo?: unknown } | undefined)?.returnTo
  return typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/app'
}
