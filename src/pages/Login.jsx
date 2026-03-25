import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authClient } from "@/api/authClient";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";

const INITIAL_LOGIN = {
  email: "",
  password: "",
};

const INITIAL_REGISTER = {
  fullName: "",
  email: "",
  password: "",
};

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAppState } = useAuth();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(INITIAL_LOGIN);
  const [registerForm, setRegisterForm] = useState(INITIAL_REGISTER);
  const [submitting, setSubmitting] = useState(false);

  const redirectTarget = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || null;
  }, [location.search]);

  async function handleLogin(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await authClient.login(loginForm);
      await checkAppState();
      navigate(getRouteByRole(response.user?.role, redirectTarget), { replace: true });
    } catch (error) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await authClient.register(registerForm);
      await checkAppState();
      navigate(getRouteByRole(response.user?.role, redirectTarget), { replace: true });
    } catch (error) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card-glass w-full max-w-md rounded-3xl p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-foreground">Авторизация участников молодёжного парламента</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login" ? "Войдите, чтобы продолжить" : "Создайте учетную запись участника"}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-secondary p-1">
          <button
            onClick={() => setMode("login")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === "login" ? "bg-background text-foreground" : "text-muted-foreground"
            }`}
          >
            Вход
          </button>
          <button
            onClick={() => setMode("register")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === "register" ? "bg-background text-foreground" : "text-muted-foreground"
            }`}
          >
            Регистрация
          </button>
        </div>

        {mode === "login" ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <Field label="Электронная почта">
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary"
                required
              />
            </Field>
            <Field label="Пароль">
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary"
                required
              />
            </Field>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Выполняется вход..." : "Войти"}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleRegister}>
            <Field label="ФИО">
              <input
                value={registerForm.fullName}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))}
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary"
                required
              />
            </Field>
            <Field label="Электронная почта">
              <input
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary"
                required
              />
            </Field>
            <Field label="Пароль">
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary"
                minLength={8}
                required
              />
            </Field>
            <p className="rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-muted-foreground">
              После регистрации вам будет автоматически назначена роль участника.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Создаем учетную запись..." : "Зарегистрироваться"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function getRouteByRole(role, fallback) {
  if (role === "organizer") return "/admin";
  if (role === "observer") return "/hr-panel";
  return fallback || "/participant";
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
