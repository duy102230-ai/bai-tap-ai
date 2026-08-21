import Link from "next/link";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CopyLinkButton from "./copy-link-button";
import DeleteExamButton from "./delete-exam-button";

export default async function ExamsPage() {
  const teacherId = await getSessionTeacherId();
  const exams = await prisma.exam.findMany({
    where: { teacherId: teacherId! },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, submissions: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Đề thi</h1>
        <Link
          href="/dashboard/exams/new"
          className="min-h-[44px] inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-white text-sm font-semibold hover:bg-blue-700 transition-all"
        >
          + Tạo đề mới
        </Link>
      </div>

      {exams.length === 0 && (
        <p className="text-sm text-slate-500">Chưa có đề thi nào.</p>
      )}

      <div className="space-y-3">
        {exams.map((exam) => (
          <div key={exam.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{exam.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {exam._count.questions} câu hỏi · {exam._count.submissions} bài đã nộp
                  {exam.durationMinutes ? ` · Giới hạn ${exam.durationMinutes} phút` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/dashboard/exams/${exam.id}`}
                  className="text-sm text-slate-600 hover:underline"
                >
                  Xem kết quả
                </Link>
                <Link
                  href={`/dashboard/exams/${exam.id}/edit`}
                  className="text-sm text-slate-600 hover:underline"
                >
                  Sửa
                </Link>
                <CopyLinkButton shareCode={exam.shareCode} />
                <DeleteExamButton examId={exam.id} title={exam.title} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
