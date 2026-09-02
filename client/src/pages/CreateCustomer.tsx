import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCreateCustomerMutation } from "@/features/customers/customersApi";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateCustomer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [createCustomer, { isLoading, error }] = useCreateCustomerMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await createCustomer(data).unwrap();
      navigate(`/customers/${result.data.id}`);
    } catch {
      // error state
    }
  };

  const apiError =
    error && "data" in error
      ? (error.data as { message?: string })?.message
      : null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <Link to="/customers" className="text-sm text-slate-500 hover:text-primary-600">
          ← {t("customers.title")}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">
          {t("customers.create")}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
      >
        {apiError && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
            {apiError}
          </div>
        )}

        {(["name", "email", "phone", "company"] as const).map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {field === "name"
                ? t("auth.name")
                : field === "email"
                  ? t("auth.email")
                  : field === "phone"
                    ? t("customers.phone")
                    : t("customers.company")}
            </label>
            <input
              type={field === "email" ? "email" : "text"}
              className={cn(
                "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                errors[field] ? "border-red-400" : "border-slate-300"
              )}
              {...register(field)}
            />
            {errors[field] && (
              <p className="mt-1 text-xs text-red-600">{errors[field]?.message}</p>
            )}
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("customers.notes")}
          </label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            {...register("notes")}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 text-sm transition"
        >
          {isLoading ? t("common.loading") : t("customers.create")}
        </button>
      </form>
    </div>
  );
}
