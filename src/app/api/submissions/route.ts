import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAnswerBreakdown } from "@/lib/grade";

export async function POST(req: NextRequest) {
  const { shareCode, studentName, answers } = await req.json();

  if (!shareCode || !studentName || !answers) {
    return NextResponse.json({ error: "Thiếu thông tin bài làm." }, { status: 400 });
  }

  const exam = await prisma.exam.findUnique({
    where: { shareCode },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { question: true },
      },
    },
  });

  if (!exam) {
    return NextResponse.json({ error: "Không tìm thấy đề thi." }, { status: 404 });
  }

  const questions = exam.questions.map((eq) => eq.question);
  const breakdown = buildAnswerBreakdown(questions, answers);

  const gradableItems = breakdown.filter((b) => b.gradable);
  const totalPoints = gradableItems.length;
  const score = Math.round(gradableItems.reduce((sum, b) => sum + b.scoreFraction, 0) * 100) / 100;

  const submission = await prisma.submission.create({
    data: {
      examId: exam.id,
      studentName,
      answers: JSON.stringify(answers),
      score,
      totalPoints,
    },
  });

  return NextResponse.json({
    submissionId: submission.id,
    score,
    totalPoints,
    breakdown,
  });
}
