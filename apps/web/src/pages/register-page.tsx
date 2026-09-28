import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setError("Preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve possuir pelo menos 6 caracteres.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      void navigate("/");
    } catch {
      setError(
        "Não foi possível criar sua conta. Verifique os dados e tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-background">
      <div className="flex w-full flex-col lg:w-1/2">
        <header className="flex h-20 items-center px-6 sm:px-10">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar ao mercado
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-border/60 bg-muted/50">
                <UserPlus className="size-5" />
              </div>

              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                CurrencyQuote
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Crie sua conta
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Crie sua conta para salvar suas moedas favoritas e personalizar
                sua experiência.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>

                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>

                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Crie uma senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                    className="pr-11"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-0 top-0 flex size-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Utilize pelo menos 6 caracteres.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400"
                >
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar conta"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Já possui uma conta?{" "}
              <Link
                to="/login"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>

      <aside className="relative hidden flex-1 overflow-hidden border-l border-border/60 lg:flex lg:items-center">
        <img
          src="/financial-register-bg.png"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />

        <div className="absolute inset-0 bg-black/45" />

        <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/20 to-transparent" />

        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-black/20" />

        <div className="relative z-10 w-full max-w-lg px-12 text-white xl:px-16 2xl:px-20">
          <div className="mb-8 flex items-center gap-3">
            <div className="size-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />

            <span className="text-xs font-medium uppercase tracking-wider text-white/60">
              Global Markets
            </span>
          </div>

          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Acompanhe o mercado do seu jeito.
          </h2>

          <p className="mt-5 text-base leading-relaxed text-white/65">
            Salve suas principais moedas e tenha acesso rápido às cotações que
            mais importam para você.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {["USD", "EUR", "GBP"].map((currency) => (
              <div
                key={currency}
                className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 backdrop-blur-md"
              >
                <p className="text-sm font-semibold text-white">{currency}</p>

                <p className="mt-1 text-xs text-white/50">/ BRL</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
