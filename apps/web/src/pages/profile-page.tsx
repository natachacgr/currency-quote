import { ArrowLeft, LogOut, Mail, Star, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/use-auth";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";

export function ProfilePage() {
  const navigate = useNavigate();

  const { user, logout, isAuthenticated } = useAuth();

  const { favorites, isLoading, isError } = useFavorites(isAuthenticated);

  function handleLogout() {
    logout();
    void navigate("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar ao mercado
          </Link>

          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Minha conta
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Perfil</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Visualize seus dados e acompanhe suas moedas favoritas.
          </p>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-border/60 bg-card p-6 lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                <User className="size-5" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Informações pessoais
                </p>

                <h2 className="font-semibold">{user?.name}</h2>
              </div>
            </div>

            <div className="mt-6 border-t border-border/60 pt-6">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>

                  <p className="mt-1 text-sm font-medium">{user?.email}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Star className="size-5 fill-amber-400 text-amber-400" />
            </div>

            <p className="mt-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Favoritos
            </p>

            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {isLoading ? "—" : favorites.length}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {favorites.length === 1
                ? "moeda favoritada"
                : "moedas favoritadas"}
            </p>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Mercado
              </p>

              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                Minhas moedas favoritas
              </h2>
            </div>

            <Star className="size-5 text-muted-foreground" />
          </div>

          {isLoading && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Carregando favoritos...
            </div>
          )}

          {isError && (
            <div className="py-12 text-center">
              <p className="font-medium">
                Não foi possível carregar seus favoritos.
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Tente novamente em alguns instantes.
              </p>
            </div>
          )}

          {!isLoading && !isError && favorites.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-muted">
                <Star className="size-5 text-muted-foreground" />
              </div>

              <p className="mt-4 font-medium">Nenhuma moeda favorita</p>

              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Favorite moedas no dashboard para encontrá-las rapidamente aqui.
              </p>

              <Button asChild variant="outline" className="mt-5">
                <Link to="/">Explorar moedas</Link>
              </Button>
            </div>
          )}

          {!isLoading && !isError && favorites.length > 0 && (
            <div className="divide-y divide-border/60">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-sm font-semibold">
                      {favorite.currency.code}
                    </div>

                    <div>
                      <p className="font-medium">
                        {favorite.currency.code} / BRL
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {favorite.currency.name}
                      </p>
                    </div>
                  </div>

                  <Star className="size-4 fill-amber-400 text-amber-400" />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
