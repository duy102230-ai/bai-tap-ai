export type QuestionForGrading = {
  id: string;
  type: string;
  content: string;
  options: string | null;
  answer: string;
  explanation: string | null;
  imageUrl: string | null;
};

export type SubItemBreakdown = {
  text: string;
  correctValue: string;
  studentValue: string;
  isCorrect: boolean;
};

export type AnswerBreakdownItem = {
  questionId: string;
  type: string;
  content: string;
  options: string[] | null;
  imageUrl: string | null;
  explanation: string | null;
  gradable: boolean;
  scoreFraction: number; // 0..1, chỉ có ý nghĩa khi gradable = true
  studentAnswerDisplay: string | null;
  correctAnswerDisplay: string | null;
  subItems?: SubItemBreakdown[];
};

function findOptionText(options: string[] | null, letter: string): string | null {
  if (!options || !letter) return null;
  const found = options.find((o) => o.trim().charAt(0).toLowerCase() === letter.toLowerCase());
  return found || null;
}

export function buildAnswerBreakdown(
  questions: QuestionForGrading[],
  studentAnswers: Record<string, string>
): AnswerBreakdownItem[] {
  return questions.map((q) => {
    const options: string[] | null = q.options ? JSON.parse(q.options) : null;
    const rawStudentAnswer = studentAnswers[q.id];

    if (q.type === "true_false" && options) {
      let correctArr: string[] = [];
      let studentArr: string[] = [];
      try {
        correctArr = JSON.parse(q.answer);
      } catch {
        correctArr = [];
      }
      try {
        studentArr = JSON.parse(rawStudentAnswer || "[]");
      } catch {
        studentArr = [];
      }

      const subItems: SubItemBreakdown[] = options.map((opt, i) => ({
        text: opt,
        correctValue: correctArr[i] === "true" ? "Đúng" : "Sai",
        studentValue:
          studentArr[i] === "true" ? "Đúng" : studentArr[i] === "false" ? "Sai" : "(chưa chọn)",
        isCorrect: (studentArr[i] || "") === (correctArr[i] || ""),
      }));

      const correctCount = subItems.filter((s) => s.isCorrect).length;

      return {
        questionId: q.id,
        type: q.type,
        content: q.content,
        options,
        imageUrl: q.imageUrl,
        explanation: q.explanation,
        gradable: true,
        scoreFraction: options.length > 0 ? correctCount / options.length : 0,
        studentAnswerDisplay: null,
        correctAnswerDisplay: null,
        subItems,
      };
    }

    if (q.type === "multiple_choice") {
      const studentLetter = (rawStudentAnswer || "").trim();
      const correctLetter = q.answer.trim();
      const isCorrect =
        studentLetter.toLowerCase() === correctLetter.toLowerCase() && studentLetter !== "";

      return {
        questionId: q.id,
        type: q.type,
        content: q.content,
        options,
        imageUrl: q.imageUrl,
        explanation: q.explanation,
        gradable: true,
        scoreFraction: isCorrect ? 1 : 0,
        studentAnswerDisplay: studentLetter
          ? findOptionText(options, studentLetter) || studentLetter
          : "(chưa chọn)",
        correctAnswerDisplay: findOptionText(options, correctLetter) || correctLetter,
      };
    }

    if (q.type === "fill_blank") {
      const studentAnswer = (rawStudentAnswer || "").trim();
      const isCorrect =
        studentAnswer.toLowerCase() === q.answer.trim().toLowerCase() && studentAnswer !== "";

      return {
        questionId: q.id,
        type: q.type,
        content: q.content,
        options,
        imageUrl: q.imageUrl,
        explanation: q.explanation,
        gradable: true,
        scoreFraction: isCorrect ? 1 : 0,
        studentAnswerDisplay: studentAnswer || "(chưa trả lời)",
        correctAnswerDisplay: q.answer,
      };
    }

    // essay — không tự chấm được, chỉ hiển thị để đối chiếu
    return {
      questionId: q.id,
      type: q.type,
      content: q.content,
      options,
      imageUrl: q.imageUrl,
      explanation: q.explanation,
      gradable: false,
      scoreFraction: 0,
      studentAnswerDisplay: (rawStudentAnswer || "").trim() || "(chưa trả lời)",
      correctAnswerDisplay: q.answer,
    };
  });
}
