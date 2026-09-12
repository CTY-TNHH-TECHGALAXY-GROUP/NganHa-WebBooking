import { Locale } from '@/lib/constants';

export type LocalizedString = Record<string, string>;

export interface OurStoryFilmFrame {
  id: number;
  frameTag: string;
  badge: LocalizedString;
  title: LocalizedString;
  desc: LocalizedString;
  image: string;
  watermarkEnabled?: boolean;
  watermarkOpacity?: number;
}

export interface OurStoryPillar {
  icon: string;
  image?: string;
  title: LocalizedString;
  desc: LocalizedString;
  watermarkEnabled?: boolean;
  watermarkOpacity?: number;
}

export interface OurStoryMenuNiche {
  id: string;
  order: string;
  title: LocalizedString;
  tagline: LocalizedString;
  summary: LocalizedString;
  included: LocalizedString;
  bestFor: LocalizedString;
  highlights: LocalizedString;
  note?: LocalizedString;
  image: string;
  watermarkEnabled?: boolean;
  watermarkOpacity?: number;
  ctaText?: LocalizedString;
  ctaLink?: string | null;
}

export interface OurStoryActivity {
  frameId: number;
  text: LocalizedString;
  badge: LocalizedString;
}

export interface OurStoryConfig {
  contentVersion: number;
  header: {
    badge: LocalizedString;
    title: LocalizedString;
    script: LocalizedString;
    addressLabel: LocalizedString;
    cityLabel: LocalizedString;
  };
  locationSection: {
    title: LocalizedString;
    text: LocalizedString;
    strategicPosition: LocalizedString;
    connectionsTitle: LocalizedString;
    connections: LocalizedString[];
    cityImage: string;
    cityImageWatermarkEnabled?: boolean;
    cityImageWatermarkOpacity?: number;
    cityCaptionLeft: LocalizedString;
    cityCaptionRight: LocalizedString;
    streetSignImage: string;
    streetSignImageWatermarkEnabled?: boolean;
    streetSignImageWatermarkOpacity?: number;
    imageCaption: LocalizedString;
  };
  architectureSection: {
    title: LocalizedString;
    features: LocalizedString[];
    activityTitle: LocalizedString;
    activityHint: LocalizedString;
    activities: OurStoryActivity[];
  };
  filmReel: {
    title: LocalizedString;
    frames: OurStoryFilmFrame[];
  };
  atmosphereSection: {
    title: LocalizedString;
    morning: LocalizedString;
    evening: LocalizedString;
    landmark: LocalizedString;
    nightStreetImage: string;
    nightStreetImageWatermarkEnabled?: boolean;
    nightStreetImageWatermarkOpacity?: number;
    imageCaption: LocalizedString;
  };
  specialtySection: {
    badge: LocalizedString;
    headline: LocalizedString;
    lead: LocalizedString;
    pillars: OurStoryPillar[];
    menuNiches?: OurStoryMenuNiche[];
    ctaText: LocalizedString;
    ctaLink: string | null;
  };
}

export const hasValidOurStoryContent = (obj: any): boolean => {
  return Boolean(
    obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    Object.keys(obj).length > 0 &&
    (obj.header || obj.locationSection || obj.architectureSection || obj.filmReel || obj.atmosphereSection || obj.specialtySection)
  );
};

export const createDefaultOurStoryConfig = (): OurStoryConfig => ({
  contentVersion: 3,
  header: {
    badge: {
      vi: 'Heritage & Destination',
      en: 'Heritage & Destination',
      cn: '传承与目的地',
      jp: 'ヘリテージ＆デスティネーション',
      kr: '헤리티지 & 여행지',
    },
    title: {
      vi: 'Hệ Thống Oria Barbershop & Spa',
      en: 'Oria Barbershop & Spa System',
      cn: 'Oria 理发与水疗连锁系统',
      jp: 'Oria バーバーショップ＆スパ',
      kr: 'Oria 바버샵 & 스파 시스템',
    },
    script: {
      vi: 'Our story',
      en: 'Our story',
      cn: '我们的故事',
      jp: '私たちの物語',
      kr: '우리의 이야기',
    },
    addressLabel: {
      vi: '11 Ngô Đức Kế',
      en: '11 Ngo Duc Ke',
      cn: '吴德计街11号',
      jp: 'ゴ・ドゥック・ケ通り11番地',
      kr: '응오득께 11번지',
    },
    cityLabel: {
      vi: 'Sài Gòn, Việt Nam',
      en: 'Saigon, Vietnam',
      cn: '西贡，越南',
      jp: 'サイゴン、ベトナム',
      kr: '사이공, 베트남',
    },
  },
  locationSection: {
    title: {
      vi: 'Vị Trí Vàng và Kết Nối',
      en: 'Prime Location & Connectivity',
      cn: '黄金位置与交通枢纽',
      jp: '一等地と接続性',
      kr: '황금 입지와 접근성',
    },
    text: {
      vi: 'Tọa lạc ngay bên sông Sài Gòn, khu vực đường Ngô Đức Kế, Quận 1 là một trong những tuyến phố có vị trí đắc địa và mang tính biểu tượng cao tại trung tâm Thành phố Hồ Chí Minh.',
      en: 'Located right next to the Saigon River, the Ngo Duc Ke street area in District 1 is one of the most prestigious and iconic avenues in the heart of Ho Chi Minh City.',
      cn: '位于西贡河畔，第一郡吴德计街是胡志明市中心最繁华、最具标志性的黄金街道之一。',
      jp: 'サイゴン川のすぐそばに位置する1区のゴ・ドゥック・ケ通りは、ホーチミン市の中心部で最も名誉ある象徴的な通りの1つです。',
      kr: '사이공 강 바로 옆에 위치한 1군 응오득께(Ngo Duc Ke) 거리는 호치민시 중심부에서 가장 상징적인 최고급 입지입니다.',
    },
    strategicPosition: {
      vi: 'Vị trí chiến lược: Đường Ngô Đức Kế nằm trọn vẹn tại Phường Sài Gòn, Quận 1, khu vực trung tâm kinh tế và thương mại của thành phố. Tuyến đường có chiều dài khoảng 403m, lưu thông hai chiều thuận tiện.',
      en: 'Strategic Position: Ngo Duc Ke Street lies entirely within District 1, the economic and commercial hub of the city. Measuring around 403m in length, it offers smooth two-way transit.',
      cn: '战略位置：吴德计街全长约403米，双向通行，紧邻全市最高端的商业与金融中心。',
      jp: '戦略的立地：ゴ・ドゥック・ケ通りは全長約403mで、2車線通行が可能。市の経済・商業の中心地に位置しています。',
      kr: '전략적 위치: 응오득께 거리는 1군 중심 상업·금융 허브에 위치하며, 약 403m 길이에 편리한 양방향 통행을 제공합니다.',
    },
    connectionsTitle: {
      vi: 'Kết nối quan trọng: Đường Ngô Đức Kế kéo dài và giao cắt với các trục đường “vàng” khác của Quận 1, tạo nên một tam giác kinh doanh sầm uất bậc nhất:',
      en: 'Crucial Junctions: Ngo Duc Ke Street connects and intersects with other premier avenues in District 1, forming an illustrious commercial golden triangle:',
      cn: '核心连通：与第一郡多条黄金干道纵横交错，构成顶尖繁华商圈：',
      jp: '重要なアクセス：ゴ・ドゥック・ケ通りは1区の他の主要な大通りと交差し、繁華なゴールデントライアングルを形成しています。',
      kr: '주요 연결: 1군의 황금 도로들과 교차하여 최고 수준의 상업 삼각지대를 형성합니다:',
    },
    connections: [
      {
        vi: 'Nối từ Công Trường Mê Linh (gần sông Sài Gòn và tượng Trần Hưng Đạo).',
        en: 'Originates at Me Linh Square (near Saigon River and Tran Hung Dao Monument).',
        cn: '起自美灵广场（靠近西贡河与陈兴道雕像）。',
        jp: 'メーリン広場（サイゴン川とチャン・フン・ダオ像の近く）からスタート。',
        kr: '메린 광장(사이공 강과 쩐흥다오 동상 인근)에서 연결.',
      },
      {
        vi: 'Cắt ngang đường Đồng Khởi (trục đường thương mại xa xỉ bậc nhất).',
        en: 'Crosses Dong Khoi Street (the most luxurious retail and heritage corridor).',
        cn: '横穿同起街（最负盛名的奢华商业街）。',
        jp: 'ドンコイ通り（最もラグジュアリーな商業大通り）と交差。',
        kr: '동코이 거리(최고급 럭셔리 상업 거리)와 교차.',
      },
      {
        vi: 'Giao cắt đường Nguyễn Huệ (phố đi bộ và quảng trường sự kiện).',
        en: 'Crosses Nguyen Hue Boulevard (the iconic walking promenade and cultural event plaza).',
        cn: '交汇阮惠大道（标志性的步行街与活动广场）。',
        jp: 'グエンフエ通り（象徴的な歩行者天国とイベント広場）と交差。',
        kr: '응우옌후에 거리(보행자 전용 광장)와 교차.',
      },
      {
        vi: 'Kết thúc tại đoạn giao cắt với Hồ Tùng Mậu & Hải Triều (sát cạnh tòa tháp Bitexco Financial Tower).',
        en: 'Concludes at the intersection with Ho Tung Mau & Hai Trieu (adjacent to Bitexco Financial Tower).',
        cn: '止于胡松茂街与海潮街交界处（紧邻Bitexco金融大厦）。',
        jp: 'ホートゥンマウ＆ハイチエウ通りの交差点（ビテクスコ・タワーの隣）で終了。',
        kr: '호뚱마우 및 하이찌에우 교차로(비텍스코 파이낸셜 타워 인근)에서 마무리.',
      },
    ],
    cityImage: '/images/about-street.png',
    cityImageWatermarkEnabled: true,
    cityCaptionLeft: {
      vi: 'Saigon district 01',
      en: 'Saigon district 01',
      cn: '西贡第一郡',
      jp: 'サイゴン1区',
      kr: '사이공 1군',
    },
    cityCaptionRight: {
      vi: 'City rhythm',
      en: 'City rhythm',
      cn: '城市律动',
      jp: '都市のリズム',
      kr: '도시의 리듬',
    },
    streetSignImage: '/images/story/street-sign.jpg',
    streetSignImageWatermarkEnabled: true,
    imageCaption: {
      vi: 'Trục đường Ngô Đức Kế giao cắt đường Đồng Khởi • Trung tâm Quận 1',
      en: 'Ngo Duc Ke Street intersecting with Dong Khoi • District 1 Center',
      cn: '吴德计街与同起街十字路口 • 第一郡中心',
      jp: 'ゴ・ドゥック・ケ通りとドンコイ通りの交差点 • 1区中心部',
      kr: '응오득께 거리와 동코이 거리 교차로 • 1군 중심',
    },
  },
  architectureSection: {
    title: {
      vi: 'Đặc Điểm Kiến Trúc & Thương Mại',
      en: 'Architecture & Commerce',
      cn: '建筑与商业特色',
      jp: '建築と商業の特徴',
      kr: '건축 및 상업적 특징',
    },
    features: [
      {
        vi: 'Tập trung cao ốc văn phòng hạng A: Khu vực quy tụ các tòa cao ốc tài chính lớn như Melinh Point Tower, cùng hàng loạt trụ sở tập đoàn đa quốc gia và tổ chức tài chính hàng đầu.',
        en: 'Grade-A Office Density: Home to premier towers like Melinh Point Tower, multinational headquarters, and renowned financial institutions.',
        cn: '甲级写字楼云集：汇聚了包括美灵角大厦在内的多座顶级写字楼与跨国金融总部。',
        jp: 'グレードAオフィスの集積：メーリンポイントタワーをはじめとする最高級オフィスビルや多国籍企業の拠点が密集しています。',
        kr: 'A급 오피스 밀집: 메린 포인트 타워를 비롯한 대형 금융 빌딩 및 글로벌 기업 본사가 집중되어 있습니다.',
      },
      {
        vi: 'Thương mại và dịch vụ cao cấp: Thừa hưởng sự sầm uất liền kề Đồng Khởi & Nguyễn Huệ với các khách sạn 5 sao quốc tế, nhà hàng ẩm thực sang trọng và thương hiệu thời trang toàn cầu.',
        en: 'High-End Retail & Hospitality: Bordering Dong Khoi and Nguyen Hue with 5-star international hotels, Michelin dining, and luxury global fashion houses.',
        cn: '高端商业与服务：毗邻同起街与阮惠街，尽享五星级国际酒店、高档餐饮与奢华时尚品牌。',
        jp: '高級リテール＆ホスピタリティ：5つ星ホテル、ファインダイニング、世界的ハイブランドが並びます。',
        kr: '최고급 상업 및 서비스: 5성급 호텔, 고급 다이닝, 글로벌 럭셔리 패션 브랜드가 바로 연결됩니다.',
      },
    ],
    activityTitle: {
      vi: 'Các hoạt động du lịch hấp dẫn:',
      en: 'Exciting Travel Activities:',
      cn: '精彩游览体验：',
      jp: '魅力的なアクティビティ：',
      kr: '매력적인 여행 활동:',
    },
    activityHint: {
      vi: '(Nhấp vào từng hoạt động để cuộn đến thước phim tương ứng)',
      en: '(Click each activity to glide to its corresponding film frame)',
      cn: '（点击各项活动即可跳转至对应胶片画面）',
      jp: '（各アクティビティをクリックすると該当のフィルムコマへスクロールします）',
      kr: '(각 활동을 클릭하면 해당 필름 프레임으로 이동합니다)',
    },
    activities: [
      {
        frameId: 1,
        text: {
          vi: 'Nhìn toàn cảnh thành phố trên xe buýt 2 tầng',
          en: 'Panoramic city views on the double-decker open bus',
          cn: '乘坐双层敞篷观光巴士俯瞰全城胜景',
          jp: '2階建てオープントップバスで街を一望',
          kr: '2층 오픈탑 버스에서 도시 전경 감상',
        },
        badge: {
          vi: 'Xem phim #1 ▷',
          en: 'View Film #1 ▷',
          cn: '查看胶片 #1 ▷',
          jp: 'フィルム #1 ▷',
          kr: '필름 보기 #1 ▷',
        },
      },
      {
        frameId: 4,
        text: {
          vi: 'Tham quan thành phố dưới Saigon Waterbus',
          en: 'Explore the scenic city route with Saigon Waterbus',
          cn: '乘坐西贡水上巴士漫游河畔风光',
          jp: 'サイゴン・ウォーターバスで水上散策',
          kr: '사이공 수상버스로 강변 투어',
        },
        badge: {
          vi: 'Xem phim #4 ▷',
          en: 'View Film #4 ▷',
          cn: '查看胶片 #4 ▷',
          jp: 'フィルム #4 ▷',
          kr: '필름 보기 #4 ▷',
        },
      },
      {
        frameId: 2,
        text: {
          vi: 'Buổi tối trên tàu Saigon Princess (ngắm skyline ven sông)',
          en: 'Gourmet evening on Saigon Princess with river skyline vistas',
          cn: '夜游西贡公主号邮轮（尽揽璀璨天际线）',
          jp: 'サイゴン・プリンセス号で川辺の夜景クルーズ',
          kr: '사이공 프린세스 디너 크루즈(야경 감상)',
        },
        badge: {
          vi: 'Xem phim #2 ▷',
          en: 'View Film #2 ▷',
          cn: '查看胶片 #2 ▷',
          jp: 'フィルム #2 ▷',
          kr: '필름 보기 #2 ▷',
        },
      },
      {
        frameId: 3,
        text: {
          vi: 'Bấm huyệt chân tại Oria sau một ngày dài trải nghiệm',
          en: 'Restorative foot reflexology at Oria after an eventful journey',
          cn: '漫游一日后在 Oria 享受深度足底穴位按摩',
          jp: '1日の旅の終わりに Oria で極上の足つぼケア',
          kr: '하루 여정 후 Oria에서 즐기는 발 지압 마사지',
        },
        badge: {
          vi: 'Xem phim #3 ▷',
          en: 'View Film #3 ▷',
          cn: '查看胶片 #3 ▷',
          jp: 'フィルム #3 ▷',
          kr: '필름 보기 #3 ▷',
        },
      },
    ],
  },
  filmReel: {
    title: {
      vi: 'Thước Phim: Trải Nghiệm Sài Gòn & Oria',
      en: 'Film Reel: Saigon Experience & Oria',
      cn: '胶片记忆：西贡旅程与 Oria',
      jp: 'フィルムリール：サイゴン体験＆Oria',
      kr: '필름 릴: 사이공 경험 & Oria',
    },
    frames: [
      {
        id: 1,
        frameTag: 'KODAK 500T • 11A ▶',
        badge: {
          vi: 'City Tour',
          en: 'City Tour',
          cn: '城市观光',
          jp: 'シティツアー',
          kr: '시티 투어',
        },
        title: {
          vi: 'Khung Hình 01 • Nhìn toàn cảnh thành phố trên xe buýt 2 tầng',
          en: 'Frame 01 • Panoramic City Views on Double-Decker Bus',
          cn: '胶片 01 • 敞篷双层巴士俯瞰城市全景',
          jp: 'コマ 01 • 2階建てバスで楽しむパノラマビュー',
          kr: '프레임 01 • 2층 버스에서 즐기는 도시 파노라마',
        },
        desc: {
          vi: 'Lướt qua các công trình kiến trúc biểu tượng của Sài Gòn trên tuyến xe buýt thoáng nóc, thu trọn vẻ đẹp giao thoa giữa lịch sử và hiện đại.',
          en: 'Glide past Saigon iconic landmarks aboard the open-top bus, taking in the seamless blend of architectural heritage and vibrant modernity.',
          cn: '穿梭于西贡标志性建筑之间，沉浸于悠久历史与现代律动的和谐交融。',
          jp: 'オープントップバスで歴史的遺産とモダンな街並みが織りなすサイゴンの美しさを堪能。',
          kr: '오픈탑 버스를 타고 사이공의 역사적 유산과 현대적인 도시미를 한눈에 담아보세요.',
        },
        image: '/images/story/photo-bus.jpg',
        watermarkEnabled: true,
      },
      {
        id: 2,
        frameTag: 'KODAK 500T • 12 ▶',
        badge: {
          vi: 'River Cruise',
          en: 'River Cruise',
          cn: '江轮晚宴',
          jp: 'リバークルーズ',
          kr: '리버 크루즈',
        },
        title: {
          vi: 'Khung Hình 02 • Buổi tối trên tàu Saigon Princess',
          en: 'Frame 02 • Enchanting Evening on Saigon Princess Cruise',
          cn: '胶片 02 • 西贡公主号江畔浪漫之夜',
          jp: 'コマ 02 • サイゴン・プリンセス号での優雅な夜',
          kr: '프레임 02 • 사이공 프린세스 위의 특별한 밤',
        },
        desc: {
          vi: 'Bữa tối thượng lưu bồng bềnh trên dòng sông Sài Gòn, ngắm nhìn skyline hoa lệ của thành phố về đêm trong tiếng nhạc du dương.',
          en: 'Luxury fine dining along the Saigon River, marveling at the illuminated city skyline to the gentle rhythm of live acoustic music.',
          cn: '荡漾在西贡河畔的奢华晚宴，在悠扬乐声中饱览绚烂的夜景天际线。',
          jp: 'サイゴン川の夜景を眺めながら、贅沢なディナーと心地よい音楽に包まれるひととき。',
          kr: '감미로운 음악과 함께 밤의 사이공 강과 화려한 스카이라인을 만끽하는 디너 크루즈.',
        },
        image: '/images/story/photo-cruise.jpg',
        watermarkEnabled: true,
      },
      {
        id: 3,
        frameTag: 'KODAK 500T • 13 ▶',
        badge: {
          vi: 'Oria Wellness',
          en: 'Oria Wellness',
          cn: 'Oria 身心愈养',
          jp: 'Oria ウェルネス',
          kr: 'Oria 웰니스',
        },
        title: {
          vi: 'Khung Hình 03 • Bấm huyệt chân tại Oria Barbershop & Spa',
          en: 'Frame 03 • Restorative Reflexology at Oria Barbershop & Spa',
          cn: '胶片 03 • Oria 传统草本足底理疗',
          jp: 'コマ 03 • Oria での贅沢な足つぼトリートメント',
          kr: '프레임 03 • Oria 바버샵 & 스파에서의 힐링 발 지압',
        },
        desc: {
          vi: 'Trạm dừng thư giãn hoàn hảo ngay trung tâm Ngô Đức Kế. Kỹ thuật bấm huyệt cổ truyền và thảo dược tự nhiên giúp giải tỏa mọi mệt mỏi sau chuyến du ngoạn.',
          en: 'The sanctuary for deep relaxation on Ngo Duc Ke. Traditional pressure-point therapies and organic herbs dispel fatigue after your urban explorations.',
          cn: '吴德计街正核心的静谧绿洲，传统经络穴位推拿与天然草本香氛，彻底舒缓身心疲惫。',
          jp: '伝統的な指圧技法と天然ハーブが、歩き疲れた体を芯からリフレッシュさせます。',
          kr: '도심 속 완벽한 쉼터. 전통 지압과 천연 허브 테라피로 하루의 피로를 말끔히 풀어드립니다.',
        },
        image: '/images/services/foot-massage.png',
        watermarkEnabled: true,
      },
      {
        id: 4,
        frameTag: 'KODAK 500T • 14 ▶',
        badge: {
          vi: 'Waterbus Experience',
          en: 'Waterbus Experience',
          cn: '水上巴士漫游',
          jp: 'ウォーターバス体験',
          kr: '워터버스 경험',
        },
        title: {
          vi: 'Khung Hình 04 • Tham quan thành phố dưới Saigon Waterbus',
          en: 'Frame 04 • City Exploration on Saigon Waterbus',
          cn: '胶片 04 • 西贡水上巴士水上观光之旅',
          jp: 'コマ 04 • サイゴン・ウォーターバスからの都市探訪',
          kr: '프레임 04 • 사이공 수상버스에서 만나는 도시 풍경',
        },
        desc: {
          vi: 'Tận hưởng làn gió mát lành và ngắm nhìn nhịp sống sôi động của hai bờ sông Sài Gòn từ góc nhìn sông nước độc đáo.',
          en: 'Bask in cool river breezes while witnessing the dynamic pulse of Saigon waterfronts from an authentic aquatic vantage point.',
          cn: '迎着河畔清风，自独特的水路视角领略西贡两岸的蓬勃生机与悠闲惬意。',
          jp: '心地よい川風を感じながら、サイゴンの水辺の豊かな景色と活気を満喫。',
          kr: '시원한 강바람을 맞으며 색다른 물길 시선에서 사이공의 활기를 느껴보세요.',
        },
        image: '/images/story/photo-waterbus.jpg',
        watermarkEnabled: true,
      },
    ],
  },
  atmosphereSection: {
    title: {
      vi: 'Không Khí Và Phong Cách',
      en: 'Atmosphere & Lifestyle',
      cn: '氛围与城市风尚',
      jp: '雰囲気とスタイル',
      kr: '분위기와 라이프스타일',
    },
    morning: {
      vi: 'Buổi sáng năng động: Hương thơm cà phê nồng nàn, các tiệm bánh thanh lịch và cửa hàng thời trang cao cấp đón chào nhịp sống của giới văn phòng và du khách quốc tế.',
      en: 'Energetic Mornings: The rich aroma of artisanal coffee, elegant patisseries, and luxury boutiques welcoming corporate executives and international travelers.',
      cn: '活力清晨：浓郁香醇的咖啡香气、精致法式烘焙店与高级时尚精品店，交织出国际商务精英的活力晨光。',
      jp: '活気ある朝：香り高いコーヒー、上品なベーカリー、高級ブティックがオフィス街と観光客を迎えます。',
      kr: '활기찬 아침: 향긋한 커피, 우아한 베이커리, 럭셔리 부티크가 직장인과 여행자를 반깁니다.',
    },
    evening: {
      vi: 'Buổi tối hoa lệ: Ánh đèn lộng lẫy từ các quán rooftop bar, không khí trẻ trung, phóng khoáng kết nối trực tiếp từ phố đi bộ Nguyễn Huệ tạo nên trải nghiệm đêm đậm chất Sài Gòn.',
      en: 'Glamorous Evenings: Radiant glow from rooftop lounges and modern bistros, channeling the spirited energy of Nguyen Hue promenade into an unforgettable nightlife scene.',
      cn: '华丽夜晚：屋顶酒吧的流光溢彩与阮惠步行街的欢腾热情紧密相连，勾勒出最地道迷人的西贡夜色。',
      jp: '華やかな夜：ルーフトップバーの輝く光と、グエンフエ歩行者天国から伝わる躍動的なナイトライフ。',
      kr: '화려한 밤: 루프탑 바의 불빛과 응우옌후에 거리의 자유로운 에너지가 어우러진 감각적인 밤.',
    },
    landmark: {
      vi: 'Điểm đến biểu tượng: Nơi giao thoa hoàn hảo giữa nét cổ điển hoa lệ của di sản Sài Gòn và kiến trúc hiện đại, thu hút nhiều góc check-in sang trọng.',
      en: 'Iconic Landmark: A harmonious confluence of Saigon classic French heritage and avant-garde architecture, creating beloved photogenic destinations.',
      cn: '经典地标：西贡百年法式复古底蕴与超现代建筑在此交相辉映，成为备受赞誉的打卡胜地。',
      jp: '象徴的なデスティネーション：クラシックな歴史の美しさと洗練された近代建築が調和するフォトスポット。',
      kr: '상징적인 명소: 클래식한 헤리티지와 현대 건축이 어우러져 어디서나 돋보이는 포토제닉한 장소.',
    },
    nightStreetImage: '/images/story/night-street.jpg',
    nightStreetImageWatermarkEnabled: true,
    imageCaption: {
      vi: 'Đêm Sài Gòn lung linh ánh đèn nhìn về phía Nhà Hát Thành Phố & Đồng Khởi',
      en: 'Illuminated Saigon Nightscape facing the Opera House & Dong Khoi',
      cn: '流光溢彩的西贡夜景，眺望大剧院与同起街',
      jp: 'オペラハウスとドンコイ通りを望むサイゴンの夜景',
      kr: '오페라 하우스와 동코이 거리를 바라보는 눈부신 사이공의 밤',
    },
  },
  specialtySection: {
    badge: {
      vi: 'Đích Đến Của Sự Phục Hồi',
      en: 'Destination of Rejuvenation',
      cn: '身心重焕的终极殿堂',
      jp: '心身の再生を叶える場所',
      kr: '진정한 재충전의 명소',
    },
    headline: {
      vi: 'Đặc Sản Địa Phương • Oria Barbershop & Spa',
      en: 'Local Specialty • Oria Barbershop & Spa',
      cn: '本土特色体验 • Oria 理发与水疗',
      jp: 'ローカルスペシャリティ • Oria バーバー＆スパ',
      kr: '로컬 스페셜티 • Oria 바버샵 & 스파',
    },
    lead: {
      vi: '• Bên cạnh những trải nghiệm thị giác và ẩm thực du khách có thể tản bộ dọc theo bờ sông Sài Gòn và không nên bỏ lỡ Oria Spa nằm ngay cạnh khách sạn Riverside, sát bên sông Sài Gòn - một khu vực an ninh rất tốt, để mỗi lần ghé qua, bạn chỉ cần nghĩ đến việc thư giãn mà không phải lo nghĩ gì khác.',
      en: '• Alongside the city’s visual and culinary experiences, visitors can stroll along the Saigon River and should not miss Oria Spa, located right beside the Riverside Hotel and close to the river in a very safe area. Each time you visit, all you need to think about is relaxing, without worrying about anything else.',
      cn: '• 除了视觉与美食体验，游客还可以沿着西贡河悠闲漫步，也不要错过紧邻 Riverside Hotel、坐落于西贡河畔的 Oria Spa。这里治安良好，每次到访，您只需安心放松，无须为其他事情担忧。',
      jp: '• 視覚やグルメの体験に加え、旅行者はサイゴン川沿いを散策できます。そして、Riverside Hotelのすぐ隣、サイゴン川のそばに位置するOria Spaもぜひお見逃しなく。治安の良いエリアにあるため、訪れるたびに余計な心配をせず、ただリラックスすることだけを考えていただけます。',
      kr: '• 시각과 미식의 즐거움을 경험한 뒤에는 사이공강을 따라 산책해 보세요. Riverside Hotel 바로 옆, 사이공강 가까이의 안전한 지역에 자리한 Oria Spa도 놓치지 마세요. 방문할 때마다 다른 걱정 없이 오직 휴식에만 집중하실 수 있습니다.',
    },
    pillars: [
      {
        icon: '👥',
        image: '/images/about-treatment.png',
        watermarkEnabled: true,
        title: {
          vi: 'Oria Spa Luôn Có Chỗ Cho Tất Cả Mọi Người',
          en: 'A Place for Everyone at Oria Spa',
          cn: 'Oria Spa 始终为每个人留有一席之地',
          jp: 'Oria Spaには誰もがくつろげる場所があります',
          kr: 'Oria Spa에는 모두를 위한 자리가 있습니다',
        },
        desc: {
          vi: 'Không gian ở đây đủ rộng để đón cùng lúc 27 khách, nên dù bạn đi một mình, đi cùng người thương, hay kéo cả nhóm bạn đông đủ, Oria Spa vẫn luôn có chỗ cho tất cả mọi người. Dịch vụ tại Oria Spa được thiết kế cho đủ mọi đổi tượng - nam, nữ, người trẻ, trung niên hay cao tuổi, ai đến cũng tìm được thứ phù hợp với mình.',
          en: 'The space is large enough to welcome 27 guests at once, so whether you come alone, with someone you love, or with a full group of friends, Oria Spa always has room for everyone. Services at Oria Spa are designed for every kind of guest - men, women, younger visitors, middle-aged guests, and seniors alike can all find something that suits them.',
          cn: '这里的空间宽敞，可同时接待27位宾客。无论您独自前来、与爱人同行，还是和一大群朋友结伴而来，Oria Spa始终能为每个人提供舒适的位置。Oria Spa的服务为不同人群而设计，无论男女、年轻人、中年人或长者，每位宾客都能找到适合自己的项目。',
          jp: '館内は一度に27名のお客様をお迎えできる広さがあり、お一人でも、大切な方とでも、大勢のご友人とでも、Oria Spaには皆様のための場所があります。Oria Spaのサービスは、男性・女性、若い方から中高年の方まで、あらゆるお客様が自分に合ったものを見つけられるよう設計されています。',
          kr: '이곳은 한 번에 27명의 고객을 맞이할 만큼 넓어 혼자 오셔도, 사랑하는 사람과 함께 오셔도, 많은 친구와 방문하셔도 Oria Spa에는 모두를 위한 자리가 있습니다. Oria Spa의 서비스는 남녀, 청년층, 중년층, 어르신까지 누구나 자신에게 맞는 관리를 찾을 수 있도록 설계되었습니다.',
        },
      },
      {
        icon: '🚪',
        image: '/images/about-cruise.png',
        watermarkEnabled: true,
        title: {
          vi: 'Mỗi Người Có Trải Nghiệm Riêng',
          en: 'A Personal Experience for Each Guest',
          cn: '每个人都有自己的体验',
          jp: '一人ひとりに合わせた体験',
          kr: '각자를 위한 개별적인 경험',
        },
        desc: {
          vi: 'Nếu đi cùng nhau hai người, một nam một nữ, thử kết hợp này xem: nam cắt tóc và lấy ráy tai, nữ gội đầu và massage chân - vừa đủ khác nhau để mỗi người có trải nghiệm riêng, vừa đủ gần để cùng kết thúc một lúc.',
          en: 'If two people come together, one man and one woman, try this combination: a haircut and ear cleaning for him, and a hair wash and foot massage for her - different enough for each person to enjoy an individual experience, yet close enough for both to finish at the same time.',
          cn: '如果两人同行，一位男士与一位女士，不妨尝试这样的组合：男士剪发并洁耳，女士洗发并享受足部按摩。项目各有不同，让每个人都拥有自己的体验，同时安排又足够接近，可以在差不多同一时间结束。',
          jp: '男女お二人でお越しなら、男性はヘアカットと耳掃除、女性はシャンプーとフットマッサージという組み合わせはいかがでしょう。それぞれが自分らしい体験を楽しめるほど異なりながら、同じ頃に終えられるほど近い時間でご案内できます。',
          kr: '남녀 두 분이 함께 방문한다면 이런 조합을 추천합니다. 남성은 헤어 커트와 귀 청소를, 여성은 헤어 워시와 발 마사지를 받아 보세요. 각자만의 경험을 즐길 만큼 다르면서도 비슷한 시간에 함께 마칠 수 있도록 조화롭게 구성할 수 있습니다.',
        },
      },
      {
        icon: '🌿',
        image: '/images/services/foot-massage.png',
        watermarkEnabled: true,
        title: {
          vi: 'Đầy Đủ Lựa Chọn Cho Từng Nhu Câu',
          en: 'A Complete Choice for Every Need',
          cn: '满足不同需求的完整选择',
          jp: 'あらゆるニーズに応える選択肢',
          kr: '모든 필요에 맞춘 다양한 선택',
        },
        desc: {
          vi: 'Về không gian, Oria Spa có đầy đủ lựa chọn cho từng nhu câu: phòng lớn cho các nhóm đông người, phòng đôi cho hai người muôn ở gần nhau, và phòng riêng cho ai thích sự yên tĩnh một mình. Với menu phổ thông, bạn sẽ được sắp xếp thợ và phòng phù hợp với dịch vụ mình chọn - nhanh gọn, không mất thời gian lựa chọn thêm. Còn với menu cao cấp, mặc định bạn sẽ được vào phòng riêng, được xem hình và tự chọn kỹ thuật viên theo đúng sở thích của mình.',
          en: 'For the setting, Oria Spa offers a complete choice for every need: large rooms for bigger groups, couple rooms for two people who want to stay close, and private rooms for anyone who prefers peaceful time alone. With the standard menu, a suitable therapist and room are arranged according to your selected service - quick, simple, and without extra choices. With the premium menu, a private room is provided by default, and you can view profiles and choose the therapist who best matches your preference.',
          cn: '在空间选择上，Oria Spa可以满足不同需求：大型房间适合多人团体，双人房适合希望彼此相伴的两位宾客，独立包间则留给喜欢安静独处的人。选择标准菜单时，我们会根据您所选的服务安排合适的技师与房间，快捷省心，无须再花时间挑选。选择高级菜单时，默认安排独立包间，您还可以查看照片，并依照个人喜好自行选择技师。',
          jp: '空間についても、Oria Spaはそれぞれのニーズに応える選択肢をご用意しています。大人数のグループには広い部屋、近くで過ごしたいお二人にはペアルーム、一人で静かに過ごしたい方には個室があります。スタンダードメニューでは、お選びのサービスに合うスタッフと部屋をこちらで手早く手配するため、追加の選択に時間を取られません。プレミアムメニューでは個室が標準となり、写真を見ながらお好みのセラピストを選べます。',
          kr: '공간 또한 필요에 따라 다양하게 선택할 수 있습니다. 많은 인원이 함께하는 그룹을 위한 대형 룸, 가까이 머물고 싶은 두 분을 위한 커플 룸, 혼자만의 고요함을 원하는 분을 위한 프라이빗 룸이 준비되어 있습니다. 스탠다드 메뉴는 선택한 서비스에 맞는 관리사와 룸을 빠르게 배정해 드려 추가 선택에 시간을 들일 필요가 없습니다. 프리미엄 메뉴는 기본적으로 프라이빗 룸이 제공되며, 사진을 보고 원하는 관리사를 직접 선택할 수 있습니다.',
        },
      },
      {
        icon: '🔥',
        image: '/images/about-treatment.png',
        watermarkEnabled: true,
        title: {
          vi: 'Một Hành Trình Phục Hồi Năng Lượng Toàn Diện',
          en: 'A Complete Journey of Renewal',
          cn: '一场全面恢复能量的旅程',
          jp: '心身のエネルギーを満たす回復の旅',
          kr: '온전한 에너지 회복의 여정',
        },
        desc: {
          vi: 'Dù bạn đến Oria Spa vì lý do gì - muôn thư giãn sau một ngày dài, muôn dành thời gian cho người thân, hay chỉ đơn giản là muốn thử điêu gì đó mới - chúng tôi luôn có một chỗ và một cách phù hợp để đón bạn. Đó chính là bấm huyệt chân và Aroma toàn thân được thực hiện bằng đôi bàn tay của các nghệ nhân, nơi mọi giác quan được đánh thức, một tách trà nóng, một âm điệu spa du dương như bản giao hưởng nâng từng nhịp xoa bóp trở thành một điệu nhạc cơ thể, mùi xông tinh dầu thiên nhiên, không gian yên tĩnh chìm vào giấc ngủ, một hành trình phục hồi năng lượng toàn diện. Đó là linh hồn của sự trải nghiệm mà Hệ Thống Oria Barbershop & Spa luôn hướng đến.',
          en: 'Whatever brings you to Oria Spa - the wish to relax after a long day, to spend time with loved ones, or simply to try something new - we always have a fitting place and a thoughtful way to welcome you. Here, foot reflexology and full-body Aroma treatments are performed by the hands of skilled artisans, awakening every sense: a warm cup of tea, soothing spa melodies like a symphony that turns each massage rhythm into music for the body, the scent of natural essential oils, and a quiet space that lets you drift into sleep. It is a complete journey of renewed energy. That is the soul of the experience toward which the Oria Barbershop & Spa System always aspires.',
          cn: '无论您因何来到Oria Spa——想在漫长的一天后放松身心、想陪伴挚爱亲友，或只是想尝试一些新鲜事物——我们总有合适的空间与方式迎接您。足底穴位按摩与全身Aroma护理由经验丰富的匠人双手完成，在这里，所有感官都会被唤醒：一杯热茶、如交响乐般悠扬的水疗旋律，让每一下按摩节奏化作身体的乐章；天然精油的香气、令人安然入睡的静谧空间，共同构成一场全面恢复能量的旅程。这正是Oria Barbershop & Spa连锁始终追求的体验灵魂。',
          jp: 'どのような理由でOria Spaを訪れるとしても、長い一日の終わりにくつろぎたいとき、大切な人と時間を過ごしたいとき、あるいはただ新しい何かを試してみたいとき、私たちはいつでもお客様に合った場所と迎え方をご用意しています。熟練した職人の手による足つぼと全身アロマトリートメントがすべての感覚を呼び覚まします。温かいお茶、マッサージの一つひとつのリズムを身体の音楽へと変える交響曲のような穏やかなスパ音楽、天然精油の香り、そして眠りへと誘う静かな空間。それは、心身のエネルギーを総合的に回復する旅です。これこそが、Oria Barbershop & Spaが常に目指している体験の真髄です。',
          kr: 'Oria Spa를 찾는 이유가 무엇이든, 긴 하루 끝에 쉬고 싶을 때, 소중한 사람과 시간을 보내고 싶을 때, 또는 그저 새로운 것을 경험하고 싶을 때, 저희는 언제나 고객에게 알맞은 공간과 방식으로 맞이합니다. 숙련된 장인의 손길로 진행되는 발 지압과 전신 아로마 관리는 모든 감각을 깨웁니다. 따뜻한 차 한 잔, 마사지의 리듬 하나하나를 몸을 위한 음악으로 바꾸는 교향곡 같은 잔잔한 스파 선율, 천연 에센셜 오일의 향기, 잠에 빠져들게 하는 고요한 공간이 어우러져 온전한 에너지 회복의 여정을 완성합니다. 이것이 바로 Oria Barbershop & Spa가 언제나 추구하는 경험의 본질입니다.',
        },
      },
    ],
    menuNiches: [
      {
        id: 'standard',
        order: '01',
        title: {
          vi: 'Menu Phổ Thông',
          en: 'Standard Menu',
          cn: '标准菜单',
          jp: 'スタンダードメニュー',
          kr: '스탠다드 메뉴',
        },
        tagline: {
          vi: 'Đầy đủ dịch vụ spa + barbershop',
          en: 'Full spa + barbershop services',
          cn: '全套水疗 + 理发服务',
          jp: 'スパ + 理容サービス完備',
          kr: '스파 + 이발소 서비스 전체',
        },
        summary: {
          vi: 'Đây là menu nền tảng, tổng hợp toàn bộ dịch vụ chăm sóc cơ thể và diện mạo trong một không gian — dành cho khách hàng muốn giải quyết nhiều nhu cầu trong một lần ghé, không cần di chuyển nhiều nơi.',
          en: 'This is the foundational menu, bringing together body care and grooming services in one space — for guests who want to take care of multiple needs in a single visit, without moving between different locations.',
          cn: '这是基础菜单，将身体护理与仪容护理服务整合在同一空间——适合希望在一次到店中解决多种需求、无需奔波多地的客人。',
          jp: 'ボディケアと身だしなみケアのサービスを一つの空間に集約した基本メニューです——複数の場所を移動することなく、一度の来店で様々なニーズを満たしたいお客様に最適です。',
          kr: '기본이 되는 메뉴로, 신체 관리와 그루밍 서비스를 한 공간에서 모두 제공합니다 — 여러 곳을 이동할 필요 없이 한 번의 방문으로 다양한 니즈를 해결하고 싶은 고객에게 적합합니다.',
        },
        included: {
          vi: 'Dịch vụ spa cơ bản (massage thư giãn, chăm sóc da mặt...), dịch vụ barbershop (tạo kiểu, cạo mặt...), đặc biệt là dịch vụ đặc trưng ráy tai chuyên nghiệp mang lại cảm giác sạch sẽ, thư giãn tức thì, thường được kết hợp sau cắt tóc hoặc massage.',
          en: 'Basic spa services (relaxation massage, facial care...), barbershop services (styling, face shaving...), and our signature professional ear-cleaning service that leaves you feeling instantly refreshed and relaxed.',
          cn: '基础水疗服务（放松按摩、面部护理等）、理发服务（造型、修面等），以及特色专业采耳服务，带来即时的清洁与放松体验，常作为理发或按摩后的附加项目。',
          jp: '基本スパサービス（リラクゼーションマッサージ、フェイシャルケアなど）、理容サービス（スタイリング、シェービングなど）、そして即座にすっきりと寛げる特色プロフェッショナル耳掃除サービス。',
          kr: '기본 스파 서비스(릴렉싱 마사지, 페이셜 케어 등), 이발소 서비스(스타일링, 면도 등), 즉각적인 청결과 편안함을 선사하는 시그니처 전문 귀 청소 서비스 포함.',
        },
        bestFor: {
          vi: 'Khách hàng muốn trải nghiệm nhanh gọn, tiện lợi — vừa chăm sóc cơ thể vừa chỉnh chu diện mạo trong một buổi; người mới trải nghiệm lần đầu; khách tìm mức chi phí hợp lý; giải quyết nhiều nhu cầu cùng lúc (tóc, mặt, tai...).',
          en: 'Guests who want a quick, convenient one-stop experience — caring for both body and appearance in one visit; first-time visitors; guests looking for reasonable pricing; solving multiple needs in one go.',
          cn: '追求快捷便利、在一次到店中兼顾身体与面貌打理的客人；初次体验者；追求合理价格与高性价比的客人；希望一站式解决多项小需求的客人。',
          jp: '手早く身だしなみとボディケアを整えたい方、初めてご利用の方、手頃な価格を重視される方、髪・顔・耳のケアを一度に済ませたい方。',
          kr: '한 번의 방문으로 신체 관리와 외모 관리를 빠르고 편리하게 해결하고 싶은 고객, 첫 방문 고객, 합리적인 가격을 원하는 고객, 여러 니즈를 한 번에 해결하고 싶은 고객.',
        },
        highlights: {
          vi: 'Menu có tính đại chúng nhất — quy trình tiêu chuẩn, thời gian phục vụ tối ưu, không cần đặt lịch phức tạp. Nhân viên điều phối linh hoạt theo dịch vụ, phòng chung rộng rãi thoáng đãng. Dịch vụ ráy tai là điểm nhấn đặc trưng giúp menu này khác biệt hoàn toàn.',
          en: 'The most accessible menu — standard process, optimized service time, ideal for regular use without complex booking. Random staff assignment, spacious airy shared rooms. Signature ear cleaning is the distinctive highlight.',
          cn: '最具大众化的菜单——标准化流程、优化服务时间，适合日常使用或初次体验，无需复杂预约。公共房间宽敞通风，特色采耳是区别于一般水疗理发店的标志亮点。',
          jp: '最も親しみやすいメニュー——標準化されたプロセスと最適化された時間で、日常使いにも最適。広々とした共有ルーム、特色ある耳掃除が他店との明確な違いを生み出します。',
          kr: '가장 대중적인 메뉴 — 표준화된 프로세스와 최적화된 소요 시간으로 복잡한 예약 불필요. 넓고 쾌적한 공용룸, 시그니처 귀 청소가 일반 스파와 차별화되는 하이라이트.',
        },
        image: '/images/barbershop.png',
        watermarkEnabled: true,
        ctaText: {
          vi: 'Khám Phá Menu Phổ Thông',
          en: 'Explore Standard Menu',
          cn: '探索标准菜单',
          jp: 'スタンダードメニューを見る',
          kr: '스탠다드 메뉴 알아보기',
        },
        ctaLink: '/{lang}/new-user/standard/checkout',
      },
      {
        id: 'luxury',
        order: '02',
        title: {
          vi: 'Menu Luxury — Design Your Journey',
          en: 'Luxury Menu — Design Your Journey',
          cn: '尊享菜单 — 专属定制旅程',
          jp: 'ラグジュアリーメニュー — ジャーニーデザイン',
          kr: '럭셔리 메뉴 — 나만의 여정 설계',
        },
        tagline: {
          vi: 'Phòng riêng · Tự thiết kế dịch vụ · Chọn nhân viên phù hợp',
          en: 'Private room · Design your own service · Choose preferred therapist',
          cn: '独立包间 · 自由定制服务 · 自选技师',
          jp: '完全個室 · 自分だけのサービス設計 · セラピスト指名',
          kr: '프라이빗 룸 · 나만의 서비스 설계 · 원하는 테라피스트 선택',
        },
        summary: {
          vi: 'Menu cao cấp dành cho khách hàng đề cao sự riêng tư, cá nhân hóa và chất lượng trải nghiệm ở mức tối đa. Khách hàng chủ động tự thiết kế toàn bộ hành trình trải nghiệm của mình thay vì theo quy trình có sẵn.',
          en: 'This is the premium menu for guests who value privacy, personalization, and the highest level of experience quality. Guests take full control of designing their own bespoke journey rather than following a fixed routine.',
          cn: '为重视隐私、个性化与极致体验品质的客人打造的高端菜单。不同于固定流程的标准菜单，尊享菜单让客人完全自主设计属于自己的整场体验。',
          jp: 'プライバシー、パーソナライズ、そして最高レベルの体験品質を重視するお客様のためのプレミアムメニュー。決まったコースではなく、ご自身で旅の全工程をデザインできます。',
          kr: '프라이버시, 개인화, 최상의 경험 품질을 중시하는 고객을 위한 프리미엄 메뉴입니다. 정해진 프로세스를 따르지 않고, 고객이 직접 자신만의 여정을 설계할 수 있습니다.',
        },
        included: {
          vi: 'Phòng riêng biệt lập yên tĩnh, kín đáo suốt buổi trị liệu; Tự thiết kế dịch vụ kết hợp linh hoạt nhiều dịch vụ theo đúng nhu cầu cá nhân; Xem hồ sơ/chuyên môn và tự chọn kỹ thuật viên có thế mạnh đúng mong muốn (deep tissue, chăm sóc da...).',
          en: 'Secluded private room throughout the session; Design your own service by combining multiple therapies to your exact needs; View therapist profiles and choose the specialist matching your preferences.',
          cn: '全程独立私密包间；根据自身需求自由组合多项服务（非固定套餐）；查阅技师专业背景与擅长领域，自主挑选最符合心意的技师（深层理疗、护肤专精等）。',
          jp: '施術の間ずっと他のお客様と共有しない完全個室；希望に合わせて複数のサービスを組み合わせる自由設計；セラピストのプロフィールを確認して得意分野を持つ担当者を指名可能。',
          kr: '시술 내내 독립된 조용한 프라이빗 룸; 본인의 니즈에 맞춘 자유로운 다중 서비스 조합 설계; 테라피스트 프로필 확인 후 원하는 전문 분야의 관리사 직접 선택.',
        },
        bestFor: {
          vi: 'Khách hàng đã có kinh nghiệm sử dụng dịch vụ, biết rõ mình cần gì; người coi trọng sự riêng tư tuyệt đối; khách muốn trải nghiệm được "may đo"; các dịp đặc biệt: sinh nhật, kỷ niệm, tiếp đãi đối tác quý.',
          en: 'Experienced spa-goers who know their body\'s needs; guests valuing absolute privacy; those desiring a tailored luxury experience; special occasions: birthdays, anniversaries, and VIP partner hosting.',
          cn: '已有丰富体验经验且明确需求的客人；极为重视绝对隐私的客人；追求量身定制体验者；特殊场合：生日、纪念日、商务接待或贵宾款待。',
          jp: 'すでに利用経験があり自分に必要なものを理解している方、完全なプライバシーを重視する方、オーダーメイド体験を求める方、記念日・誕生日やVIPのおもてなし。',
          kr: '자신의 니즈를 명확히 아는 경험 많은 고객, 절대적인 프라이버시를 중시하는 분, 맞춤형 경험을 원하는 고객, 특별한 날: 생일, 기념일, 비즈니스 파트너/귀빈 접대.',
        },
        highlights: {
          vi: 'Đây không phải là "mua dịch vụ" mà là "thiết kế trải nghiệm" — khách hàng là người chủ động từ không gian, nội dung đến người thực hiện. Cần đặt lịch trước để Oria Spa chuẩn bị chu đáo, sắp xếp đúng phòng và kỹ thuật viên ưng ý nhất.',
          en: 'This isn\'t "buying a service" — it is "designing an experience." The guest is in full control. Advance booking is required so Oria Spa can prepare the ideal room, specialist, and tailored amenities for you.',
          cn: '这并非单纯“购买服务”，而是“打造专属体验”——从空间、服务到技师由您全权主导。需提前预约以便Oria Spa妥善筹备，为您精准安排心仪房间与专职技师。',
          jp: '単なる「サービスの購入」ではなく「体験のデザイン」——空間から担当セラピストまでお客様が主導。最適な個室とセラピストを手配するため事前予約をお願いしております。',
          kr: '단순한 "서비스 구매"가 아니라 "경험을 설계"하는 것입니다 — 공간부터 담당 테라피스트까지 고객이 주도합니다. 완벽한 맞춤 준비를 위해 사전 예약이 필수입니다.',
        },
        image: '/images/history/2021-ngan-ha-treatment-beds.png',
        watermarkEnabled: true,
        ctaText: {
          vi: 'Thiết Kế Hành Trình Riêng',
          en: 'Design Your Journey',
          cn: '定制专属体验',
          jp: '旅をデザインする',
          kr: '나만의 여정 설계하기',
        },
        ctaLink: '/{lang}/new-user/standard/checkout',
      },
      {
        id: 'deep_body',
        order: '03',
        title: {
          vi: 'Menu Body Chuyên Sâu',
          en: 'Deep Body Therapy',
          cn: '深层理疗菜单',
          jp: 'ディープボディセラピー',
          kr: '딥 바디 테라피',
        },
        tagline: {
          vi: 'Tập trung massage và trị liệu chuyên sâu',
          en: 'Focused on massage and deep therapeutic treatment',
          cn: '专注按摩与深层理疗',
          jp: 'マッサージとディープセラピーに特化',
          kr: '마사지와 딥테라피 집중',
        },
        summary: {
          vi: 'Menu chuyên biệt tập trung 100% vào mục tiêu giải quyết các vấn đề cơ thể ở mức độ sâu — căng cơ mãn tính, đau vai gáy, mất ngủ do stress tích tụ và phục hồi năng lượng thể chất toàn diện.',
          en: 'This specialized menu focuses 100% on one goal: resolving deep-seated body issues — chronic muscle tension, neck and shoulder pain, stress-related insomnia, and total energy recovery.',
          cn: '本菜单100%专注于一个目标：解决身体深层问题——慢性肌肉劳损、肩颈酸痛、因压力累积的失眠，以及全身能量的深度恢复。',
          jp: '総合スパのように多様なサービスを広げるのではなく、慢性的な筋肉の張り、首・肩のコリ、ストレスによる不眠、活力回復など身体の深層問題の解決に100%集中する専門メニューです。',
          kr: '신체의 깊은 문제를 해결하는 데 100% 집중하는 전문 메뉴입니다: 만성 근육 긴장, 목·어깨 통증, 스트레스로 인한 불면증 완화 및 온전한 에너지 회복.',
        },
        included: {
          vi: 'Liệu trình massage trị liệu chuyên sâu (deep tissue, myofascial release, trigger point therapy...); Kỹ thuật viên giàu kinh nghiệm dùng lực mạnh và sâu; Đánh giá thể trạng trước khi thực hiện; Thời lượng từ 70 phút trở lên để chạm đến lớp cơ sâu.',
          en: 'Deep therapeutic massage modalities (deep tissue, myofascial release, trigger point); Experienced therapists applying strong, deep pressure; Pre-treatment body assessment; Extended duration (70+ mins) to reach deep muscle layers.',
          cn: '深层理疗按摩疗程（深层肌肉、筋膜放松、激痛点疗法）；经验丰富且熟练运用强劲深层力度的资深技师；护理前进行身体状况细致评估；70分钟以上充裕时长以触达深层肌肉。',
          jp: 'ディープセラピー施術（ディープティッシュ、筋膜リリース、トリガーポイント）；強く深い圧をコントロールできる熟練セラピスト；施術前の身体状態評価；深層筋に届く70分以上のセッション。',
          kr: '딥테라피 마사지 시술(딥티슈, 근막 이완, 트리거 포인트 테라피); 강하고 깊은 압을 능숙하게 다루는 숙련된 테라피스트; 시술 전 신체 상태 평가; 심층 근육에 도달하는 70분 이상의 충분한 시간.',
        },
        bestFor: {
          vi: 'Người làm việc văn phòng ngồi lâu đau mỏi vai gáy - lưng dưới; người mất ngủ do căng thẳng cơ bắp tích tụ; người vận động thể thao cần phục hồi cơ; khách quen với lực mạnh mong muốn tác động sâu thực sự.',
          en: 'Office workers sitting long hours with chronic neck, shoulder, and lower back pain; those suffering insomnia from muscle tension; athletes needing muscle recovery; guests accustomed to strong pressure desiring deep relief.',
          cn: '久坐办公、经常肩颈腰背酸痛的白领；因肌肉紧绷积累而失眠或浅眠者；运动量大需肌肉恢复者；习惯强力手法、希望明显感受深层渗透力的客人。',
          jp: '長時間のデスクワークで首・肩・腰のコリに悩むオフィスワーカー、筋肉の緊張による不眠に悩む方、運動後のリカバリーが必要な方、強い圧を好む方。',
          kr: '장시간 앉아서 근무하며 목·어깨·허리 통증을 겪는 직장인, 근육 긴장으로 불면이나 얕은 수면을 겪는 분, 운동 후 근육 회복이 필요한 스포츠 애호가, 강한 압을 선호하는 고객.',
        },
        highlights: {
          vi: 'Menu duy nhất định vị rõ là "trị liệu" chứ không chỉ "thư giãn" — mục tiêu là thay đổi thực sự tình trạng cơ thể. Vì sử dụng lực mạnh và sâu, menu này không khuyến khích cho khách hàng lần đầu massage, phù hợp nhất với người đã quen và thực sự có nhu cầu.',
          en: 'The only menu explicitly positioned as "therapy" rather than "relaxation" — designed to create measurable physical improvement. Due to deep, strong pressure, not recommended for first-time massage guests.',
          cn: '唯一明确定位为“理疗”而非单纯“放松”的菜单——旨在真正改善身体状况。因手法深层有力，本菜单不建议首次体验按摩的客人选择，最适合已有按摩习惯者。',
          jp: '「リラクゼーション」ではなく明確に「セラピー」として位置づけられた唯一のメニュー。強く深い圧を使用するため、マッサージ未経験の方にはおすすめせず、慣れた方に最適です。',
          kr: '"릴렉세이션"이 아닌 "테라피"로 명확히 포지셔닝된 유일한 메뉴 — 신체 상태를 근본적으로 개선합니다. 강하고 깊은 압을 사용하므로 첫 마사지 고객에게는 권장하지 않습니다.',
        },
        image: '/images/body-treatment-full.png',
        watermarkEnabled: true,
        ctaText: {
          vi: 'Đặt Lịch Trị Liệu Ngay',
          en: 'Book Deep Therapy',
          cn: '预约深层理疗',
          jp: 'ディープセラピーを予約',
          kr: '딥테라피 예약하기',
        },
        ctaLink: '/{lang}/new-user/standard/checkout',
      },
      {
        id: 'homespa',
        order: '04',
        title: {
          vi: 'Menu Homespa',
          en: 'Home Spa Menu',
          cn: '到家水疗菜单',
          jp: 'ホームスパメニュー',
          kr: '홈스파 메뉴',
        },
        tagline: {
          vi: 'KTV đến tận nhà — trải nghiệm spa không cần ra ngoài',
          en: 'Therapist comes to you — spa experience without leaving home',
          cn: '技师上门 —— 无需出门的水疗体验',
          jp: 'セラピストが訪問 — 外出せずに楽しむスパ体験',
          kr: '테라피스트가 직접 방문 — 외출 없이 즐기는 스파',
        },
        summary: {
          vi: 'Giải quyết rào cản di chuyển rất thực tế: thời tiết nắng gắt/mưa lớn, kẹt xe giờ cao điểm, hoặc đơn giản là sau một ngày dài chỉ muốn ở nhà thư giãn. Homespa mang dịch vụ xoa bóp đến tận không gian riêng của bạn.',
          en: 'This menu solves a very real friction: unpredictable weather, rush-hour traffic, or simply wanting to stay comfortably at home after a long day. Homespa brings premier spa therapy directly to your private sanctuary.',
          cn: '解决出行痛点：烈日暴雨天气、高峰交通拥堵，或是忙碌一天后只想留在家里。到家水疗将高品质按摩护理直接带入您的私密生活空间。',
          jp: '強い日差しや大雨、渋滞、あるいは長い一日の後に外出せず家にいたいという現実的な障壁を解決。ホームスパは上質なトリートメントをお客様のプライベート空間へお届けします。',
          kr: '궂은 날씨, 출퇴근길 교통체증, 또는 하루 끝에 편안한 내 집에서 쉬고 싶은 현실적인 장벽을 해결합니다. 홈스파는 전문 스파 서비스를 고객의 프라이빗한 공간으로 직접 전달합니다.',
        },
        included: {
          vi: 'Kỹ thuật viên di chuyển trực tiếp đến địa chỉ yêu cầu (nhà riêng, căn hộ, khách sạn...); Trang bị đầy đủ dụng cụ và tinh dầu chuyên nghiệp; Thực hiện chuẩn chỉnh liệu trình phù hợp thể trạng theo gói dịch vụ đã chọn.',
          en: 'Therapist travels to your requested address (home, apartment, hotel...); Fully equipped with professional spa tools and organic oils; Delivers the precise treatment matching your body\'s needs according to your chosen package.',
          cn: '技师前往您指定的地址（住宅、公寓、酒店等）；携带齐全的专业水疗器具与优质精油；根据所选套餐细致执行符合身体需求的专属疗程。',
          jp: 'セラピストがご指定先（自宅、マンション、ホテル等）へ訪問；プロ仕様の器具とオイルを持参；ご選択のパッケージに沿って身体のニーズに応じた丁寧な施術を行います。',
          kr: '테라피스트가 고객이 지정한 장소(자택, 아파트, 호텔 등)로 직접 방문; 전문 스파 장비와 천연 오일 완비; 선택하신 패키지에 맞춰 신체 니즈에 맞는 정성스러운 시술을 제공합니다.',
        },
        bestFor: {
          vi: 'Khách hàng bận rộn không có thời gian di chuyển; người ở khu vực xa, giao thông khó khăn; khách muốn trải nghiệm trong không gian quen thuộc riêng tư tuyệt đối; tiệc tại gia, chăm sóc gia đình đông người, người lớn tuổi hoặc phụ nữ sau sinh.',
          en: 'Busy guests with no time to travel; residents in distant areas; guests who prefer familiar private spaces; occasion-based groups: house parties, family wellness (multiple guests), elderly or postpartum women.',
          cn: '无暇出行的忙碌人士；居住偏远或交通不便的客人；希望在熟悉且绝对私密的家中享受服务的客人；居家聚会、家庭多人同时护理、行动不便的长辈或产后女性。',
          jp: '移動時間が取れない多忙な方、遠方や交通が不便な地域にお住まいの方、慣れた完全プライベートな空間を好む方、ホームパーティー、ご家族複数名のケア、外出が難しいご高齢者や産後の女性。',
          kr: '매장까지 이동할 시간이 없는 바쁜 고객, 외곽 지역 거주자, 익숙하고 완전한 프라이빗 공간을 원하는 분, 홈파티 및 다인 가족 케어, 외출이 불편한 어르신 또는 산후 여성.',
        },
        highlights: {
          vi: 'Homespa không phải bản thu nhỏ của spa tại chỗ, mà là giải pháp loại bỏ hoàn toàn rào cản về di chuyển và thời tiết, để việc chăm sóc cơ thể trở nên dễ tiếp cận bất kể hoàn cảnh.',
          en: 'Homespa is not a scaled-down version of an in-spa visit, but a dedicated solution removing commute and weather barriers, making wellness effortlessly accessible in every circumstance.',
          cn: '到家水疗并非门店服务的“缩水版”，而是专注解决出行与天气障碍的完整方案，让高品质身心关怀不受客观环境限制、随时可享。',
          jp: 'ホームスパは店舗の「簡易版」ではなく、移動や天候という障壁を完全に取り除き、どんな状況でも上質なボディケアを受けられるようにするためのソリューションです。',
          kr: '홈스파는 매장 서비스의 "축소판"이 아니라, 이동과 날씨라는 장벽을 완전히 없애 어떤 상황에서도 신체 관리를 쉽게 접할 수 있도록 하는 솔루션입니다.',
        },
        image: '/images/heel-care.png',
        watermarkEnabled: true,
        ctaText: {
          vi: 'Liên Hệ Đặt Lịch Homespa',
          en: 'Contact Homespa',
          cn: '联系到家水疗',
          jp: 'ホームスパを予約・相談',
          kr: '홈스파 문의 및 예약',
        },
        ctaLink: '/{lang}/oriahome',
      },
    ],
    ctaText: {
      vi: 'Đặt Lịch Trải Nghiệm Ngay',
      en: 'Reserve Your Experience',
      cn: '立即预约专属体验',
      jp: '今すぐ体験を予約する',
      kr: '지금 바로 예약하기',
    },
    ctaLink: null,
  },
});

export const hydrateOurStoryConfig = (saved: any): OurStoryConfig => {
  const defaults = createDefaultOurStoryConfig();
  if (!saved || typeof saved !== 'object') return defaults;

  const migrateSpecialtyCopy = Number(saved.contentVersion || 0) < 3;
  const specialtyLead = { ...defaults.specialtySection.lead, ...(saved.specialtySection?.lead || {}) };
  const specialtyPillars = Array.isArray(saved.specialtySection?.pillars) && saved.specialtySection.pillars.length > 0
    ? saved.specialtySection.pillars.map((item: any, idx: number) => ({
        ...(defaults.specialtySection.pillars[idx] || {}),
        ...item,
        watermarkEnabled: item.watermarkEnabled !== false,
        watermarkOpacity: typeof item.watermarkOpacity === 'number' ? Math.min(100, Math.max(5, item.watermarkOpacity)) : 15,
        image: item.image || defaults.specialtySection.pillars[idx]?.image,
        title: { ...(defaults.specialtySection.pillars[idx]?.title || {}), ...(item.title || {}) },
        desc: { ...(defaults.specialtySection.pillars[idx]?.desc || {}), ...(item.desc || {}) },
      }))
    : defaults.specialtySection.pillars;

  if (migrateSpecialtyCopy) {
    Object.assign(specialtyLead, defaults.specialtySection.lead);
    defaults.specialtySection.pillars.forEach((pillar, idx) => {
      if (!specialtyPillars[idx]) return;
      Object.assign(specialtyPillars[idx].title, pillar.title);
      Object.assign(specialtyPillars[idx].desc, pillar.desc);
    });
  }

  const defaultMenuNiches = defaults.specialtySection.menuNiches || [];
  const specialtyMenuNiches = Array.isArray(saved.specialtySection?.menuNiches) && saved.specialtySection.menuNiches.length > 0
    ? saved.specialtySection.menuNiches.map((item: any, idx: number) => {
        const fallback = defaultMenuNiches[idx] || defaultMenuNiches[0];
        return {
          id: item.id || fallback?.id || `menu-niche-${idx + 1}`,
          order: item.order || fallback?.order || String(idx + 1).padStart(2, '0'),
          image: item.image || fallback?.image || '/images/about-treatment.png',
          watermarkEnabled: item.watermarkEnabled !== false,
          watermarkOpacity: typeof item.watermarkOpacity === 'number' ? Math.min(100, Math.max(5, item.watermarkOpacity)) : 15,
          title: { ...(fallback?.title || {}), ...(item.title || {}) },
          tagline: { ...(fallback?.tagline || {}), ...(item.tagline || {}) },
          summary: { ...(fallback?.summary || {}), ...(item.summary || {}) },
          included: { ...(fallback?.included || {}), ...(item.included || {}) },
          bestFor: { ...(fallback?.bestFor || {}), ...(item.bestFor || {}) },
          highlights: { ...(fallback?.highlights || {}), ...(item.highlights || {}) },
          note: { ...(fallback?.note || {}), ...(item.note || {}) },
          ctaText: { ...(fallback?.ctaText || {}), ...(item.ctaText || {}) },
          ctaLink: item.ctaLink !== undefined ? item.ctaLink : fallback?.ctaLink,
        };
      })
    : defaultMenuNiches;

  return {
    contentVersion: 3,
    header: {
      badge: { ...defaults.header.badge, ...(saved.header?.badge || {}) },
      title: { ...defaults.header.title, ...(saved.header?.title || {}) },
      script: { ...defaults.header.script, ...(saved.header?.script || {}) },
      addressLabel: { ...defaults.header.addressLabel, ...(saved.header?.addressLabel || {}) },
      cityLabel: { ...defaults.header.cityLabel, ...(saved.header?.cityLabel || {}) },
    },
    locationSection: {
      title: { ...defaults.locationSection.title, ...(saved.locationSection?.title || {}) },
      text: { ...defaults.locationSection.text, ...(saved.locationSection?.text || {}) },
      strategicPosition: { ...defaults.locationSection.strategicPosition, ...(saved.locationSection?.strategicPosition || {}) },
      connectionsTitle: { ...defaults.locationSection.connectionsTitle, ...(saved.locationSection?.connectionsTitle || {}) },
      connections: Array.isArray(saved.locationSection?.connections) && saved.locationSection.connections.length > 0
        ? saved.locationSection.connections.map((item: any, idx: number) => ({
            ...(defaults.locationSection.connections[idx] || {}),
            ...item,
          }))
        : defaults.locationSection.connections,
      cityImage: saved.locationSection?.cityImage || defaults.locationSection.cityImage,
      cityImageWatermarkEnabled: saved.locationSection?.cityImageWatermarkEnabled !== false,
      cityImageWatermarkOpacity: typeof saved.locationSection?.cityImageWatermarkOpacity === 'number' ? Math.min(100, Math.max(5, saved.locationSection.cityImageWatermarkOpacity)) : 15,
      cityCaptionLeft: { ...defaults.locationSection.cityCaptionLeft, ...(saved.locationSection?.cityCaptionLeft || {}) },
      cityCaptionRight: { ...defaults.locationSection.cityCaptionRight, ...(saved.locationSection?.cityCaptionRight || {}) },
      streetSignImage: saved.locationSection?.streetSignImage || defaults.locationSection.streetSignImage,
      streetSignImageWatermarkEnabled: saved.locationSection?.streetSignImageWatermarkEnabled !== false,
      streetSignImageWatermarkOpacity: typeof saved.locationSection?.streetSignImageWatermarkOpacity === 'number' ? Math.min(100, Math.max(5, saved.locationSection.streetSignImageWatermarkOpacity)) : 15,
      imageCaption: { ...defaults.locationSection.imageCaption, ...(saved.locationSection?.imageCaption || {}) },
    },
    architectureSection: {
      title: { ...defaults.architectureSection.title, ...(saved.architectureSection?.title || {}) },
      features: Array.isArray(saved.architectureSection?.features) && saved.architectureSection.features.length > 0
        ? saved.architectureSection.features.map((item: any, idx: number) => ({
            ...(defaults.architectureSection.features[idx] || {}),
            ...item,
          }))
        : defaults.architectureSection.features,
      activityTitle: { ...defaults.architectureSection.activityTitle, ...(saved.architectureSection?.activityTitle || {}) },
      activityHint: { ...defaults.architectureSection.activityHint, ...(saved.architectureSection?.activityHint || {}) },
      activities: Array.isArray(saved.architectureSection?.activities) && saved.architectureSection.activities.length > 0
        ? saved.architectureSection.activities.map((item: any, idx: number) => ({
            ...(defaults.architectureSection.activities[idx] || {}),
            ...item,
          }))
        : defaults.architectureSection.activities,
    },
    filmReel: {
      title: { ...defaults.filmReel.title, ...(saved.filmReel?.title || {}) },
      frames: Array.isArray(saved.filmReel?.frames) && saved.filmReel.frames.length > 0
        ? saved.filmReel.frames.map((item: any, idx: number) => ({
            ...(defaults.filmReel.frames[idx] || { id: idx + 1, frameTag: `KODAK 500T • ${idx + 1}A ▶` }),
            ...item,
            watermarkEnabled: item.watermarkEnabled !== false,
            watermarkOpacity: typeof item.watermarkOpacity === 'number' ? Math.min(100, Math.max(5, item.watermarkOpacity)) : 15,
            badge: { ...(defaults.filmReel.frames[idx]?.badge || {}), ...(item.badge || {}) },
            title: { ...(defaults.filmReel.frames[idx]?.title || {}), ...(item.title || {}) },
            desc: { ...(defaults.filmReel.frames[idx]?.desc || {}), ...(item.desc || {}) },
          }))
        : defaults.filmReel.frames,
    },
    atmosphereSection: {
      title: { ...defaults.atmosphereSection.title, ...(saved.atmosphereSection?.title || {}) },
      morning: { ...defaults.atmosphereSection.morning, ...(saved.atmosphereSection?.morning || {}) },
      evening: { ...defaults.atmosphereSection.evening, ...(saved.atmosphereSection?.evening || {}) },
      landmark: { ...defaults.atmosphereSection.landmark, ...(saved.atmosphereSection?.landmark || {}) },
      nightStreetImage: saved.atmosphereSection?.nightStreetImage || defaults.atmosphereSection.nightStreetImage,
      nightStreetImageWatermarkEnabled: saved.atmosphereSection?.nightStreetImageWatermarkEnabled !== false,
      nightStreetImageWatermarkOpacity: typeof saved.atmosphereSection?.nightStreetImageWatermarkOpacity === 'number' ? Math.min(100, Math.max(5, saved.atmosphereSection.nightStreetImageWatermarkOpacity)) : 15,
      imageCaption: { ...defaults.atmosphereSection.imageCaption, ...(saved.atmosphereSection?.imageCaption || {}) },
    },
    specialtySection: {
      badge: { ...defaults.specialtySection.badge, ...(saved.specialtySection?.badge || {}) },
      headline: { ...defaults.specialtySection.headline, ...(saved.specialtySection?.headline || {}) },
      lead: specialtyLead,
      pillars: specialtyPillars,
      menuNiches: specialtyMenuNiches,
      ctaText: { ...defaults.specialtySection.ctaText, ...(saved.specialtySection?.ctaText || {}) },
      ctaLink: saved.specialtySection?.ctaLink === '/new-user/standard/checkout' ? null : (saved.specialtySection?.ctaLink || defaults.specialtySection.ctaLink),
    },
  };
};
