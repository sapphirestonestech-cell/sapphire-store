"use client";

import dynamic from "next/dynamic";

const EmailCkeditorInner = dynamic(() => import("./email-ckeditor-inner"), {
  ssr: false,
  loading: () => (
    <div className="min-h-64 rounded-sm border border-border-subtle bg-card p-4 text-body text-muted">
      Loading editor…
    </div>
  ),
});

export function EmailCkeditor({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (html: string) => void;
}) {
  return <EmailCkeditorInner id={id} value={value} onChange={onChange} />;
}
