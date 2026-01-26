import styles from "./AdminModal.module.css";

export default function AdminModal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.x} onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
