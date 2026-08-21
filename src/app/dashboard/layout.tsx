import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./logout-button";
import Sidebar from "./sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const teacherId = await getSessionTeacherId();
  if (!teacherId) redirect("/login");

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });

  return (
    <div className="flex flex-1 bg-slate-50">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between px-4 sm:px-8 py-4">
            <Link href="/dashboard" className="flex md:hidden items-center gap-2 font-extrabold text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg">
                📚
              </span>
              Bài tập AI
            </Link>
            <nav className="hidden md:flex" />
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2.5 text-sm sm:text-base text-slate-600">
                <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {teacher?.name?.charAt(0).toUpperCase() || "?"}
                </span>
                <span className="hidden sm:inline">{teacher?.name}</span>
              </span>
              <LogoutButton />
            </div>
          </div>
          <nav className="flex md:hidden items-center gap-5 overflow-x-auto px-4 pb-3 text-sm font-medium text-slate-600">
            <Link href="/dashboard" className="whitespace-nowrap hover:text-blue-700">
              Tổng quan
            </Link>
            <Link href="/dashboard/questions" className="whitespace-nowrap hover:text-blue-700">
              Ngân hàng câu hỏi
            </Link>
            <Link href="/dashboard/exams" className="whitespace-nowrap hover:text-blue-700">
              Đề thi
            </Link>
          </nav>
        </header>
        <main className="flex-1 px-4 sm:px-8 py-8 max-w-6xl w-full mx-auto md:mx-0">{children}</main>
      </div>
    </div>
  );
}
