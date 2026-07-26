// AIChatBot.i18n.ts - Chat UI text dictionary (5 languages)
import { Locale } from '@/types';

export interface AIChatTexts {
  title: string;
  subtitle: string;
  placeholder: string;
  greeting: string;
  voiceHint: string;
  bookNow: string;
  thinking: string;
  errorMessage: string;
  voiceListening: string;
  voiceUnsupported: string;
  send: string;
  poweredBy: string;
}

export const chatTexts: Record<Locale, AIChatTexts> = {
  vi: {
    title: 'Trợ Lý AI',
    subtitle: 'ORIARETREAT',
    placeholder: 'Nhập tin nhắn...',
    greeting: 'Xin chào! 👋 Tôi là trợ lý AI của ORIARETREAT Spa. Tôi có thể giúp bạn tìm hiểu dịch vụ, giá cả và đặt lịch. Hãy hỏi tôi bất cứ điều gì!',
    voiceHint: 'Nhấn mic để nói',
    bookNow: 'Đặt lịch ngay',
    thinking: 'Đang suy nghĩ...',
    errorMessage: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
    voiceListening: 'Đang nghe...',
    voiceUnsupported: 'Trình duyệt không hỗ trợ giọng nói',
    send: 'Gửi',
    poweredBy: 'Được hỗ trợ bởi AI',
  },
  en: {
    title: 'AI Assistant',
    subtitle: 'ORIARETREAT',
    placeholder: 'Type a message...',
    greeting: 'Hello! 👋 I\'m the AI assistant of ORIARETREAT Spa. I can help you explore services, pricing and make a booking. Ask me anything!',
    voiceHint: 'Tap mic to speak',
    bookNow: 'Book Now',
    thinking: 'Thinking...',
    errorMessage: 'Sorry, an error occurred. Please try again.',
    voiceListening: 'Listening...',
    voiceUnsupported: 'Voice not supported in this browser',
    send: 'Send',
    poweredBy: 'Powered by AI',
  },
  cn: {
    title: 'AI助手',
    subtitle: '银河理发店和水疗中心',
    placeholder: '输入消息...',
    greeting: '你好！👋 我是银河Spa的AI助手。我可以帮您了解服务、价格和预约。随时问我！',
    voiceHint: '点击麦克风说话',
    bookNow: '立即预约',
    thinking: '思考中...',
    errorMessage: '抱歉，出现了错误。请重试。',
    voiceListening: '正在听...',
    voiceUnsupported: '此浏览器不支持语音',
    send: '发送',
    poweredBy: 'AI驱动',
  },
  jp: {
    title: 'AIアシスタント',
    subtitle: 'ガンハー バーバーショップ＆スパ',
    placeholder: 'メッセージを入力...',
    greeting: 'こんにちは！👋 ガンハースパのAIアシスタントです。サービス、料金のご案内や予約のお手伝いをいたします。お気軽にどうぞ！',
    voiceHint: 'マイクをタップして話す',
    bookNow: '今すぐ予約',
    thinking: '考え中...',
    errorMessage: '申し訳ありません、エラーが発生しました。もう一度お試しください。',
    voiceListening: '聞いています...',
    voiceUnsupported: 'このブラウザではは音声をサポートしていません',
    send: '送信',
    poweredBy: 'AIによる自動応答',
  },
  kr: {
    title: 'AI 어시스턴트',
    subtitle: '응안하 바버샵 & 스파',
    placeholder: '메시지 입력...',
    greeting: '안녕하세요! 👋 응안하 스파의 AI 어시스턴트입니다. 서비스, 가격 안내 및 예약을 도와드립니다. 무엇이든 물어보세요!',
    voiceHint: '마이크를 탭하여 말하기',
    bookNow: '지금 예약',
    thinking: '생각 중...',
    errorMessage: '죄송합니다, 오류가 발생했습니다. 다시 시도해 주세요.',
    voiceListening: '듣고 있습니다...',
    voiceUnsupported: '이 브라우저에서는 음성을 지원하지 않습니다',
    send: '보내기',
    poweredBy: 'AI 기반',
  },
};

// Voice recognition language codes per locale
export const VOICE_LANG_MAP: Record<Locale, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  cn: 'zh-CN',
  jp: 'ja-JP',
  kr: 'ko-KR',
};
