import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Nav.module.css";
import Button from "../ui/Button/Button";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../auth/AuthContext";

export default function Nav() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const isAr = i18n.language === "ar";

  function toggleLang() {
    const next = isAr ? "en" : "ar";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = next;
  }

  useEffect(() => {
    document.documentElement.dir = isAr ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={styles.nav}>
      <Link to="/dashboard" className={styles.brand}>SADA</Link>

      <nav className={styles.links}>
        <NavLink className={styles.link} to="/dashboard">{t("nav.home")}</NavLink>
        <NavLink className={styles.link} to="/projects">{t("nav.projects")}</NavLink>
        <NavLink className={styles.link} to="/plans">{t("nav.pricing")}</NavLink>
        <Link className={styles.link} to="/profile">{t("nav.profile")}</Link>

        {user?.role === "admin" && (
          <NavLink className={styles.link} to="/admin">{t("nav.adminPanel")}</NavLink>
        )}

        {user && (
          <div className={styles.creditsBadge}>
            <span className={styles.creditsLabel}>{t("nav.credits")}</span>
            <span className={styles.creditsValue}>{user.credits ?? 0}</span>
          </div>
        )}

        <Button variant="ghost" onClick={toggle}>
          {theme === "dark" ? t("nav.light") : t("nav.dark")}
        </Button>

        <Button variant="ghost" onClick={toggleLang}>
          {isAr ? "EN" : "عربي"}
        </Button>

        <Button variant="ghost" onClick={logout}>{t("nav.logout")}</Button>
      </nav>

      <button className={styles.burger} onClick={() => setOpen(true)} aria-label="Open menu">
        <span className={styles.burgerLines} aria-hidden="true">
          <span /><span /><span />
        </span>
      </button>

      <div className={`${styles.panel} ${open ? styles.panelOpen : ""}`} onClick={close}>
        <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
          <div className={styles.drawerTop}>
            <div className={styles.drawerTitle}>{t("nav.menu")}</div>
            <button className={styles.drawerClose} onClick={close} aria-label="Close">✕</button>
          </div>
          <div className={styles.drawerLinks}>
            <Link className={styles.link} to="/dashboard" onClick={close}>{t("nav.home")}</Link>
            <Link className={styles.link} to="/projects" onClick={close}>{t("nav.projects")}</Link>
            <Link className={styles.link} to="/plans" onClick={close}>{t("nav.pricing")}</Link>
            <Link className={styles.link} to="/profile" onClick={close}>{t("nav.profile")}</Link>
            {user?.role === "admin" && (
              <Link className={styles.link} to="/admin" onClick={close}>{t("nav.adminPanel")}</Link>
            )}
            {user && (
              <div className={styles.mobileCredits}>
                {t("nav.credits")}: <strong>{user.credits ?? 0}</strong>
              </div>
            )}
            <Button variant="primary" onClick={() => { toggle(); close(); }}>
              {t("nav.switchTo", { mode: theme === "dark" ? t("nav.light") : t("nav.dark") })}
            </Button>
            <Button variant="ghost" onClick={toggleLang}>
              {isAr ? "EN" : "عربي"}
            </Button>
            <Button variant="ghost" onClick={() => { logout(); close(); }}>{t("nav.logout")}</Button>
          </div>
        </div>
      </div>
    </header>
  );
}