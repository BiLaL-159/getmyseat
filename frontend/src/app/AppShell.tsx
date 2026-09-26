import { useAuth } from 'react-oidc-context'
import { Link } from 'react-router'
import { useMe, type Role } from '@/api/me.ts'
import { Button } from '@/components/ui/button.tsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import ThemeToggle from '@/theme/ThemeToggle.tsx'
import './app.css'

const roleLabels: Record<Role, string> = { CUSTOMER: 'Customer', ORGANIZER: 'Organizer', ADMIN: 'Admin' }

function AppShell() {
  const auth = useAuth()

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="font-display text-3xl font-black uppercase leading-none">getMySeat</Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {auth.isAuthenticated && (
            <Button variant="outline" onClick={() => void auth.signoutRedirect()}>Sign out</Button>
          )}
        </div>
      </header>
      <main>
        {auth.isLoading || auth.activeNavigator ? (
          <p className="font-mono text-muted-foreground">Signing you in…</p>
        ) : auth.isAuthenticated ? (
          <Account />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl font-black uppercase">You&apos;re signed out</CardTitle>
              <CardDescription>Sign in to see your account.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-4">
              {auth.error && <p role="alert" className="text-destructive">Sign-in didn&apos;t work. Please try again.</p>}
              <Button onClick={() => void auth.signinRedirect()}>Sign in</Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

function Account() {
  const me = useMe()

  if (me.isPending) return <p className="font-mono text-muted-foreground">Loading your account…</p>
  if (me.isError) return <p role="alert" className="text-destructive">We couldn&apos;t load your account. Try again in a moment.</p>

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="font-display text-4xl font-black uppercase leading-none">{me.data.name}</h1>
        </CardTitle>
        {me.data.email && <CardDescription className="font-mono">{me.data.email}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ul aria-label="Roles" className="flex flex-wrap gap-2">
          {me.data.roles?.map((role) => (
            <li key={role} className="rounded-full border px-3 py-1 font-mono text-sm">{roleLabels[role]}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default AppShell
