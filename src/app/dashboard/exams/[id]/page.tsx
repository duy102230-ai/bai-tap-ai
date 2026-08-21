import { notFound } from "next/navigation";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const questionStats = exam.questions
    .map((eq) => {
      const q = eq.question;
      if (q.type !== "multiple_choice" && q.type !== "fill_blank" && q.type !== "true_false") {
        return null;
      }

      let accuracySum = 0;
      let counted = 0;

      for (const s of submissions) {
        let studentAnswers: Record<string, string>;
        try {
          studentAnswers = JSON.parse(s.answers);
        } catch {
          continue;
        }
        counted += 1;

        if (q.type === "true_false") {
          try {
            const correctArr: string[] = JSON.parse(q.answer);
            const studentArr: string[] = JSON.parse(studentAnswers[q.id] || "[]");
            const total = correctArr.length || 1;
            let correctCount = 0;
            for (let i = 0; i < total; i++) {
              if ((studentArr[i] || "") === (correctArr[i] || "")) correctCount += 1;
            }
            accuracySum += correctCount / total;
          } catch {
            // bỏ qua nếu dữ liệu lỗi
          }
        } else {
          const studentAnswer = (studentAnswers[q.id] || "").toString().trim().toLowerCase();
          const correctAnswer = q.answer.trim().toLowerCase();
          if (studentAnswer === correctAnswer) accuracySum += 1;
        }
      }

      const accuracy = counted > 0 ? accuracySum / counted : 0;

      return {
        id: q.id,
        content: q.content,
        type: q.type,
        accuracy,
        counted,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">{exam.title}</h1>
      <p className="text-sm text-slate-500 mb-6">
        {totalSubmissions} học sinh đã nộp bài
      </p>

      {totalSubmissions > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Điểm trung bình</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {avgScore.toFixed(1)}/{avgTotal.toFixed(0)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Cao nhất</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{highest}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Thấp nhất</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{lowest}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
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
          <div
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
          >
            <div>
              <p className="font-medium text-slate-900">{s.studentName}</p>
              <p className="text-xs text-slate-500">
                Nộp lúc {s.submittedAt.toLocaleString("vi-VN")}
              </p>
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {s.score}/{s.totalPoints}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
