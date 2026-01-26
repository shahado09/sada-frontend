import api from "../api/api";

export async function createPaymentIntent({ type, itemCode }) {
  const r = await api.post("/payments/intents", { type, itemCode });
  return r.data.intent;
}

export async function submitPaymentProof(intentId, payload) {
  const r = await api.post(`/payments/intents/${intentId}/submit`, payload);
  return r.data.intent;
}

export async function getPaymentIntent(intentId) {
  const r = await api.get(`/payments/intents/${intentId}`);
  return r.data.intent;
}

export async function resubmitPaymentIntent(oldIntentId) {
  const r = await api.post(`/payments/intents/${oldIntentId}/resubmit`);
  return r.data.intent;
}
