"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: "🏠" },
  { href: "/dashboard/questions", label: "Ngân hàng câu hỏi", icon: "📖" },
  { href: "/dashboard/exams", label: "Đề thi", icon: "📝" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col bg-blue-950 text-blue-100 min-h-screen sticky top-0">
      <Link href="/dashboard" className="flex items-center gap-3 px-6 py-6 font-extrabold text-lg text-white">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl shadow-sm shadow-blue-900/50">
          📚
        </span>
        Bài tập AI
      </Link>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-blue-200 hover:bg-blue-900/60 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
