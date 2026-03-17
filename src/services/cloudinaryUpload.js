import api from "../api/api";

export async function uploadUpTo3Images(files) {
  const list = Array.from(files || []).slice(0, 3);
  if (list.length === 0) return [];

  const form = new FormData();
  for (const f of list) {
    form.append("files", f);
  }

  const res = await api.post("/uploads/temp", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.inputs || [];
}