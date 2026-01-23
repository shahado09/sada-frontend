import api from "../api/api";

export async function createProject(payload) {
  const res = await api.post("/projects", payload);
  return res.data.project;
}

export async function getMyProjects() {
  const res = await api.get("/projects");
  return res.data.projects;
}

export async function getProjectById(id) {
  const res = await api.get(`/projects/${id}`);
  return res.data.project;
}


export async function updateProject(id, payload) {
  const res = await api.put(`/projects/${id}`, payload);
  return res.data.project;
}

export async function deleteProject(id) {
  const res = await api.delete(`/projects/${id}`);
  return res.data;
}

export async function restoreProject(id) {
  const res = await api.post(`/projects/${id}/restore`);
  return res.data;
}
