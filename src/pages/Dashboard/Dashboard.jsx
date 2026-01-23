import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Welcome{user?.email ? `, ${user.email}` : ""} 👋
          </p>
        </div>

        <button className={styles.logout} onClick={logout}>
          Logout
        </button>
      </header>

      <section className={styles.grid}>
        <Link className={styles.card} to="/projects">
          <div className={styles.cardTitle}>Projects</div>
          <div className={styles.cardDesc}>View and manage your projects</div>
        </Link>

        <Link className={styles.card} to="/projects/new">
          <div className={styles.cardTitle}>Create Project</div>
          <div className={styles.cardDesc}>Start a new campaign/project</div>
        </Link>

        <Link className={styles.card} to="/plans">
          <div className={styles.cardTitle}>Plans</div>
          <div className={styles.cardDesc}>
            View available subscription plans
          </div>
        </Link>

        <Link className={styles.card} to="/packs">
          <div className={styles.cardTitle}>Credit Packs </div>
          <div className={styles.cardDesc}>
            Buy one-time credit packs
          </div>
        </Link>

        <div className={`${styles.card} ${styles.disabled}`}>
          <div className={styles.cardTitle}>Generation Requests</div>
          <div className={styles.cardDesc}></div>
        </div>

        <div className={`${styles.card} ${styles.disabled}`}>
          <div className={styles.cardTitle}>Outputs</div>
          <div className={styles.cardDesc}></div>
        </div>
      </section>
    </div>
  );
}
