import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  usePortalTicketQuery,
  usePortalAddMessageMutation,
} from "@/features/portal/portalApi";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export default function PortalTicketDetail() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const { t } = useTranslation();
  const { data, isLoading, isError } = usePortalTicketQuery(id!);
  const [addMessage, { isLoading: sending }] = usePortalAddMessageMutation();
  const [content, setContent] = useState("");

  const ticket = data?.data;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !id) return;
    await addMessage({ ticketId: id, content: content.trim() });
    setContent("");
  };

  if (isLoading) {
    return <p className="py-12 text-center text-slate-500">{t("common.loading")}</p>;
  }

  if (isError || !ticket) {
    return (
      <p className="py-12 text-center text-red-600">{t("tickets.notFound")}</p>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        to={`/portal/${slug}`}
        className="text-sm text-slate-500 hover:text-primary-600"
      >
        ← {t("portal.myTickets")}
      </Link>

      <div>
        <h1 className="text-xl font-bold text-slate-900">{ticket.subject}</h1>
        <div className="flex gap-2 mt-2">
          <StatusBadge value={ticket.status} />
          <StatusBadge value={ticket.priority} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 max-h-[420px] overflow-y-auto">
        {(ticket.messages ?? []).map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              msg.type === "CUSTOMER"
                ? "bg-slate-50 border border-slate-100"
                : "bg-primary-50 border border-primary-100"
            )}
          >
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{msg.sender?.name ?? "Support"}</span>
              <span>{new Date(msg.createdAt).toLocaleString()}</span>
            </div>
            <p className="whitespace-pre-wrap text-slate-700">{msg.content}</p>
          </div>
        ))}
      </div>

      {ticket.status !== "CLOSED" && (
        <form onSubmit={handleSend} className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder={t("tickets.replyPlaceholder")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="rounded-lg bg-primary-600 text-white text-sm px-4 py-2 hover:bg-primary-700 disabled:opacity-50"
          >
            {sending ? t("common.loading") : t("tickets.send")}
          </button>
        </form>
      )}
    </div>
  );
}
