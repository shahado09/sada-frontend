import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import styles from "./Nav.module.css";
import Button from "../ui/Button/Button";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../auth/AuthContext";

export default function Nav() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

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
      <Link to="/dashboard" className={styles.brand}>
        SADA
      </Link>

      <nav className={styles.links}>
        <NavLink className={styles.link} to="/dashboard">
          Home
        </NavLink>
        <NavLink className={styles.link} to="/projects">
          Projects
        </NavLink>
        <NavLink className={styles.link} to="/plans">
          Pricing
        </NavLink>
                    <Link className={styles.link} to="/profile" onClick={close}>
              Profile
            </Link>


        {user?.role === "admin" && (
          <NavLink className={styles.link} to="/admin">
            Admin Panel
          </NavLink>
        )}

        {user && (
          <div className={styles.creditsBadge}>
            <span className={styles.creditsLabel}>Credits</span>
            <span className={styles.creditsValue}>
              {user.credits ?? 0}
            </span>
          </div>
        )}

        <Button variant="ghost" onClick={toggle}>
          {theme === "dark" ? "Light" : "Dark"}
        </Button>

        <Button variant="ghost" onClick={logout}>
          Logout
        </Button>
      </nav>

      <button
        className={styles.burger}
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <span className={styles.burgerLines} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      <div
        className={`${styles.panel} ${open ? styles.panelOpen : ""}`}
        onClick={close}
      >
        <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
          <div className={styles.drawerTop}>
            <div className={styles.drawerTitle}>Menu</div>
            <button
              className={styles.drawerClose}
              onClick={close}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className={styles.drawerLinks}>
            <Link className={styles.link} to="/dashboard" onClick={close}>
              Home
            </Link>
            <Link className={styles.link} to="/projects" onClick={close}>
              Projects
            </Link>
            <Link className={styles.link} to="/plans" onClick={close}>
              Pricing
            </Link>
            <Link className={styles.link} to="/profile" onClick={close}>
              Profile
            </Link>

            {user?.role === "admin" && (
              <Link className={styles.link} to="/admin" onClick={close}>
                Admin Panel
              </Link>
            )}


            {user && (
              <div className={styles.mobileCredits}>
                Credits: <strong>{user.credits ?? 0}</strong>
              </div>
            )}

            <Button
              variant="primary"
              onClick={() => {
                toggle();
                close();
              }}
            >
              Switch to {theme === "dark" ? "Light" : "Dark"}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                logout();
                close();
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
