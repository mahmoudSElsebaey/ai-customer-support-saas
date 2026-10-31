import { useState } from "react";
import type { FormEvent } from "react";
import { Bot, MessageCircle, Send, X, Sparkles, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

type Message = { role: "user" | "assistant"; content: string };

export default function DemoChatWidget() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith("ar");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: ar ? "أهلاً بك! أنا مساعد Voxly التجريبي. اسألني كيف يمكننا تحسين خدمة عملائك." : "Hi there! I'm the Voxly demo assistant. Ask me how we can make your customer support better." },
  ]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/api/public-demo/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-9) }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.data?.reply) {
        throw new Error(payload?.message || (ar ? "تعذر الحصول على رد. حاول مرة أخرى." : "Couldn't get a reply. Please try again."));
      }
      setMessages((current) => [...current, { role: "assistant", content: payload.data.reply }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : (ar ? "حدث خطأ غير متوقع." : "Something went wrong.") }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <section className="vox-chat-panel" dir={ar ? "rtl" : "ltr"} aria-label={ar ? "محادثة تجريبية مع الذكاء الاصطناعي" : "AI product demo chat"}>
          <header className="vox-chat-head">
            <div className="vox-chat-avatar"><Bot size={21} /></div>
            <div className="min-w-0 flex-1">
              <strong>Voxly AI</strong>
              <span><i /> {ar ? "متصل الآن · تجربة مباشرة" : "Online · Live demo"}</span>
            </div>
            <button className="vox-icon-btn" onClick={() => setOpen(false)} aria-label={ar ? "إغلاق" : "Close"}><X size={19} /></button>
          </header>
          <div className="vox-chat-messages" aria-live="polite">
            <div className="vox-chat-note"><Sparkles size={13} /> {ar ? "هذه محادثة تجريبية مدعومة بالذكاء الاصطناعي" : "A live AI-powered product demo"}</div>
            {messages.map((message, index) => (
              <div className={`vox-message ${message.role === "user" ? "vox-message-user" : "vox-message-ai"}`} key={index}>{message.content}</div>
            ))}
            {busy && <div className="vox-message vox-message-ai vox-typing"><LoaderCircle size={15} className="animate-spin" /> {ar ? "يكتب..." : "Thinking..."}</div>}
          </div>
          <form className="vox-chat-compose" onSubmit={sendMessage}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={ar ? "اكتب رسالتك هنا..." : "Ask Voxly anything..."} maxLength={1200} aria-label={ar ? "رسالتك" : "Your message"} />
            <button type="submit" disabled={!input.trim() || busy} aria-label={ar ? "إرسال" : "Send"}><Send size={17} /></button>
          </form>
          <p className="vox-chat-disclaimer">{ar ? "قد تكون إجابات الذكاء الاصطناعي غير دقيقة." : "AI responses may not always be accurate."}</p>
        </section>
      )}
      <button className={`vox-chat-launcher ${open ? "is-open" : ""}`} onClick={() => setOpen((value) => !value)} aria-label={open ? (ar ? "إغلاق المحادثة" : "Close chat") : (ar ? "جرّب مساعد الذكاء الاصطناعي" : "Try the AI assistant")}>
        {open ? <X size={23} /> : <><MessageCircle size={22} /><span>{ar ? "جرّب Voxly AI" : "Try Voxly AI"}</span><i /></>}
      </button>
    </>
  );
}
