import { Link } from "react-router-dom";
import styles from "./Dashboard.module.css";
import logo from "../../assets/sada-logo.png";

export default function Dashboard() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <img className={styles.logo} src={logo} alt="SADA" />

          <div className={styles.cards}>
            <Link className={styles.card} to="/generate/fashion">
              <div className={styles.cardTitle}>Cloth AI</div>
              <div className={styles.cardDesc}>Generate fashion visuals for outfits.</div>
              <div className={styles.cardHint}>Start →</div>
            </Link>

            <Link className={styles.card} to="/generate/product">
              <div className={styles.cardTitle}>Product AI</div>
              <div className={styles.cardDesc}>Create premium product shots & ads.</div>
              <div className={styles.cardHint}>Start →</div>
            </Link>

            <Link className={styles.card} to="/generate/creator">
              <div className={styles.cardTitle}>Creator AI</div>
              <div className={styles.cardDesc}>Content for creators: reels, posters, edits.</div>
              <div className={styles.cardHint}>Start →</div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
