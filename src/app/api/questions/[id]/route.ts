import { NextRequest, NextResponse } from "next/server";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacherId = await getSessionTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing || existing.teacherId !== teacherId) {
    return NextResponse.json({ error: "Không tìm thấy câu hỏi." }, { status: 404 });
  }

  const body = await req.json();
  const { subject, topic, content, options, answer, explanation } = body;

  const question = await prisma.question.update({
    where: { id },
    data: {
      ...(subject !== undefined && { subject }),
      ...(topic !== undefined && { topic: topic || null }),
      ...(content !== undefined && { content }),
      ...(options !== undefined && { options: options ? JSON.stringify(options) : null }),
      ...(answer !== undefined && { answer }),
      ...(explanation !== undefined && { explanation: explanation || null }),
    },
  });

  return NextResponse.json({ question });
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
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing || existing.teacherId !== teacherId) {
    return NextResponse.json({ error: "Không tìm thấy câu hỏi." }, { status: 404 });
  }

  await prisma.question.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
