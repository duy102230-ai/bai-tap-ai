"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AttachedMedia from "@/components/attached-media";

type GeneratedQuestion = {
  type: "multiple_choice" | "essay" | "fill_blank" | "true_false";
  content: string;
  options?: string[];
  answer: string;
  explanation?: string;
  hasVisual?: boolean;
  visualPage?: number;
};

export type SavedQuestion = {
  id: string;
  subject: string;
  grade: string | null;
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

function parseTrueFalseAnswer(answer: string): string[] {
  try {
    const arr = JSON.parse(answer);
    if (Array.isArray(arr)) return arr.map((v) => String(v));
  } catch {
    // fall through
  }
  return ["false", "false", "false", "false"];
}

export default function QuestionGenerator({
  onSaved,
}: {
  onSaved?: (created: SavedQuestion[]) => void;
} = {}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceIsPdf, setSourceIsPdf] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError("");
    setLoading(true);
    setQuestions([]);
    setSourceImage(null);
    setSourceIsPdf(false);

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
      setSourceImage(data.sourceImage || null);
      setSourceIsPdf(!!data.sourceIsPdf);
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

  function updateTrueFalseAnswer(qIndex: number, subIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const arr = parseTrueFalseAnswer(q.answer);
        arr[subIndex] = value;
        return { ...q, answer: JSON.stringify(arr) };
      })
    );
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
          grade,
          topic,
          sourceFile: file?.name,
          sourceImage,
          sourceIsPdf,
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
      setSourceImage(null);
      setSourceIsPdf(false);
      onSaved?.(data.questions);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Sinh câu hỏi từ ảnh/PDF bằng AI
      </h2>

      <form onSubmit={handleGenerate} className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label className="block text-sm text-slate-700 mb-1">Môn học</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Toán, Văn, Anh..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-40"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-700 mb-1">Lớp (tùy chọn)</label>
          <input
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="10, 11, 12..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-28"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-700 mb-1">Chủ đề (tùy chọn)</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Chương 1..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-40"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-700 mb-1">File ảnh/PDF đề bài</label>
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "AI đang xử lý..." : "Sinh câu hỏi"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {questions.length > 0 && (
        <div>
          {sourceImage && (
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-1">
                File đề gốc (tick &quot;Kèm hình&quot; ở câu nào cần xem hình mới trả lời được
                {sourceIsPdf ? " — nhớ điền đúng số trang" : ""}):
              </p>
              <AttachedMedia url={sourceImage} className="max-w-xs" />
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-600">
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
              <div key={i} className="rounded-lg border border-slate-200 p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    Câu {i + 1} · {typeLabel[q.type] || q.type}
                  </span>
                  <div className="flex items-center gap-3">
                    {sourceImage && (
                      <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!q.hasVisual}
                          onChange={(e) => updateQuestion(i, { hasVisual: e.target.checked })}
                        />
                        Kèm hình
                      </label>
                    )}
                    {sourceImage && sourceIsPdf && q.hasVisual && (
                      <label className="flex items-center gap-1 text-xs text-slate-600">
                        Trang
                        <input
                          type="number"
                          min={1}
                          value={q.visualPage ?? 1}
                          onChange={(e) => updateQuestion(i, { visualPage: Number(e.target.value) })}
                          className="w-12 rounded border border-slate-300 px-1 py-0.5"
                        />
                      </label>
                    )}
                    <button
                      onClick={() => removeQuestion(i)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                <textarea
                  value={q.content}
                  onChange={(e) => updateQuestion(i, { content: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm mb-2"
                  rows={2}
                />

                {q.type === "true_false" && q.options ? (
                  <div className="space-y-2 mb-2">
                    {q.options.map((opt, oi) => {
                      const answers = parseTrueFalseAnswer(q.answer);
                      return (
                        <div key={oi} className="flex gap-2 items-center">
                          <input
                            value={opt}
                            onChange={(e) => updateOption(i, oi, e.target.value)}
                            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                          <select
                            value={answers[oi] === "true" ? "true" : "false"}
                            onChange={(e) => updateTrueFalseAnswer(i, oi, e.target.value)}
                            className="rounded border border-slate-300 px-2 py-1 text-sm"
                          >
                            <option value="true">Đúng</option>
                            <option value="false">Sai</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    {q.options && (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {q.options.map((opt, oi) => (
                          <input
                            key={oi}
                            value={opt}
                            onChange={(e) => updateOption(i, oi, e.target.value)}
                            className="rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 items-center">
                      <label className="text-xs text-slate-500">Đáp án đúng:</label>
                      <input
                        value={q.answer}
                        onChange={(e) => updateQuestion(i, { answer: e.target.value })}
                        className="rounded border border-slate-300 px-2 py-1 text-sm w-24"
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
