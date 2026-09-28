import { Link } from 'react-router-dom'
import {
  CircleUserRound,
  LogOut,
  Moon,
  Sun,
  TrendingUp,
} from 'lucide-react'

import { useAuth } from '@/auth/use-auth'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/theme/use-theme'

export function Header() {
  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth()

  const {
    theme,
    toggleTheme,
  } = useTheme()

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="group flex items-center gap-3"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background transition-transform group-hover:scale-105">
              <TrendingUp className="size-5" />
            </div>

            <div className="leading-none">
              <p className="text-sm font-semibold tracking-tight sm:text-base">
                Currency
                <span className="text-muted-foreground">
                  Quote
                </span>
              </p>

              <p className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:block">
                Global Markets
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 border-l pl-6 lg:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-40" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>

            <span className="text-xs font-medium text-muted-foreground">
              Mercado online
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark'
                ? 'Ativar tema claro'
                : 'Ativar tema escuro'
            }
            title={
              theme === 'dark'
                ? 'Tema claro'
                : 'Tema escuro'
            }
          >
            {theme === 'dark' ? (
              <Sun className="size-4.5" />
            ) : (
              <Moon className="size-4.5" />
            )}
          </Button>

          <div className="mx-1 h-5 w-px bg-border" />

          {isAuthenticated && user ? (
            <>
              <Button
                variant="ghost"
                asChild
              >
                <Link to="/profile">
                  <CircleUserRound className="size-4" />

                  <span className="hidden sm:inline">
                    {user.name}
                  </span>
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                aria-label="Sair da conta"
                title="Sair"
              >
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link to="/login">
                  Entrar
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="rounded-lg"
              >
                <Link to="/register">
                  Criar conta
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}