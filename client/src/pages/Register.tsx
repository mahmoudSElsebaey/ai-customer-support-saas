import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRegisterMutation } from "@/features/auth/authApi";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/authSchemas";
import { cn } from "@/lib/utils";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [registerUser, { isLoading, error }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        organizationName: data.organizationName,
      };
      await registerUser(payload).unwrap();
      navigate("/dashboard");
    } catch {
      // handled by error state
    }
  };

  const apiError =
    error && "data" in error
      ? (error.data as { message?: string })?.message
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-xl mb-4"
            aria-hidden="true"
          >
            V
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t("auth.register")}</h1>
          <p className="text-slate-500 mt-1 text-sm">{t("auth.createOrg")}</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
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
              htmlFor="reg-name"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              {t("auth.name")}
            </label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "reg-name-error" : undefined}
              className={cn(
                "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                errors.name ? "border-red-400" : "border-slate-300"
              )}
              {...register("name")}
            />
            {errors.name && (
              <p id="reg-name-error" className="mt-1 text-xs text-red-600" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-org"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              {t("auth.organizationName")}
            </label>
            <input
              id="reg-org"
              type="text"
              autoComplete="organization"
              aria-invalid={Boolean(errors.organizationName)}
              aria-describedby={
                errors.organizationName ? "reg-org-error" : undefined
              }
              className={cn(
                "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                errors.organizationName ? "border-red-400" : "border-slate-300"
              )}
              {...register("organizationName")}
            />
            {errors.organizationName && (
              <p id="reg-org-error" className="mt-1 text-xs text-red-600" role="alert">
                {errors.organizationName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              {t("auth.email")}
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "reg-email-error" : undefined}
              className={cn(
                "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                errors.email ? "border-red-400" : "border-slate-300"
              )}
              {...register("email")}
            />
            {errors.email && (
              <p id="reg-email-error" className="mt-1 text-xs text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              {t("auth.password")}
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "reg-password-error" : undefined
              }
              className={cn(
                "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                errors.password ? "border-red-400" : "border-slate-300"
              )}
              {...register("password")}
            />
            {errors.password && (
              <p
                id="reg-password-error"
                className="mt-1 text-xs text-red-600"
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-confirm"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              {t("auth.confirmPassword")}
            </label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? "reg-confirm-error" : undefined
              }
              className={cn(
                "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                errors.confirmPassword ? "border-red-400" : "border-slate-300"
              )}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p
                id="reg-confirm-error"
                className="mt-1 text-xs text-red-600"
                role="alert"
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 text-sm transition mt-2"
          >
            {isLoading ? t("common.loading") : t("auth.register")}
          </button>

          <p className="text-center text-sm text-slate-500">
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              {t("auth.login")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
