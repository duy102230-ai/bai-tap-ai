import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { shareCode, studentName, answers } = await req.json();

  if (!shareCode || !studentName || !answers) {
    return NextResponse.json({ error: "Thiếu thông tin bài làm." }, { status: 400 });
  }

  const exam = await prisma.exam.findUnique({
    where: { shareCode },
    include: { questions: { include: { question: true } } },
  });

  if (!exam) {
    return NextResponse.json({ error: "Không tìm thấy đề thi." }, { status: 404 });
  }

  let score = 0;
  let gradable = 0;

  for (const eq of exam.questions) {
    const q = eq.question;
    if (q.type === "multiple_choice" || q.type === "fill_blank") {
      gradable += 1;
      const studentAnswer = (answers[q.id] || "").toString().trim().toLowerCase();
      const correctAnswer = q.answer.trim().toLowerCase();
      if (studentAnswer === correctAnswer) score += 1;
    } else if (q.type === "true_false") {
      gradable += 1;
      try {
        const correctArr: string[] = JSON.parse(q.answer);
        const studentArr: string[] = JSON.parse(answers[q.id] || "[]");
        const total = correctArr.length || 1;
        let correctCount = 0;
        for (let i = 0; i < total; i++) {
          if ((studentArr[i] || "") === (correctArr[i] || "")) correctCount += 1;
        }
        score += correctCount / total;
      } catch {
        // không tính điểm nếu dữ liệu không hợp lệ
      }
    }
  }

  score = Math.round(score * 100) / 100;

  const submission = await prisma.submission.create({
    data: {
      examId: exam.id,
      studentName,
      answers: JSON.stringify(answers),
      score,
      totalPoints: gradable,
    },
  });

  return NextResponse.json({
    submissionId: submission.id,
    score,
    totalPoints: gradable,
  });
}
