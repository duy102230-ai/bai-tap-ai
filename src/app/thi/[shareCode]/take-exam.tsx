"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import AttachedMedia from "@/components/attached-media";
import AnswerReview, { type AnswerBreakdownItem } from "@/components/answer-review";

type Question = {
  id: string;
  type: string;
  content: string;
  options: string[] | null;
  imageUrl: string | null;
};

export default function TakeExam({
  shareCode,
  title,
  description,
  durationMinutes,
  questions,
}: {
  shareCode: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  questions: Question[];
}) {
  const [studentName, setStudentName] = useState("");
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    totalPoints: number;
    breakdown: AnswerBreakdownItem[];
  } | null>(null);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const answersRef = useRef(answers);
  const studentNameRef = useRef(studentName);
  const submittingRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    studentNameRef.current = studentName;
  }, [studentName]);

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function setSubAnswer(questionId: string, subIndex: number, value: string) {
    setAnswers((prev) => {
      let arr: string[];
      try {
        const parsed = JSON.parse(prev[questionId] || "[]");
        arr = Array.isArray(parsed) ? parsed : ["", "", "", ""];
      } catch {
        arr = ["", "", "", ""];
      }
      while (arr.length < 4) arr.push("");
      arr[subIndex] = value;
      return { ...prev, [questionId]: JSON.stringify(arr) };
    });
  }

  function getSubAnswers(questionId: string): string[] {
    try {
      const parsed = JSON.parse(answers[questionId] || "[]");
      return Array.isArray(parsed) ? parsed : ["", "", "", ""];
    } catch {
      return ["", "", "", ""];
    }
  }

  function isAnswered(q: Question): boolean {
    if (q.type === "true_false" && q.options) {
      const subs = getSubAnswers(q.id);
      return q.options.every((_, i) => subs[i] === "true" || subs[i] === "false");
    }
    return !!(answers[q.id] || "").trim();
  }

  const answeredCount = useMemo(
    () => questions.filter(isAnswered).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions, answers]
  );

  const handleSubmit = useCallback(
    async (skipConfirm = false) => {
      if (submittingRef.current) return;

      if (!skipConfirm) {
        const unanswered = questions.filter((q) => !isAnswered(q)).length;
        if (
          unanswered > 0 &&
          !confirm(`Em còn ${unanswered} câu chưa trả lời. Vẫn muốn nộp bài chứ?`)
        ) {
          return;
        }
      }

      submittingRef.current = true;
      setSubmitting(true);
      setError("");
      try {
        const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shareCode,
            studentName: studentNameRef.current,
            answers: answersRef.current,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Lỗi khi nộp bài.");
          submittingRef.current = false;
          return;
        }
        setResult({ score: data.score, totalPoints: data.totalPoints, breakdown: data.breakdown || [] });
      } finally {
        setSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shareCode, questions, answers]
  );

  useEffect(() => {
    if (!started || !durationMinutes || result) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, durationMinutes, result]);

  function startExam() {
    setStarted(true);
    if (durationMinutes) setSecondsLeft(durationMinutes * 60);
  }

  function formatTime(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (result) {
    const percent = result.totalPoints > 0 ? result.score / result.totalPoints : 0;
    return (
      <div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm mb-6">
          <div className="text-5xl mb-3">{percent >= 0.8 ? "🎉" : percent >= 0.5 ? "👍" : "💪"}</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Đã nộp bài!</h1>
          <p className="text-slate-600 mb-6">Cảm ơn {studentName} đã hoàn thành bài thi.</p>
          <div className="inline-flex flex-col items-center justify-center h-32 w-32 rounded-full bg-blue-50 border-4 border-blue-100 mb-2">
            <span className="text-3xl font-extrabold text-blue-600">{result.score}</span>
            <span className="text-xs text-slate-500">/ {result.totalPoints} điểm</span>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            (Chỉ tính điểm các câu trắc nghiệm/đúng-sai/điền khuyết có thể chấm tự động)
          </p>
        </div>

        {result.breakdown.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Xem lại bài làm</h2>
            <AnswerReview items={result.breakdown} />
          </div>
        )}
      </div>
    );
  }

  if (!started) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            📝 {questions.length} câu hỏi
          </span>
          {durationMinutes && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              ⏱️ {durationMinutes} phút
            </span>
          )}
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">{title}</h1>
        {description && <p className="text-slate-600 mb-4">{description}</p>}
        <p className="text-sm text-slate-500 mb-4">
          Cùng bắt đầu nào — làm hết sức mình nhé! ✨
        </p>
        <label className="block text-sm font-medium text-slate-700 mb-1 mt-4">
          Họ tên của em
        </label>
        <input
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Nhập họ tên..."
        />
        <button
          disabled={!studentName.trim()}
          onClick={startExam}
          className="w-full min-h-[44px] rounded-full bg-blue-600 px-5 py-3 text-white font-semibold shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          Bắt đầu luyện tập →
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-2 z-10 mb-4 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">{title}</h1>
          {secondsLeft !== null && (
            <span
              className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold ${
                secondsLeft <= 60 ? "bg-red-100 text-red-700" : "bg-violet-100 text-violet-700"
              }`}
            >
              ⏱️ {formatTime(secondsLeft)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-slate-500">
            {answeredCount}/{questions.length} câu
          </span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900 mb-3 flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {i + 1}
              </span>
              <span>{q.content}</span>
            </p>
            <AttachedMedia url={q.imageUrl} className="max-w-full mb-3" />
            {q.type === "true_false" && q.options ? (
              <div className="space-y-3">
                {q.options.map((opt, oi) => {
                  const subAnswers = getSubAnswers(q.id);
                  return (
                    <div key={oi} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-700">{opt}</span>
                      <div className="flex gap-3 shrink-0">
                        <label className="flex min-h-[44px] items-center gap-1 text-sm text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name={`${q.id}-${oi}`}
                            checked={subAnswers[oi] === "true"}
                            onChange={() => setSubAnswer(q.id, oi, "true")}
                          />
                          Đúng
                        </label>
                        <label className="flex min-h-[44px] items-center gap-1 text-sm text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name={`${q.id}-${oi}`}
                            checked={subAnswers[oi] === "false"}
                            onChange={() => setSubAnswer(q.id, oi, "false")}
                          />
                          Sai
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : q.options ? (
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const letter = opt.trim().charAt(0);
                  const selected = answers[q.id] === letter;
                  return (
                    <label
                      key={oi}
                      className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                        selected
                          ? "border-blue-500 bg-blue-50 text-blue-900"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={letter}
                        checked={selected}
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
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập câu trả lời..."
              />
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <button
        onClick={() => handleSubmit(false)}
        disabled={submitting}
        className="w-full sm:w-auto min-h-[44px] rounded-full bg-blue-600 px-8 py-3 text-white font-semibold shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all"
      >
        {submitting ? "Đang nộp..." : "Nộp bài →"}
      </button>
    </div>
  );
}
