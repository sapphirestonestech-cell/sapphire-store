export type CloudinaryFolder = "products" | "email";

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export async function getCloudinarySignature(
  folder: CloudinaryFolder = "products",
): Promise<UploadSignature> {
  const res = await fetch(`/api/admin/upload-signature?folder=${folder}`);
  const data = (await res.json()) as UploadSignature & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Uploads are unavailable.");
  return data;
}

export async function uploadFileToCloudinary(
  file: File,
  sig: UploadSignature,
): Promise<{ url: string; publicId: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  const data = (await res.json()) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message ?? "The upload failed. Try again.");
  }
  return { url: data.secure_url, publicId: data.public_id ?? "" };
}
