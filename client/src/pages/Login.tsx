import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLoginMutation } from "@/features/auth/authApi";
import { loginSchema, type LoginFormValues } from "@/features/auth/authSchemas";
import { DocumentTitle } from "@/components/DocumentTitle";
import { cn } from "@/lib/utils";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [login, { isLoading, error }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data).unwrap();
      navigate("/dashboard");
    } catch {
      // error is handled via RTK Query error state
    }
  };

  const apiError =
    error && "data" in error
      ? (error.data as { message?: string })?.message
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <DocumentTitle title={t("auth.login")} />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-xl mb-4"
            aria-hidden="true"
          >
            V
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t("auth.login")}</h1>
          <p className="text-slate-500 mt-1 text-sm">{t("common.tagline")}</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
          noValidate
        >
          {apiError && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3"
            >
              {apiError}
            </div>
          )}

          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              {t("auth.email")}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className={cn(
                "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                errors.email ? "border-red-400" : "border-slate-300"
              )}
              {...register("email")}
            />
            {errors.email && (
              <p id="login-email-error" className="mt-1 text-xs text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              {t("auth.password")}
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "login-password-error" : undefined
              }
              className={cn(
                "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                errors.password ? "border-red-400" : "border-slate-300"
              )}
              {...register("password")}
            />
            {errors.password && (
              <p
                id="login-password-error"
                className="mt-1 text-xs text-red-600"
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 text-sm transition"
          >
            {isLoading ? t("common.loading") : t("auth.login")}
          </button>

          <p className="text-center text-sm text-slate-500">
            {t("auth.noAccount")}{" "}
            <Link
              to="/register"
              className="text-primary-600 hover:underline font-medium"
            >
              {t("auth.register")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
