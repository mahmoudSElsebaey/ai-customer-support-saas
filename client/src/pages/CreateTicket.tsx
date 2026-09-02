import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCreateTicketMutation } from "@/features/tickets/ticketsApi";
import { useGetCustomersQuery } from "@/features/customers/customersApi";
import { cn } from "@/lib/utils";

const schema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  subject: z.string().min(3),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

type FormValues = z.infer<typeof schema>;

export default function CreateTicket() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [createTicket, { isLoading, error }] = useCreateTicketMutation();
  const { data: customersData } = useGetCustomersQuery({ limit: 100 });

  const customers = customersData?.data?.items ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "MEDIUM" },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await createTicket(data).unwrap();
      navigate(`/tickets/${result.data.id}`);
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
        <Link to="/tickets" className="text-sm text-slate-500 hover:text-primary-600">
          ← {t("tickets.title")}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">
          {t("tickets.createTicket")}
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("tickets.customer")}
          </label>
          <select
            className={cn(
              "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-primary-500",
              errors.customerId ? "border-red-400" : "border-slate-300"
            )}
            {...register("customerId")}
          >
            <option value="">{t("tickets.selectCustomer")}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
          {errors.customerId && (
            <p className="mt-1 text-xs text-red-600">{errors.customerId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("tickets.subject")}
          </label>
          <input
            className={cn(
              "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
              errors.subject ? "border-red-400" : "border-slate-300"
            )}
            {...register("subject")}
          />
          {errors.subject && (
            <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("tickets.description")}
          </label>
          <textarea
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            {...register("description")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("tickets.priority")}
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-primary-500"
            {...register("priority")}
          >
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 text-sm transition"
        >
          {isLoading ? t("common.loading") : t("tickets.createTicket")}
        </button>
      </form>
    </div>
  );
}
