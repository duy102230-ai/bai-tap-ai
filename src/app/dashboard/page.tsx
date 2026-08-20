import Link from "next/link";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const teacherId = await getSessionTeacherId();
  const [questionCount, examCount] = await Promise.all([
    prisma.question.count({ where: { teacherId: teacherId! } }),
    prisma.exam.count({ where: { teacherId: teacherId! } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Tổng quan</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">Câu hỏi trong ngân hàng</p>
          <p className="text-3xl font-bold text-zinc-900 mt-1">{questionCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">Đề thi đã tạo</p>
          <p className="text-3xl font-bold text-zinc-900 mt-1">{examCount}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          href="/dashboard/questions"
          className="rounded-lg bg-zinc-900 px-5 py-3 text-white text-sm font-medium hover:bg-zinc-700"
        >
          + Tạo câu hỏi từ ảnh/PDF bằng AI
        </Link>
        <Link
          href="/dashboard/exams/new"
          className="rounded-lg border border-zinc-300 bg-white px-5 py-3 text-zinc-900 text-sm font-medium hover:bg-zinc-50"
        >
          + Tạo đề thi mới
        </Link>
      </div>
    </div>
  );
}
