"use client";

import { useState } from "react";

type Question = {
  id: string;
  type: string;
  content: string;
  options: string[] | null;
};

export default function TakeExam({
  shareCode,
  title,
  description,
  questions,
}: {
  shareCode: string;
  title: string;
  description: string | null;
  questions: Question[];
}) {
  const [studentName, setStudentName] = useState("");
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; totalPoints: number } | null>(null);
  const [error, setError] = useState("");

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareCode, studentName, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Lỗi khi nộp bài.");
        return;
      }
      setResult({ score: data.score, totalPoints: data.totalPoints });
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">Đã nộp bài!</h1>
        <p className="text-zinc-600 mb-4">Cảm ơn {studentName} đã hoàn thành bài thi.</p>
        <p className="text-3xl font-bold text-zinc-900">
          {result.score}/{result.totalPoints} điểm
        </p>
        <p className="text-xs text-zinc-400 mt-2">
          (Chỉ tính điểm các câu trắc nghiệm/điền khuyết có thể chấm tự động)
        </p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8">
        <h1 className="text-xl font-semibold text-zinc-900 mb-1">{title}</h1>
        {description && <p className="text-zinc-600 mb-4">{description}</p>}
        <p className="text-sm text-zinc-500 mb-4">{questions.length} câu hỏi</p>
        <label className="block text-sm text-zinc-700 mb-1">Họ tên của em</label>
        <input
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm mb-4"
          placeholder="Nhập họ tên..."
        />
        <button
          disabled={!studentName.trim()}
          onClick={() => setStarted(true)}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50"
        >
          Bắt đầu làm bài
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">{title}</h1>
      <div className="space-y-4 mb-6">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm font-medium text-zinc-900 mb-3">
              Câu {i + 1}. {q.content}
            </p>
            {q.options ? (
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const letter = opt.trim().charAt(0);
                  return (
                    <label
                      key={oi}
                      className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={letter}
                        checked={answers[q.id] === letter}
                        onChange={() => setAnswer(q.id, letter)}
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                rows={3}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Nhập câu trả lời..."
              />
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="rounded-lg bg-zinc-900 px-6 py-3 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50"
      >
        {submitting ? "Đang nộp..." : "Nộp bài"}
      </button>
    </div>
  );
}
