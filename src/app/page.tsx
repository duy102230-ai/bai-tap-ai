import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans">
      <main className="flex flex-col items-center gap-6 text-center px-6 py-32">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          Tạo bài tập &amp; đề thi bằng AI
        </h1>
        <p className="max-w-md text-lg text-zinc-600">
          Upload ảnh/PDF đề bài, AI tự động sinh câu hỏi trắc nghiệm. Lưu vào
          ngân hàng câu hỏi, tạo đề, học sinh làm bài online và tự động chấm điểm.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-full bg-zinc-900 px-6 py-3 text-white font-medium hover:bg-zinc-700"
          >
            Đăng nhập / Đăng ký
          </Link>
        </div>
      </main>
    </div>
  );
}
