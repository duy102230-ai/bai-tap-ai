"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  subject: string;
  topic: string | null;
  type: string;
  content: string;
  options: string | null;
  imageUrl: string | null;
};

const typeLabel: Record<string, string> = {
  multiple_choice: "Trắc nghiệm",
  essay: "Tự luận",
  fill_blank: "Điền khuyết",
  true_false: "Đúng/Sai",
};

export default function ExamForm({
  questions,
  examId,
  initialTitle = "",
  initialDescription = "",
  initialDurationMinutes = null,
  initialSelectedIds = [],
}: {
  questions: Question[];
  examId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialDurationMinutes?: number | null;
  initialSelectedIds?: string[];
}) {
  const router = useRouter();
  const isEdit = !!examId;
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [durationMinutes, setDurationMinutes] = useState(
    initialDurationMinutes ? String(initialDurationMinutes) : ""
  );
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedIds));
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdLink, setCreatedLink] = useState("");

  const subjects = useMemo(
    () => Array.from(new Set(questions.map((q) => q.subject))),
    [questions]
  );

  const filtered = useMemo(
    () =>
      subjectFilter === "all"
        ? questions
        : questions.filter((q) => q.subject === subjectFilter),
    [questions, subjectFilter]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title || selected.size === 0) {
      setError("Vui lòng nhập tiêu đề và chọn ít nhất 1 câu hỏi.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        questionIds: Array.from(selected),
      };

      if (isEdit) {
        const res = await fetch(`/api/exams/id/${examId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Lỗi khi lưu đề.");
          return;
        }
        router.push("/dashboard/exams");
        router.refresh();
        return;
      }

      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Lỗi khi tạo đề.");
        return;
      }
      setCreatedLink(`${window.location.origin}/thi/${data.exam.shareCode}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (createdLink) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <p className="text-green-800 font-medium mb-2">Tạo đề thành công!</p>
        <p className="text-sm text-slate-700 mb-3">Gửi link này cho học sinh làm bài:</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={createdLink}
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm bg-white"
          />
          <button
            onClick={() => navigator.clipboard.writeText(createdLink)}
            className="rounded bg-blue-600 px-4 py-2 text-white text-sm"
          >
            Copy
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm text-slate-700 mb-1">Tiêu đề đề thi</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Kiểm tra 15 phút - Chương 1"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm text-slate-700 mb-1">Mô tả (tùy chọn)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Giới hạn thời gian làm bài (phút, để trống nếu không giới hạn)
          </label>
          <input
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="vd: 15"
            className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Chọn câu hỏi ({selected.size} đã chọn)
        </h2>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="all">Tất cả môn</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 mb-6">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500">Chưa có câu hỏi nào trong ngân hàng.</p>
        )}
        {filtered.map((q) => {
          const options: string[] | null = q.options ? JSON.parse(q.options) : null;
          return (
            <label
              key={q.id}
              className={`flex gap-3 rounded-lg border p-3 cursor-pointer ${
                selected.has(q.id) ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(q.id)}
                onChange={() => toggle(q.id)}
                className="mt-1"
              />
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase">
                  {typeLabel[q.type] || q.type} · {q.subject}
                </span>
                <p className="text-sm text-slate-900">{q.content}</p>
                {q.imageUrl?.startsWith("data:") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={q.imageUrl}
                    alt="Hình minh họa"
                    className="max-w-[200px] rounded border border-slate-200 mt-1"
                  />
                )}
                {options && (
                  <ul className="text-xs text-slate-600 mt-1">
                    {options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-blue-600 px-5 py-3 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo đề thi"}
      </button>
    </form>
  );
}
