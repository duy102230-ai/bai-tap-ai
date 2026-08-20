import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QuestionGenerator from "./generator";
import QuestionList from "./question-list";

export default async function QuestionsPage() {
  const teacherId = await getSessionTeacherId();
  const questions = await prisma.question.findMany({
    where: { teacherId: teacherId! },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Ngân hàng câu hỏi</h1>

      <QuestionGenerator />

      <h2 className="text-lg font-semibold text-zinc-900 mb-3">
        Tất cả câu hỏi ({questions.length})
      </h2>
      <QuestionList
        questions={questions.map((q) => ({ ...q, createdAt: q.createdAt.toISOString() }))}
      />
    </div>
  );
}
