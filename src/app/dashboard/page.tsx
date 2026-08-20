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
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Tổng quan</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg">
              📖
            </span>
            <p className="text-sm text-slate-500">Câu hỏi trong ngân hàng</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{questionCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-lg">
              📝
            </span>
            <p className="text-sm text-slate-500">Đề thi đã tạo</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{examCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/dashboard/questions"
          className="rounded-full bg-blue-600 px-5 py-3 text-white text-sm font-semibold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
        >
          + Tạo câu hỏi từ ảnh/PDF bằng AI
        </Link>
        <Link
          href="/dashboard/exams/new"
          className="rounded-full border border-slate-300 bg-white px-5 py-3 text-slate-900 text-sm font-semibold hover:bg-blue-50 hover:border-blue-200 transition-all"
        >
          + Tạo đề thi mới
        </Link>
      </div>
    </div>
  );
}
