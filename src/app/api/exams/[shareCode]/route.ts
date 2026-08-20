import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareCode: string }> }
) {
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

  if (!exam || !exam.isPublished) {
    return NextResponse.json({ error: "Không tìm thấy đề thi." }, { status: 404 });
  }

  // Ẩn đáp án/giải thích khỏi học sinh
  const questions = exam.questions.map((eq) => ({
    id: eq.question.id,
    type: eq.question.type,
    content: eq.question.content,
    options: eq.question.options ? JSON.parse(eq.question.options) : null,
    imageUrl: eq.question.imageUrl?.startsWith("data:") ? eq.question.imageUrl : null,
  }));

  return NextResponse.json({
    id: exam.id,
    title: exam.title,
    description: exam.description,
    questions,
  });
}
