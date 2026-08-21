import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAnswerBreakdown } from "@/lib/grade";
import AnswerReview from "@/components/answer-review";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;
  const teacherId = await getSessionTeacherId();

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { question: true },
      },
    },
  });

  if (!exam || exam.teacherId !== teacherId) notFound();

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.examId !== exam.id) notFound();

  const questions = exam.questions.map((eq) => eq.question);
  const answers = JSON.parse(submission.answers) as Record<string, string>;
  const breakdown = buildAnswerBreakdown(questions, answers);

  return (
    <div>
      <Link href={`/dashboard/exams/${id}`} className="text-sm text-blue-600 hover:underline">
        ← Quay lại kết quả đề thi
      </Link>

      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{submission.studentName}</h1>
          <p className="text-sm text-slate-500">
            Nộp lúc {submission.submittedAt.toLocaleString("vi-VN")}
          </p>
        </div>
        <p className="text-2xl font-bold text-blue-600">
          {submission.score}/{submission.totalPoints}
        </p>
      </div>

      <AnswerReview items={breakdown} />
    </div>
  );
}
