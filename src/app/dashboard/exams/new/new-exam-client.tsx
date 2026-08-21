"use client";

import { useState } from "react";
import QuestionGenerator, { type SavedQuestion } from "../../questions/generator";
import ExamForm from "./exam-form";

type Question = {
  id: string;
  subject: string;
  grade: string | null;
  topic: string | null;
  type: string;
  content: string;
  options: string | null;
  imageUrl: string | null;
};

export default function NewExamClient({ initialQuestions }: { initialQuestions: Question[] }) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [newlyAddedIds, setNewlyAddedIds] = useState<string[]>([]);
  const [newlyAddedNonce, setNewlyAddedNonce] = useState(0);
  const [showUpload, setShowUpload] = useState(false);

  function handleSaved(created: SavedQuestion[]) {
    setQuestions((prev) => [...created, ...prev]);
    setNewlyAddedIds(created.map((c) => c.id));
    setNewlyAddedNonce((n) => n + 1);
    setShowUpload(false);
  }

  return (
    <div>
      {!showUpload ? (
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="min-h-[44px] mb-6 rounded-full border border-blue-300 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-all"
        >
          + Upload ảnh/PDF để sinh câu hỏi mới cho đề này
        </button>
      ) : (
        <div className="mb-6">
          <QuestionGenerator onSaved={handleSaved} />
          <button
            type="button"
            onClick={() => setShowUpload(false)}
            className="text-sm text-slate-500 hover:underline"
          >
            Ẩn phần upload
          </button>
        </div>
      )}

      <ExamForm
        questions={questions}
        newlyAddedIds={newlyAddedIds}
        newlyAddedNonce={newlyAddedNonce}
      />
    </div>
  );
}
