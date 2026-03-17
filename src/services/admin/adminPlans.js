import api from "../../api/api";

export async function adminListPlans() {
  const r = await api.get("/admin/plans");
  return r.data.plans || [];
}

export async function adminCreatePlan(payload) {
  const r = await api.post("/admin/plans", payload);
  return r.data.plan;
}

export async function adminUpdatePlan(id, payload) {
  const r = await api.put(`/admin/plans/${id}`, payload);
  return r.data.plan;
}

export async function adminDeactivatePlan(id) {
  const r = await api.delete(`/admin/plans/${id}`);
  return r.data.plan;
}


export async function adminHardDeletePlan(id) {
  await api.delete(`/admin/plans/${id}/hard`);
}
