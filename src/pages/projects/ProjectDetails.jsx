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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    setDeleting(true);
    try {
      await deleteProject(id);
      navigate("/projects");
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message || "Delete failed");
      setIsError(true);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Project</h2>
          <Link className={styles.link} to="/projects">← Back</Link>
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
                    onClick={() => setShowDeleteModal(true)}
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
          <Link className={styles.link} to="/dashboard">← Back to Dashboard</Link>
        </p>
      </div>

      {/* Custom Delete Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => { if (!deleting) setShowDeleteModal(false); }}
        >
          <div
            style={{
              background: "var(--card, #0f1f2e)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "32px 28px", width: 340, maxWidth: "90vw",
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--text, #fff)" }}>
              Delete Project?
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted, #8899aa)", marginBottom: 28, lineHeight: 1.6 }}>
              This will archive <strong style={{ color: "var(--text, #fff)" }}>{project?.title}</strong> and all its outputs. You have 30 days to restore it.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{
                  padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
                  background: "transparent", color: "var(--text, #fff)", cursor: "pointer",
                  fontSize: 14, fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "9px 20px", borderRadius: 10, border: "none",
                  background: "rgba(176,43,24,0.85)", color: "#fff", cursor: deleting ? "not-allowed" : "pointer",
                  fontSize: 14, fontWeight: 700, opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
