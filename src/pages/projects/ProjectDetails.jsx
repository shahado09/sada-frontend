import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteProject, getProjectById } from "../../services/projectService";
import styles from "./Projects.module.css";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setMsg("");
      setIsError(false);
      const data = await getProjectById(id);
      setProject(data);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Project not found");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleDelete() {
    const ok = confirm("Delete this project? You can restore within 30 days.");
    if (!ok) return;

    try {
      await deleteProject(id);
      navigate("/projects");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
      setIsError(true);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Project</h2>
          <Link className={styles.link} to="/projects">← Back</Link>
        </div>

        {loading && <p className={styles.muted}>Loading...</p>}
        {msg && <p className={`${styles.msg} ${isError ? styles.error : styles.success}`}>{msg}</p>}

        {!loading && project && (
          <>
            <p className={styles.muted}><b>Title:</b> {project.title}</p>
            <p className={styles.muted}><b>Category:</b> {project.category}</p>

            <div className={styles.rowButtons}>
              <button className={`${styles.smallBtn} ${styles.danger}`} onClick={handleDelete}>
                Delete
              </button>
              <button className={`${styles.smallBtn} ${styles.ghost}`} onClick={() => navigate("/dashboard")}>
                Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
