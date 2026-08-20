import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Thiếu email hoặc mật khẩu." }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({ where: { email } });
  if (!teacher) {
    return NextResponse.json({ error: "Email hoặc mật khẩu không đúng." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, teacher.password);
  if (!valid) {
    return NextResponse.json({ error: "Email hoặc mật khẩu không đúng." }, { status: 401 });
  }

  await createSession(teacher.id);

  return NextResponse.json({ id: teacher.id, email: teacher.email, name: teacher.name });
}
