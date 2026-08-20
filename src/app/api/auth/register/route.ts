import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 });
  }

  const existing = await prisma.teacher.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email đã được đăng ký." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const teacher = await prisma.teacher.create({
    data: { email, password: hashed, name },
  });

  await createSession(teacher.id);

  return NextResponse.json({ id: teacher.id, email: teacher.email, name: teacher.name });
}
