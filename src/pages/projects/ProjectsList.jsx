import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { deleteProject, getMyProjects } from "../../services/projectService";
import styles from "./Projects.module.css";

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  async function load() {
    try {
      setLoading(true); setMsg(""); setIsError(false);
      const data = await getMyProjects();
      setProjects(data);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load projects");
      setIsError(true);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    const ok = confirm(t("projects.deleteModal.body", { name: "" }));
    if (!ok) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
      setIsError(true);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t("projects.title")}</h2>
          <button className={styles.smallBtn + " " + styles.ghost} onClick={() => navigate("/projects/new")}>
            {t("projects.newBtn")}
          </button>
        </div>
        <p className={styles.subtitle}>{t("projects.subtitle")}</p>
        {msg && <p className={`${styles.msg} ${isError ? styles.error : styles.success}`}>{msg}</p>}
        {loading && <p className={styles.muted}>{t("projects.loading")}</p>}
        {!loading && projects.length === 0 && (
          <div className={styles.item} style={{ marginTop: 14 }}>
            <p className={styles.muted}>{t("projects.noProjects")}</p>
            <button className={styles.button} onClick={() => navigate("/projects/new")}>
              {t("projects.createFirst")}
            </button>
          </div>
        )}
        <div className={styles.grid}>
          {projects.map((p) => (
            <div className={styles.item} key={p._id}>
              <Link className={styles.link} to={`/projects/${p._id}`}>{p.title}</Link>
              <p className={styles.muted}>{t("projects.category")} {p.category}</p>
              <div className={styles.rowButtons}>
                <button className={`${styles.smallBtn} ${styles.ghost}`} onClick={() => navigate(`/projects/${p._id}`)}>
                  {t("projects.open")}
                </button>
                <button className={`${styles.smallBtn} ${styles.danger}`} onClick={() => handleDelete(p._id)}>
                  {t("projects.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className={styles.muted} style={{ marginTop: 16 }}>
          <Link className={styles.link} to="/dashboard">{t("projects.back")}</Link>
        </p>
      </div>
    </div>
  );
}