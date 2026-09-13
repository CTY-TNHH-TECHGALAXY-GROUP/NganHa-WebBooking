export type SpaceLang = 'vi' | 'en' | 'cn' | 'jp' | 'kr';

export interface SpaceChapter {
  number: string;
  title: string;
  subtitle: string;
  videoLabel: string;
  playFilm: string;
  explore: string;
  tabs: Record<string, string>;
}

export interface SpaceContent {
  nav: {
    hero: string;
    welcome: string;
    floor1: string;
    floor2: string;
  };
  hero: {
    title: string;
    titleEm: string;
    subtitle: string;
    scrollPrompt: string;
  };
  chapter1: SpaceChapter;
  interlude: {
    small: string;
    quote1: string;
    quote2: string;
  };
  chapter2: SpaceChapter;
  chapter3: SpaceChapter;
  gallery: {
    title1: string;
    title2: string;
    desc: string;
    mainTitle: string;
    sideTop: string;
    sideBottom: string;
  };
  capacity: {
    kicker: string;
    title: string;
    introPrimary: string;
    introSecondary: string;
    capacityLabel: string;
    capacityTitle: string;
    capacityDescription: string;
    facilityTitle: string;
    facilityDescription: string;
    facilities: Array<{ title: string; description: string }>;
    closingPrimary: string;
    closingHighlight: string;
    groupNote: string;
  };
  cta: {
    title1: string;
    title2: string;
    desc: string;
    exploreBtn: string;
    bookBtn: string;
  };
  footer: {
    tagline: string;
    concept: string;
  };
}

export const spaceLocalization: Record<SpaceLang, SpaceContent> = {
  vi: {
    nav: {
      hero: 'Trang đầu',
      welcome: 'Khu vực đón khách',
      floor1: 'Tầng 1',
      floor2: 'Tầng 2',
    },
    hero: {
      title: 'Không gian,',
      titleEm: 'cảm nhận chầm chậm.',
      subtitle: 'Ba không gian. Một hành trình tiếp nối qua ánh sáng, xúc chạm và tĩnh lặng.',
      scrollPrompt: 'Cuộn để khám phá',
    },
    chapter1: {
      number: '01 / Đến nơi',
      title: 'Khu vực đón khách',
      subtitle: 'Bước chuyển êm dịu từ sự náo nhiệt bên ngoài bước vào nhịp điệu tĩnh lặng của Oria.',
      videoLabel: 'Khu vực đón khách / Phim 01',
      playFilm: 'Phát phim',
      explore: 'Khám phá không gian này',
      tabs: {
        reception: 'Quầy lễ tân',
        lounge: 'Sảnh chờ',
        ritual: 'Nghi thức trà',
      },
    },
    interlude: {
      small: 'Từ khoảnh khắc bước vào đến khi bắt đầu liệu trình',
      quote1: 'Không có gì làm gián đoạn',
      quote2: 'cảm giác trọn vẹn của không gian.',
    },
    chapter2: {
      number: '02 / Trị liệu',
      title: 'Tầng 1',
      subtitle: 'Tầng trị liệu sinh động được kiến tạo bởi chuyển động, kỹ thuật điêu luyện và xúc chạm ấm áp.',
      videoLabel: 'Tầng 1 / Phim 02',
      playFilm: 'Phát phim',
      explore: 'Khám phá tầng này',
      tabs: {
        body: 'Chăm sóc cơ thể',
        foot: 'Chăm sóc chân',
        private: 'Phòng riêng',
      },
    },
    chapter3: {
      number: '03 / Thư giãn sâu',
      title: 'Tầng 2',
      subtitle: 'Yên tĩnh hơn, riêng tư hơn và chậm rãi lắng đọng trong từng đường nét không gian và thị giác.',
      videoLabel: 'Tầng 2 / Phim 03',
      playFilm: 'Phát phim',
      explore: 'Khám phá tầng này',
      tabs: {
        suite: 'Phòng Suite VIP',
        headSpa: 'Gội đầu dưỡng sinh',
        quiet: 'Khu tĩnh lặng',
      },
    },
    gallery: {
      title1: 'Vài nét chi tiết,',
      title2: 'thuần khiết giản đơn.',
      desc: 'Những lát cắt tĩnh lặng lưu giữ khoảnh khắc, tôn vinh trọn vẹn vẻ đẹp nguyên bản của không gian.',
      mainTitle: 'Chi tiết liệu trình massage',
      sideTop: 'Liệu trình chăm sóc',
      sideBottom: 'Không gian phòng Spa',
    },
    capacity: {
      kicker: '04 / Cùng nhau',
      title: 'Một không gian cho mọi người.',
      introPrimary: 'Một không gian để mọi người có thể đến cùng nhau và thư giãn theo cách riêng.',
      introSecondary: 'OriaSpa đón tiếp khách nam, khách nữ, gia đình, người lớn tuổi và trẻ em với nhiều dịch vụ phù hợp cho từng độ tuổi và nhu cầu.',
      capacityLabel: 'Sức chứa cùng lúc',
      capacityTitle: 'Đủ không gian cho cả gia đình.',
      capacityDescription: 'Với sức chứa lên đến 27 khách cùng lúc, OriaSpa phù hợp cho khách đi một mình, cặp đôi, nhóm bạn, gia đình nhiều thế hệ và đoàn khách. Mỗi người có thể lựa chọn dịch vụ và thời lượng riêng mà không cần tách khỏi lịch trình chung.',
      facilityTitle: 'Nhiều nhu cầu. Một không gian đầy đủ.',
      facilityDescription: 'OriaSpa được bố trí nhiều khu vực chuyên biệt để các thành viên có thể lựa chọn những dịch vụ khác nhau và được phục vụ trong cùng một thời điểm.',
      facilities: [
        { title: 'Ghế chăm sóc chân', description: 'Khu vực riêng dành cho thư giãn chân, chăm sóc bàn chân và các liệu trình nhẹ nhàng.' },
        { title: 'Ghế cắt tóc', description: 'Phục vụ cắt tóc nam, cạo râu và các bước chăm sóc cá nhân trong cùng một hành trình thư giãn.' },
        { title: 'Giường chăm sóc cơ thể', description: 'Không gian dành cho trị liệu toàn thân, cổ vai gáy và nhiều liệu trình chăm sóc cơ thể.' },
        { title: 'Giường gội đầu', description: 'Phù hợp cho gội đầu thư giãn, chăm sóc tóc và các combo kết hợp chăm sóc đầu, cổ, vai, gáy.' },
      ],
      closingPrimary: 'Đến cùng nhau. ',
      closingHighlight: 'Thư giãn theo cách riêng.',
      groupNote: 'Với nhóm đông, vui lòng liên hệ trước để được sắp xếp chu đáo.',
    },
    cta: {
      title1: 'Hãy đến và cảm nhận',
      title2: 'bằng chính giác quan của bạn.',
      desc: 'Khi đã thấu hiểu không gian, bước tiếp theo thật nhẹ nhàng và giản đơn.',
      exploreBtn: 'Khám phá dịch vụ',
      bookBtn: 'Đặt lịch trải nghiệm',
    },
    footer: {
      tagline: 'OriaSpa — Để chúng tôi thấu hiểu bạn',
      concept: 'Ý niệm không gian tối giản / 03',
    },
  },
  en: {
    nav: {
      hero: 'Hero',
      welcome: 'Welcome Area',
      floor1: 'First Floor',
      floor2: 'Second Floor',
    },
    hero: {
      title: 'Space,',
      titleEm: 'felt slowly.',
      subtitle: 'Three spaces. One continuous journey through light, touch and quiet.',
      scrollPrompt: 'Scroll to enter',
    },
    chapter1: {
      number: '01 / Arrival',
      title: 'Welcome Area',
      subtitle: 'A soft transition from outside movement into the calm rhythm of Oria.',
      videoLabel: 'Welcome Area / Film 01',
      playFilm: 'Play film',
      explore: 'Explore within this space',
      tabs: {
        reception: 'Reception',
        lounge: 'Lounge',
        ritual: 'Ritual',
      },
    },
    interlude: {
      small: 'From arrival to treatment',
      quote1: 'Nothing should interrupt',
      quote2: 'the feeling of the space.',
    },
    chapter2: {
      number: '02 / Therapy',
      title: 'First Floor',
      subtitle: 'A more active treatment floor shaped by movement, technique and human touch.',
      videoLabel: 'First Floor / Film 02',
      playFilm: 'Play film',
      explore: 'Explore within this floor',
      tabs: {
        body: 'Body Care',
        foot: 'Foot Care',
        private: 'Private Room',
      },
    },
    chapter3: {
      number: '03 / Retreat',
      title: 'Second Floor',
      subtitle: 'Quieter, more private, and deliberately slower in both space and visual rhythm.',
      videoLabel: 'Second Floor / Film 03',
      playFilm: 'Play film',
      explore: 'Explore within this floor',
      tabs: {
        suite: 'VIP Suite',
        headSpa: 'Head Spa',
        quiet: 'Quiet Lounge',
      },
    },
    gallery: {
      title1: 'A few details,',
      title2: 'nothing more.',
      desc: 'Only use still photography after the three main videos. This prevents the page from competing with the film content.',
      mainTitle: 'Massage detail',
      sideTop: 'Treatment',
      sideBottom: 'Spa room',
    },
    capacity: {
      kicker: '04 / Together',
      title: 'A space for everyone.',
      introPrimary: 'A place where everyone can arrive together and relax in their own way.',
      introSecondary: 'OriaSpa welcomes men, women, families, older guests and children, with services suited to different ages and needs.',
      capacityLabel: 'Capacity at one time',
      capacityTitle: 'Room for the whole family.',
      capacityDescription: 'With space for up to 27 guests at once, OriaSpa is suitable for individuals, couples, groups of friends, multigenerational families and larger parties. Each guest can choose a different service and duration while staying within the same shared schedule.',
      facilityTitle: 'Different needs. One complete space.',
      facilityDescription: 'OriaSpa includes several purpose-designed areas, allowing family members to enjoy different services at the same time.',
      facilities: [
        { title: 'Foot care chairs', description: 'A dedicated area for foot relaxation, detailed foot care and gentle treatments.' },
        { title: 'Barber chairs', description: 'For men’s haircuts, shaving and personal grooming as part of the same relaxing visit.' },
        { title: 'Body treatment beds', description: 'A private setting for full-body care, head, neck and shoulder treatments, and other body rituals.' },
        { title: 'Hair-wash beds', description: 'Designed for relaxing hair washes, hair care and combinations with head, neck and shoulder care.' },
      ],
      closingPrimary: 'Come together. ',
      closingHighlight: 'Relax your own way.',
      groupNote: 'For larger groups, please contact us in advance so we can prepare everything thoughtfully.',
    },
    cta: {
      title1: 'Come feel',
      title2: 'it yourself.',
      desc: 'The page ends before it becomes repetitive. Once the guest understands the space, the next action should be simple.',
      exploreBtn: 'Explore treatments',
      bookBtn: 'Book your visit',
    },
    footer: {
      tagline: 'OriaSpa — Let us understand you',
      concept: 'Minimal Space Concept / 03',
    },
  },
  cn: {
    nav: {
      hero: '首屏',
      welcome: '接待大厅',
      floor1: '一层',
      floor2: '二层',
    },
    hero: {
      title: '空间，',
      titleEm: '慢品入微。',
      subtitle: '三处空间。一段融合光影、触感与静谧的连续旅程。',
      scrollPrompt: '向下滚动以进入',
    },
    chapter1: {
      number: '01 / 抵达',
      title: '接待大厅',
      subtitle: '从喧嚣的外部节奏，轻柔过渡至 Oria 的静谧韵律。',
      videoLabel: '接待大厅 / 影像 01',
      playFilm: '播放影片',
      explore: '探索此空间',
      tabs: {
        reception: '接待前台',
        lounge: '休闲贵宾厅',
        ritual: '仪式空间',
      },
    },
    interlude: {
      small: '从抵达那一刻至疗程展开',
      quote1: '不应有任何打扰',
      quote2: '这一份沉浸的空间触感。',
    },
    chapter2: {
      number: '02 / 疗愈',
      title: '一层',
      subtitle: '更为生动的护理空间，由韵律流动、专业手法与指尖温度共同塑造。',
      videoLabel: '一层 / 影像 02',
      playFilm: '播放影片',
      explore: '探索此楼层',
      tabs: {
        body: '身体护理',
        foot: '足部护理',
        private: '独立包间',
      },
    },
    chapter3: {
      number: '03 / 静幽',
      title: '二层',
      subtitle: '更为幽静隐密，在空间营造与视觉节奏上皆舒缓沉潜。',
      videoLabel: '二层 / 影像 03',
      playFilm: '播放影片',
      explore: '探索此楼层',
      tabs: {
        suite: 'VIP 套间',
        headSpa: '头部水疗',
        quiet: '静休区',
      },
    },
    gallery: {
      title1: '细微之处，',
      title2: '恰到好处。',
      desc: '静止的光影定格于三段主影片之后，与动态影像交相呼应，余韵悠长。',
      mainTitle: '按摩特写',
      sideTop: '护理体验',
      sideBottom: '水疗雅室',
    },
    capacity: {
      kicker: '04 / 相聚',
      title: '一个适合每一位客人的空间。',
      introPrimary: '让大家可以一同到来，并以各自喜欢的方式放松身心。',
      introSecondary: 'OriaSpa 接待男士、女士、家庭、长者与儿童，并根据不同年龄和需求提供合适的服务。',
      capacityLabel: '同时接待人数',
      capacityTitle: '为全家人留出充足空间。',
      capacityDescription: 'OriaSpa 可同时接待多达 27 位客人，适合个人、情侣、朋友聚会、多代家庭及团体。每位客人都可以选择不同的服务与时长，同时保留共同的行程安排。',
      facilityTitle: '不同需求。一个完整空间。',
      facilityDescription: 'OriaSpa 设有多个专属服务区域，让家人能够在同一时间体验不同的护理项目。',
      facilities: [
        { title: '足部护理椅', description: '专为足部放松、细致护理及轻柔疗程设置的区域。' },
        { title: '理发椅', description: '提供男士理发、剃须与个人仪容护理，让放松体验更加完整。' },
        { title: '身体护理床', description: '适合全身护理、头颈肩放松及多种身体疗程的私密空间。' },
        { title: '洗发床', description: '适用于放松洗发、头发护理，以及结合头部、颈部和肩部护理的套餐。' },
      ],
      closingPrimary: '一同到来。 ',
      closingHighlight: '以自己的方式放松。',
      groupNote: '如为多人同行，请提前联系我们，以便妥善安排。',
    },
    cta: {
      title1: '亲临体会',
      title2: '属于您的舒适。',
      desc: '感知空间之后，开启专属于您的水疗旅程。',
      exploreBtn: '探索护理项目',
      bookBtn: '预约到店',
    },
    footer: {
      tagline: 'OriaSpa — 让我们倾听并理解您',
      concept: '极简空间美学 / 03',
    },
  },
  jp: {
    nav: {
      hero: 'トップ',
      welcome: 'ウェルカムエリア',
      floor1: '1階',
      floor2: '2階',
    },
    hero: {
      title: '空間を、',
      titleEm: '静かに感じる。',
      subtitle: '三つの空間。光、感触、静けさを巡るひとすじの旅。',
      scrollPrompt: 'スクロールして進む',
    },
    chapter1: {
      number: '01 / 到着',
      title: 'ウェルカムエリア',
      subtitle: '外の喧騒から、Oriaの穏やかなリズムへと導く柔らかなグラデーション。',
      videoLabel: 'ウェルカムエリア / 映像 01',
      playFilm: '再生',
      explore: 'この空間を見る',
      tabs: {
        reception: 'レセプション',
        lounge: 'ラウンジ',
        ritual: 'リチュアル',
      },
    },
    interlude: {
      small: '到着からトリートメントへ',
      quote1: '何ものにも遮られない',
      quote2: '空間の心地よさ。',
    },
    chapter2: {
      number: '02 / セラピー',
      title: '1階',
      subtitle: '流れるような動き、卓越した手技、温もりある人の手が織りなすトリートメント空間。',
      videoLabel: '1階 / 映像 02',
      playFilm: '再生',
      explore: 'このフロアを見る',
      tabs: {
        body: 'ボディケア',
        foot: 'フットケア',
        private: '個室',
      },
    },
    chapter3: {
      number: '03 / リトリート',
      title: '2階',
      subtitle: 'より静かに、よりプライベートに。空間も視覚のリズムも穏やかにほどけてゆく。',
      videoLabel: '2階 / 映像 03',
      playFilm: '再生',
      explore: 'このフロアを見る',
      tabs: {
        suite: 'VIP スイート',
        headSpa: 'ヘッドスパ',
        quiet: 'クワイエットルーム',
      },
    },
    gallery: {
      title1: 'わずかなディテール、',
      title2: 'それだけで十分。',
      desc: '3つの映像を終えた後に佇む静止画。映像の余韻を妨げることなく、静けさを届けます。',
      mainTitle: 'マッサージのディテール',
      sideTop: 'トリートメント',
      sideBottom: 'スパルーム',
    },
    capacity: {
      kicker: '04 / 一緒に',
      title: 'すべての方のためのひとつの空間。',
      introPrimary: 'みんなで訪れ、それぞれの過ごし方でくつろげる空間です。',
      introSecondary: 'OriaSpaでは、男性、女性、ご家族、ご年配の方、お子様まで、年齢やご希望に合わせたサービスをご用意しています。',
      capacityLabel: '同時利用人数',
      capacityTitle: 'ご家族みんなで過ごせる空間。',
      capacityDescription: 'OriaSpaは一度に最大27名様までご利用いただけます。お一人、カップル、ご友人同士、多世代のご家族、グループでのご来店に適しています。同じスケジュールの中で、それぞれ異なるサービスや時間をお選びいただけます。',
      facilityTitle: '異なるニーズ。ひとつの充実した空間。',
      facilityDescription: 'OriaSpaには目的に合わせた複数の専用エリアがあり、ご家族が同じ時間に異なるサービスを受けられます。',
      facilities: [
        { title: 'フットケアチェア', description: '足のリラックス、丁寧なフットケア、やさしい施術のための専用エリアです。' },
        { title: 'バーバーチェア', description: 'メンズカット、シェービング、身だしなみケアを、ひとつのくつろぎの時間としてご利用いただけます。' },
        { title: 'ボディケアベッド', description: '全身ケア、頭・首・肩のケア、さまざまなボディトリートメントに適したプライベート空間です。' },
        { title: 'シャンプーベッド', description: 'リラックスシャンプー、ヘアケア、頭・首・肩のケアを組み合わせたコースに対応しています。' },
      ],
      closingPrimary: '一緒に訪れて。 ',
      closingHighlight: '自分らしくくつろぐ。',
      groupNote: '大人数でご来店の際は、スムーズにご案内できるよう事前にご連絡ください。',
    },
    cta: {
      title1: '心地よさを',
      title2: '体感してください。',
      desc: '空間の息づかいを感じたら、次のステップへとお進みください。',
      exploreBtn: 'メニューを見る',
      bookBtn: '来店予約する',
    },
    footer: {
      tagline: 'OriaSpa — あなたに寄り添い、理解する場所',
      concept: 'ミニマル空間コンセプト / 03',
    },
  },
  kr: {
    nav: {
      hero: '홈',
      welcome: '웰컴 구역',
      floor1: '1층',
      floor2: '2층',
    },
    hero: {
      title: '공간을,',
      titleEm: '천천히 느끼다.',
      subtitle: '세 개의 공간. 빛과 손길, 고요함을 지나 이어지는 하나의 여정.',
      scrollPrompt: '스크롤하여 입장하기',
    },
    chapter1: {
      number: '01 / 도착',
      title: '웰컴 구역',
      subtitle: '바깥의 분주함에서 Oria의 고요한 리듬으로 부드럽게 이어지는 전환.',
      videoLabel: '웰컴 구역 / 영상 01',
      playFilm: '영상 재생',
      explore: '이 공간 살펴보기',
      tabs: {
        reception: '리셉션',
        lounge: '라운지',
        ritual: '리추얼',
      },
    },
    interlude: {
      small: '도착부터 트리트먼트까지',
      quote1: '그 무엇도 방해할 수 없는',
      quote2: '공간 그대로의 감각.',
    },
    chapter2: {
      number: '02 / 테라피',
      title: '1층',
      subtitle: '섬세한 움직임과 숙련된 테크닉, 따뜻한 손길이 어우러지는 활력의 힐링 공간.',
      videoLabel: '1층 / 영상 02',
      playFilm: '영상 재생',
      explore: '이 층 살펴보기',
      tabs: {
        body: '바디 케어',
        foot: '풋 케어',
        private: '프라이빗 룸',
      },
    },
    chapter3: {
      number: '03 / 리트리트',
      title: '2층',
      subtitle: '더욱 고요하고 프라이빗하게, 공간과 시선의 리듬 모두 한층 깊어지는 여유.',
      videoLabel: '2층 / 영상 03',
      playFilm: '영상 재생',
      explore: '이 층 살펴보기',
      tabs: {
        suite: 'VIP 스위트',
        headSpa: '헤드스파',
        quiet: '콰이어트 라운지',
      },
    },
    gallery: {
      title1: '몇 가지 디테일,',
      title2: '그 이상의 것은 없이.',
      desc: '세 편의 주요 영상 뒤로 이어지는 스틸 사진들이 공간 본연의 차분한 여운을 전합니다.',
      mainTitle: '마사지 디테일',
      sideTop: '트리트먼트',
      sideBottom: '스파 룸',
    },
    capacity: {
      kicker: '04 / 함께',
      title: '모두를 위한 하나의 공간.',
      introPrimary: '모두 함께 방문해 각자의 방식으로 편안하게 쉴 수 있는 공간입니다.',
      introSecondary: 'OriaSpa는 남성, 여성, 가족, 어르신과 어린이를 맞이하며 연령과 필요에 맞는 다양한 서비스를 제공합니다.',
      capacityLabel: '동시 이용 가능 인원',
      capacityTitle: '온 가족을 위한 충분한 공간.',
      capacityDescription: 'OriaSpa는 한 번에 최대 27명까지 이용할 수 있어 개인, 커플, 친구 모임, 여러 세대가 함께하는 가족 및 단체 방문에 적합합니다. 같은 일정 안에서도 각자 원하는 서비스와 시간을 선택할 수 있습니다.',
      facilityTitle: '서로 다른 필요. 하나의 완성된 공간.',
      facilityDescription: 'OriaSpa는 용도별 공간을 갖추어 가족 구성원이 같은 시간에 서로 다른 서비스를 이용할 수 있습니다.',
      facilities: [
        { title: '풋 케어 체어', description: '발의 휴식과 세심한 풋 케어, 부드러운 관리를 위한 전용 공간입니다.' },
        { title: '바버 체어', description: '남성 헤어 커트, 면도 및 개인 그루밍을 한 번의 편안한 방문 안에서 제공합니다.' },
        { title: '바디 케어 베드', description: '전신 케어, 머리·목·어깨 관리와 다양한 바디 프로그램을 위한 프라이빗한 공간입니다.' },
        { title: '샴푸 베드', description: '편안한 샴푸, 헤어 케어 및 머리·목·어깨 관리를 결합한 프로그램에 적합합니다.' },
      ],
      closingPrimary: '함께 방문하고. ',
      closingHighlight: '각자의 방식으로 쉬어가세요.',
      groupNote: '단체 방문 시 원활한 준비를 위해 미리 연락해 주세요.',
    },
    cta: {
      title1: '직접 오셔서',
      title2: '그 감각을 느껴보세요.',
      desc: '공간을 충분히 느끼셨다면, 이제 당신만을 위한 다음 여정을 시작해 보세요.',
      exploreBtn: '프로그램 살펴보기',
      bookBtn: '예약하기',
    },
    footer: {
      tagline: 'OriaSpa — 당신을 온전히 이해하는 곳',
      concept: '미니멀 스페이스 콘셉트 / 03',
    },
  },
};

export const getSpaceContent = (lang: string): SpaceContent => {
  const validLang: SpaceLang = (['vi', 'en', 'cn', 'jp', 'kr'].includes(lang) ? lang : 'en') as SpaceLang;
  return spaceLocalization[validLang] || spaceLocalization.en;
};
