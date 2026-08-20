"use client";

import { useState } from "react";

export default function CopyLinkButton({ shareCode }: { shareCode: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const link = `${window.location.origin}/thi/${shareCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-sm rounded-lg border border-slate-300 px-3 py-1 hover:bg-blue-50"
    >
      {copied ? "Đã copy!" : "Copy link"}
    </button>
  );
}
