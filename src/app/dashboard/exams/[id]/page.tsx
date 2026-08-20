import { notFound } from "next/navigation";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    },
  });

  if (!exam || exam.teacherId !== teacherId) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-1">{exam.title}</h1>
      <p className="text-sm text-zinc-500 mb-6">
        {exam.submissions.length} học sinh đã nộp bài
      </p>

      {exam.submissions.length === 0 && (
        <p className="text-sm text-zinc-500">Chưa có học sinh nào nộp bài.</p>
      )}

      <div className="space-y-2">
        {exam.submissions.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div>
              <p className="font-medium text-zinc-900">{s.studentName}</p>
              <p className="text-xs text-zinc-500">
                Nộp lúc {s.submittedAt.toLocaleString("vi-VN")}
              </p>
            </div>
            <p className="text-lg font-semibold text-zinc-900">
              {s.score}/{s.totalPoints}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
