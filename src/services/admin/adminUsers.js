import api from "../../api/api";

export async function adminListUsers() {
  const r = await api.get("/admin/users");
  return r.data.users || [];
}

export async function adminUpdateUserRole(id, role) {
  const r = await api.put(`/admin/users/${id}/role`, { role });
  return r.data.user;
}

export async function adminDeactivateUser(id) {
  const r = await api.delete(`/admin/users/${id}`);
  return r.data.user;
}
