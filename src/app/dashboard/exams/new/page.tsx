import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExamForm from "./exam-form";

export default async function NewExamPage() {
  const teacherId = await getSessionTeacherId();
  const questions = await prisma.question.findMany({
    where: { teacherId: teacherId! },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Tạo đề thi mới</h1>
      <ExamForm questions={questions} />
    </div>
  );
}
