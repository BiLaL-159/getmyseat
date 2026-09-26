import { act } from '@testing-library/react'
import { vi } from 'vitest'
import { restoreSession } from '@/auth/session.ts'
import { userManager } from '@/auth/userManager.ts'

// Starts a session restore that stays pending until `finish`, which settles it as "no session".
export function holdSessionRestore() {
  let settle!: () => void
  vi.spyOn(userManager, 'signinSilent').mockReturnValueOnce(
    new Promise((_, reject) => {
      settle = () => reject(new Error('login_required'))
    }),
  )
  const restored = restoreSession()
  return {
    finish: async () => {
      settle()
      await act(() => restored)
    },
  }
}
