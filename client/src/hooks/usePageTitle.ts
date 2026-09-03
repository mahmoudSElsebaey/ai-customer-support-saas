import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const APP_NAME = "Voxly";

/** Map path prefixes to i18n title keys */
function resolveTitleKey(pathname: string): string | null {
  if (pathname === "/") return null;
  if (pathname.startsWith("/login")) return "auth.login";
  if (pathname.startsWith("/register")) return "auth.register";
  if (pathname.startsWith("/dashboard")) return "nav.dashboard";
  if (pathname.startsWith("/tickets/new")) return "tickets.createTicket";
  if (pathname.match(/^\/tickets\/[^/]+$/)) return "tickets.title";
  if (pathname.startsWith("/tickets")) return "nav.tickets";
  if (pathname.startsWith("/customers/new")) return "customers.create";
  if (pathname.match(/^\/customers\/[^/]+$/)) return "customers.title";
  if (pathname.startsWith("/customers")) return "nav.customers";
  if (pathname.startsWith("/knowledge/new")) return "knowledge.create";
  if (pathname.match(/^\/knowledge\/[^/]+\/edit$/)) return "knowledge.edit";
  if (pathname.match(/^\/knowledge\/[^/]+$/)) return "knowledge.title";
  if (pathname.startsWith("/knowledge")) return "nav.knowledge";
  if (pathname.startsWith("/analytics")) return "nav.analytics";
  if (pathname.startsWith("/billing")) return "nav.billing";
  if (pathname.includes("/portal/") && pathname.endsWith("/login"))
    return "auth.login";
  if (pathname.includes("/portal/") && pathname.endsWith("/register"))
    return "auth.register";
  if (pathname.includes("/portal/") && pathname.includes("/knowledge"))
    return "portal.help";
  if (pathname.includes("/portal/") && pathname.includes("/new"))
    return "portal.newTicket";
  if (pathname.includes("/portal/")) return "portal.helpCenter";
  return null;
}

/**
 * Sets document.title from the current route + language.
 * Mount once near the app root (e.g. inside App).
 */
export function usePageTitle() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const key = resolveTitleKey(pathname);
    document.title = key
      ? `${t(key)} · ${APP_NAME}`
      : `${APP_NAME} — AI Customer Support`;
  }, [pathname, t, i18n.language]);
}
