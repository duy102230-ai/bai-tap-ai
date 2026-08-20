import { NextRequest, NextResponse } from "next/server";
import { getSessionTeacherId } from "@/lib/auth";
import { generateQuestionsFromFile } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const teacherId = await getSessionTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Vui lòng chọn file ảnh hoặc PDF." }, { status: 400 });
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Chỉ hỗ trợ file ảnh (PNG/JPEG/WEBP) hoặc PDF." },
      { status: 400 }
    );
  }

  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "File tối đa 15MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const questions = await generateQuestionsFromFile(buffer, file.type);
    return NextResponse.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định khi gọi AI.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
