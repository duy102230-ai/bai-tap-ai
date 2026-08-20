import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TakeExam from "./take-exam";

export default async function ExamTakingPage({
  params,
}: {
  params: Promise<{ shareCode: string }>;
}) {
  const { shareCode } = await params;

  const exam = await prisma.exam.findUnique({
    where: { shareCode },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { question: true },
      },
    },
  });

  if (!exam || !exam.isPublished) notFound();

  const questions = exam.questions.map((eq) => ({
    id: eq.question.id,
    type: eq.question.type,
    content: eq.question.content,
    options: eq.question.options ? (JSON.parse(eq.question.options) as string[]) : null,
  }));

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-2xl">
        <TakeExam
          shareCode={shareCode}
          title={exam.title}
          description={exam.description}
          questions={questions}
        />
      </div>
    </div>
  );
}
