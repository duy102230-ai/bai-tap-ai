"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GeneratedQuestion = {
  type: "multiple_choice" | "essay" | "fill_blank";
  content: string;
  options?: string[];
  answer: string;
  explanation?: string;
};

export default function QuestionGenerator() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError("");
    setLoading(true);
    setQuestions([]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Có lỗi khi sinh câu hỏi.");
        return;
      }
      setQuestions(data.questions);
    } finally {
      setLoading(false);
    }
  }

  function updateQuestion(index: number, patch: Partial<GeneratedQuestion>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q))
    );
  }

  function updateOption(qIndex: number, optIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex || !q.options) return q;
        const newOptions = [...q.options];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions };
      })
    );
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveAll() {
    if (!subject) {
      setError("Vui lòng nhập môn học trước khi lưu.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          topic,
          sourceFile: file?.name,
          questions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Lỗi khi lưu câu hỏi.");
        return;
      }
      setQuestions([]);
      setFile(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 mb-8">
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">
        Sinh câu hỏi từ ảnh/PDF bằng AI
      </h2>

      <form onSubmit={handleGenerate} className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label className="block text-sm text-zinc-700 mb-1">Môn học</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Toán, Văn, Anh..."
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm w-40"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-700 mb-1">Chủ đề (tùy chọn)</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Chương 1..."
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm w-40"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-700 mb-1">File ảnh/PDF đề bài</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={!file || loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "AI đang xử lý..." : "Sinh câu hỏi"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {questions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-zinc-600">
              AI sinh được {questions.length} câu hỏi. Kiểm tra/chỉnh sửa rồi lưu vào ngân hàng.
            </p>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="rounded-lg bg-green-600 px-4 py-2 text-white text-sm font-medium hover:bg-green-500 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : `Lưu tất cả (${questions.length})`}
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-zinc-500 uppercase">
                    Câu {i + 1} · {q.type === "multiple_choice" ? "Trắc nghiệm" : q.type === "essay" ? "Tự luận" : "Điền khuyết"}
                  </span>
                  <button
                    onClick={() => removeQuestion(i)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Xóa
                  </button>
                </div>
                <textarea
                  value={q.content}
                  onChange={(e) => updateQuestion(i, { content: e.target.value })}
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm mb-2"
                  rows={2}
                />
                {q.options && (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {q.options.map((opt, oi) => (
                      <input
                        key={oi}
                        value={opt}
                        onChange={(e) => updateOption(i, oi, e.target.value)}
                        className="rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                    ))}
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <label className="text-xs text-zinc-500">Đáp án đúng:</label>
                  <input
                    value={q.answer}
                    onChange={(e) => updateQuestion(i, { answer: e.target.value })}
                    className="rounded border border-zinc-300 px-2 py-1 text-sm w-24"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
