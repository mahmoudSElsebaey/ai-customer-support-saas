import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useGetPlansQuery,
  useGetSubscriptionQuery,
  useCreateCheckoutMutation,
  useCreatePortalMutation,
} from "@/features/billing/billingApi";
import { cn } from "@/lib/utils";

export default function Billing() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: plansData, isLoading: loadingPlans } = useGetPlansQuery();
  const { data: subData, isLoading: loadingSub, refetch } =
    useGetSubscriptionQuery();
  const [checkout, { isLoading: checkingOut }] = useCreateCheckoutMutation();
  const [portal, { isLoading: openingPortal }] = useCreatePortalMutation();

  const plans = plansData?.data?.plans ?? [];
  const enabled = plansData?.data?.enabled ?? false;
  const sub = subData?.data;

  useEffect(() => {
    if (params.get("success")) {
      setBanner(t("billing.success"));
      void refetch();
    } else if (params.get("canceled")) {
      setBanner(t("billing.canceled"));
    }
  }, [params, t, refetch]);

  const handleCheckout = async (plan: "PRO" | "BUSINESS") => {
    setError(null);
    try {
      const res = await checkout({ plan }).unwrap();
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "data" in e
          ? (e as { data?: { message?: string } }).data?.message
          : null;
      setError(msg ?? t("billing.error"));
    }
  };

  const handlePortal = async () => {
    setError(null);
    try {
      const res = await portal().unwrap();
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "data" in e
          ? (e as { data?: { message?: string } }).data?.message
          : null;
      setError(msg ?? t("billing.error"));
    }
  };

  if (loadingPlans || loadingSub) {
    return (
      <div className="py-20 text-center text-slate-500">{t("common.loading")}</div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("billing.title")}</h1>
        <p className="text-sm text-slate-500 mt-1">{t("billing.subtitle")}</p>
      </div>

      {banner && (
        <div className="rounded-lg bg-emerald-50 text-emerald-800 text-sm px-4 py-3">
          {banner}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {sub && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {t("billing.currentPlan")}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {sub.planName}
              <span className="ms-2 text-xs font-normal text-slate-500">
                ({sub.planStatus})
              </span>
            </p>
            {sub.currentPeriodEnd && (
              <p className="text-xs text-slate-400 mt-1">
                {t("billing.periodEnd")}:{" "}
                {new Date(sub.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          {enabled && sub.stripeCustomerId && (
            <button
              type="button"
              onClick={handlePortal}
              disabled={openingPortal}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {openingPortal ? t("common.loading") : t("billing.manage")}
            </button>
          )}
        </div>
      )}

      {!enabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3">
          {t("billing.notConfigured")}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = sub?.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={cn(
                "bg-white rounded-xl border p-5 flex flex-col",
                isCurrent
                  ? "border-primary-500 ring-1 ring-primary-500"
                  : "border-slate-200"
              )}
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {plan.name}
                </h3>
                <p className="mt-2">
                  <span className="text-3xl font-bold text-slate-900">
                    ${plan.priceMonthly}
                  </span>
                  <span className="text-sm text-slate-500">
                    /{t("billing.month")}
                  </span>
                </p>
              </div>

              <ul className="space-y-2 text-sm text-slate-600 flex-1 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-primary-600">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.id === "FREE" ? (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-lg border border-slate-200 text-slate-400 py-2 text-sm"
                >
                  {isCurrent ? t("billing.current") : t("billing.free")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    !plan.checkoutAvailable || checkingOut || isCurrent
                  }
                  onClick={() =>
                    handleCheckout(plan.id as "PRO" | "BUSINESS")
                  }
                  className={cn(
                    "w-full rounded-lg py-2 text-sm font-medium transition disabled:opacity-50",
                    isCurrent
                      ? "border border-slate-200 text-slate-400"
                      : "bg-primary-600 text-white hover:bg-primary-700"
                  )}
                >
                  {isCurrent
                    ? t("billing.current")
                    : checkingOut
                      ? t("common.loading")
                      : t("billing.upgrade")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
