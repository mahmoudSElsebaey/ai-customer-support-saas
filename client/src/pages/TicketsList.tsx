import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetTicketsQuery } from "@/features/tickets/ticketsApi";
import { StatusBadge } from "@/components/StatusBadge";

const statuses = ["", "OPEN", "PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const priorities = ["", "LOW", "MEDIUM", "HIGH", "URGENT"];

export default function TicketsList() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isFetching } = useGetTicketsQuery({
    page,
    limit: 20,
    status: status || undefined,
    priority: priority || undefined,
    search: search || undefined,
  });

  const tickets = data?.data?.items ?? [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("tickets.title")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {pagination ? `${pagination.total} ${t("tickets.total")}` : "—"}
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition"
        >
          {t("tickets.createTicket")}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
            setPage(1);
          }}
          className="flex gap-2"
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("common.search")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-48"
          />
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            {t("common.search")}
          </button>
        </form>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
        >
          <option value="">{t("tickets.allStatuses")}</option>
          {statuses.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
        >
          <option value="">{t("tickets.allPriorities")}</option>
          {priorities.filter(Boolean).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">{t("common.loading")}</div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center text-slate-500">{t("tickets.empty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-start px-4 py-3 font-medium">{t("tickets.subject")}</th>
                  <th className="text-start px-4 py-3 font-medium">{t("tickets.customer")}</th>
                  <th className="text-start px-4 py-3 font-medium">{t("tickets.status")}</th>
                  <th className="text-start px-4 py-3 font-medium">{t("tickets.priority")}</th>
                  <th className="text-start px-4 py-3 font-medium">{t("tickets.agent")}</th>
                  <th className="text-start px-4 py-3 font-medium">{t("tickets.updated")}</th>
                </tr>
              </thead>
              <tbody className={isFetching ? "opacity-60" : ""}>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80 transition"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="font-medium text-slate-900 hover:text-primary-600"
                      >
                        {ticket.subject}
                      </Link>
                      {ticket._count && (
                        <span className="ms-2 text-xs text-slate-400">
                          {ticket._count.messages} msgs
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {ticket.customer.name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={ticket.status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={ticket.priority} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {ticket.assignedAgent?.name ?? (
                        <span className="text-slate-400">{t("tickets.unassigned")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(ticket.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-sm text-slate-600 disabled:opacity-40 hover:text-primary-600"
            >
              {t("common.back")}
            </button>
            <span className="text-xs text-slate-500">
              {page} / {pagination.totalPages}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="text-sm text-slate-600 disabled:opacity-40 hover:text-primary-600"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
