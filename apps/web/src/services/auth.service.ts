import { api } from '@/lib/api'
import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
} from '@/types/auth'

export const authService = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(
      '/auth/login',
      input,
    )

    return data
  },

  async register(
    input: RegisterInput,
  ): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(
      '/auth/register',
      input,
    )

    return data
  },

  async getMe(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/auth/me')

    return data
  },
}