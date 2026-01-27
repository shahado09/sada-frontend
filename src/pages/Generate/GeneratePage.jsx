import styles from "./GeneratePage.module.css";
import GenerateImageSection from "./GenerateImageSection";

export default function GeneratePage({ category, title, subtitle }) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.hTitle}>{title}</div>
        <div className={styles.hSub}>{subtitle}</div>
      </div>

      <div className={styles.shell}>
        <GenerateImageSection category={category} />
      </div>
    </div>
  );
}
