import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewExamClient from "./new-exam-client";

export default async function NewExamPage() {
  const teacherId = await getSessionTeacherId();
  const questions = await prisma.question.findMany({
    where: { teacherId: teacherId! },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Tạo đề thi mới</h1>
      <NewExamClient initialQuestions={questions} />
    </div>
  );
}
