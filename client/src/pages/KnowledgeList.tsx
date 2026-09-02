import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useGetArticlesQuery,
  useGetCategoriesQuery,
} from "@/features/knowledge/knowledgeApi";
import { useEmbedArticlesMutation, useAiStatusQuery } from "@/features/ai/aiApi";
import { StatusBadge } from "@/components/StatusBadge";

export default function KnowledgeList() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [embedMsg, setEmbedMsg] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useGetArticlesQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
    category: category || undefined,
  });

  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: aiStatus } = useAiStatusQuery();
  const [embedArticles, { isLoading: isEmbedding }] = useEmbedArticlesMutation();

  const categories = categoriesData?.data ?? [];
  const articles = data?.data?.items ?? [];
  const pagination = data?.data?.pagination;
  const aiEnabled = aiStatus?.data?.enabled ?? false;

  const handleEmbed = async () => {
    setEmbedMsg(null);
    try {
      const res = await embedArticles({ force: false, limit: 50 }).unwrap();
      setEmbedMsg(
        t("ai.embedResult", {
          ok: res.data.succeeded,
          total: res.data.processed,
        })
      );
    } catch {
      setEmbedMsg(t("ai.error"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("knowledge.title")}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {pagination ? `${pagination.total} ${t("knowledge.total")}` : "—"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {aiEnabled && (
            <button
              type="button"
              onClick={handleEmbed}
              disabled={isEmbedding}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
            >
              {isEmbedding ? t("common.loading") : t("ai.embedArticles")}
            </button>
          )}
          <Link
            to="/knowledge/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition"
          >
            {t("knowledge.create")}
          </Link>
        </div>
      </div>

      {embedMsg && (
        <div className="rounded-lg bg-emerald-50 text-emerald-800 text-sm px-4 py-2">
          {embedMsg}
        </div>
      )}

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
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">{t("knowledge.allStatuses")}</option>
          {["DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">{t("knowledge.allCategories")}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">
            {t("common.loading")}
          </div>
        ) : articles.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            {t("knowledge.empty")}
          </div>
        ) : (
          <ul className={`divide-y divide-slate-100 ${isFetching ? "opacity-60" : ""}`}>
            {articles.map((article) => (
              <li key={article.id}>
                <Link
                  to={`/knowledge/${article.id}`}
                  className="block px-5 py-4 hover:bg-slate-50/80 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {article.title}
                      </p>
                      {article.excerpt && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {article.category && (
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {article.category}
                          </span>
                        )}
                        {article.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge value={article.status} />
                      <span className="text-[11px] text-slate-400">
                        {new Date(article.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
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
