import Link from "next/link";

const features = [
  { icon: "📸", title: "Upload đề bài", desc: "Chụp ảnh hoặc PDF đề bài có sẵn" },
  { icon: "✨", title: "AI sinh câu hỏi", desc: "Tự động tạo trắc nghiệm, đúng/sai" },
  { icon: "📝", title: "Học sinh làm bài", desc: "Làm online, chấm điểm ngay lập tức" },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-gradient-to-b from-blue-50 via-white to-white font-sans">
      <main className="flex flex-col items-center gap-8 text-center px-6 py-24 sm:py-32 max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
          📚 Trợ lý AI cho giáo viên
        </span>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Tạo bài tập &amp; đề thi{" "}
          <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
            bằng AI
          </span>
        </h1>

        <p className="max-w-md text-lg text-slate-600">
          Upload ảnh/PDF đề bài, AI tự động sinh câu hỏi. Lưu vào ngân hàng câu hỏi,
          tạo đề, học sinh làm bài online và tự động chấm điểm.
        </p>

        <Link
          href="/login"
          className="rounded-full bg-blue-600 px-8 py-3.5 text-white font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-700/30 transition-all"
        >
          Bắt đầu miễn phí →
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="font-semibold text-slate-900 text-sm">{f.title}</p>
              <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
