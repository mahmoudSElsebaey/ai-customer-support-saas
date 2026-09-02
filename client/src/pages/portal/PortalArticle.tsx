import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePortalArticleQuery } from "@/features/portal/portalApi";

export default function PortalArticle() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const { t } = useTranslation();
  const { data, isLoading, isError } = usePortalArticleQuery(id!);
  const article = data?.data;

  if (isLoading) {
    return <p className="py-12 text-center text-slate-500">{t("common.loading")}</p>;
  }

  if (isError || !article) {
    return (
      <p className="py-12 text-center text-red-600">{t("knowledge.notFound")}</p>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        to={`/portal/${slug}/knowledge`}
        className="text-sm text-slate-500 hover:text-primary-600"
      >
        ← {t("portal.help")}
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">{article.title}</h1>
      {article.category && (
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
          {article.category}
        </span>
      )}
      <article className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
          {article.content}
        </div>
      </article>
    </div>
  );
}
