import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteProject, getMyProjects } from "../../services/projectService";
import styles from "./Projects.module.css";

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  async function load() {
    try {
      setLoading(true);
      setMsg("");
      setIsError(false);
      const data = await getMyProjects();
      setProjects(data);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load projects");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    const ok = confirm("Delete this project? You can restore within 30 days.");
    if (!ok) return;

    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      setMsg("Project deleted (30-day grace).");
      setIsError(false);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
      setIsError(true);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Projects</h2>
          <button className={styles.smallBtn + " " + styles.ghost} onClick={() => navigate("/projects/new")}>
            + New
          </button>
        </div>

        <p className={styles.subtitle}>Only active projects are visible here.</p>

        {msg && <p className={`${styles.msg} ${isError ? styles.error : styles.success}`}>{msg}</p>}
        {loading && <p className={styles.muted}>Loading...</p>}

        {!loading && projects.length === 0 && (
          <div className={styles.item} style={{ marginTop: 14 }}>
            <p className={styles.muted}>No projects yet.</p>
            <button className={styles.button} onClick={() => navigate("/projects/new")}>
              Create your first project
            </button>
          </div>
        )}

        <div className={styles.grid}>
          {projects.map((p) => (
            <div className={styles.item} key={p._id}>
              <Link className={styles.link} to={`/projects/${p._id}`}>
                {p.title}
              </Link>
              <p className={styles.muted}>Category: {p.category}</p>

              <div className={styles.rowButtons}>
                <button className={`${styles.smallBtn} ${styles.ghost}`} onClick={() => navigate(`/projects/${p._id}`)}>
                  Open
                </button>
                <button className={`${styles.smallBtn} ${styles.danger}`} onClick={() => handleDelete(p._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className={styles.muted} style={{ marginTop: 16 }}>
          <Link className={styles.link} to="/dashboard">← Back to Dashboard</Link>
        </p>
      </div>
    </div>
  );
}
