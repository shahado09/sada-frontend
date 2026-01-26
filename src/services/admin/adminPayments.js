import api from "../../api/api";

// GET /api/admin/payments?status=pending_review&type=pack
export async function adminListPayments({ status, type } = {}) {
  const r = await api.get("/admin/payments", {
    params: {
      status: status || "pending_review",
      ...(type ? { type } : {}),
    },
  });

  const intents = r.data.intents || [];

  // تأكيد مخرجات ثابتة للـ UI
  return intents.map((p) => ({
    ...p,
    amount: p.amount ?? p.amountBHD,
    proofUrl: p.proofUrl ?? p.proofImageUrl,
    userEmail: p.user?.email || p.userId?.email,
    userName: p.user?.name || p.userId?.name,
  }));
}

// POST /api/admin/payments/:id/approve
export async function adminApprovePayment(id, note) {
  const r = await api.post(`/admin/payments/${id}/approve`, { note });
  return r.data.intent;
}

// POST /api/admin/payments/:id/reject
export async function adminRejectPayment(id, reason) {
  const r = await api.post(`/admin/payments/${id}/reject`, { reason });
  return r.data.intent;
}

