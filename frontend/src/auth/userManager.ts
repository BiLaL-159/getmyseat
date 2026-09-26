import { InMemoryWebStorage, UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { config } from '@/config.ts'

// Authorization Code + PKCE against the public getmyseat-frontend client. Tokens live in memory
// only; a page load gets them back from the Keycloak session (see session.ts). The PKCE verifier
// and request state must survive the redirect, so they go to sessionStorage.
export const userManager = new UserManager({
  authority: config.oidcAuthority,
  client_id: config.oidcClientId,
  redirect_uri: `${window.location.origin}/auth/callback`,
  silent_redirect_uri: `${window.location.origin}/silent-callback.html`,
  post_logout_redirect_uri: `${window.location.origin}/`,
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
  stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
  automaticSilentRenew: true,
  silentRequestTimeoutInSeconds: 4,
})

// Drop ?code=&state= from the address bar once the callback has been handled.
export function onSigninCallback() {
  window.history.replaceState(window.history.state, '', window.location.pathname)
}

export function isSigninCallback() {
  return window.location.pathname === '/auth/callback'
}
