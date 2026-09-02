import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetCustomerQuery } from "@/features/customers/customersApi";
import { StatusBadge } from "@/components/StatusBadge";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetCustomerQuery(id!);

  const customer = data?.data;

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-500">{t("common.loading")}</div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="py-20 text-center text-red-600">
        Customer not found
        <div className="mt-4">
          <Link to="/customers" className="text-primary-600 text-sm hover:underline">
            {t("common.back")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link to="/customers" className="text-sm text-slate-500 hover:text-primary-600">
          ← {t("customers.title")}
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
          <StatusBadge value={customer.status} />
        </div>
        <p className="text-slate-500 text-sm mt-1">{customer.email}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
          <p className="mt-1 text-slate-900">{customer.phone ?? "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase">
            {t("customers.company")}
          </p>
          <p className="mt-1 text-slate-900">{customer.company ?? "—"}</p>
        </div>
      </div>

      {customer.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase mb-2">
            {t("customers.notes")}
          </p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{customer.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{t("tickets.title")}</h2>
          <span className="text-xs text-slate-500">
            {customer._count?.tickets ?? 0}
          </span>
        </div>
        {(customer.tickets ?? []).length === 0 ? (
          <p className="p-6 text-sm text-slate-400 text-center">{t("tickets.empty")}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(customer.tickets ?? []).map((ticket) => (
              <li key={ticket.id}>
                <Link
                  to={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={ticket.status} />
                    <StatusBadge value={ticket.priority} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
