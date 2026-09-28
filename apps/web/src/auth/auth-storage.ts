import type { AuthUser } from '@/types/auth'

const ACCESS_TOKEN_KEY = 'currency-quote:access-token'
const USER_KEY = 'currency-quote:user'

export const authStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getUser(): AuthUser | null {
    const storedUser = localStorage.getItem(USER_KEY)

    if (!storedUser) {
      return null
    }

    try {
      return JSON.parse(storedUser) as AuthUser
    } catch {
      localStorage.removeItem(USER_KEY)
      return null
    }
  },

  saveSession(
    accessToken: string,
    user: AuthUser,
  ): void {
    localStorage.setItem(
      ACCESS_TOKEN_KEY,
      accessToken,
    )

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(user),
    )
  },

  clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}