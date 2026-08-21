import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const teacherId = await getSessionTeacherId();
  if (!teacherId) redirect("/login");

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-7">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-base shadow-sm shadow-blue-600/30">
                📚
              </span>
              Bài tập AI
            </Link>
            <Link
              href="/dashboard/questions"
              className="text-sm font-medium text-slate-600 hover:text-blue-700"
            >
              Ngân hàng câu hỏi
            </Link>
            <Link
              href="/dashboard/exams"
              className="text-sm font-medium text-slate-600 hover:text-blue-700"
            >
              Đề thi
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm text-slate-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {teacher?.name?.charAt(0).toUpperCase() || "?"}
              </span>
              {teacher?.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
