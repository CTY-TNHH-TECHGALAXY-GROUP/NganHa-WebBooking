import type { Locale } from '@/lib/constants';

export type LostAndFoundStatus = 'available' | 'contacting' | 'returned';

export type LostAndFoundItem = {
  id: string;
  type: 'glasses' | 'accessory' | 'tech' | 'other';
  title: Record<Locale, string>;
  detail: Record<Locale, string>;
  foundAt: Record<Locale, string>;
  foundOn: string;
  status: LostAndFoundStatus;
  image: string;
};

export type LostAndFoundConfig = {
  items: LostAndFoundItem[];
};

const localized = (vi: string, en: string, jp: string, kr: string, cn: string): Record<Locale, string> => ({ vi, en, jp, kr, cn });

export const DEFAULT_LOST_AND_FOUND: LostAndFoundConfig = {
  items: [
    {
      id: 'found-glasses-01',
      type: 'glasses',
      title: localized('Kính gọng nâu', 'Tortoiseshell glasses', 'べっ甲柄のメガネ', '갈색 뿔테 안경', '玳瑁色眼镜'),
      detail: localized('Được giữ lại sau một buổi chăm sóc buổi chiều.', 'Kept after an afternoon care appointment.', '午後のケアの後にお預かりしています。', '오후 케어 후 보관 중입니다.', '在下午护理结束后被妥善保管。'),
      foundAt: localized('Khu vực chờ - Ngô Đức Kế', 'Waiting area - Ngo Duc Ke', '待合スペース - Ngô Đức Kế', '대기 공간 - Ngô Đức Kế', '等候区 - Ngô Đức Kế'),
      foundOn: '2026-09-01',
      status: 'available',
      image: '/images/lost-and-found/found-glasses.png',
    },
    {
      id: 'found-scarf-02',
      type: 'accessory',
      title: localized('Khăn lụa màu kem', 'Cream silk scarf', 'クリーム色のシルクスカーフ', '크림색 실크 스카프', '奶油色丝巾'),
      detail: localized('Được xếp gọn sau ghế trong phòng trị liệu.', 'Folded carefully after a therapy room visit.', '施術室の椅子のそばで丁寧に畳んで保管しています。', '테라피 룸 방문 후 정성스럽게 접어 보관했습니다.', '在护理室座椅旁被细心折好并保管。'),
      foundAt: localized('Phòng trị liệu - Thi Sách', 'Therapy room - Thi Sach', '施術室 - Thi Sách', '테라피 룸 - Thi Sách', '护理室 - Thi Sách'),
      foundOn: '2026-08-30',
      status: 'available',
      image: '/images/lost-and-found/found-silk-scarf.png',
    },
    {
      id: 'found-earbuds-03',
      type: 'tech',
      title: localized('Hộp tai nghe màu đen', 'Black earbud case', '黒いイヤホンケース', '검은 이어버드 케이스', '黑色耳机盒'),
      detail: localized('Được tìm thấy gần khu vực thanh toán.', 'Found close to the payment counter.', 'お会計カウンターの近くで見つかりました。', '결제 카운터 근처에서 발견되었습니다.', '在付款柜台附近被发现。'),
      foundAt: localized('Quầy tiếp đón - Ngô Đức Kế', 'Reception - Ngo Duc Ke', '受付 - Ngô Đức Kế', '리셉션 - Ngô Đức Kế', '前台 - Ngô Đức Kế'),
      foundOn: '2026-08-27',
      status: 'contacting',
      image: '/images/lost-and-found/found-earbud-case.png',
    },
  ],
};

export const normalizeLostAndFound = (value: unknown): LostAndFoundConfig => {
  const config = value as Partial<LostAndFoundConfig> | undefined;
  if (!Array.isArray(config?.items) || config.items.length === 0) return DEFAULT_LOST_AND_FOUND;
  return {
    items: config.items.map((item, index) => ({
      ...DEFAULT_LOST_AND_FOUND.items[index % DEFAULT_LOST_AND_FOUND.items.length],
      ...item,
      id: item.id || `found-${index + 1}`,
      title: { ...DEFAULT_LOST_AND_FOUND.items[index % DEFAULT_LOST_AND_FOUND.items.length].title, ...(item.title || {}) },
      detail: { ...DEFAULT_LOST_AND_FOUND.items[index % DEFAULT_LOST_AND_FOUND.items.length].detail, ...(item.detail || {}) },
      foundAt: { ...DEFAULT_LOST_AND_FOUND.items[index % DEFAULT_LOST_AND_FOUND.items.length].foundAt, ...(item.foundAt || {}) },
    })),
  };
};

export const getLostAndFoundText = (value: Record<string, string>, locale: string) =>
  value[locale] || value.en || value.vi || '';
