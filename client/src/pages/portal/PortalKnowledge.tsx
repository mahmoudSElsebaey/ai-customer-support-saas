import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePortalKnowledgeQuery } from "@/features/portal/portalApi";

export default function PortalKnowledge() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const { data, isLoading } = usePortalKnowledgeQuery({
    search: q || undefined,
  });
  const articles = data?.data?.items ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">{t("portal.help")}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQ(search);
        }}
        className="flex gap-2"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.search")}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {t("common.search")}
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-slate-500">{t("common.loading")}</p>
        ) : articles.length === 0 ? (
          <p className="p-8 text-center text-slate-500">{t("knowledge.empty")}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {articles.map((a) => (
              <li key={a.id}>
                <Link
                  to={`/portal/${slug}/knowledge/${a.id}`}
                  className="block px-4 py-3 hover:bg-slate-50"
                >
                  <p className="font-medium text-slate-900">{a.title}</p>
                  {a.excerpt && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {a.excerpt}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
