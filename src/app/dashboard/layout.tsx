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
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold text-zinc-900">
              📚 Bài tập AI
            </Link>
            <Link href="/dashboard/questions" className="text-sm text-zinc-600 hover:text-zinc-900">
              Ngân hàng câu hỏi
            </Link>
            <Link href="/dashboard/exams" className="text-sm text-zinc-600 hover:text-zinc-900">
              Đề thi
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600">{teacher?.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
