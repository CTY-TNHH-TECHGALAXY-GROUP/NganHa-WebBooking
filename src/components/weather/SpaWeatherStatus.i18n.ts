import type { Locale } from '@/lib/constants';

export const weatherTexts: Record<Locale, {
  noRain: string;
  rainSoon: string;
  lightRain: string;
  rain: string;
  travelDelay: string;
  showWeather: string;
  dismiss: string;
}> = {
  vi: {
    noRain: 'Hiện tại Oria Spa không mưa',
    rainSoon: 'Hiện tại không mưa · Có thể mưa sắp tới',
    lightRain: 'Hiện đang có mưa nhẹ tại Oria Spa',
    rain: 'Hiện đang có mưa tại Oria Spa',
    travelDelay: 'Vui lòng cân nhắc thêm thời gian di chuyển.',
    showWeather: 'Xem thời tiết tại Oria Spa',
    dismiss: 'Đóng thông báo thời tiết',
  },
  en: {
    noRain: 'No rain at Oria Spa right now',
    rainSoon: 'No rain now · Rain may arrive soon',
    lightRain: 'Light rain at Oria Spa',
    rain: "It's currently raining at Oria Spa",
    travelDelay: 'Please allow extra travel time.',
    showWeather: 'Show weather at Oria Spa',
    dismiss: 'Dismiss weather message',
  },
  cn: {
    noRain: 'Oria Spa 目前没有下雨',
    rainSoon: '目前没有下雨 · 稍后可能有雨',
    lightRain: 'Oria Spa 目前正下小雨',
    rain: 'Oria Spa 目前正在下雨',
    travelDelay: '请为前往门店预留更多时间。',
    showWeather: '查看 Oria Spa 的天气',
    dismiss: '关闭天气提示',
  },
  jp: {
    noRain: '現在、Oria Spa周辺では雨は降っていません',
    rainSoon: '現在は雨なし · まもなく降る可能性があります',
    lightRain: '現在、Oria Spa周辺では小雨が降っています',
    rain: '現在、Oria Spa周辺では雨が降っています',
    travelDelay: '移動時間に余裕を持ってお越しください。',
    showWeather: 'Oria Spaの天気を表示',
    dismiss: '天気のお知らせを閉じる',
  },
  kr: {
    noRain: '현재 Oria Spa에는 비가 오지 않습니다',
    rainSoon: '현재 비는 없지만 · 곧 비가 올 수 있습니다',
    lightRain: '현재 Oria Spa에는 약한 비가 내립니다',
    rain: '현재 Oria Spa에는 비가 내립니다',
    travelDelay: '방문 시 이동 시간을 여유 있게 계획해 주세요.',
    showWeather: 'Oria Spa 날씨 보기',
    dismiss: '날씨 안내 닫기',
  },
};
