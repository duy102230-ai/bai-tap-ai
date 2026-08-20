"use client";

type Question = {
  id: string;
  subject: string;
  topic: string | null;
  type: string;
  content: string;
  options: string | null;
  answer: string;
  createdAt: string;
};

const typeLabel: Record<string, string> = {
  multiple_choice: "Trắc nghiệm",
  essay: "Tự luận",
  fill_blank: "Điền khuyết",
  true_false: "Đúng/Sai",
};

function parseTrueFalseAnswer(answer: string): string[] {
  try {
    const arr = JSON.parse(answer);
    if (Array.isArray(arr)) return arr.map((v) => String(v));
  } catch {
    // fall through
  }
  return [];
}

export default function QuestionList({ questions }: { questions: Question[] }) {
  if (questions.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Chưa có câu hỏi nào trong ngân hàng. Upload ảnh/PDF ở trên để AI sinh câu hỏi.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => {
        const options: string[] | null = q.options ? JSON.parse(q.options) : null;
        return (
          <div key={q.id} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium text-zinc-500 uppercase">
                {typeLabel[q.type] || q.type}
              </span>
              <span className="text-xs text-zinc-400">·</span>
              <span className="text-xs text-zinc-500">{q.subject}</span>
              {q.topic && (
                <>
                  <span className="text-xs text-zinc-400">·</span>
                  <span className="text-xs text-zinc-500">{q.topic}</span>
                </>
              )}
            </div>
            <p className="text-sm text-zinc-900 mb-1.5">{q.content}</p>
            {q.type === "true_false" && options ? (
              <ul className="text-sm text-zinc-600 mb-1.5 space-y-0.5">
                {options.map((opt, i) => {
                  const answers = parseTrueFalseAnswer(q.answer);
                  const isTrue = answers[i] === "true";
                  return (
                    <li key={i} className="flex items-center gap-2">
                      <span>{opt}</span>
                      <span className={isTrue ? "text-green-700 text-xs" : "text-red-600 text-xs"}>
                        {isTrue ? "Đúng" : "Sai"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <>
                {options && (
                  <ul className="text-sm text-zinc-600 mb-1.5 space-y-0.5">
                    {options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-green-700">Đáp án: {q.answer}</p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
