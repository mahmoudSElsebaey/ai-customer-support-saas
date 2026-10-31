import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLoginMutation } from "@/features/auth/authApi";
import { loginSchema, type LoginFormValues } from "@/features/auth/authSchemas";
import { DocumentTitle } from "@/components/DocumentTitle";
import { cn } from "@/lib/utils";

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [login, { isLoading, error }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    setValue,
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

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800">
                {t("auth.demoAccounts", "Try a demo account")}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {i18n.language === "ar"
                  ? "اختر نوع الحساب لملء بيانات الدخول تلقائيًا"
                  : "Choose an account to fill in the login details"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: "Owner", email: "owner@demo.voxly.app", label: i18n.language === "ar" ? "المالك" : "Owner" },
                { role: "Agent", email: "agent@demo.voxly.app", label: i18n.language === "ar" ? "موظف الدعم" : "Support agent" },
              ].map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => {
                    setValue("email", account.email, { shouldValidate: true });
                    setValue("password", "Demo1234!", { shouldValidate: true });
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-start hover:border-primary-400 hover:bg-primary-50 transition"
                >
                  <span className="block text-sm font-semibold text-slate-800">{account.label}</span>
                  <span className="block text-[11px] text-slate-500 mt-1"> {account.email} </span>
                </button>
              ))}
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  {i18n.language === "ar" ? "عميل البوابة" : "Portal customer"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">customer@demo.voxly.app</p>
              </div>
              <Link to="/portal/demo/login" className="shrink-0 text-xs font-semibold text-primary-600 hover:underline">
                {i18n.language === "ar" ? "دخول العميل" : "Customer login"}
              </Link>
            </div>
            <p className="text-center text-xs text-slate-500">
              {i18n.language === "ar" ? "كلمة المرور لجميع الحسابات:" : "Password for all demo accounts:"} <span className="font-semibold text-slate-700">Demo1234!</span>
            </p>
          </div>

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
