import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, ArrowLeft, ArrowRight, Bot, Check, Headphones, Inbox, Languages, LifeBuoy, MessageSquareText, ShieldCheck, Sparkles, Zap, BarChart3, BookOpen, Menu } from "lucide-react";
import { useState } from "react";
import DemoChatWidget from "../components/DemoChatWidget";

export default function LandingPage() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith("ar");
  const [menuOpen, setMenuOpen] = useState(false);
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const copy = ar ? {
    navFeatures:"المميزات", navHow:"كيف يعمل", navLogin:"تسجيل الدخول", navStart:"ابدأ مجاناً",
    eyebrow:"منصة دعم العملاء المدعومة بالذكاء الاصطناعي",
    title:"كل محادثات عملائك.\nفي مكان واحد.",
    lead:"Voxly يجمع المحادثات والتذاكر وقاعدة المعرفة والذكاء الاصطناعي في مساحة عمل واحدة تساعد فريقك على تقديم دعم أسرع وأكثر إنسانية.",
    primary:"ابدأ تجربتك المجانية", secondary:"جرّب المساعد الذكي",
    trusted:"كل ما يحتاجه فريق الدعم لينجز أكثر",
    featuresTitle:"دعم عملاء أذكى، من أول رسالة",
    featuresLead:"أدوات مترابطة تقلل الفوضى وتمنح فريقك رؤية كاملة لكل عميل.",
    f1:"صندوق وارد موحّد", d1:"تابع طلبات العملاء ومحادثاتهم من مكان واحد، دون التنقل بين الأدوات.",
    f2:"مساعد ذكاء اصطناعي", d2:"أنشئ ردوداً مقترحة واستفد من قاعدة المعرفة لتقديم إجابات أدق.",
    f3:"قاعدة معرفة", d3:"نظّم مقالات المساعدة واجعل الوصول للمعلومة أسرع للفريق والعملاء.",
    f4:"تحليلات واضحة", d4:"راقب حجم الطلبات وسرعة الاستجابة وأداء فريقك من لوحة واحدة.",
    howTitle:"من أول سؤال إلى عميل أكثر رضا",
    s1:"استقبل", sd1:"اجمع رسائل العملاء وطلبات الدعم في صندوق موحّد.",
    s2:"تعاون", sd2:"وزّع التذاكر على فريقك وتابع كل محادثة بسياقها.",
    s3:"أجب بذكاء", sd3:"دع AI يساعد فريقك باقتراح ردود مستندة إلى قاعدة المعرفة.",
    ctaTitle:"جاهز لتجربة دعم مختلفة؟", ctaLead:"ابدأ مساحة عملك واكتشف كيف يساعد Voxly فريقك على تقديم تجربة أفضل.",
    cta:"ابدأ الآن", footer:"منصة واحدة. محادثات أوضح. عملاء أكثر رضا."
  } : {
    navFeatures:"Features", navHow:"How it works", navLogin:"Log in", navStart:"Get started",
    eyebrow:"AI-powered customer support platform",
    title:"Every customer conversation.\nOne clear workspace.",
    lead:"Voxly brings conversations, tickets, a knowledge base and AI assistance together so your team can deliver faster, more human support.",
    primary:"Start for free", secondary:"Try the AI assistant",
    trusted:"Everything your support team needs to do more",
    featuresTitle:"Smarter support, from the first message",
    featuresLead:"Connected tools that reduce the noise and give your team the full customer picture.",
    f1:"Unified inbox", d1:"Manage customer requests and conversations in one place, without switching tools.",
    f2:"AI assistant", d2:"Draft helpful replies and use your knowledge base to deliver more accurate answers.",
    f3:"Knowledge base", d3:"Organize help articles and make trusted answers easier to find.",
    f4:"Clear analytics", d4:"Track ticket volume, response speed and team performance from one dashboard.",
    howTitle:"From first question to happier customers",
    s1:"Capture", sd1:"Bring customer messages and support requests into one shared inbox.",
    s2:"Collaborate", sd2:"Assign tickets to your team and keep every conversation in context.",
    s3:"Resolve smarter", sd3:"Let AI help your team draft replies grounded in your knowledge base.",
    ctaTitle:"Ready for a better support experience?", ctaLead:"Create your workspace and see how Voxly helps your team deliver better service.",
    cta:"Get started", footer:"One platform. Clearer conversations. Happier customers."
  };

  return (
    <div className="vox-landing" dir={ar ? "rtl" : "ltr"}>
      <header className="vox-nav">
        <div className="vox-container vox-nav-inner">
          <Link to="/" className="vox-brand"><span className="vox-brand-mark"><MessageSquareText size={21} /></span><span>voxly<span className="vox-brand-dot">.</span></span></Link>
          <nav className={`vox-nav-links ${menuOpen ? "is-visible" : ""}`}>
            <a href="#features" onClick={() => setMenuOpen(false)}>{copy.navFeatures}</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>{copy.navHow}</a>
            <button className="vox-language" onClick={() => i18n.changeLanguage(ar ? "en" : "ar")}><Languages size={16}/>{ar ? "English" : "العربية"}</button>
            <Link to="/login" className="vox-login">{copy.navLogin}</Link>
            <Link to="/register" className="vox-nav-cta">{copy.navStart}<ArrowUpRight size={16}/></Link>
          </nav>
          <button className="vox-mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"><Menu /></button>
        </div>
      </header>

      <main>
        <section className="vox-hero">
          <div className="vox-hero-glow" />
          <div className="vox-container vox-hero-grid">
            <div className="vox-hero-copy">
              <div className="vox-eyebrow"><span><Sparkles size={14}/></span>{copy.eyebrow}</div>
              <h1>{copy.title.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br/>}</span>)}</h1>
              <p>{copy.lead}</p>
              <div className="vox-hero-actions">
                <Link to="/register" className="vox-button vox-button-primary">{copy.primary}<Arrow size={17}/></Link>
                <a href="#live-demo" className="vox-button vox-button-ghost"><span className="vox-play">▶</span>{copy.secondary}</a>
              </div>
              <div className="vox-hero-proof"><div className="vox-proof-avatars"><i>V</i><i>A</i><i>M</i><i>+</i></div><span>{copy.trusted}</span></div>
            </div>
            <div className="vox-hero-visual" aria-label="Voxly customer support workspace preview">
              <div className="vox-orbit vox-orbit-one"/><div className="vox-orbit vox-orbit-two"/>
              <div className="vox-dashboard-window">
                <div className="vox-window-top"><div className="vox-window-dots"><i/><i/><i/></div><span>voxly / workspace</span><span className="vox-live"><i/> LIVE</span></div>
                <div className="vox-window-body">
                  <aside className="vox-mock-sidebar"><div className="vox-mock-logo"><MessageSquareText size={17}/></div><b/><b/><b/><b/><b/></aside>
                  <div className="vox-mock-main">
                    <div className="vox-mock-heading"><div><small>WORKSPACE OVERVIEW</small><strong>Good morning, Alex 👋</strong></div><span>•••</span></div>
                    <div className="vox-stats"><div><small>Open tickets</small><strong>128</strong><i>↗ 12.8%</i></div><div><small>Avg. response</small><strong>2m 34s</strong><i>↘ 18%</i></div><div><small>Resolved</small><strong>94.2%</strong><i>↗ 8.4%</i></div></div>
                    <div className="vox-inbox-preview"><div className="vox-inbox-title"><strong>Recent conversations</strong><small>View all →</small></div><div className="vox-ticket-row"><span className="vox-person p1">JD</span><div><b>Jordan Davis</b><small>Order delivery update</small></div><em>2m</em></div><div className="vox-ticket-row"><span className="vox-person p2">SM</span><div><b>Sarah Miller</b><small>Need help with my account</small></div><em>8m</em></div><div className="vox-ticket-row"><span className="vox-person p3">RK</span><div><b>Ryan Kim</b><small>Subscription question</small></div><em>14m</em></div></div>
                  </div>
                </div>
              </div>
              <div className="vox-ai-float"><div className="vox-ai-float-icon"><Bot size={19}/></div><div><small>VOXLY AI ASSISTANT</small><strong>Reply drafted <span>✓</span></strong><p>Thanks for reaching out! I'd be happy to help...</p></div><Sparkles className="vox-float-spark" size={17}/></div>
              <div className="vox-hero-badge"><span><Zap size={16}/></span><div><b>AI-powered</b><small>Human-first support</small></div></div>
            </div>
          </div>
          <div className="vox-container vox-trust-strip"><span>{ar ? "كل أدوات الدعم في مساحة واحدة" : "ALL YOUR SUPPORT TOOLS, WORKING AS ONE"}</span><div><i><Inbox/> {ar ? "التذاكر" : "Tickets"}</i><i><Bot/> AI</i><i><BookOpen/> {ar ? "المعرفة" : "Knowledge"}</i><i><BarChart3/> {ar ? "التحليلات" : "Analytics"}</i></div></div>
        </section>

        <section className="vox-features vox-section" id="features">
          <div className="vox-container">
            <div className="vox-section-heading"><span className="vox-section-kicker">{ar ? "مصمم لفريقك" : "BUILT FOR YOUR TEAM"}</span><h2>{copy.featuresTitle}</h2><p>{copy.featuresLead}</p></div>
            <div className="vox-feature-grid">
              <article className="vox-feature-card feature-dark"><div className="vox-feature-icon"><Inbox/></div><h3>{copy.f1}</h3><p>{copy.d1}</p><div className="vox-feature-art vox-inbox-art"><div className="art-line active"/><div className="art-line"/><div className="art-line short"/><div className="art-bubble"><MessageSquareText size={17}/></div></div></article>
              <article className="vox-feature-card"><div className="vox-feature-icon icon-purple"><Bot/></div><h3>{copy.f2}</h3><p>{copy.d2}</p><div className="vox-ai-art"><Sparkles/><span>AI</span><i/><i/><i/></div></article>
              <article className="vox-feature-card"><div className="vox-feature-icon icon-green"><BookOpen/></div><h3>{copy.f3}</h3><p>{copy.d3}</p><div className="vox-book-art"><div/><div/><div/></div></article>
              <article className="vox-feature-card"><div className="vox-feature-icon icon-orange"><BarChart3/></div><h3>{copy.f4}</h3><p>{copy.d4}</p><div className="vox-chart-art"><i/><i/><i/><i/><i/><i/><i/></div></article>
            </div>
          </div>
        </section>

        <section className="vox-how vox-section" id="how">
          <div className="vox-container vox-how-grid">
            <div className="vox-how-copy"><span className="vox-section-kicker">{ar ? "بسيط من البداية" : "SIMPLE BY DESIGN"}</span><h2>{copy.howTitle}</h2><p>{ar ? "تدفق عمل واضح يساعد فريقك على التركيز على ما يهم: مساعدة العميل." : "A clear workflow that lets your team focus on what matters: helping the customer."}</p><div className="vox-steps"><div><span>01</span><section><b>{copy.s1}</b><p>{copy.sd1}</p></section></div><div><span>02</span><section><b>{copy.s2}</b><p>{copy.sd2}</p></section></div><div><span>03</span><section><b>{copy.s3}</b><p>{copy.sd3}</p></section></div></div></div>
            <div className="vox-how-art"><div className="vox-how-ring ring-a"/><div className="vox-how-ring ring-b"/><div className="vox-how-center"><MessageSquareText size={34}/><b>voxly<span>.</span></b></div><div className="vox-how-node node-a"><Headphones/></div><div className="vox-how-node node-b"><Bot/></div><div className="vox-how-node node-c"><ShieldCheck/></div><div className="vox-how-node node-d"><LifeBuoy/></div><div className="vox-how-caption"><Check size={15}/> {ar ? "كل شيء متصل" : "Everything connected"}</div></div>
          </div>
        </section>

        <section className="vox-demo-band" id="live-demo"><div className="vox-container vox-demo-inner"><div><span className="vox-section-kicker">{ar ? "جرّب بنفسك" : "SEE IT IN ACTION"}</span><h2>{ar ? "تحدث مع مساعد Voxly الآن" : "Meet your AI support assistant"}</h2><p>{ar ? "اضغط على زر المحادثة أسفل الصفحة واسأل أي سؤال عن المنصة." : "Open the chat in the corner and ask anything about the platform. This is a live AI-powered demo."}</p></div><div className="vox-demo-visual"><div className="vox-demo-orb"><Bot size={42}/><span/></div><div className="vox-demo-speech">{ar ? "كيف يمكنني مساعدتك اليوم؟" : "How can I help you today?"}<i/></div></div></div></section>

        <section className="vox-cta"><div className="vox-container vox-cta-box"><div className="vox-cta-spark"><Sparkles/></div><h2>{copy.ctaTitle}</h2><p>{copy.ctaLead}</p><Link to="/register" className="vox-button vox-button-light">{copy.cta}<Arrow size={17}/></Link></div></section>
      </main>
      <footer className="vox-footer"><div className="vox-container vox-footer-inner"><Link to="/" className="vox-brand"><span className="vox-brand-mark"><MessageSquareText size={19}/></span><span>voxly<span className="vox-brand-dot">.</span></span></Link><span>{copy.footer}</span><span>© {new Date().getFullYear()} Voxly</span></div></footer>
      <DemoChatWidget/>
    </div>
  );
}
