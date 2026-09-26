import { userManager } from './userManager.ts'

// Runs inside the hidden iframe of a silent sign-in: hands Keycloak's response to the parent page.
void userManager.signinSilentCallback()
