import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useGetArticleQuery,
  useDeleteArticleMutation,
  useUpdateArticleMutation,
} from "@/features/knowledge/knowledgeApi";
import { StatusBadge } from "@/components/StatusBadge";

export default function KnowledgeDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetArticleQuery(id!);
  const [deleteArticle, { isLoading: isDeleting }] = useDeleteArticleMutation();
  const [updateArticle] = useUpdateArticleMutation();

  const article = data?.data;

  const handleDelete = async () => {
    if (!id || !confirm(t("knowledge.confirmDelete"))) return;
    await deleteArticle(id);
    navigate("/knowledge");
  };

  const handlePublish = async () => {
    if (!id) return;
    await updateArticle({
      id,
      body: { status: article?.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" },
    });
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-500">{t("common.loading")}</div>
    );
  }

  if (isError || !article) {
    return (
      <div className="py-20 text-center text-red-600">
        {t("knowledge.notFound")}
        <div className="mt-4">
          <Link to="/knowledge" className="text-primary-600 text-sm hover:underline">
            {t("common.back")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/knowledge"
            className="text-sm text-slate-500 hover:text-primary-600"
          >
            ← {t("knowledge.title")}
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge value={article.status} />
            {article.category && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {article.category}
              </span>
            )}
            {article.author && (
              <span className="text-xs text-slate-400">
                {article.author.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePublish}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
          >
            {article.status === "PUBLISHED"
              ? t("knowledge.unpublish")
              : t("knowledge.publish")}
          </button>
          <Link
            to={`/knowledge/${id}/edit`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
          >
            {t("common.edit")}
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-xs font-medium hover:bg-red-50 disabled:opacity-50"
          >
            {t("common.delete")}
          </button>
        </div>
      </div>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <article className="bg-white rounded-xl border border-slate-200 p-6 prose prose-slate max-w-none">
        <div className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
          {article.content}
        </div>
      </article>

      <p className="text-xs text-slate-400">
        {t("tickets.updated")}: {new Date(article.updatedAt).toLocaleString()}
        {article.publishedAt &&
          ` · Published: ${new Date(article.publishedAt).toLocaleString()}`}
      </p>
    </div>
  );
}
