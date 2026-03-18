import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createProject } from "../../services/projectService";
import styles from "./Projects.module.css";

export default function CreateProject() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("product");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(""); setIsError(false);
    try {
      setLoading(true);
      const project = await createProject({ title, category });
      navigate(`/projects/${project._id}`);
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Create failed");
      setIsError(true);
    } finally { setLoading(false); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t("createProject.title")}</h2>
          <Link className={styles.link} to="/projects">{t("createProject.back")}</Link>
        </div>
        {msg && <p className={`${styles.msg} ${isError ? styles.error : styles.success}`}>{msg}</p>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={t("createProject.titlePlaceholder")} minLength={2} maxLength={120} required />
          <select className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="product">product</option>
            <option value="fashion">fashion</option>
            <option value="creator">creator</option>
          </select>
          <button className={styles.button} disabled={loading}>
            {loading ? t("createProject.creating") : t("createProject.create")}
          </button>
        </form>
        <p className={styles.muted} style={{ marginTop: 16 }}>
          <Link className={styles.link} to="/dashboard">{t("createProject.backDash")}</Link>
        </p>
      </div>
    </div>
  );
}