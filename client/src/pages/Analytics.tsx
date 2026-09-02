import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetAnalyticsOverviewQuery } from "@/features/analytics/analyticsApi";

function formatHours(h: number | null | undefined) {
  if (h == null) return "—";
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

export default function Analytics() {
  const { t } = useTranslation();
  const [days, setDays] = useState(30);
  const { data, isLoading, isFetching } = useGetAnalyticsOverviewQuery({ days });

  const overview = data?.data;
  const maxVolume = Math.max(
    1,
    ...(overview?.volumeSeries.map((v) => v.count) ?? [1])
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("analytics.title")}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t("analytics.subtitle", { days })}
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
                days === d
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-500">{t("common.loading")}</div>
      ) : !overview ? (
        <div className="py-16 text-center text-slate-500">—</div>
      ) : (
        <div className={`space-y-8 ${isFetching ? "opacity-70" : ""}`}>
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              label={t("analytics.created")}
              value={overview.totals.createdInPeriod}
            />
            <Kpi
              label={t("analytics.resolved")}
              value={overview.totals.resolvedInPeriod}
            />
            <Kpi
              label={t("analytics.avgFirstResponse")}
              value={formatHours(overview.performance.avgFirstResponseHours)}
            />
            <Kpi
              label={t("analytics.avgResolution")}
              value={formatHours(overview.performance.avgResolutionHours)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi
              label={t("workspace.active")}
              value={overview.totals.activeTickets}
              compact
            />
            <Kpi
              label={t("customers.title")}
              value={overview.totals.customers}
              compact
            />
            <Kpi
              label={t("knowledge.title")}
              value={overview.totals.publishedArticles}
              compact
            />
          </div>

          {/* Volume chart */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">
              {t("analytics.volume")}
            </h2>
            <div className="flex items-end gap-1 h-36">
              {overview.volumeSeries.map((point) => {
                const height = Math.max(
                  2,
                  (point.count / maxVolume) * 100
                );
                return (
                  <div
                    key={point.date}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    <div
                      className="w-full max-w-[14px] rounded-t bg-primary-500/80 hover:bg-primary-600 transition"
                      style={{ height: `${height}%` }}
                      title={`${point.date}: ${point.count}`}
                    />
                    <span className="sr-only">
                      {point.date}: {point.count}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-400">
              <span>{overview.volumeSeries[0]?.date}</span>
              <span>
                {overview.volumeSeries[overview.volumeSeries.length - 1]?.date}
              </span>
            </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Status breakdown */}
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-4">
                {t("analytics.byStatus")}
              </h2>
              <Breakdown rows={Object.entries(overview.byStatus)} />
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-4">
                {t("analytics.byPriority")}
              </h2>
              <Breakdown rows={Object.entries(overview.byPriority)} />
            </section>
          </div>

          {/* Agent workload */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">
              {t("analytics.agentWorkload")}
            </h2>
            {overview.agentWorkload.length === 0 ? (
              <p className="text-sm text-slate-400">{t("analytics.noAgents")}</p>
            ) : (
              <ul className="space-y-2">
                {overview.agentWorkload.map((a) => (
                  <li
                    key={a.agentId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-700">{a.name}</span>
                    <span className="font-medium text-slate-900">
                      {a.activeTickets}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* AI usage */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">
              {t("analytics.aiUsage")}
            </h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <Kpi
                label={t("analytics.aiRequests")}
                value={overview.ai.totalRequests}
                compact
              />
              <Kpi
                label={t("analytics.aiTokens")}
                value={overview.ai.totalTokens.toLocaleString()}
                compact
              />
              <Kpi
                label={t("analytics.aiCost")}
                value={`$${overview.ai.totalCost.toFixed(4)}`}
                compact
              />
            </div>
            {Object.keys(overview.ai.byFeature).length > 0 && (
              <ul className="divide-y divide-slate-100 text-sm">
                {Object.entries(overview.ai.byFeature).map(([feature, row]) => (
                  <li
                    key={feature}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-slate-600 font-mono text-xs">
                      {feature}
                    </span>
                    <span className="text-slate-800">
                      {row.requests} req · {row.tokens.toLocaleString()} tok · $
                      {row.cost.toFixed(4)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  compact,
}: {
  label: string;
  value: string | number;
  compact?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 ${compact ? "p-4" : "p-5"}`}
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`mt-2 font-bold text-slate-900 ${compact ? "text-xl" : "text-2xl"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Breakdown({ rows }: { rows: [string, number][] }) {
  const total = rows.reduce((s, [, n]) => s + n, 0) || 1;
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">—</p>;
  }
  return (
    <ul className="space-y-3">
      {rows
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => (
          <li key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">{label.replace(/_/g, " ")}</span>
              <span className="text-slate-800 font-medium">{count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500"
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
          </li>
        ))}
    </ul>
  );
}
