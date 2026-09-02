import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePortalCreateTicketMutation } from "@/features/portal/portalApi";

const schema = z.object({
  subject: z.string().min(3),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

type FormValues = z.infer<typeof schema>;

export default function PortalNewTicket() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [createTicket, { isLoading, error }] = usePortalCreateTicketMutation();

  const { register, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "MEDIUM" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await createTicket(values).unwrap();
      navigate(`/portal/${slug}/tickets/${res.data.id}`);
    } catch {
      /* */
    }
  };

  const apiError =
    error && "data" in error
      ? (error.data as { message?: string })?.message
      : null;

  return (
    <div className="space-y-4 max-w-lg">
      <Link
        to={`/portal/${slug}`}
        className="text-sm text-slate-500 hover:text-primary-600"
      >
        ← {t("portal.myTickets")}
      </Link>
      <h1 className="text-xl font-bold text-slate-900">
        {t("portal.newTicket")}
      </h1>

      {apiError && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">
          {apiError}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border border-slate-200 p-5 space-y-3"
      >
        <input
          placeholder={t("tickets.subject")}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          {...register("subject")}
        />
        <textarea
          rows={5}
          placeholder={t("tickets.description")}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-y"
          {...register("description")}
        />
        <select
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          {...register("priority")}
        >
          {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-primary-600 text-white py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {isLoading ? t("common.loading") : t("portal.submitTicket")}
        </button>
      </form>
    </div>
  );
}
