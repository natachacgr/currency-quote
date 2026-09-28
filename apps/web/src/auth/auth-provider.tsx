import { useEffect, useState, type PropsWithChildren } from "react";

import { authService } from "@/services/auth.service";
import type { AuthUser, LoginInput, RegisterInput } from "@/types/auth";

import { authStorage } from "./auth-storage";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(authStorage.getUser());

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const accessToken = authStorage.getAccessToken();

      if (!accessToken) {
        authStorage.clearSession();
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const authenticatedUser = await authService.getMe();

        authStorage.saveSession(accessToken, authenticatedUser);

        setUser(authenticatedUser);
      } catch {
        authStorage.clearSession();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const login = async (input: LoginInput): Promise<void> => {
    const response = await authService.login(input);

    authStorage.saveSession(response.accessToken, response.user);

    setUser(response.user);
  };

  const register = async (input: RegisterInput): Promise<void> => {
    const response = await authService.register(input);

    authStorage.saveSession(response.accessToken, response.user);

    setUser(response.user);
  };

  const logout = (): void => {
    authStorage.clearSession();
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
