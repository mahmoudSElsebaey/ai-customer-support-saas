import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetCustomersQuery } from "@/features/customers/customersApi";
import { StatusBadge } from "@/components/StatusBadge";

export default function CustomersList() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isFetching } = useGetCustomersQuery({
    page,
    limit: 20,
    search: search || undefined,
  });

  const customers = data?.data?.items ?? [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("customers.title")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {pagination ? `${pagination.total} ${t("customers.total")}` : "—"}
          </p>
        </div>
        <Link
          to="/customers/new"
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition"
        >
          {t("customers.create")}
        </Link>
      </div>

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
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-56"
        />
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        >
          {t("common.search")}
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">{t("common.loading")}</div>
        ) : customers.length === 0 ? (
          <div className="p-10 text-center text-slate-500">{t("customers.empty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-start px-4 py-3 font-medium">{t("auth.name")}</th>
                  <th className="text-start px-4 py-3 font-medium">{t("auth.email")}</th>
                  <th className="text-start px-4 py-3 font-medium">{t("customers.company")}</th>
                  <th className="text-start px-4 py-3 font-medium">{t("tickets.status")}</th>
                  <th className="text-start px-4 py-3 font-medium">{t("tickets.title")}</th>
                </tr>
              </thead>
              <tbody className={isFetching ? "opacity-60" : ""}>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/customers/${c.id}`}
                        className="font-medium text-slate-900 hover:text-primary-600"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.email}</td>
                    <td className="px-4 py-3 text-slate-600">{c.company ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge value={c.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {c._count?.tickets ?? 0}
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
              className="text-sm text-slate-600 disabled:opacity-40"
            >
              {t("common.back")}
            </button>
            <span className="text-xs text-slate-500">
              {page} / {pagination.totalPages}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="text-sm text-slate-600 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
