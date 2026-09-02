import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useAiStatusQuery,
  useAnalyzeTicketMutation,
  useSuggestReplyMutation,
  type TicketAnalysis,
} from "@/features/ai/aiApi";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

interface AiAssistantPanelProps {
  ticketId: string;
  onInsertSuggestion: (text: string) => void;
}

export function AiAssistantPanel({
  ticketId,
  onInsertSuggestion,
}: AiAssistantPanelProps) {
  const { t } = useTranslation();
  const { data: statusData } = useAiStatusQuery();
  const enabled = statusData?.data?.enabled ?? false;

  const [analyze, { isLoading: isAnalyzing }] = useAnalyzeTicketMutation();
  const [suggest, { isLoading: isSuggesting }] = useSuggestReplyMutation();

  const [analysis, setAnalysis] = useState<TicketAnalysis | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setError(null);
    try {
      const res = await analyze(ticketId).unwrap();
      setAnalysis(res.data.analysis);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "data" in e
          ? (e as { data?: { message?: string } }).data?.message
          : null;
      setError(msg ?? t("ai.error"));
    }
  };

  const handleSuggest = async () => {
    setError(null);
    try {
      const res = await suggest(ticketId).unwrap();
      setSuggestion(res.data.suggestion);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "data" in e
          ? (e as { data?: { message?: string } }).data?.message
          : null;
      setError(msg ?? t("ai.error"));
    }
  };

  if (!enabled) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          {t("ai.title")}
        </h3>
        <p className="text-sm text-slate-500">{t("ai.notConfigured")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {t("ai.title")}
        </h3>
        <span className="h-1.5 w-1.5 rounded-full bg-primary-500" title="AI on" />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-xs px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={cn(
            "rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
          )}
        >
          {isAnalyzing ? t("common.loading") : t("ai.analyze")}
        </button>
        <button
          type="button"
          onClick={handleSuggest}
          disabled={isSuggesting}
          className="rounded-lg bg-primary-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {isSuggesting ? t("common.loading") : t("ai.suggestReply")}
        </button>
      </div>

      {analysis && (
        <div className="space-y-2 rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs">
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge value={analysis.priority} />
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-600">
              {analysis.sentiment}
            </span>
          </div>
          <p>
            <span className="text-slate-500">{t("ai.intent")}:</span>{" "}
            <span className="font-medium text-slate-800">{analysis.intent}</span>
          </p>
          <p>
            <span className="text-slate-500">{t("ai.category")}:</span>{" "}
            <span className="font-medium text-slate-800">{analysis.category}</span>
          </p>
          <p className="text-slate-600 leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      {suggestion && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">{t("ai.suggestion")}</p>
          <div className="rounded-lg border border-primary-100 bg-primary-50/50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
            {suggestion}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onInsertSuggestion(suggestion)}
              className="rounded-lg bg-primary-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-primary-700"
            >
              {t("ai.insert")}
            </button>
            <button
              type="button"
              onClick={handleSuggest}
              disabled={isSuggesting}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {t("ai.regenerate")}
            </button>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 text-slate-500"
            >
              {t("ai.dismiss")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
