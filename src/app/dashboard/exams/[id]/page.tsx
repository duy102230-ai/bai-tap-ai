import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAnswerBreakdown } from "@/lib/grade";

const typeLabel: Record<string, string> = {
  multiple_choice: "Trắc nghiệm",
  essay: "Tự luận",
  fill_blank: "Điền khuyết",
  true_false: "Đúng/Sai",
};

export default async function ExamResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teacherId = await getSessionTeacherId();

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      submissions: { orderBy: { submittedAt: "desc" } },
      questions: {
        orderBy: { order: "asc" },
        include: { question: true },
      },
    },
  });

  if (!exam || exam.teacherId !== teacherId) notFound();

  const submissions = exam.submissions;
  const totalSubmissions = submissions.length;
  const questions = exam.questions.map((eq) => eq.question);

  const avgScore =
    totalSubmissions > 0
      ? submissions.reduce((sum, s) => sum + (s.score ?? 0), 0) / totalSubmissions
      : 0;
  const avgTotal =
    totalSubmissions > 0
      ? submissions.reduce((sum, s) => sum + (s.totalPoints ?? 0), 0) / totalSubmissions
      : 0;
  const highest = totalSubmissions > 0 ? Math.max(...submissions.map((s) => s.score ?? 0)) : 0;
  const lowest = totalSubmissions > 0 ? Math.min(...submissions.map((s) => s.score ?? 0)) : 0;

  // Gộp breakdown của mọi bài nộp để tính tỷ lệ đúng theo từng câu
  const accuracyByQuestion = new Map<string, { sum: number; count: number }>();
  for (const s of submissions) {
    let answers: Record<string, string>;
    try {
      answers = JSON.parse(s.answers);
    } catch {
      continue;
    }
    const breakdown = buildAnswerBreakdown(questions, answers);
    for (const b of breakdown) {
      if (!b.gradable) continue;
      const prev = accuracyByQuestion.get(b.questionId) || { sum: 0, count: 0 };
      prev.sum += b.scoreFraction;
      prev.count += 1;
      accuracyByQuestion.set(b.questionId, prev);
    }
  }

  const questionStats = questions
    .filter((q) => accuracyByQuestion.has(q.id))
    .map((q) => {
      const stat = accuracyByQuestion.get(q.id)!;
      return {
        id: q.id,
        content: q.content,
        type: q.type,
        accuracy: stat.count > 0 ? stat.sum / stat.count : 0,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">{exam.title}</h1>
      <p className="text-sm text-slate-500 mb-6">
        {totalSubmissions} học sinh đã nộp bài
      </p>

      {totalSubmissions > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Điểm trung bình</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {avgScore.toFixed(1)}/{avgTotal.toFixed(0)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Cao nhất</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{highest}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Thấp nhất</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{lowest}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Số bài nộp</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalSubmissions}</p>
          </div>
        </div>
      )}

      {questionStats.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Tỷ lệ trả lời đúng theo câu (câu khó nhất ở trên)
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            {questionStats.map((qs, i) => {
              const pct = Math.round(qs.accuracy * 100);
              return (
                <div key={qs.id}>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span className="truncate pr-2">
                      Câu {i + 1} · {typeLabel[qs.type]} · {qs.content}
                    </span>
                    <span className="shrink-0 font-medium">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalSubmissions === 0 && (
        <p className="text-sm text-slate-500">Chưa có học sinh nào nộp bài.</p>
      )}

      <div className="space-y-2">
        {submissions.map((s) => (
          <Link
            key={s.id}
            href={`/dashboard/exams/${id}/submissions/${s.id}`}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
          >
            <div>
              <p className="font-medium text-slate-900">{s.studentName}</p>
              <p className="text-xs text-slate-500">
                Nộp lúc {s.submittedAt.toLocaleString("vi-VN")} · Xem chi tiết →
              </p>
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {s.score}/{s.totalPoints}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
