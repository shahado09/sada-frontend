import api from "../api/api";

export async function getCloudinarySignature() {
  const r = await api.get("/uploads/cloudinary-signature");
  return r.data; 
}


export async function uploadReceiptToCloudinary(file, sig) {
  const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", sig.timestamp);
  fd.append("folder", sig.folder);
  fd.append("signature", sig.signature);

  const res = await fetch(url, { method: "POST", body: fd });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Cloudinary upload failed: ${t}`);
  }
  const data = await res.json();
  return data.secure_url;
}
