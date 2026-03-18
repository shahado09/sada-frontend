import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";
import styles from "./LandingPage.module.css";

const FEATURES = [
  { icon: "👗", titleAr: "أزياء بلمسة فنية", titleEn: "Fashion with Artistry", descAr: "حوّل ملابسك لصور احترافية تنافس كبار البراندات العالمية", descEn: "Transform your clothing into professional shots competing with global brands" },
  { icon: "📦", titleAr: "منتجات بجودة إعلانية", titleEn: "Ad-Quality Products", descAr: "صور منتجاتك بخلفيات فاخرة وإضاءة استوديو احترافية", descEn: "Shoot your products with luxury backgrounds and professional studio lighting" },
  { icon: "🎬", titleAr: "فيديوهات تأسر العيون", titleEn: "Captivating Videos", descAr: "أنشئ مقاطع فيديو تعبّر عن هوية علامتك التجارية", descEn: "Create videos that express your brand identity and captivate your audience" },
  { icon: "🌍", titleAr: "عربي في القلب", titleEn: "Arabic at Heart", descAr: "المنصة الأولى المصممة خصيصًا للسوق الخليجي والعربي", descEn: "The first platform designed specifically for the Gulf and Arab market" },
  { icon: "⚡", titleAr: "نتائج في دقائق", titleEn: "Results in Minutes", descAr: "لا تصوير، لا استوديو، لا تأخير — فقط أرسل وانتظر النتيجة", descEn: "No shooting, no studio, no delay — just send and wait for results" },
  { icon: "🔒", titleAr: "محتواك ملكك", titleEn: "Your Content is Yours", descAr: "حقوق تجارية كاملة لكل ما تنشئه على المنصة", descEn: "Full commercial rights for everything you create on the platform" },
];

const STEPS = [
  { num: "01", titleAr: "اختر خدمتك", titleEn: "Choose Your Service", descAr: "أزياء، منتجات، أو فيديو — كل شيء تحت سقف واحد", descEn: "Fashion, products, or video — everything under one roof" },
  { num: "02", titleAr: "أرسل المواد", titleEn: "Send Your Materials", descAr: "صور واضحة لملابسك أو منتجاتك — والباقي علينا", descEn: "Clear photos of your clothes or products — we handle the rest" },
  { num: "03", titleAr: "استلم النتائج", titleEn: "Receive Results", descAr: "صور وفيديوهات احترافية جاهزة للنشر في دقائق", descEn: "Professional photos and videos ready to publish in minutes" },
];

export default function LandingPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const heroRef = useRef(null);

  useEffect(() => {
    document.documentElement.dir = isAr ? "rtl" : "ltr";
  }, [isAr]);

  function toggleLang() {
    const next = isAr ? "en" : "ar";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  }

  return (
    <div className={styles.page} dir={isAr ? "rtl" : "ltr"}>

      {/* NAV */}
      <nav className={styles.nav}>
        <div>
          <div className={styles.navBrand}>SADA</div>
          <div className={styles.navSub}>VISUAL CONTENT STUDIO</div>
        </div>
        <div className={styles.navRight}>
          <button className={styles.langBtn} onClick={toggleLang}>
            {isAr ? "EN" : "عربي"}
          </button>
          <Link to="/login" className={styles.navLogin}>
            {isAr ? "دخول" : "Login"}
          </Link>
          <Link to="/signup" className={styles.navCta}>
            {isAr ? "ابدأ مجانًا" : "Start Free"}
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.heroBg}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.orb3} />
          <div className={styles.grid} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            {"✦ SADA — Visual Content Studio"}
          </div>
          <h1 className={styles.heroTitle}>
            {isAr ? (
              <>
                <span className={styles.heroTitleSub}>علامتك تستحق</span>
                <span className={styles.heroAccentBlock}>صدى مختلف</span>
              </>
            ) : (
              <>
                <span className={styles.heroTitleSub}>Your brand deserves</span>
                <span className={styles.heroAccentBlock}>a different SADA</span>
              </>
            )}
          </h1>
          <p className={styles.heroSub}>
            {isAr ? "بسعر منخفض وجودة عالية" : "lower cost, higher quality"}
          </p>
          <div className={styles.heroCtas}>
            <Link to="/signup" className={styles.ctaPrimary}>
              {isAr ? "ابدأ مجانًا الآن" : "Start Free Now"}
              <span className={styles.ctaArrow}>←</span>
            </Link>
            <Link to="/plans" className={styles.ctaSecondary}>
              {isAr ? "شوف الأسعار" : "View Pricing"}
            </Link>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <div className={styles.statNum}>3+</div>
              <div className={styles.statLabel}>{isAr ? "نماذج ذكاء اصطناعي" : "AI Models"}</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <div className={styles.statNum}>60s</div>
              <div className={styles.statLabel}>{isAr ? "أقصى وقت للتوليد" : "Max Generation Time"}</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <div className={styles.statNum}>100%</div>
              <div className={styles.statLabel}>{isAr ? "حقوق تجارية كاملة" : "Commercial Rights"}</div>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.mockup}>
            <div className={styles.mockupBar}>
              <span /><span /><span />
            </div>
            <div className={styles.mockupContent}>
              <div className={styles.mockupImg}>
                <div className={styles.mockupWave}>
                  <span /><span /><span /><span /><span /><span /><span />
                </div>
              </div>
              <div className={styles.mockupPrompt}>
                <div className={styles.mockupPromptIcon}>✨</div>
                <div className={styles.mockupPromptText}>
                  {isAr ? "عارضة خليجية — خلفية ممر فاخر..." : "Khaleeji model — luxurious hallway..."}
                </div>
                <div className={styles.mockupPromptCursor} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.features}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionLabel}>{isAr ? "لماذا صدى؟" : "Why SADA?"}</div>
          <h2 className={styles.sectionTitle}>
            {isAr ? "كل ما تحتاجه في مكان واحد" : "Everything you need in one place"}
          </h2>
        </div>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} className={styles.featureCard} style={{ animationDelay: `${i * 80}ms` }}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <div className={styles.featureTitle}>{isAr ? f.titleAr : f.titleEn}</div>
              <div className={styles.featureDesc}>{isAr ? f.descAr : f.descEn}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionLabel}>{isAr ? "كيف يعمل؟" : "How it works"}</div>
          <h2 className={styles.sectionTitle}>
            {isAr ? "ثلاث خطوات فقط" : "Just three steps"}
          </h2>
        </div>
        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div key={i} className={styles.step}>
              <div className={styles.stepNum}>{s.num}</div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>{isAr ? s.titleAr : s.titleEn}</div>
                <div className={styles.stepDesc}>{isAr ? s.descAr : s.descEn}</div>
              </div>
              {i < STEPS.length - 1 && <div className={styles.stepArrow}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerBg} />
        <div className={styles.ctaBannerContent}>
          <h2 className={styles.ctaBannerTitle}>
            {isAr ? "جاهز تبدأ؟" : "Ready to start?"}
          </h2>
          <p className={styles.ctaBannerSub}>
            {isAr
              ? "علامتك التجارية تستحق محتوى أفضل — ابدأ الآن"
              : "Your brand deserves better visuals — start now"}
          </p>
          <Link to="/signup" className={styles.ctaPrimary} style={{ fontSize: 16, padding: "14px 36px" }}>
            {isAr ? "سجّل مجانًا" : "Sign Up Free"}
            <span className={styles.ctaArrow}>←</span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <div className={styles.footerBrand}>SADA</div>
          <div className={styles.footerSub}>VISUAL CONTENT STUDIO</div>
        </div>
        <div className={styles.footerLinks}>
          <Link to="/policy" className={styles.footerLink}>{isAr ? "سياسة الخدمة" : "Policy"}</Link>
          <Link to="/login" className={styles.footerLink}>{isAr ? "دخول" : "Login"}</Link>
          <Link to="/signup" className={styles.footerLink}>{isAr ? "تسجيل" : "Sign Up"}</Link>
        </div>
        <div className={styles.footerCopy}>© {new Date().getFullYear()} SADA</div>
      </footer>
    </div>
  );
}