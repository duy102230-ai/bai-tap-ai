import { NextRequest, NextResponse } from "next/server";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { GeneratedQuestion } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const teacherId = await getSessionTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json();
  const { subject, topic, sourceImage, sourceIsPdf, questions } = body as {
    subject: string;
    topic?: string;
    sourceImage?: string | null;
    sourceIsPdf?: boolean;
    questions: GeneratedQuestion[];
  };

  if (!subject || !Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "Thiếu môn học hoặc danh sách câu hỏi." }, { status: 400 });
  }

  const created = await prisma.$transaction(
    questions.map((q) => {
      let imageUrl: string | null = null;
      if (q.hasVisual && sourceImage) {
        imageUrl = sourceIsPdf && q.visualPage ? `${sourceImage}#page=${q.visualPage}` : sourceImage;
      }
      return prisma.question.create({
        data: {
          teacherId,
          subject,
          topic: topic || null,
          type: q.type,
          content: q.content,
          options: q.options ? JSON.stringify(q.options) : null,
          answer: q.answer,
          explanation: q.explanation || null,
          imageUrl,
        },
      });
    })
  );

  return NextResponse.json({ questions: created });
}
