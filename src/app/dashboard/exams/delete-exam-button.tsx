"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteExamButton({ examId, title }: { examId: string; title: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Xóa đề thi "${title}"? Toàn bộ bài làm của học sinh cho đề này cũng sẽ bị xóa.`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/exams/id/${examId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Lỗi khi xóa đề thi.");
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {deleting ? "Đang xóa..." : "Xóa"}
    </button>
  );
}
