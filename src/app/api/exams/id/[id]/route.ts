import { NextRequest, NextResponse } from "next/server";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacherId = await getSessionTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!exam || exam.teacherId !== teacherId) {
    return NextResponse.json({ error: "Không tìm thấy đề thi." }, { status: 404 });
  }

  return NextResponse.json({ exam });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacherId = await getSessionTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.exam.findUnique({ where: { id } });
  if (!existing || existing.teacherId !== teacherId) {
    return NextResponse.json({ error: "Không tìm thấy đề thi." }, { status: 404 });
  }

  const body = await req.json();
  const { title, description, durationMinutes, questionIds } = body as {
    title?: string;
    description?: string | null;
    durationMinutes?: number | null;
    questionIds?: string[];
  };

  if (questionIds && questionIds.length === 0) {
    return NextResponse.json({ error: "Đề thi cần ít nhất 1 câu hỏi." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.exam.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(durationMinutes !== undefined && { durationMinutes: durationMinutes || null }),
      },
    });

    if (questionIds) {
      await tx.examQuestion.deleteMany({ where: { examId: id } });
      await tx.examQuestion.createMany({
        data: questionIds.map((questionId, index) => ({
          examId: id,
          questionId,
          order: index,
        })),
      });
    }
  });

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ exam });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacherId = await getSessionTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.exam.findUnique({ where: { id } });
  if (!existing || existing.teacherId !== teacherId) {
    return NextResponse.json({ error: "Không tìm thấy đề thi." }, { status: 404 });
  }

  await prisma.exam.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
