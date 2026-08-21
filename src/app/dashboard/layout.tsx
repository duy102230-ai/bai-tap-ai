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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <nav className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-3 font-extrabold text-lg text-slate-900">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl shadow-sm shadow-blue-600/30">
                📚
              </span>
              Bài tập AI
            </Link>
            <Link
              href="/dashboard/questions"
              className="text-base font-medium text-slate-600 hover:text-blue-700"
            >
              Ngân hàng câu hỏi
            </Link>
            <Link
              href="/dashboard/exams"
              className="text-base font-medium text-slate-600 hover:text-blue-700"
            >
              Đề thi
            </Link>
          </nav>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2.5 text-base text-slate-600">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
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
