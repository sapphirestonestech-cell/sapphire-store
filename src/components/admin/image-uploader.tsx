"use client";

import { useCallback, useEffect, useState } from "react";
import { RingPlaceholder } from "@/components/ui/ring-placeholder";

const MAX_IMAGES = 4;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export interface SlotValue {
  url: string;
  publicId?: string;
  label: string;
}

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

async function getSignature(): Promise<UploadSignature> {
  const res = await fetch("/api/admin/upload-signature");
  const data = (await res.json()) as UploadSignature & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Uploads are unavailable.");
  return data;
}

async function uploadToCloudinary(
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

/**
 * Four fixed image slots — DESIGN.md §9, ProductReq.md §6.3.
 * A fifth upload is refused with a clear message; the first slot is the
 * cover.
 */
export function ImageUploader({
  value,
  onChange,
}: {
  value: SlotValue[];
  onChange: (next: SlotValue[]) => void;
}) {
  const [slots, setSlots] = useState<SlotValue[]>(() => {
    const initial = Array.from({ length: MAX_IMAGES }, (_, i) => value[i] ?? { url: "", label: "" });
    return initial;
  });
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    onChange(slots.filter((s) => s.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const setSlot = useCallback((index: number, patch: Partial<SlotValue>) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }, []);

  async function pickFile(index: number, file: File) {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Use a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is over 5 MB. Choose a smaller file.");
      return;
    }
    const filled = slots.filter((s) => s.url).length;
    if (!slots[index].url && filled >= MAX_IMAGES) {
      setError("A ring can have at most four images.");
      return;
    }

    setBusyIndex(index);
    try {
      const sig = await getSignature();
      const uploaded = await uploadToCloudinary(file, sig);
      setSlot(index, { url: uploaded.url, publicId: uploaded.publicId });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "The upload failed. Try again.";
      setError(message);
      if (message.toLowerCase().includes("configured")) setConfigError(message);
    } finally {
      setBusyIndex(null);
    }
  }

  const filledCount = slots.filter((s) => s.url).length;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-body font-medium">Images</p>
        <p className="text-label text-muted tabular">
          {filledCount} of {MAX_IMAGES} images
        </p>
      </div>

      {configError ? (
        <p role="alert" className="text-body text-warning">
          {configError}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-body text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {slots.map((slot, i) => (
          <div key={i} className="space-y-2">
            <div className="relative aspect-square overflow-hidden rounded-sm border border-border-subtle bg-card">
              {slot.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slot.url}
                  alt={slot.label || `Product image ${i + 1}`}
                  className="size-full object-cover"
                />
              ) : (
                <RingPlaceholder label={i === 0 ? "Cover" : `Image ${i + 1}`} />
              )}
              {i === 0 ? (
                <span className="absolute left-2 top-2 rounded-sm bg-card/90 px-2 py-0.5 text-label font-medium">
                  Cover
                </span>
              ) : null}
              {busyIndex === i ? (
                <div className="absolute inset-0 flex items-center justify-center bg-card/70 text-label">
                  Uploading…
                </div>
              ) : null}
            </div>

            <label className="block">
              <span className="sr-only">Image {i + 1} label</span>
              <input
                type="text"
                value={slot.label}
                onChange={(e) => setSlot(i, { label: e.target.value })}
                placeholder={
                  i === 0 ? "Cover (optional label)" : "e.g. Left hand"
                }
                className="h-10 w-full rounded-pill border border-border-subtle bg-card px-3 text-body"
              />
            </label>

            <div className="flex gap-2">
              <label className="inline-flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-pill border border-border-subtle bg-card px-3 text-label font-medium">
                {slot.url ? "Replace" : "Upload"}
                <input
                  type="file"
                  accept={ACCEPTED.join(",")}
                  className="sr-only"
                  disabled={busyIndex !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) pickFile(i, file);
                    e.target.value = "";
                  }}
                />
              </label>
              {slot.url ? (
                <button
                  type="button"
                  onClick={() => setSlot(i, { url: "", publicId: "" })}
                  className="inline-flex min-h-9 items-center rounded-pill px-3 text-label font-medium text-danger"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
