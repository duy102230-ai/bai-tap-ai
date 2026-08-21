"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AttachedMedia from "@/components/attached-media";

type Question = {
  id: string;
  subject: string;
  topic: string | null;
  type: string;
  content: string;
  options: string | null;
  answer: string;
  imageUrl: string | null;
  createdAt: string;
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

export default function QuestionList({ questions }: { questions: Question[] }) {
  if (questions.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Chưa có câu hỏi nào trong ngân hàng. Upload ảnh/PDF ở trên để AI sinh câu hỏi.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <QuestionItem key={q.id} question={q} />
      ))}
    </div>
  );
}

function QuestionItem({ question: q }: { question: Question }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const initialOptions: string[] | null = q.options ? JSON.parse(q.options) : null;
  const [content, setContent] = useState(q.content);
  const [options, setOptions] = useState<string[] | null>(initialOptions);
  const [answer, setAnswer] = useState(q.answer);

  function updateOption(i: number, value: string) {
    setOptions((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  function updateTrueFalseAnswer(i: number, value: string) {
    const arr = parseTrueFalseAnswer(answer);
    arr[i] = value;
    setAnswer(JSON.stringify(arr));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/questions/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, options, answer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Lỗi khi lưu.");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Xóa câu hỏi này khỏi ngân hàng? Nếu câu hỏi đang nằm trong đề thi, nó cũng sẽ bị gỡ khỏi đề đó.")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/questions/${q.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Lỗi khi xóa câu hỏi.");
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase">
            {typeLabel[q.type] || q.type}
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">{q.subject}</span>
          {q.topic && (
            <>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">{q.topic}</span>
            </>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-blue-600 hover:underline"
            >
              Sửa
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              {deleting ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        )}
      </div>

      <AttachedMedia url={q.imageUrl} className="max-w-xs mb-1.5" />

      {!editing ? (
        <>
          <p className="text-sm text-slate-900 mb-1.5">{q.content}</p>
          {q.type === "true_false" && initialOptions ? (
            <ul className="text-sm text-slate-600 mb-1.5 space-y-0.5">
              {initialOptions.map((opt, i) => {
                const answers = parseTrueFalseAnswer(q.answer);
                const isTrue = answers[i] === "true";
                return (
                  <li key={i} className="flex items-center gap-2">
                    <span>{opt}</span>
                    <span className={isTrue ? "text-green-700 text-xs" : "text-red-600 text-xs"}>
                      {isTrue ? "Đúng" : "Sai"}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <>
              {initialOptions && (
                <ul className="text-sm text-slate-600 mb-1.5 space-y-0.5">
                  {initialOptions.map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-green-700">Đáp án: {q.answer}</p>
            </>
          )}
        </>
      ) : (
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm mb-2"
            rows={2}
          />

          {q.type === "true_false" && options ? (
            <div className="space-y-2 mb-2">
              {options.map((opt, i) => {
                const answers = parseTrueFalseAnswer(answer);
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                    <select
                      value={answers[i] === "true" ? "true" : "false"}
                      onChange={(e) => updateTrueFalseAnswer(i, e.target.value)}
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
              {options && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {options.map((opt, i) => (
                    <input
                      key={i}
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-center mb-2">
                <label className="text-xs text-slate-500">Đáp án đúng:</label>
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1 text-sm w-24"
                />
              </div>
            </>
          )}

          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-blue-600 px-3 py-1.5 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setContent(q.content);
                setOptions(initialOptions);
                setAnswer(q.answer);
                setError("");
              }}
              className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
