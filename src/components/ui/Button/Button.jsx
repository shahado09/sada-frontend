import styles from "./Button.module.css";

export default function Button({ variant = "btn", className = "", ...props }) {
  const v = variant === "primary" ? styles.primary : variant === "ghost" ? styles.ghost : "";
  return <button className={`${styles.btn} ${v} ${className}`} {...props} />;
}
