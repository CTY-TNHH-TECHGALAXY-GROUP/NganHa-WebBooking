// /api/chat/route.ts - Gemini AI chat endpoint for ORIA SPA
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const fetchSystemSettings = async () => {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from('WebBookingContent').select('value').eq('key', 'system_settings').single();
    return data?.value || {};
  } catch (e) {
    return {};
  }
};

// Language instruction templates
const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  vi: 'Trả lời bằng tiếng Việt. Dùng giọng văn thân thiện, lịch sự như nhân viên spa chuyên nghiệp.',
  en: 'Reply in English. Use a friendly, professional spa receptionist tone.',
  cn: '用中文回答。使用友好、专业的水疗接待员语气。',
  jp: '日本語で返答してください。フレンドリーでプロフェッショナルなスパ受付の口調を使ってください。',
  kr: '한국어로 답변해 주세요. 친절하고 전문적인 스파 안내원의 어조를 사용하세요.',
};

const buildSystemPrompt = (locale: string, systemSettings: any): string => {
  const langInstruction = LANGUAGE_INSTRUCTIONS[locale] || LANGUAGE_INSTRUCTIONS.vi;
  
  const phone = systemSettings?.phone || '0123.456.789';
  const mapsUrl = systemSettings?.googleMaps || 'https://maps.app.goo.gl/8XBkjsJicXqdNsZk7';
  const hours = systemSettings?.hours || '9:00 AM - 12:00 AM (Last order 11:30 PM)';

  const SPA_KNOWLEDGE = `
## ORIA SPA - Thông tin

### Chi nhánh
- **ORIA SPA Barbershop**: 11 Ngô Đức Kế, P. Sài Gòn, Quận 1, TP.HCM
  - Hotline/SĐT: ${phone}
  - Giờ mở cửa: ${hours}
  - Google Maps: ${mapsUrl}

### Dịch vụ & Giá

1. **Ear Clean Package / Gói Lấy Ráy Tai**
   - Bao gồm: Lấy ráy tai / Massage đầu cổ vai / Massage chân với thảo dược
   - Thời gian: 70 phút
   - Giá: 650,000 VND (~$30 USD)

2. **Heel Skin Shave Package / Gói Cạo Da Gót Chân**
   - Bao gồm: Cạo da gót chân / Massage chân với thảo dược
   - Thời gian: 70 phút
   - Giá: 600,000 VND (~$27 USD)

3. **Hair Wash Package / Gói Gội Đầu Dưỡng Sinh**
   - Bao gồm: Gội đầu / Massage đầu cổ vai / Massage toàn thân & chân
   - Thời gian: 90 phút
   - Giá: 770,000 VND (~$35 USD)

4. **Facial Package / Gói Chăm Sóc Da Mặt**
   - Bao gồm: Chăm sóc da mặt / Cạo mặt / Massage đầu cổ vai / Gội nhanh / Massage toàn thân
   - Thời gian: 90 phút
   - Giá: 800,000 VND (~$36 USD)

5. **Barbershop Package / Gói Barbershop**
   - Bao gồm: Cạo râu / Cắt móng / Massage toàn thân / Lấy ráy tai / Cạo gót / Gội đầu / Đắp mặt nạ
   - Thời gian: 120 phút
   - Giá: 800,000 VND (~$39 USD)
   - Lưu ý: Available 11am - 7pm

### Website đặt lịch
- URL: https://nganha.vercel.app/
- Khách có thể đặt lịch online qua website
`;

  return `Bạn là trợ lý AI chăm sóc khách hàng cao cấp của ORIA SPA (ORIA SPA) tại Quận 1, TP. Hồ Chí Minh.

${langInstruction}

[Giọng điệu và Phong cách]
- Luôn thể hiện sự niềm nở, hòa đồng, lịch sự và cực kỳ trang nhã.
- Xưng hô là "em" hoặc "ORIA SPA", và gọi khách hàng là "anh/chị" hoặc "Quý khách".
- Trả lời ngắn gọn, súc tích (tối đa 150 từ). Dùng emoji phù hợp.
- Nếu khách hỏi ngoài phạm vi spa, lịch sự từ chối và hướng lại về dịch vụ spa.
- Nếu khách hỏi địa chỉ, đường đi, hãy cung cấp Google Maps link.
- Nếu khách hỏi số điện thoại liên hệ, hãy cung cấp số Hotline/SĐT.

[Nguyên tắc Giao tiếp BẮT BUỘC]
- Mở đầu cuộc trò chuyện (câu đầu tiên khi gặp khách): BẮT BUỘC dùng "ORIA SPA Xin Chào,".
- Kết thúc cuộc trò chuyện (khi khách chào tạm biệt hoặc đã chốt xong): BẮT BUỘC dùng "ORIA SPA Xin Cảm ơn.".

[QUY TRÌNH TƯ VẤN 3 BƯỚC]
Bước 1: Chào hỏi & Khám phá nhu cầu
- Sau câu chào "ORIA SPA Xin Chào,", HÃY CHỦ ĐỘNG hỏi thăm tình trạng cơ thể của khách (vd: "Hôm nay anh/chị có đang cảm thấy nhức mỏi ở vùng nào không ạ?").

Bước 2: Gợi ý dịch vụ (Bắt bệnh - Kê đơn)
- Lắng nghe phản hồi của khách. Dựa vào thông tin dịch vụ bên dưới để gợi ý:
  + Nếu khách mỏi cổ/vai/gáy/đầu: Gợi ý "Gói Gội Đầu Dưỡng Sinh" hoặc "Gói Lấy Ráy Tai".
  + Nếu khách nhức mỏi bàn chân: Gợi ý "Gói Cạo Da Gót Chân".
  + Nếu khách muốn thư giãn toàn diện: Gợi ý "Gói Facial" hoặc "Gói Barbershop".
- Khi gợi ý, hãy nêu bật lợi ích của gói đó để khách thấy được sự quan tâm. Luôn nêu rõ tên, thời gian và giá.

Bước 3: Chốt lịch (Call to Action)
- Khi khách đã ưng ý, khéo léo hỏi xem khách muốn đặt lịch lúc nào.
- Hướng dẫn khách dùng tính năng đặt lịch trực tiếp trên website hoặc gọi qua số Hotline/SĐT.

${SPA_KNOWLEDGE}`;
};

// ═══════════════════════════════════════
// Retry helper for rate limiting
// ═══════════════════════════════════════

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 5000, 10000]; // ms

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Rate limit error messages per locale
const RATE_LIMIT_MESSAGES: Record<string, string> = {
  vi: 'Hệ thống đang bận, vui lòng thử lại sau vài giây nhé! 🙏',
  en: 'System is busy, please try again in a few seconds! 🙏',
  cn: '系统繁忙，请稍后再试！🙏',
  jp: 'システムが混雑しています。数秒後にもう一度お試しください！🙏',
  kr: '시스템이 바쁩니다. 몇 초 후에 다시 시도해 주세요! 🙏',
};

// ═══════════════════════════════════════
// API Route Handler
// ═══════════════════════════════════════

export const POST = async (request: NextRequest) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('[AI Chat] GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { message, locale = 'vi', history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Fetch system settings dynamically
    const systemSettings = await fetchSystemSettings();

    // Khởi tạo model và nhúng Kịch bản ORIA SPA ngay tại đây
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: buildSystemPrompt(locale, systemSettings)
    });

    // Build chat history cho Gemini
    let chatHistory = history
      .filter((m: { role: string; content: string }) => m.content && m.role)
      .slice(0, -1) // Bỏ tin nhắn cuối cùng (vì nó là message hiện tại)
      .map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    // Đảm bảo history bắt đầu bằng 'user' (Yêu cầu bắt buộc của Gemini)
    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory = chatHistory.slice(1);
    }

    // Khởi tạo phiên chat
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    // Vòng lặp Retry xử lý Rate Limit
    let lastError: unknown = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await chat.sendMessage(message);
        const reply = result.response.text();
        return NextResponse.json({ reply });
      } catch (err: unknown) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);

        const isRateLimit = errMsg.includes('429') || errMsg.toLowerCase().includes('retry') || errMsg.toLowerCase().includes('resource');

        if (isRateLimit && attempt < MAX_RETRIES) {
          console.log(`[AI Chat] Rate limited, retrying in ${RETRY_DELAYS[attempt]}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }

        break;
      }
    }

    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    const isRateLimit = errorMessage.includes('429') || errorMessage.toLowerCase().includes('retry');

    if (isRateLimit) {
      console.warn('[AI Chat Rate Limit Blocked]', errorMessage);
      return NextResponse.json({
        reply: RATE_LIMIT_MESSAGES[locale] || RATE_LIMIT_MESSAGES.vi,
      });
    }

    console.error('[AI Chat API Error]', errorMessage);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 },
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[AI Chat API Fatal Error]', errorMessage);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 },
    );
  }
};