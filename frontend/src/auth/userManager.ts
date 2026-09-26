import { InMemoryWebStorage, UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { config } from '@/config.ts'

// Authorization Code + PKCE against the public getmyseat-frontend client. Tokens live in memory
// only, so a reload signs the SPA out; the Keycloak session lets the next sign-in skip the form.
// The PKCE verifier and request state must survive the redirect, so they go to sessionStorage.
export const userManager = new UserManager({
  authority: config.oidcAuthority,
  client_id: config.oidcClientId,
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: `${window.location.origin}/`,
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
  stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
  automaticSilentRenew: true,
})

// Drop ?code=&state= from the address bar once the callback has been handled.
export function onSigninCallback() {
  window.history.replaceState(window.history.state, '', window.location.pathname)
}
