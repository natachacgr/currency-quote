export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}