import api from "../api/api";

// Public (للمستخدمين)
export async function fetchPacks() {
  const res = await api.get("/packs");
  return res.data.packs || [];
}

// Admin
export async function adminFetchPacks() {
  const res = await api.get("/admin/packs");
  return res.data.packs || [];
}

export async function adminCreatePack(payload) {
  const res = await api.post("/admin/packs", payload);
  return res.data.pack;
}

export async function adminUpdatePack(id, payload) {
  const res = await api.put(`/admin/packs/${id}`, payload);
  return res.data.pack;
}

export async function adminDeactivatePack(id) {
  const res = await api.delete(`/admin/packs/${id}`);
  return res.data.pack;
}
