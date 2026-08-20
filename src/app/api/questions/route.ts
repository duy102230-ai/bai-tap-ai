import { NextRequest, NextResponse } from "next/server";
import { getSessionTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const teacherId = await getSessionTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const subject = req.nextUrl.searchParams.get("subject");

  const questions = await prisma.question.findMany({
    where: { teacherId, ...(subject ? { subject } : {}) },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  const teacherId = await getSessionTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json();
  const { subject, topic, type, content, options, answer, explanation } = body;

  if (!subject || !type || !content || !answer) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 });
  }

  const question = await prisma.question.create({
    data: {
      teacherId,
      subject,
      topic: topic || null,
      type,
      content,
      options: options ? JSON.stringify(options) : null,
      answer,
      explanation: explanation || null,
    },
  });

  return NextResponse.json({ question });
}
