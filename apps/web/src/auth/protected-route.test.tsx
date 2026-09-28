import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "@/auth/auth-context";
import { ProtectedRoute } from "@/auth/protected-route";

function renderProtectedRoute(overrides: Partial<AuthContextValue> = {}) {
  const authValue: AuthContextValue = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<div>Perfil protegido</div>} />
          </Route>

          <Route path="/login" element={<div>Página de login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("ProtectedRoute", () => {
  it("should show loading state while authentication is loading", () => {
    renderProtectedRoute({
      isLoading: true,
    });

    expect(screen.getByText("Carregando...")).toBeInTheDocument();

    expect(screen.queryByText("Perfil protegido")).not.toBeInTheDocument();

    expect(screen.queryByText("Página de login")).not.toBeInTheDocument();
  });

  it("should redirect unauthenticated users to login", () => {
    renderProtectedRoute({
      isAuthenticated: false,
      isLoading: false,
    });

    expect(screen.getByText("Página de login")).toBeInTheDocument();

    expect(screen.queryByText("Perfil protegido")).not.toBeInTheDocument();
  });

  it("should render protected content for authenticated users", () => {
    renderProtectedRoute({
      user: {
        id: "user-1",
        name: "Maria Silva",
        email: "maria@email.com",
      },
      isAuthenticated: true,
      isLoading: false,
    });

    expect(screen.getByText("Perfil protegido")).toBeInTheDocument();

    expect(screen.queryByText("Página de login")).not.toBeInTheDocument();
  });
});
