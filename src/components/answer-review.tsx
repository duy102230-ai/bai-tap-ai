"use client";

import AttachedMedia from "@/components/attached-media";

export type AnswerBreakdownItem = {
  questionId: string;
  type: string;
  content: string;
  options: string[] | null;
  imageUrl: string | null;
  explanation: string | null;
  gradable: boolean;
  scoreFraction: number;
  studentAnswerDisplay: string | null;
  correctAnswerDisplay: string | null;
  subItems?: {
    text: string;
    correctValue: string;
    studentValue: string;
    isCorrect: boolean;
  }[];
};

export default function AnswerReview({ items }: { items: AnswerBreakdownItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isFullyCorrect = item.gradable && item.scoreFraction === 1;
        const isPartlyCorrect = item.gradable && item.scoreFraction > 0 && item.scoreFraction < 1;

        return (
          <div
            key={item.questionId}
            className={`rounded-xl border p-4 text-left ${
              !item.gradable
                ? "border-slate-200 bg-white"
                : isFullyCorrect
                ? "border-green-200 bg-green-50"
                : isPartlyCorrect
                ? "border-amber-200 bg-amber-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-lg leading-none">
                {!item.gradable ? "✍️" : isFullyCorrect ? "✅" : isPartlyCorrect ? "⚠️" : "❌"}
              </span>
              <p className="text-sm font-medium text-slate-900">
                Câu {i + 1}. {item.content}
              </p>
            </div>

            <AttachedMedia url={item.imageUrl} className="max-w-full mb-2" />

            {item.subItems ? (
              <ul className="text-sm space-y-1">
                {item.subItems.map((s, si) => (
                  <li key={si} className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-700">{s.text}</span>
                    <span
                      className={`text-xs font-medium ${
                        s.isCorrect ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      Em chọn: {s.studentValue} {s.isCorrect ? "" : `(đúng: ${s.correctValue})`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm space-y-1">
                <p className="text-slate-700">
                  <span className="text-slate-500">Câu trả lời của em: </span>
                  {item.studentAnswerDisplay}
                </p>
                {item.gradable && !isFullyCorrect && (
                  <p className="text-green-700">
                    <span className="text-slate-500">Đáp án đúng: </span>
                    {item.correctAnswerDisplay}
                  </p>
                )}
                {!item.gradable && (
                  <p className="text-slate-500 text-xs">Câu tự luận — giáo viên chấm thủ công.</p>
                )}
              </div>
            )}

            {item.explanation && (
              <p className="text-xs text-slate-500 mt-2">💡 {item.explanation}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
