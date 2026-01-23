// src/services/packs.js
import api from "../api/api";

// GET /api/packs
export async function fetchPacks() {
  const res = await api.get("/packs");
  return res.data.packs;
}
