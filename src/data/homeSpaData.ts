export type LocalizedString = Record<string, string>;

export interface HomeSpaSection {
  id: string;
  heading: LocalizedString;
  paragraphs: LocalizedString[];
}

export interface HomeSpaConfig {
  pageTitle: LocalizedString;
  pageSubtitle: LocalizedString;
  heroImage?: string;
  heroMediaType?: 'image' | 'video';
  heroWatermarkEnabled?: boolean;
  heroWatermarkOpacity?: number;
  storyPhotos?: string[];
  storyPhotosWatermark?: boolean[];
  storyPhotosWatermarkOpacity?: number[];
  sections: HomeSpaSection[];
  closingText: LocalizedString;
  ctaText: LocalizedString;
  ctaLink: string;
}

export const DEFAULT_HOME_SPA_CONFIG: HomeSpaConfig = {
  pageTitle: {
    vi: 'Oria Home Spa',
    en: 'Oria Home Spa',
    cn: 'Oria Home Spa',
    kr: 'Oria Home Spa',
    jp: 'Oria Home Spa',
  },
  pageSubtitle: {
    vi: 'Khi spa đến tận nhà bạn',
    en: 'When the spa comes to you',
    cn: '让水疗直接来到你身边',
    kr: '스파가 당신에게 찾아갑니다',
    jp: 'スパがあなたのもとへ',
  },
  heroImage: '',
  heroMediaType: 'image',
  heroWatermarkEnabled: true,
  heroWatermarkOpacity: 15,
  storyPhotos: ['', '', ''],
  storyPhotosWatermark: [true, true, true],
  storyPhotosWatermarkOpacity: [15, 15, 15],
  sections: [
    {
      id: 'sec-1',
      heading: {
        vi: 'Oria Home Spa là gì?',
        en: 'What is Oria Home Spa?',
        cn: '什么是Oria Home Spa?',
        kr: 'Oria Home Spa란?',
        jp: 'Oria Home Spaとは?',
      },
      paragraphs: [
        {
          vi: 'Là dịch vụ Oria Spa cử kỹ thuật viên đến tận nơi bạn ở - nhà riêng, căn hộ hay khách sạn. Vẫn là kỹ thuật viên của Oria Spa, vẫn tay nghề đó, chỉ khác là bạn không cần đi đâu cả.',
          en: "It's Oria Spa sending a technician directly to where you are - your home, apartment, or hotel room. Same Oria Spa technicians, same skill level, the only difference is you don't have to go anywhere.",
          cn: '这是Oria Spa派技师直接上门为您服务——无论是您的家、公寓还是酒店房间。依然是Oria Spa的技师,依然是同样的专业水准,唯一不同的是,您不需要出门。',
          kr: 'Oria Spa의 테크니션이 고객님이 계신 곳 - 집, 아파트, 호텔 객실 - 로 직접 찾아가는 서비스입니다. 같은 Oria Spa 테크니션, 같은 숙련도, 다른 점은 어디도 갈 필요가 없다는 것뿐입니다.',
          jp: 'Oria Spaのセラピストが、ご自宅やマンション、ホテルの客室など、お客様のいる場所まで直接伺うサービスです。担当するのは同じOria Spaのセラピスト、技術レベルも変わりません。違うのは、どこにも出かける必要がないという点だけです。',
        },
        {
          vi: 'Chỉ cần đặt lịch trước ít nhất 2 tiếng, kỹ thuật viên sẽ mang theo đầy đủ dụng cụ và đến đúng giờ hẹn.',
          en: 'Just book at least 2 hours in advance, and the technician will arrive on time with everything they need.',
          cn: '只需提前至少2小时预约,技师就会携带全套工具准时抵达。',
          kr: '최소 2시간 전에만 예약하면, 테크니션이 필요한 모든 도구를 챙겨 정시에 방문합니다.',
          jp: '少なくとも2時間前にご予約いただければ、セラピストが必要な道具一式を持って時間通りに伺います。',
        },
      ],
    },
    {
      id: 'sec-2',
      heading: {
        vi: 'Khi nào nên đến Oria Spa?',
        en: 'When should you visit Oria Spa?',
        cn: '什么时候适合到店体验Oria Spa?',
        kr: '언제 Oria Spa 매장을 방문해야 할까요?',
        jp: 'どんな時にOria Spaの店舗を訪れるべき?',
      },
      paragraphs: [
        {
          vi: 'Khi bạn muốn nhiều hơn một dịch vụ. Cắt tóc, lấy ráy tai, gội đầu, chăm sóc da mặt - những dịch vụ này cần không gian và thiết bị chuyên dụng, chỉ có ở spa mới làm được trọn vẹn.',
          en: 'When you want more than one service. Haircuts, ear cleaning, hair washing, facial care - these need dedicated space and equipment that only the spa can provide in full.',
          cn: '当您想同时享受多项服务时。剪发、采耳、洗头、面部护理——这些项目需要专属的空间和设备,只有在店内才能完整完成。',
          kr: '하나 이상의 서비스를 원할 때. 헤어컷, 귀 청소, 헤어 워시, 페이셜 케어 - 이런 서비스는 전용 공간과 장비가 필요해서, 매장에서만 제대로 받을 수 있습니다.',
          jp: '複数のサービスを受けたい時。ヘアカット、耳掃除、ヘアウォッシュ、フェイシャルケア - これらは専用の空間と設備が必要なため、店舗でこそ本格的に受けられます。',
        },
        {
          vi: 'Khi bạn đi cùng người khác. Gia đình, nhóm bạn, đồng nghiệp hay cặp đôi - Oria Spa có phòng gia đình, phòng couple, phòng riêng để cả nhóm cùng trải nghiệm một lúc.',
          en: "When you're coming with others. Family, friends, colleagues, or couples - Oria Spa has family rooms, couple rooms, and private rooms so the whole group can be treated at the same time.",
          cn: '当您和其他人一起前来时。家人、朋友、同事或伴侣——Oria Spa设有家庭房、情侣房、独立包厢,让整个团队可以同时享受服务。',
          kr: '다른 사람과 함께 갈 때. 가족, 친구, 동료, 커플 - Oria Spa에는 패밀리룸, 커플룸, 프라이빗룸이 있어 그룹 전체가 동시에 서비스를 받을 수 있습니다.',
          jp: '他の人と一緒に行く時。ご家族、ご友人、同僚、カップル - Oria Spaにはファミリールーム、カップルルーム、プライベートルームがあり、グループ全員が同時に施術を受けられます。',
        },
        {
          vi: 'Và khi bạn muốn được thật sự bước ra khỏi không gian quen thuộc. Đôi khi việc rời khỏi nhà, đến một nơi yên tĩnh khác, mới là phần khiến bạn thư giãn nhất.',
          en: 'And when you genuinely want to step outside your familiar space. Sometimes leaving home for somewhere calm and different is exactly what makes the experience relaxing.',
          cn: '当您真的想暂时离开熟悉的空间时。有时候,离开家去一个安静不同的地方,才是让人最放松的部分。',
          kr: '그리고 익숙한 공간에서 정말로 벗어나고 싶을 때. 가끔은 집을 떠나 고요하고 새로운 곳으로 가는 것 자체가 가장 편안함을 주는 부분이기도 합니다.',
          jp: 'そして、本当に見慣れた空間から離れたい時。時には家を出て静かで違う場所に行くこと自体が、一番のリラックスになることもあります。',
        },
      ],
    },
    {
      id: 'sec-3',
      heading: {
        vi: 'Khi nào nên book Oria Home Spa?',
        en: 'When should you book Oria Home Spa?',
        cn: '什么时候适合预约Oria Home Spa到家服务?',
        kr: '언제 Oria Home Spa를 예약해야 할까요?',
        jp: 'どんな時にOria Home Spaを予約すべき?',
      },
      paragraphs: [
        {
          vi: 'Khi bạn quá mệt để đi đâu cả. Sau một chuyến bay dài, một ngày làm việc kiệt sức, hay đơn giản là hôm nay không muốn ra đường - đó là lúc để spa đến với bạn.',
          en: "When you're too tired to go anywhere. After a long flight, an exhausting workday, or simply a day you don't feel like leaving the house - that's when the spa should come to you.",
          cn: '当您疲惫得不想出门时。长途飞行之后、辛苦工作了一整天之后,或者只是今天不想出门——这时就该让水疗来找您了。',
          kr: '너무 지쳐서 어디도 가고 싶지 않을 때. 긴 비행 후, 힘든 업무 하루를 보낸 후, 아니면 그냥 오늘은 밖에 나가고 싶지 않을 때 - 그럴 때 스파가 직접 찾아옵니다.',
          jp: '疲れすぎてどこにも行きたくない時。長時間のフライトの後、へとへとになるほど働いた一日の後、あるいは単に今日は外に出たくない時 - そんな時こそスパがあなたのもとへ伺います。',
        },
        {
          vi: 'Khi bạn có con nhỏ hoặc người lớn tuổi ở nhà. Không phải sắp xếp người trông, không phải di chuyển, mọi thứ diễn ra ngay trong không gian quen thuộc.',
          en: 'When you have young children or elderly family members at home. No need to arrange care for them, no need to travel - everything happens right in your own familiar space.',
          cn: '当家里有小孩或老人需要照看时。不用安排人照看,不用出门奔波,一切都在熟悉的环境中进行。',
          kr: '집에 어린 자녀나 어르신이 계실 때. 따로 돌봐줄 사람을 구할 필요도, 이동할 필요도 없이, 모든 것이 익숙한 공간에서 이루어집니다.',
          jp: '小さなお子様やご高齢のご家族がご自宅にいらっしゃる時。誰かに預ける手配も、移動も必要なく、すべて慣れ親しんだ空間の中で完結します。',
        },
        {
          vi: 'Khi bạn muốn thư giãn rồi ngủ luôn. Massage xong là lên giường, không phải mặc đồ, gọi xe, đi về - giữ trọn cảm giác thoải mái đó cho đến khi ngủ.',
          en: 'When you want to relax and go straight to sleep. Once the massage ends, you just roll into bed - no getting dressed, no calling a ride, no commute home - keeping that relaxed feeling all the way until you fall asleep.',
          cn: '当您想放松完直接入睡时。按摩结束后直接躺上床——不用换衣服、叫车、往返奔波——把那份放松感一直保持到入睡。',
          kr: '마사지 후 바로 잠들고 싶을 때. 마사지가 끝나면 바로 침대로 - 옷을 갈아입거나, 차를 부르거나, 집으로 돌아갈 필요 없이 - 잠들 때까지 그 편안함을 그대로 유지할 수 있습니다.',
          jp: '施術後そのまま眠りたい時。マッサージが終わればそのままベッドへ - 着替えたり、車を呼んだり、帰宅したりする必要はありません - その心地よさを眠りにつくまでそのまま保てます。',
        },
        {
          vi: 'Và khi bạn đang ở khách sạn. Thay vì tìm hiểu xem nên đi spa nào, cứ để Oria Home Spa đến tận phòng.',
          en: "And when you're staying at a hotel. Instead of researching which spa to visit, let Oria Home Spa come straight to your room.",
          cn: '以及当您正在酒店入住时。与其研究该去哪家水疗馆,不如让Oria Home Spa直接来到您的房间。',
          kr: '그리고 호텔에 머무르고 있을 때. 어느 스파를 갈지 알아보는 대신, Oria Home Spa가 객실로 직접 찾아오게 하세요.',
          jp: 'そしてホテルに滞在中の时。どのスパに行くか調べる代わりに、Oria Home Spaに客室まで直接来てもらいましょう。',
        },
      ],
    },
  ],
  closingText: {
    vi: 'Hai lựa chọn, hai hoàn cảnh khác nhau. Đến Oria Spa khi bạn muốn một trải nghiệm trọn vẹn, đầy đủ. Book Oria Home Spa khi bạn chỉ muốn được thư giãn mà không phải đi đâu cả.',
    en: 'Two options, two different situations. Visit Oria Spa when you want a full, complete experience. Book Oria Home Spa when all you want is to relax without going anywhere.',
    cn: '两种选择,两种不同的场景。想要完整、全面的体验时,请到Oria Spa;只想放松、不想出门时,就预约Oria Home Spa。',
    kr: '두 가지 선택, 두 가지 다른 상황. 온전하고 완전한 경험을 원할 땐 Oria Spa 매장으로. 어디도 가지 않고 그저 편안히 쉬고 싶을 땐 Oria Home Spa를 예약하세요.',
    jp: '2つの選択肢、2つの異なるシーン。完全で充実した体験を求めるなら店舗のOria Spaへ。どこにも行かずただリラックスしたいならOria Home Spaをご予約ください。',
  },
  ctaText: {
    vi: 'Liên Hệ Đặt Lịch Homespa',
    en: 'Contact Homespa',
    cn: '联系到家水疗',
    jp: 'ホームスパを予約・相談',
    kr: '홈스파 문의 및 예약',
  },
  ctaLink: 'tel:+84964090277',
};

export function hydrateHomeSpaConfig(raw: any): HomeSpaConfig {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_HOME_SPA_CONFIG;
  }

  const rawSections = Array.isArray(raw.sections) && raw.sections.length > 0
    ? raw.sections
    : DEFAULT_HOME_SPA_CONFIG.sections;

  const hydratedSections: HomeSpaSection[] = rawSections.map((sec: any, idx: number) => {
    const defaultSec = DEFAULT_HOME_SPA_CONFIG.sections[idx] || DEFAULT_HOME_SPA_CONFIG.sections[0];
    return {
      id: sec.id || defaultSec.id || `sec-${idx + 1}`,
      heading: sec.heading || defaultSec.heading,
      paragraphs: Array.isArray(sec.paragraphs) && sec.paragraphs.length > 0
        ? sec.paragraphs
        : defaultSec.paragraphs,
    };
  });

  const rawHero = typeof raw.heroImage === 'string' ? raw.heroImage.trim() : '';
  const heroImage = rawHero.includes('unsplash.com') ? '' : (rawHero || DEFAULT_HOME_SPA_CONFIG.heroImage || '');
  const isVideoDetect = /\.(mp4|mov|webm)(\?.*)?$/i.test(heroImage);
  const heroMediaType: 'image' | 'video' = raw.heroMediaType === 'video' || (raw.heroMediaType !== 'image' && isVideoDetect)
    ? 'video'
    : 'image';

  const rawPhotos: string[] = Array.isArray(raw.storyPhotos)
    ? raw.storyPhotos
    : (DEFAULT_HOME_SPA_CONFIG.storyPhotos || ['', '', '']);
  const storyPhotos = rawPhotos.map((url) =>
    typeof url === 'string' && !url.includes('unsplash.com') ? url.trim() : ''
  );

  const heroWatermarkOpacity =
    typeof raw.heroWatermarkOpacity === 'number' && raw.heroWatermarkOpacity >= 0 && raw.heroWatermarkOpacity <= 100
      ? Math.round(raw.heroWatermarkOpacity)
      : 15;

  const rawWmOpacity = Array.isArray(raw.storyPhotosWatermarkOpacity) ? raw.storyPhotosWatermarkOpacity : [];
  const storyPhotosWatermarkOpacity: number[] = storyPhotos.map((_, idx) => {
    const val = rawWmOpacity[idx];
    return typeof val === 'number' && val >= 0 && val <= 100 ? Math.round(val) : 15;
  });

  return {
    pageTitle: raw.pageTitle || DEFAULT_HOME_SPA_CONFIG.pageTitle,
    pageSubtitle: raw.pageSubtitle || DEFAULT_HOME_SPA_CONFIG.pageSubtitle,
    heroImage,
    heroMediaType,
    heroWatermarkEnabled: raw.heroWatermarkEnabled !== false,
    heroWatermarkOpacity,
    storyPhotos,
    storyPhotosWatermark: Array.isArray(raw.storyPhotosWatermark)
      ? raw.storyPhotosWatermark
      : [true, true, true],
    storyPhotosWatermarkOpacity,
    sections: hydratedSections,
    closingText: raw.closingText || DEFAULT_HOME_SPA_CONFIG.closingText,
    ctaText: raw.ctaText || DEFAULT_HOME_SPA_CONFIG.ctaText,
    ctaLink: raw.ctaLink || DEFAULT_HOME_SPA_CONFIG.ctaLink,
  };
}
