import { NavLink } from "react-router-dom";
import styles from "./PricingTabs.module.css";

export default function PricingTabs() {
  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="tablist" aria-label="Pricing Tabs">
        <NavLink
          to="/packs"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ""}`
          }
        >
          Packs
        </NavLink>

        <NavLink
          to="/plans"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ""}`
          }
        >
          Plans
        </NavLink>

      </div>
    </div>
  );
}
