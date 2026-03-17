import { NavLink } from "react-router-dom";
import styles from "./AdminSidebar.module.css";

export default function AdminSidebar() {
  const nav = ({ isActive }) => (isActive ? styles.active : styles.link);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>SADA • Admin</div>

      <nav className={styles.nav}>
        <NavLink className={nav} to="/admin" end>Dashboard</NavLink>
        <NavLink className={nav} to="/admin/payments">Requests</NavLink>
        <NavLink className={nav} to="/admin/plans">Plans</NavLink>
        <NavLink className={nav} to="/admin/packs">Packs</NavLink>
        <NavLink className={nav} to="/admin/users">Users</NavLink>
        <NavLink className={nav} to="/admin/prompts">Prompts</NavLink>
        <NavLink className={nav} to="/admin/ledger">Ledger</NavLink>
      </nav>
    </aside>
  );
}
