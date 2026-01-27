export async function uploadTempImageToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = "sada_temp_input";

  if (!cloudName) throw new Error("Missing VITE_CLOUDINARY_CLOUD_NAME");

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);
  form.append("folder", "sada/temp-input/images");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Cloudinary upload failed");

  return { url: data.secure_url, publicId: data.public_id, resourceType: "image" };
}

export async function uploadUpTo3Images(files) {
  const list = Array.from(files || []).slice(0, 3);
  const out = [];
  for (const f of list) out.push(await uploadTempImageToCloudinary(f));
  return out;
}
