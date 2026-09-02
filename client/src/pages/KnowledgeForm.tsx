import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useGetArticleQuery,
} from "@/features/knowledge/knowledgeApi";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(3),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(), // comma-separated in UI
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

type FormValues = z.infer<typeof schema>;

export default function KnowledgeForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: existing } = useGetArticleQuery(id!, { skip: !isEdit });
  const [createArticle, { isLoading: isCreating, error: createError }] =
    useCreateArticleMutation();
  const [updateArticle, { isLoading: isUpdating, error: updateError }] =
    useUpdateArticleMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "DRAFT" },
  });

  useEffect(() => {
    if (existing?.data) {
      const a = existing.data;
      reset({
        title: a.title,
        content: a.content ?? "",
        excerpt: a.excerpt ?? "",
        category: a.category ?? "",
        tags: a.tags.join(", "),
        status: a.status,
      });
    }
  }, [existing, reset]);

  const onSubmit = async (data: FormValues) => {
    const payload = {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || null,
      category: data.category || null,
      tags: data.tags
        ? data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      status: data.status,
    };

    try {
      if (isEdit && id) {
        await updateArticle({ id, body: payload }).unwrap();
        navigate(`/knowledge/${id}`);
      } else {
        const result = await createArticle(payload).unwrap();
        navigate(`/knowledge/${result.data.id}`);
      }
    } catch {
      // error state
    }
  };

  const error = createError || updateError;
  const apiError =
    error && "data" in error
      ? (error.data as { message?: string })?.message
      : null;
  const isLoading = isCreating || isUpdating;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link to="/knowledge" className="text-sm text-slate-500 hover:text-primary-600">
          ← {t("knowledge.title")}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">
          {isEdit ? t("knowledge.edit") : t("knowledge.create")}
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
            {t("knowledge.articleTitle")}
          </label>
          <input
            className={cn(
              "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
              errors.title ? "border-red-400" : "border-slate-300"
            )}
            {...register("title")}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("knowledge.content")}
          </label>
          <textarea
            rows={12}
            className={cn(
              "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-y font-mono",
              errors.content ? "border-red-400" : "border-slate-300"
            )}
            {...register("content")}
          />
          {errors.content && (
            <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("knowledge.excerpt")}
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-primary-500"
            placeholder={t("knowledge.excerptHint")}
            {...register("excerpt")}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("knowledge.category")}
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-primary-500"
              placeholder="e.g. Billing, Shipping"
              {...register("category")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("knowledge.status")}
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-primary-500"
              {...register("status")}
            >
              {["DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("knowledge.tags")}
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-primary-500"
            placeholder="refund, shipping, account"
            {...register("tags")}
          />
          <p className="mt-1 text-xs text-slate-400">{t("knowledge.tagsHint")}</p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 text-sm transition"
        >
          {isLoading
            ? t("common.loading")
            : isEdit
              ? t("common.save")
              : t("knowledge.create")}
        </button>
      </form>
    </div>
  );
}
