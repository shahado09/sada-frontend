import api from "../../api/api";

export async function adminListPacks() {
  const r = await api.get("/admin/packs");
  return r.data.packs || [];
}

export async function adminCreatePack(payload) {
  const r = await api.post("/admin/packs", payload);
  return r.data.pack;
}

export async function adminUpdatePack(id, payload) {
  const r = await api.put(`/admin/packs/${id}`, payload);
  return r.data.pack;
}

export async function adminDeactivatePack(id) {
  const r = await api.delete(`/admin/packs/${id}`);
  return r.data.pack;
}


export async function adminHardDeletePack(id) {
  await api.delete(`/admin/packs/${id}/hard`);
}