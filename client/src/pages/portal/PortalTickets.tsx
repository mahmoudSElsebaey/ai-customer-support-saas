import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePortalTicketsQuery } from "@/features/portal/portalApi";
import { StatusBadge } from "@/components/StatusBadge";

export default function PortalTickets() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { data, isLoading } = usePortalTicketsQuery();
  const tickets = data?.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">
          {t("portal.myTickets")}
        </h1>
        <Link
          to={`/portal/${slug}/new`}
          className="rounded-lg bg-primary-600 text-white text-sm px-3 py-1.5 hover:bg-primary-700"
        >
          {t("portal.newTicket")}
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-slate-500">{t("common.loading")}</p>
        ) : tickets.length === 0 ? (
          <p className="p-8 text-center text-slate-500">{t("portal.noTickets")}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  to={`/portal/${slug}/tickets/${ticket.id}`}
                  className="block px-4 py-3 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(ticket.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <StatusBadge value={ticket.status} />
                      <StatusBadge value={ticket.priority} />
                    </div>
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
