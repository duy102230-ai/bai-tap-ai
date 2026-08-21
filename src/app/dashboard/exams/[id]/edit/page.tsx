import { notFound } from "next/navigation";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExamForm from "../../new/exam-form";

export default async function EditExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teacherId = await getSessionTeacherId();

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!exam || exam.teacherId !== teacherId) notFound();

  const questions = await prisma.question.findMany({
    where: { teacherId: teacherId! },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">Sửa đề thi</h1>
      <ExamForm
        questions={questions}
        examId={exam.id}
        initialTitle={exam.title}
        initialDescription={exam.description || ""}
        initialDurationMinutes={exam.durationMinutes}
        initialSelectedIds={exam.questions.map((eq) => eq.questionId)}
      />
    </div>
  );
}
