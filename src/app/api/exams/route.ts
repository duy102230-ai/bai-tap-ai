import { NextRequest, NextResponse } from "next/server";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function GET() {
  const teacherId = await getSessionTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const exams = await prisma.exam.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, submissions: true } } },
  });

  return NextResponse.json({ exams });
}

export async function POST(req: NextRequest) {
  const teacherId = await getSessionTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { title, description, durationMinutes, questionIds } = await req.json();

  if (!title || !Array.isArray(questionIds) || questionIds.length === 0) {
    return NextResponse.json({ error: "Thiếu tiêu đề hoặc danh sách câu hỏi." }, { status: 400 });
  }

  const shareCode = nanoid(8);

  const exam = await prisma.exam.create({
    data: {
      teacherId,
      title,
      description: description || null,
      durationMinutes: durationMinutes || null,
      shareCode,
      isPublished: true,
      questions: {
        create: questionIds.map((questionId: string, index: number) => ({
          questionId,
          order: index,
        })),
      },
    },
  });

  return NextResponse.json({ exam });
}
