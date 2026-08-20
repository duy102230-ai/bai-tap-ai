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
};

const typeLabel: Record<string, string> = {
  multiple_choice: "Trắc nghiệm",
  essay: "Tự luận",
  fill_blank: "Điền khuyết",
};

export default function ExamForm({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
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
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          questionIds: Array.from(selected),
        }),
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
        <p className="text-sm text-zinc-700 mb-3">Gửi link này cho học sinh làm bài:</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={createdLink}
            className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm bg-white"
          />
          <button
            onClick={() => navigator.clipboard.writeText(createdLink)}
            className="rounded bg-zinc-900 px-4 py-2 text-white text-sm"
          >
            Copy
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm text-zinc-700 mb-1">Tiêu đề đề thi</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Kiểm tra 15 phút - Chương 1"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-700 mb-1">Mô tả (tùy chọn)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-zinc-900">
          Chọn câu hỏi ({selected.size} đã chọn)
        </h2>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
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
          <p className="text-sm text-zinc-500">Chưa có câu hỏi nào trong ngân hàng.</p>
        )}
        {filtered.map((q) => {
          const options: string[] | null = q.options ? JSON.parse(q.options) : null;
          return (
            <label
              key={q.id}
              className={`flex gap-3 rounded-lg border p-3 cursor-pointer ${
                selected.has(q.id) ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(q.id)}
                onChange={() => toggle(q.id)}
                className="mt-1"
              />
              <div>
                <span className="text-xs font-medium text-zinc-500 uppercase">
                  {typeLabel[q.type] || q.type} · {q.subject}
                </span>
                <p className="text-sm text-zinc-900">{q.content}</p>
                {options && (
                  <ul className="text-xs text-zinc-600 mt-1">
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
        className="rounded-lg bg-zinc-900 px-5 py-3 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50"
      >
        {saving ? "Đang tạo..." : "Tạo đề thi"}
      </button>
    </form>
  );
}
