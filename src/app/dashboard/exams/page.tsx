import Link from "next/link";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CopyLinkButton from "./copy-link-button";

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
        <h1 className="text-2xl font-semibold text-zinc-900">Đề thi</h1>
        <Link
          href="/dashboard/exams/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-white text-sm font-medium hover:bg-zinc-700"
        >
          + Tạo đề mới
        </Link>
      </div>

      {exams.length === 0 && (
        <p className="text-sm text-zinc-500">Chưa có đề thi nào.</p>
      )}

      <div className="space-y-3">
        {exams.map((exam) => (
          <div key={exam.id} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900">{exam.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {exam._count.questions} câu hỏi · {exam._count.submissions} bài đã nộp
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/exams/${exam.id}`}
                  className="text-sm text-zinc-600 hover:underline"
                >
                  Xem kết quả
                </Link>
                <CopyLinkButton shareCode={exam.shareCode} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
