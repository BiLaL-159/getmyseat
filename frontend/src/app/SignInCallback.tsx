import { Link, Navigate } from 'react-router'
import { useSession } from '@/auth/session.ts'
import './app.css'

// Where Keycloak sends the browser back to. The AuthProvider exchanges the code; this page shows
// progress and then returns the visitor to where they started.
function SignInCallback() {
  const session = useSession()

  if (session.status === 'signedIn') return <Navigate to={session.returnTo} replace />

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-4 px-4 py-12">
      {session.error ? (
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
