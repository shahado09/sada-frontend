// src/services/cloudinaryUpload.js

const PRESET = "sada_temp_input";

function mustHaveCloudName() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error("Missing VITE_CLOUDINARY_CLOUD_NAME in frontend .env");
  return cloudName;
}

export async function uploadTempImageToCloudinary(file) {
  const cloudName = mustHaveCloudName();

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", PRESET);
  form.append("folder", "sada/temp-input/images");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Cloudinary image upload failed");

  // public_id نحتاجه عشان نحذفه فورًا بعد ما يخلص الجينيريشن
  return {
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: "image",
  };
}

export async function uploadTempVideoToCloudinary(file) {
  const cloudName = mustHaveCloudName();

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", PRESET);
  form.append("folder", "sada/temp-input/videos");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Cloudinary video upload failed");

  return {
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: "video",
  };
}
