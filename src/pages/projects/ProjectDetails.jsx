import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import styles from "./Projects.module.css";

import { deleteProject, getProjectById } from "../../services/projectService";
import OutputsGallery from "../../components/OutputsGallery/OutputsGallery";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function load() {
    try {
      setLoading(true);
      setMsg("");
      setIsError(false);
      const data = await getProjectById(id);
      setProject(data);
    } catch (e) {
      setProject(null);
      setMsg(e?.response?.data?.message || e.message || "Project not found");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleDelete() {
    const ok = confirm("Delete this project?");
    if (!ok) return;

    try {
      await deleteProject(id);
      navigate("/projects");
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message || "Delete failed");
      setIsError(true);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Project</h2>
          <Link className={styles.link} to="/projects">
            ← Back
          </Link>
        </div>

        {msg && <p className={`${styles.msg} ${isError ? styles.error : styles.success}`}>{msg}</p>}
        {loading && <p className={styles.muted}>Loading…</p>}

        {!loading && project && (
          <>
            <div className={styles.item} style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {project.title || project.name || "Untitled"}
                  </div>
                  <div className={styles.muted}>Category: {project.category || "-"}</div>
                </div>

                <div className={styles.rowButtons}>
                  <button
                    className={`${styles.smallBtn} ${styles.ghost}`}
                    onClick={() => setRefreshKey((x) => x + 1)}
                  >
                    Refresh Outputs
                  </button>
                  <button
                    className={`${styles.smallBtn} ${styles.danger}`}
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.item} style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Outputs</div>
              <OutputsGallery projectId={id} refreshKey={refreshKey} />
            </div>
          </>
        )}

        <p className={styles.muted} style={{ marginTop: 16 }}>
          <Link className={styles.link} to="/dashboard">
            ← Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
