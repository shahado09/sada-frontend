import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import styles from "./OutputsGallery.module.css";

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.outputs)) return payload.outputs;
  return [];
}

function pickUrl(x) {
  return x?.url || x?.resultUrl || "";
}

function isVideo(x) {
  return x?.type === "video" || /\.(mp4|webm|mov)$/i.test(pickUrl(x));
}

async function downloadFile(url, name) {
  try {
    const r = await fetch(url);
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name || "output";
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {}
}

export default function OutputsGallery({ projectId, refreshKey, pendingRequestId, onPendingResolved }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [activeUrl, setActiveUrl] = useState("");
  const [activeId, setActiveId] = useState("");
  const [activeIsVideo, setActiveIsVideo] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    if (!projectId) return;
    setLoading(true);
    setErr("");
    try {
      const res = await api.get(`/projects/${projectId}/outputs`);
      setItems(asArray(res.data));
    } catch (e) {
      setItems([]);
      setErr(e?.response?.data?.message || e.message || "Failed to load outputs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!projectId) return;
    load();
  }, [projectId, refreshKey]);

  useEffect(() => {
    function handler(e) {
      const pid = e?.detail?.projectId;
      const output = e?.detail?.output;
      if (!pid || !output) return;
      if (String(pid) !== String(projectId)) return;

      setItems((prev) => {
        const exists = prev.some((x) => String(x?._id) === String(output?._id));
        if (exists) return prev;
        return [output, ...prev];
      });

      if (typeof onPendingResolved === "function") onPendingResolved();
    }

    window.addEventListener("output.created", handler);
    return () => window.removeEventListener("output.created", handler);
  }, [projectId, onPendingResolved]);

  useEffect(() => {
    function handler(e) {
      const pid = e?.detail?.projectId;
      if (!pid || String(pid) !== String(projectId)) return;
      load();
      if (typeof onPendingResolved === "function") onPendingResolved();
    }
    window.addEventListener("generation_completed", handler);
    return () => window.removeEventListener("generation_completed", handler);
  }, [projectId, onPendingResolved]);

  const pendingOutput = useMemo(() => {
    if (!pendingRequestId) return null;
    return items.find((x) => String(x?.request) === String(pendingRequestId)) || null;
  }, [items, pendingRequestId]);

  // ✅ moved ABOVE the early return — fixes "Rendered more hooks" error
  const gridItems = useMemo(() => {
    if (!pendingRequestId) return items;
    return items.filter((x) => String(x?.request) !== String(pendingRequestId));
  }, [items, pendingRequestId]);

  useEffect(() => {
    if (pendingRequestId && pendingOutput) {
      if (typeof onPendingResolved === "function") onPendingResolved();
    }
  }, [pendingRequestId, pendingOutput]);

  function openModal(x) {
    const url = pickUrl(x);
    if (!url) return;
    setActiveUrl(url);
    setActiveId(x?._id || "");
    setActiveIsVideo(isVideo(x));
    setOpen(true);
  }

  function closeModal() {
    if (deleting) return;
    setOpen(false);
    setActiveUrl("");
    setActiveId("");
    setActiveIsVideo(false);
  }

  async function deleteOutput() {
    if (!activeId || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/outputs/${activeId}`);
      closeModal();
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to delete output");
    } finally {
      setDeleting(false);
    }
  }

  // early return AFTER all hooks
  if (!projectId) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.title}>Gallery</div>
        <button type="button" className={styles.btn} onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {err ? (
        <div className={styles.empty}>{err}</div>
      ) : gridItems.length === 0 && !pendingRequestId ? (
        <div className={styles.empty}>No outputs yet</div>
      ) : (
        <div className={styles.grid}>

          {pendingRequestId && !pendingOutput && (
            <div className={styles.processingCard} aria-live="polite">
              <div className={styles.processingInner}>
                <div className={styles.spinner} />
                <div className={styles.processingTitle}>Creating…</div>
                <div className={styles.processingSub}>Your output will appear here</div>
              </div>
            </div>
          )}

          {pendingOutput && (
            <button type="button" className={styles.cardBtn} onClick={() => openModal(pendingOutput)}>
              {isVideo(pendingOutput) ? (
                <video className={styles.video} src={pickUrl(pendingOutput)} controls playsInline preload="metadata" />
              ) : (
                <img className={styles.img} src={pickUrl(pendingOutput)} alt="" loading="lazy" />
              )}
            </button>
          )}

          {gridItems.map((x) => {
            const url = pickUrl(x);
            if (!url) return null;
            return (
              <button key={x._id || url} type="button" className={styles.cardBtn} onClick={() => openModal(x)}>
                {isVideo(x) ? (
                  <video className={styles.video} src={url} controls playsInline preload="metadata" />
                ) : (
                  <img className={styles.img} src={url} alt="" loading="lazy" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <div className={styles.backdrop} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={styles.modalTitle}>Preview</div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.modalBtn} onClick={() => downloadFile(activeUrl, activeId || "output")} disabled={deleting}>
                  Download
                </button>
                <button type="button" className={styles.dangerBtn} onClick={deleteOutput} disabled={deleting}>
                  {deleting ? "Deleting…" : "Delete"}
                </button>
                <button type="button" className={styles.modalBtn} onClick={closeModal} disabled={deleting}>
                  Close
                </button>
              </div>
            </div>
            <div className={styles.modalBody}>
              {activeIsVideo ? (
                <video className={styles.modalVideo} src={activeUrl} controls autoPlay playsInline />
              ) : (
                <img className={styles.modalImg} src={activeUrl} alt="" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}