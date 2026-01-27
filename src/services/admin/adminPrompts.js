import api from "../../api/api";

export async function adminListPrompts() {
  const r = await api.get("/admin/prompt-templates");
  return r.data || [];
}

export async function adminCreatePrompt(payload) {
  const r = await api.post("/admin/prompt-templates", payload);
  return r.data;
}

export async function adminUpdatePrompt(id, payload) {
  const r = await api.put(`/admin/prompt-templates/${id}`, payload);
  return r.data;
}

export async function adminDeactivatePrompt(id) {
  const r = await api.patch(`/admin/prompt-templates/${id}/deactivate`);
  return r.data;
}

export async function adminActivatePrompt(id) {
  const r = await api.patch(`/admin/prompt-templates/${id}/activate`);
  return r.data;
}
