import api from "../api/api";


export async function fetchPlans() {
  const res = await api.get("/plans");
  return res.data.plans || [];
}

// Admin
export async function adminFetchPlans() {
  const res = await api.get("/admin/plans");
  return res.data.plans || [];
}

export async function adminCreatePlan(payload) {
  const r = await api.post("/admin/plans", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return r.data.plan;
}

export async function adminUpdatePlan(id, payload) {
  const res = await api.put(`/admin/plans/${id}`, payload);
  return res.data.plan;
}

export async function adminDeactivatePlan(id) {
  const res = await api.delete(`/admin/plans/${id}`);
  return res.data.plan;
}

