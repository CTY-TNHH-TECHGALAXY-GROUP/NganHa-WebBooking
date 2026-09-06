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
}

export interface OurStoryPillar {
  icon: string;
  image?: string;
  title: LocalizedString;
  desc: LocalizedString;
  watermarkEnabled?: boolean;
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
    cityCaptionLeft: LocalizedString;
    cityCaptionRight: LocalizedString;
    streetSignImage: string;
    streetSignImageWatermarkEnabled?: boolean;
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
    imageCaption: LocalizedString;
  };
  specialtySection: {
    badge: LocalizedString;
    headline: LocalizedString;
    lead: LocalizedString;
    pillars: OurStoryPillar[];
    ctaText: LocalizedString;
    ctaLink: string;
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
    ctaText: {
      vi: 'Đặt Lịch Trải Nghiệm Ngay',
      en: 'Reserve Your Experience',
      cn: '立即预约专属体验',
      jp: '今すぐ体験を予約する',
      kr: '지금 바로 예약하기',
    },
    ctaLink: '/new-user/standard/checkout',
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
      cityCaptionLeft: { ...defaults.locationSection.cityCaptionLeft, ...(saved.locationSection?.cityCaptionLeft || {}) },
      cityCaptionRight: { ...defaults.locationSection.cityCaptionRight, ...(saved.locationSection?.cityCaptionRight || {}) },
      streetSignImage: saved.locationSection?.streetSignImage || defaults.locationSection.streetSignImage,
      streetSignImageWatermarkEnabled: saved.locationSection?.streetSignImageWatermarkEnabled !== false,
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
      imageCaption: { ...defaults.atmosphereSection.imageCaption, ...(saved.atmosphereSection?.imageCaption || {}) },
    },
    specialtySection: {
      badge: { ...defaults.specialtySection.badge, ...(saved.specialtySection?.badge || {}) },
      headline: { ...defaults.specialtySection.headline, ...(saved.specialtySection?.headline || {}) },
      lead: specialtyLead,
      pillars: specialtyPillars,
      ctaText: { ...defaults.specialtySection.ctaText, ...(saved.specialtySection?.ctaText || {}) },
      ctaLink: saved.specialtySection?.ctaLink || defaults.specialtySection.ctaLink,
    },
  };
};
