// src/services/plans.js
import api from "../api/api";

// GET /api/plans
export async function fetchPlans() {
  const res = await api.get("/plans");
  return res.data.plans;
}
