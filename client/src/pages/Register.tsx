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
      const { confirmPassword: _, ...payload } = data;
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
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-xl mb-4">
            V
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t("auth.register")}</h1>
          <p className="text-slate-500 mt-1 text-sm">{t("auth.createOrg")}</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
        >
          {apiError && (
            <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
              {apiError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("auth.name")}
            </label>
            <input
              type="text"
              className={cn(
                "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                errors.name ? "border-red-400" : "border-slate-300"
              )}
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("auth.organizationName")}
            </label>
            <input
              type="text"
              className={cn(
                "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                errors.organizationName ? "border-red-400" : "border-slate-300"
              )}
              {...register("organizationName")}
            />
            {errors.organizationName && (
              <p className="mt-1 text-xs text-red-600">
                {errors.organizationName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("auth.email")}
            </label>
            <input
              type="email"
              autoComplete="email"
              className={cn(
                "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                errors.email ? "border-red-400" : "border-slate-300"
              )}
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("auth.password")}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              className={cn(
                "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                errors.password ? "border-red-400" : "border-slate-300"
              )}
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("auth.confirmPassword")}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              className={cn(
                "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                errors.confirmPassword ? "border-red-400" : "border-slate-300"
              )}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
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
