import { useAuth } from "../../../auth/AuthContext";
import styles from "./AdminTopbar.module.css";

export default function AdminTopbar() {
  const { user, logout } = useAuth();

  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <div className={styles.title}>Admin Panel</div>
        <div className={styles.sub}>Manage payments, plans and packs</div>
      </div>

      <div className={styles.right}>
        <div className={styles.user}>{user?.email}</div>
        <button className={styles.btn} onClick={logout}>Logout</button>
      </div>
    </header>
  );
}
