import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import styles from "./OutputsGallery.module.css";

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.outputs)) return payload.outputs;
  return [];
}

function pickUrl(x) {
  return x?.url || "";
}

export default function OutputsGallery({ projectId, refreshKey, pendingRequestId, onPendingResolved }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(false);
  const [activeUrl, setActiveUrl] = useState("");
  const [activeId, setActiveId] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function load() {
    if (!projectId) return;
    setLoading(true);
    setErr("");
    try {
      const res = await api.get(`/projects/${projectId}/outputs`);
      const arr = asArray(res.data);
      setItems(arr);
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

  const pendingOutput = useMemo(() => {
    if (!pendingRequestId) return null;
    return items.find((x) => String(x?.request) === String(pendingRequestId)) || null;
  }, [items, pendingRequestId]);

  useEffect(() => {
    if (pendingRequestId && pendingOutput) {
      if (typeof onPendingResolved === "function") onPendingResolved();
    }
  }, [pendingRequestId, pendingOutput, onPendingResolved]);

  async function downloadImage(url, filenameBase = "output") {
    const r = await fetch(url);
    const blob = await r.blob();
    const ext = (blob.type && blob.type.split("/")[1]) || "jpg";
    const a = document.createElement("a");
    const obj = URL.createObjectURL(blob);
    a.href = obj;
    a.download = `${filenameBase}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(obj);
  }

  function openModal(x) {
    const url = pickUrl(x);
    if (!url) return;
    setActiveUrl(url);
    setActiveId(x?._id || "");
    setOpen(true);
  }

  function closeModal() {
    if (deleting) return;
    setOpen(false);
    setActiveUrl("");
    setActiveId("");
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

  if (!projectId) return null;

  const gridItems = (() => {
    const list = [...items];
    return list;
  })();

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
                <div className={styles.processingSub}>Your image will appear here</div>
              </div>
            </div>
          )}

          {pendingOutput && (
            <button type="button" className={styles.cardBtn} onClick={() => openModal(pendingOutput)}>
              <img className={styles.img} src={pickUrl(pendingOutput)} alt="" />
            </button>
          )}

          {gridItems
            .filter((x) => !pendingRequestId || String(x?.request) !== String(pendingRequestId))
            .map((x) => {
              const url = pickUrl(x);
              if (!url) return null;
              return (
                <button key={x._id || url} type="button" className={styles.cardBtn} onClick={() => openModal(x)}>
                  <img className={styles.img} src={url} alt="" />
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
                <button type="button" className={styles.modalBtn} onClick={() => downloadImage(activeUrl, activeId)} disabled={deleting}>
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
              <img src={activeUrl} alt="" className={styles.preview} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
