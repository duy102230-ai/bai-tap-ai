import { GoogleGenerativeAI } from "@google/generative-ai";

export type GeneratedQuestion = {
  type: "multiple_choice" | "essay" | "fill_blank" | "true_false";
  content: string;
  options?: string[];
  answer: string;
  explanation?: string;
};

const SYSTEM_PROMPT = `Bạn là trợ lý giáo dục. Nhiệm vụ: đọc nội dung đề bài/bài học trong ảnh hoặc PDF được cung cấp,
sau đó trích xuất hoặc soạn lại thành danh sách câu hỏi trắc nghiệm (multiple_choice), tự luận ngắn (essay), điền khuyết (fill_blank),
hoặc câu hỏi Đúng/Sai kiểu THPT mới (true_false).

Yêu cầu chung:
- Nếu đề gốc đã có câu hỏi sẵn, hãy trích xuất chính xác nội dung và xác định đáp án đúng dựa vào nội dung.
- Nếu không xác định được đáp án đúng chắc chắn, hãy suy luận dựa trên kiến thức chuẩn của môn học.
- Luôn có "explanation" giải thích ngắn gọn vì sao đáp án đó đúng.

Quy tắc theo từng loại:
- multiple_choice: field "options" là mảng 4 chuỗi dạng "A. nội dung", "B. nội dung", ...; field "answer" chỉ chứa chữ cái đúng (vd "A").
- essay / fill_blank: field "answer" là đáp án mẫu ngắn gọn, không cần "options".
- true_false: dùng khi đề có 1 câu hỏi/tình huống chính kèm 4 mệnh đề nhỏ a, b, c, d mà học sinh phải xác định từng mệnh đề Đúng hay Sai (thường gặp ở đề Toán/Lý/Hóa THPT mới).
  + field "content" là nội dung câu hỏi/tình huống chính.
  + field "options" là mảng đúng 4 chuỗi mệnh đề dạng "a) nội dung", "b) nội dung", "c) nội dung", "d) nội dung".
  + field "answer" là một chuỗi JSON của mảng 4 giá trị "true"/"false" tương ứng theo thứ tự a,b,c,d, ví dụ: "[\\"true\\",\\"false\\",\\"true\\",\\"false\\"]".

- QUAN TRỌNG: TUYỆT ĐỐI KHÔNG dùng cú pháp LaTeX (không dùng dấu $, \\infty, \\neq, \\frac, ^, _, v.v.). Toàn bộ công thức toán phải viết bằng ký hiệu Unicode thông thường có thể đọc trực tiếp, ví dụ: dùng "∞" thay vì "\\infty", "≠" thay vì "\\neq", "≤" "≥" "±" "√" "π" thay cho ký hiệu LaTeX tương ứng, số mũ viết dạng "x²" hoặc "x^2" bằng chữ thường (không dùng dấu ^), phân số viết dạng "a/b".

Trả về DUY NHẤT một JSON array hợp lệ, không kèm markdown, không kèm giải thích ngoài JSON, theo đúng cấu trúc:
[
  {
    "type": "multiple_choice",
    "content": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": "A",
    "explanation": "..."
  },
  {
    "type": "true_false",
    "content": "...",
    "options": ["a) ...", "b) ...", "c) ...", "d) ..."],
    "answer": "[\\"true\\",\\"false\\",\\"true\\",\\"false\\"]",
    "explanation": "..."
  }
]`;

export async function generateQuestionsFromFile(
  fileBuffer: Buffer,
  mimeType: string
): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Chưa cấu hình GEMINI_API_KEY trong .env.local. Vui lòng thêm API key trước khi dùng tính năng AI."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const result = await model.generateContent([
    SYSTEM_PROMPT,
    {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType,
      },
    },
  ]);

  const text = result.response.text().trim();
  const jsonText = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: GeneratedQuestion[];
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("AI trả về dữ liệu không đúng định dạng JSON. Vui lòng thử lại.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("AI trả về dữ liệu không đúng định dạng danh sách câu hỏi.");
  }

  return parsed;
}
