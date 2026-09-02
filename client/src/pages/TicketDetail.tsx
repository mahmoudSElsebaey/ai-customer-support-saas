import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useGetTicketQuery,
  useUpdateTicketMutation,
  useAddMessageMutation,
  type TicketStatus,
  type TicketPriority,
  type TicketMessage,
} from "@/features/tickets/ticketsApi";
import { useMeQuery } from "@/features/auth/authApi";
import { useSocket } from "@/hooks/useSocket";
import { StatusBadge } from "@/components/StatusBadge";
import { AiAssistantPanel } from "@/components/AiAssistantPanel";
import { cn } from "@/lib/utils";

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useGetTicketQuery(id!);
  const { data: meData } = useMeQuery();
  const [updateTicket] = useUpdateTicketMutation();
  const [addMessage, { isLoading: isSending }] = useAddMessageMutation();

  const {
    connected,
    joinTicket,
    leaveTicket,
    emitTypingStart,
    emitTypingStop,
    socket,
  } = useSocket();

  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [liveMessages, setLiveMessages] = useState<TicketMessage[] | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ticket = data?.data;
  const currentUserId = meData?.data?.id;

  useEffect(() => {
    if (ticket?.messages) {
      setLiveMessages(ticket.messages);
    }
  }, [ticket?.messages]);

  useEffect(() => {
    if (!id || !connected) return;
    joinTicket(id);
    return () => {
      leaveTicket(id);
    };
  }, [id, connected, joinTicket, leaveTicket]);

  useEffect(() => {
    if (!id) return;

    const onMessageCreated = (payload: {
      ticketId: string;
      message: TicketMessage;
    }) => {
      if (payload.ticketId !== id) return;
      setLiveMessages((prev) => {
        const list = prev ?? [];
        if (list.some((m) => m.id === payload.message.id)) return list;
        return [...list, payload.message];
      });
      if (payload.message.sender?.id) {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[payload.message.sender!.id];
          return next;
        });
      }
    };

    const onTicketUpdated = (payload: { ticket: { id: string } }) => {
      if (payload.ticket.id === id) refetch();
    };

    const onTypingStart = (payload: {
      ticketId: string;
      userId: string;
      name: string;
    }) => {
      if (payload.ticketId !== id || payload.userId === currentUserId) return;
      setTypingUsers((prev) => ({ ...prev, [payload.userId]: payload.name }));
    };

    const onTypingStop = (payload: { ticketId: string; userId: string }) => {
      if (payload.ticketId !== id) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[payload.userId];
        return next;
      });
    };

    socket.on("message:created", onMessageCreated);
    socket.on("ticket:updated", onTicketUpdated);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);

    return () => {
      socket.off("message:created", onMessageCreated);
      socket.off("ticket:updated", onTicketUpdated);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
    };
  }, [id, socket, currentUserId, refetch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages, typingUsers]);

  const handleTyping = useCallback(() => {
    if (!id) return;
    emitTypingStart(id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(id);
    }, 1500);
  }, [id, emitTypingStart, emitTypingStop]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !id) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitTypingStop(id);

    try {
      await addMessage({
        ticketId: id,
        content: content.trim(),
        type: isInternal ? "INTERNAL_NOTE" : "AGENT",
      }).unwrap();
      setContent("");
      setIsInternal(false);
    } catch {
      // RTK error
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!id) return;
    await updateTicket({ id, body: { status } });
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    if (!id) return;
    await updateTicket({ id, body: { priority } });
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-500">{t("common.loading")}</div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="py-20 text-center text-red-600">
        {t("tickets.notFound")}
        <div className="mt-4">
          <Link to="/tickets" className="text-primary-600 hover:underline text-sm">
            {t("common.back")}
          </Link>
        </div>
      </div>
    );
  }

  const messages = liveMessages ?? ticket.messages ?? [];
  const typingNames = Object.values(typingUsers);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/tickets"
            className="text-sm text-slate-500 hover:text-primary-600 mb-2 inline-block"
          >
            ← {t("tickets.title")}
          </Link>
          <h1 className="text-xl font-bold text-slate-900">{ticket.subject}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge value={ticket.status} />
            <StatusBadge value={ticket.priority} />
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border",
                connected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  connected ? "bg-emerald-500" : "bg-slate-400"
                )}
              />
              {connected ? "Live" : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-primary-500"
          >
            {["OPEN", "PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(
              (s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              )
            )}
          </select>
          <select
            value={ticket.priority}
            onChange={(e) =>
              handlePriorityChange(e.target.value as TicketPriority)
            }
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-primary-500"
          >
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 min-h-[320px] max-h-[520px] overflow-y-auto space-y-4">
            {messages.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-10">
                {t("tickets.noMessages")}
              </p>
            )}
            {messages.map((msg) => {
              const isNote = msg.type === "INTERNAL_NOTE";
              const isSystem = msg.type === "SYSTEM";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "rounded-lg px-4 py-3 text-sm",
                    isNote && "bg-amber-50 border border-amber-100",
                    isSystem &&
                      "bg-slate-50 text-slate-500 text-xs text-center",
                    !isNote &&
                      !isSystem &&
                      msg.type === "AGENT" &&
                      "bg-primary-50 border border-primary-100",
                    !isNote &&
                      !isSystem &&
                      msg.type === "CUSTOMER" &&
                      "bg-slate-50 border border-slate-100"
                  )}
                >
                  {!isSystem && (
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-800 text-xs">
                        {msg.sender?.name ?? "System"}
                        {isNote && (
                          <span className="ms-2 text-amber-600">
                            ({t("tickets.internalNote")})
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-slate-700">
                    {msg.content}
                  </p>
                </div>
              );
            })}

            {typingNames.length > 0 && (
              <p className="text-xs text-slate-400 italic px-1">
                {typingNames.join(", ")} {t("tickets.typing")}
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
          >
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                handleTyping();
              }}
              rows={3}
              placeholder={t("tickets.replyPlaceholder")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-slate-300"
                />
                {t("tickets.internalNote")}
              </label>
              <button
                type="submit"
                disabled={isSending || !content.trim()}
                className="rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 disabled:opacity-50 transition"
              >
                {isSending ? t("common.loading") : t("tickets.send")}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              {t("tickets.customer")}
            </h3>
            <p className="font-medium text-slate-900">{ticket.customer.name}</p>
            <p className="text-sm text-slate-500">{ticket.customer.email}</p>
            {ticket.customer.company && (
              <p className="text-sm text-slate-500 mt-1">
                {ticket.customer.company}
              </p>
            )}
            <Link
              to={`/customers/${ticket.customer.id}`}
              className="text-xs text-primary-600 hover:underline mt-2 inline-block"
            >
              {t("customers.viewProfile")}
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              {t("tickets.agent")}
            </h3>
            <p className="text-sm text-slate-700">
              {ticket.assignedAgent?.name ?? t("tickets.unassigned")}
            </p>
          </div>

          {id && (
            <AiAssistantPanel
              ticketId={id}
              onInsertSuggestion={(text) => setContent(text)}
            />
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-4 text-xs text-slate-500 space-y-1">
            <p>
              {t("tickets.created")}:{" "}
              {new Date(ticket.createdAt).toLocaleString()}
            </p>
            <p>
              {t("tickets.updated")}:{" "}
              {new Date(ticket.updatedAt).toLocaleString()}
            </p>
            {ticket.resolvedAt && (
              <p>Resolved: {new Date(ticket.resolvedAt).toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
