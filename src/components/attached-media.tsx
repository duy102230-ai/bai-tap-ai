"use client";

export default function AttachedMedia({
  url,
  className = "",
}: {
  url: string | null | undefined;
  className?: string;
}) {
  if (!url || !url.startsWith("data:")) return null;

  if (url.startsWith("data:application/pdf")) {
    return (
      <div className={`rounded-xl border border-slate-200 overflow-hidden ${className}`}>
        <iframe src={url} className="w-full h-72" title="Hình minh họa (PDF)" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Hình minh họa" className={`rounded-xl border border-slate-200 ${className}`} />
  );
}
