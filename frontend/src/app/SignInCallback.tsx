import { useAuth } from 'react-oidc-context'
import { Link, Navigate } from 'react-router'
import './app.css'

// Where Keycloak sends the browser back to. The AuthProvider exchanges the code; this page shows
// progress and then moves on to the app.
function SignInCallback() {
  const auth = useAuth()

  if (auth.isAuthenticated) return <Navigate to="/app" replace />

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-4 px-4 py-12">
      {auth.error ? (
        <>
          <p role="alert" className="text-destructive">Sign-in didn&apos;t work. Please try again.</p>
          <Link to="/" className="underline">Back to getMySeat</Link>
        </>
      ) : (
        <p className="font-mono text-muted-foreground">Signing you in…</p>
      )}
    </main>
  )
}

export default SignInCallback
