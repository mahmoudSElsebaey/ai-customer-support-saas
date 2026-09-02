import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  usePortalRegisterMutation,
  useResolvePortalOrgQuery,
} from "@/features/portal/portalApi";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function PortalRegister() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: orgData } = useResolvePortalOrgQuery(slug, { skip: !slug });
  const [registerUser, { isLoading, error }] = usePortalRegisterMutation();

  const { register, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await registerUser({
        organizationSlug: slug,
        ...values,
      }).unwrap();
      navigate(`/portal/${slug}`);
    } catch {
      /* */
    }
  };

  const apiError =
    error && "data" in error
      ? (error.data as { message?: string })?.message
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">
            {orgData?.data?.name ?? slug}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("portal.registerTitle")}
          </p>
        </div>

        {apiError && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input
            placeholder={t("auth.name")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            {...register("name")}
          />
          <input
            type="email"
            placeholder={t("auth.email")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            {...register("email")}
          />
          <input
            type="password"
            placeholder={t("auth.password")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            {...register("password")}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary-600 text-white py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? t("common.loading") : t("auth.register")}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          {t("auth.hasAccount")}{" "}
          <Link
            to={`/portal/${slug}/login`}
            className="text-primary-600 hover:underline"
          >
            {t("auth.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
