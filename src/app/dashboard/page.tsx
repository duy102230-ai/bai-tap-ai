import Link from "next/link";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MiniLineChart from "@/components/mini-line-chart";
import MiniDonutChart from "@/components/mini-donut-chart";

function dayLabel(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const teacherId = await getSessionTeacherId();

  const [teacher, questionCount, examCount, submissions, recentExams] = await Promise.all([
    prisma.teacher.findUnique({ where: { id: teacherId! } }),
    prisma.question.count({ where: { teacherId: teacherId! } }),
    prisma.exam.count({ where: { teacherId: teacherId! } }),
    prisma.submission.findMany({
      where: { exam: { teacherId: teacherId! } },
      include: { exam: { select: { title: true } } },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.exam.findMany({
      where: { teacherId: teacherId! },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { _count: { select: { questions: true, submissions: true } } },
    }),
  ]);

  const gradableSubmissions = submissions.filter((s) => (s.totalPoints ?? 0) > 0);
  const totalSubmissions = submissions.length;
  const avgPercent =
    gradableSubmissions.length > 0
      ? Math.round(
          (gradableSubmissions.reduce((sum, s) => sum + (s.score ?? 0) / (s.totalPoints ?? 1), 0) /
            gradableSubmissions.length) *
            100
        )
      : 0;

  // Điểm trung bình theo ngày, 7 ngày gần nhất
  const today = new Date();
  const last7Days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const byDay = new Map<string, { sum: number; count: number }>();
  for (const s of gradableSubmissions) {
    const key = dateKey(s.submittedAt);
    const entry = byDay.get(key) || { sum: 0, count: 0 };
    entry.sum += ((s.score ?? 0) / (s.totalPoints ?? 1)) * 100;
    entry.count += 1;
    byDay.set(key, entry);
  }
  const chartPoints = last7Days.map((d) => {
    const entry = byDay.get(dateKey(d));
    return { label: dayLabel(d), value: entry ? Math.round(entry.sum / entry.count) : 0 };
  });

  // Phân bố điểm số
  const buckets = [
    { label: "Giỏi (≥80%)", min: 80, color: "#2563eb" },
    { label: "Khá (65-79%)", min: 65, color: "#16a34a" },
    { label: "Trung bình (50-64%)", min: 50, color: "#f59e0b" },
    { label: "Yếu (35-49%)", min: 35, color: "#7c3aed" },
    { label: "Kém (<35%)", min: 0, color: "#dc2626" },
  ];
  const donutSegments = buckets.map((b, i) => {
    const upper = i === 0 ? 101 : buckets[i - 1].min;
    const count = gradableSubmissions.filter((s) => {
      const pct = ((s.score ?? 0) / (s.totalPoints ?? 1)) * 100;
      return pct >= b.min && pct < upper;
    }).length;
    return { label: b.label, value: count, color: b.color };
  });

  const recentActivity = submissions.slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
        Xin chào, {teacher?.name}! 👋
      </h1>
      <p className="text-sm text-slate-500 mb-6">Chúc anh/chị một ngày giảng dạy hiệu quả.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg">
              📖
            </span>
            <p className="text-sm text-slate-500">Câu hỏi trong ngân hàng</p>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{questionCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-lg">
              📝
            </span>
            <p className="text-sm text-slate-500">Đề thi đã tạo</p>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{examCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-lg">
              🎓
            </span>
            <p className="text-sm text-slate-500">Lượt học sinh nộp bài</p>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{totalSubmissions}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg">
              📈
            </span>
            <p className="text-sm text-slate-500">Điểm trung bình</p>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{avgPercent}%</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <Link
          href="/dashboard/questions"
          className="min-h-[44px] inline-flex items-center rounded-full bg-blue-600 px-5 py-3 text-white text-sm font-semibold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
        >
          + Tạo câu hỏi từ ảnh/PDF bằng AI
        </Link>
        <Link
          href="/dashboard/exams/new"
          className="min-h-[44px] inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-slate-900 text-sm font-semibold hover:bg-blue-50 hover:border-blue-200 transition-all"
        >
          + Tạo đề thi mới
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Điểm trung bình (%) — 7 ngày qua
          </h2>
          <MiniLineChart points={chartPoints} max={100} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Phân bố điểm số học sinh</h2>
          <MiniDonutChart
            segments={donutSegments}
            centerLabel="Tổng bài"
            centerValue={gradableSubmissions.length}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900">Đề thi gần đây</h2>
            <Link href="/dashboard/exams" className="text-sm text-blue-600 hover:underline">
              Xem tất cả
            </Link>
          </div>
          {recentExams.length === 0 ? (
            <p className="text-sm text-slate-400">Chưa có đề thi nào.</p>
          ) : (
            <ul className="space-y-3">
              {recentExams.map((exam) => (
                <li key={exam.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/exams/${exam.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-blue-700 truncate block"
                    >
                      {exam.title}
                    </Link>
                    <p className="text-xs text-slate-500">{exam._count.questions} câu hỏi</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-500">
                    {exam._count.submissions} bài nộp
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-3">Hoạt động gần đây</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400">Chưa có học sinh nào nộp bài.</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((s) => (
                <li key={s.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5">🎓</span>
                  <p className="text-slate-700">
                    <span className="font-medium text-slate-900">{s.studentName}</span> đã nộp bài{" "}
                    <span className="font-medium">{s.exam.title}</span> — {s.score}/{s.totalPoints}{" "}
                    điểm
                    <span className="text-xs text-slate-400 block">
                      {s.submittedAt.toLocaleString("vi-VN")}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
