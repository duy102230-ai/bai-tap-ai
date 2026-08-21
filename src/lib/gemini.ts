import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

export type GeneratedQuestion = {
  type: "multiple_choice" | "essay" | "fill_blank" | "true_false";
  content: string;
  options?: string[];
  answer: string;
  explanation?: string;
  hasVisual?: boolean;
  visualPage?: number;
};

const SYSTEM_PROMPT = `Bạn là trợ lý giáo dục. Nhiệm vụ: đọc nội dung đề bài/bài học trong ảnh hoặc PDF được cung cấp,
sau đó trích xuất hoặc soạn lại thành danh sách câu hỏi trắc nghiệm (multiple_choice), tự luận ngắn (essay), điền khuyết (fill_blank),
hoặc câu hỏi Đúng/Sai kiểu THPT mới (true_false).

Yêu cầu chung:
- Nếu đề gốc đã có câu hỏi sẵn, hãy trích xuất chính xác nội dung và xác định đáp án đúng dựa vào nội dung.
- Nếu không xác định được đáp án đúng chắc chắn, hãy suy luận dựa trên kiến thức chuẩn của môn học.
- Luôn có "explanation" giải thích ngắn gọn vì sao đáp án đó đúng.
- field "hasVisual": đặt là true nếu câu hỏi PHỤ THUỘC vào một hình ảnh/đồ thị/bảng biến thiên/hình vẽ trong đề gốc mà học sinh BẮT BUỘC phải nhìn thấy hình đó mới trả lời được (ví dụ đề ghi "như hình vẽ", "theo đồ thị sau", "bảng biến thiên sau đây"). Đặt false nếu câu hỏi chỉ cần đọc chữ là đủ, không cần xem hình.
- field "visualPage": CHỈ áp dụng khi nguồn là file PDF nhiều trang và "hasVisual" là true — ghi số trang (bắt đầu từ 1) trong file PDF gốc nơi hình ảnh/đồ thị đó xuất hiện, để hệ thống có thể mở đúng trang cho học sinh xem. Nếu nguồn là ảnh đơn hoặc không có hasVisual, bỏ qua field này.

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
    "explanation": "...",
    "hasVisual": false
  },
  {
    "type": "true_false",
    "content": "...",
    "options": ["a) ...", "b) ...", "c) ...", "d) ..."],
    "answer": "[\\"true\\",\\"false\\",\\"true\\",\\"false\\"]",
    "explanation": "...",
    "hasVisual": true,
    "visualPage": 2
  }
]`;

const MAX_ATTACH_BYTES = 4 * 1024 * 1024; // 4MB — giới hạn để không làm đầy database free tier

export type GenerateResult = {
  questions: GeneratedQuestion[];
  sourceImage: string | null;
  sourceIsPdf: boolean;
};

export async function generateQuestionsFromFile(
  fileBuffer: Buffer,
  mimeType: string
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Chưa cấu hình GEMINI_API_KEY trong .env.local. Vui lòng thêm API key trước khi dùng tính năng AI."
    );
  }

  let inputBuffer = fileBuffer;
  let inputMimeType = mimeType;
  let sourceImage: string | null = null;
  const sourceIsPdf = mimeType === "application/pdf";

  if (mimeType.startsWith("image/")) {
    const resized = await sharp(fileBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 78 })
      .toBuffer();
    inputBuffer = resized;
    inputMimeType = "image/jpeg";
    sourceImage = `data:image/jpeg;base64,${resized.toString("base64")}`;
  } else if (sourceIsPdf && fileBuffer.length <= MAX_ATTACH_BYTES) {
    sourceImage = `data:application/pdf;base64,${fileBuffer.toString("base64")}`;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const paraphraseNote = `\n\nLƯU Ý THÊM: Đừng sao chép nguyên văn từng chữ từ tài liệu gốc — hãy diễn đạt lại nội dung câu hỏi và đáp án bằng lời văn của riêng bạn (giữ nguyên ý nghĩa và đáp án đúng) để tránh trùng khớp với tài liệu có bản quyền.`;

  let text: string;
  try {
    const result = await model.generateContent([
      SYSTEM_PROMPT,
      { inlineData: { data: inputBuffer.toString("base64"), mimeType: inputMimeType } },
    ]);
    text = result.response.text().trim();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("RECITATION")) throw err;

    // Nội dung trùng khớp tài liệu có bản quyền — thử lại 1 lần, yêu cầu AI diễn đạt lại thay vì sao chép nguyên văn
    try {
      const retryResult = await model.generateContent([
        SYSTEM_PROMPT + paraphraseNote,
        { inlineData: { data: inputBuffer.toString("base64"), mimeType: inputMimeType } },
      ]);
      text = retryResult.response.text().trim();
    } catch {
      throw new Error(
        "AI từ chối xử lý vì nội dung ảnh/PDF trùng khớp với tài liệu có bản quyền đã xuất bản (đề thi/sách phổ biến trên mạng). Anh thử lại, hoặc dùng ảnh chụp khác/phần đề khác."
      );
    }
  }

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

  return { questions: parsed, sourceImage, sourceIsPdf };
}
