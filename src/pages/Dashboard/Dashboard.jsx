import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthContext";
import styles from "./Dashboard.module.css";
import logo from "../../assets/new-logo.png";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isAr = i18n.language === "ar";

  return (
    <div className={styles.page} dir={isAr ? "rtl" : "ltr"}>

      {/* Grid background */}
      <div className={styles.gridBg} />

      <main className={styles.main}>

        {/* Greeting */}
        <div className={styles.greeting}>
          <div className={styles.greetingLine} />
          <span>{isAr ? "مرحباً بك في" : "Welcome to"}</span>
          <span className={styles.greetingBrand}>{isAr ? "صدى" :"SADA"}</span>
          <div className={styles.greetingLine} />
        </div>

        {/* Logo */}
        <div className={styles.logoWrap}>
          <img src={logo} alt="SADA" className={styles.logo} />
        </div>

        {/* Hero tagline */}
        <div className={styles.tagline}>
          <h1 className={styles.taglineTitle}>
            {isAr ? "ماذا تريد أن تنشئ اليوم؟" : "What would you like to create today?"}
          </h1>
          <p className={styles.taglineSub}>
            {isAr
              ? `لديك ${user?.credits ?? 0} نقطة متاحة`
              : `You have ${user?.credits ?? 0} credits available`}
          </p>
        </div>

        {/* Cards */}
        <div className={styles.cards}>

          {/* Cloth AI */}
          <Link className={styles.card} to="/generate/fashion">
            <div className={styles.cardGlow} style={{ "--glow": "rgba(27,90,152,0.25)" }} />
            <div className={styles.cardIcon}>👗</div>
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>{t("dashboard.clothAi")}</div>
              <div className={styles.cardDesc}>{t("dashboard.clothDesc")}</div>
            </div>
            <div className={styles.cardArrow}>{isAr ? "←" : "→"}</div>
          </Link>

          {/* Product AI */}
          <Link className={styles.card} to="/generate/product">
            <div className={styles.cardGlow} style={{ "--glow": "rgba(27,90,152,0.20)" }} />
            <div className={styles.cardIcon}>📦</div>
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>{t("dashboard.productAi")}</div>
              <div className={styles.cardDesc}>{t("dashboard.productDesc")}</div>
            </div>
            <div className={styles.cardArrow}>{isAr ? "←" : "→"}</div>
          </Link>

          {/* Creator AI — hidden for now */}
          {/*
          <Link className={styles.card} to="/generate/creator">
            <div className={styles.cardGlow} style={{ "--glow": "rgba(27,90,152,0.15)" }} />
            <div className={styles.cardIcon}>🎬</div>
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>{t("dashboard.creatorAi")}</div>
              <div className={styles.cardDesc}>{t("dashboard.creatorDesc")}</div>
            </div>
            <div className={styles.cardArrow}>{isAr ? "←" : "→"}</div>
          </Link>
          */}

        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statDot} />
            {isAr ? "توليد الصور في ثوانٍ" : "Images generated in seconds"}
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statDot} />
            {isAr ? "فيديوهات دعائية احترافية" : "Professional commercial videos"}
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statDot} />
            {isAr ? "حقوق تجارية كاملة" : "Full commercial rights"}
          </div>
        </div>

      </main>
    </div>
  );
}