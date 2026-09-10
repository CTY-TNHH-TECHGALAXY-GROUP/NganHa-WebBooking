export type LocalizedString = Record<string, string>;

export interface LocalTourDestination {
  id: number;
  image: string;
  name: LocalizedString;
}

export interface LocalTourHighlight {
  image: string;
  images?: string[];
  title: LocalizedString;
  subtitle: LocalizedString;
}

export interface LocalTourPackage {
  id: string;
  slug?: string;
  orderNumber: string;
  title: LocalizedString;
  tagline?: LocalizedString;
  heroImage?: string;
  time: LocalizedString;
  durationLabel?: LocalizedString;
  schedule?: LocalizedString[];
  paragraphs: LocalizedString[];
  bestFor: LocalizedString;
  destinationIds: number[];
  highlights?: LocalTourHighlight[];
}

export interface LocalTourConfig {
  docTitle: LocalizedString;
  docScript: LocalizedString;
  docIntro: LocalizedString;
  docIntroSub: LocalizedString;
  forLabel: LocalizedString;
  docClosing: LocalizedString;
  address?: LocalizedString;
  packages: LocalTourPackage[];
  destinations: LocalTourDestination[];
}

export const DEFAULT_DESTINATIONS: LocalTourDestination[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
    name: {
      vi: 'Oria Spa Bờ Sông Sài Gòn & Đường Đồng Khởi',
      en: 'Oria Spa Saigon Riverfront & Đồng Khởi Street',
      cn: '西贡河畔 Oria Spa 与同起街',
      jp: 'サイゴン川沿いのOria Spaとドンコイ通り',
      kr: '사이공 강변의 Oria Spa와 동커이 거리',
    },
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=800&q=80',
    name: {
      vi: 'Nhà Thờ Đức Bà',
      en: 'Notre-Dame Cathedral',
      cn: '红教堂（圣母大教堂）',
      jp: 'サイゴン大教会',
      kr: '노트르담 대성당',
    },
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    name: {
      vi: 'Bưu Điện Thành Phố',
      en: 'Central Post Office',
      cn: '西贡中央邮政局',
      jp: 'サイゴン中央郵便局',
      kr: '사이공 중앙우체국',
    },
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
    name: {
      vi: 'Dinh Độc Lập (Hội Trường Thống Nhất)',
      en: 'Independence Palace',
      cn: '统一宫',
      jp: '統一会堂',
      kr: '통일궁',
    },
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    name: {
      vi: 'Bảo Tàng Chứng Tích Chiến Tranh',
      en: 'War Remnants Museum',
      cn: '战争遗迹博物馆',
      jp: '戦争証跡博物館',
      kr: '전쟁증적박물관',
    },
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    name: {
      vi: 'Dùng Bữa Tại Nhà Hàng Việt Bản Địa',
      en: 'Authentic Local Vietnamese Dining',
      cn: '地道越南传统餐厅用餐',
      jp: '地元のベトナム料理店でお食事',
      kr: '현지 베트남 레스토랑 식사',
    },
  },
  {
    id: 7,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    name: {
      vi: 'Trị Liệu Phục Hồi 70 Phút Tại Oria Spa',
      en: '70-Minute Massage at Oria Spa',
      cn: 'Oria Spa 70分钟按摩理疗',
      jp: 'Oria Spaで70分のマッサージ',
      kr: 'Oria Spa 70분 마사지',
    },
  },
  {
    id: 8,
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    name: {
      vi: 'Nhà Hát Thành Phố (Saigon Opera House)',
      en: 'Saigon Opera House',
      cn: '西贡大剧院',
      jp: 'サイゴン・オペラハウス',
      kr: '사이공 오페라 하우스',
    },
  },
  {
    id: 9,
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
    name: {
      vi: 'Thưởng Thức À Ồ Show',
      en: 'À Ồ Show Performance',
      cn: '观赏 À Ố Show',
      jp: 'À Ố Show 鑑賞',
      kr: 'À Ồ Show 관람',
    },
  },
];

export const DEFAULT_LOCAL_TOUR_CONFIG: LocalTourConfig = {
  docTitle: {
    vi: 'Đi Sài Gòn theo cách của Oria Spa',
    en: 'See Saigon the Oria Spa way',
    cn: '用Oria Spa的方式游览西贡',
    kr: 'Oria Spa 방식으로 사이공을 만나다',
    jp: 'Oria Spa流のサイゴンの歩き方',
  },
  docScript: {
    vi: 'Sai Gon Tour',
    en: 'Sai Gon Tour',
    cn: 'Sai Gon Tour',
    kr: 'Sai Gon Tour',
    jp: 'Sai Gon Tour',
  },
  docIntro: {
    vi: 'Đến Sài Gòn mà chỉ lướt qua vài điểm chụp hình rồi về thì phí quá. Oria Spa có local tour đưa bạn đi đúng những nơi làm nên chất Sài Gòn, mà kết thúc lại còn được nghỉ ngơi đúng nghĩa - không phải kiểu đi chơi về là rã rời.',
    en: 'Coming to Saigon and only breezing past a few photo spots before heading back is such a waste. Oria Spa runs local tours that take you to the places that actually make Saigon what it is - and end with real rest, not the kind of trip that leaves you worn out.',
    cn: '来到西贡,如果只是匆匆走过几个拍照点就回去,实在太可惜了。Oria Spa推出的本地导览,会带你去那些真正构成西贡气质的地方,而且行程结束后还能好好休息——不是那种玩完回来累得不行的旅行。',
    kr: '사이공에 와서 사진 찍기 좋은 곳 몇 군데만 스쳐 지나가고 돌아간다면 너무 아깝습니다. Oria Spa의 로컬 투어는 사이공을 사이공답게 만드는 진짜 장소들로 안내하고, 마지막엔 제대로 쉬게 해드립니다 - 여행을 다녀와서 오히려 지치는 그런 방식이 아니라요.',
    jp: 'サイゴンに来て、写真映えするスポットをいくつか通り過ぎるだけで帰ってしまうのは、あまりにもったいない。Oria Spaのローカルツアーは、サイゴンをサイゴンたらしめている場所へご案内し、最後にはしっかりと休んでいただけます - 旅行から帰ってきてかえって疲れる、そんな旅ではありません。',
  },
  docIntroSub: {
    vi: 'Ba gói, ba khung giờ khác nhau. Chọn gói hợp với thời gian bạn có.',
    en: 'Three packages, three different time frames. Pick the one that fits the time you have.',
    cn: '三个套餐,三种不同的时间安排。选一个适合你时间的吧。',
    kr: '세 가지 패키지, 세 가지 시간대. 자신에게 맞는 시간의 패키지를 고르세요.',
    jp: '3つのパッケージ、3つの異なる時間帯。ご自分の時間に合ったものをお選びください。',
  },
  forLabel: {
    vi: 'Hợp cho:',
    en: 'Good for:',
    cn: '适合:',
    kr: '이런 분께:',
    jp: 'こんな方に:',
  },
  docClosing: {
    vi: 'Ba gói, ba mức trải nghiệm khác nhau, nhưng đều được Oria Spa sắp xếp sẵn để bạn không phải lo tính toán lịch trình. Chỉ cần chọn gói phù hợp với thời gian mình có, còn lại để Oria Spa lo.',
    en: 'Three packages, three levels of experience, all arranged in advance by Oria Spa so you never have to work out the logistics. Just pick the one that fits the time you have - Oria Spa handles the rest.',
    cn: '三个套餐,三种体验层次,全部由Oria Spa提前安排妥当,你完全不用操心行程规划。只需选一个适合自己时间的套餐,剩下的交给Oria Spa就好。',
    kr: '세 가지 패키지, 세 가지 경험의 깊이. 모두 Oria Spa가 미리 준비해 두었기에 일정을 직접 짤 필요가 없습니다. 자신의 시간에 맞는 패키지 하나만 고르세요 - 나머지는 Oria Spa가 알아서 해드립니다.',
    jp: '3つのパッケージ、3つの体験の深さ。すべてOria Spaが事前に手配しているので、スケジュールを組む手間は一切ありません。ご自分の時間に合うものを一つ選ぶだけ - あとはOria Spaにお任せください。',
  },
  address: {
    vi: 'Oria Spa — 01 Ngô Đức Kế, Bến Nghé, Quận 1, TP. Hồ Chí Minh (Bên bờ sông Sài Gòn)',
    en: 'Oria Spa — 01 Ngo Duc Ke, Ben Nghe, District 1, Ho Chi Minh City (By Saigon River)',
    cn: 'Oria Spa — 胡志明市第一郡吴德计街01号（西贡河畔）',
    kr: 'Oria Spa — 01 Ngo Duc Ke, Ben Nghe, District 1, Ho Chi Minh City (사이공 강변)',
    jp: 'Oria Spa — 01 Ngo Duc Ke, Ben Nghe, District 1, Ho Chi Minh City（サイゴン川沿い）',
  },
  packages: [
    {
      id: 'pkg-1',
      slug: 'saigon-xua',
      orderNumber: '01',
      title: {
        vi: 'Gói 1: Sài Gòn Xưa',
        en: 'Package 1: Old Saigon',
        cn: '套餐一:老西贡',
        kr: '패키지 1: 옛 사이공',
        jp: 'パッケージ1:古きサイゴン',
      },
      tagline: {
        vi: 'Mạch chuyện từ kiến trúc Pháp cổ đến ký ức lịch sử sâu lắng bên bờ sông Sài Gòn.',
        en: 'A curated journey from French colonial architecture to profound historical memories by the Saigon River.',
        cn: '从西贡河畔的法式建筑之美，走向深沉的历史记忆。',
        kr: '사이공 강변의 프랑스 건축에서 깊이 있는 역사적 기억으로 이어지는 여정.',
        jp: 'サイゴン川沿いのフランス建築から、深みある歴史の記憶へと紡ぐ物語。',
      },
      heroImage: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1800&q=85',
      time: {
        vi: '8:00 sáng - 11:30 sáng (khoảng 3,5 tiếng)',
        en: '8:00 AM - 11:30 AM (about 3.5 hours)',
        cn: '上午8:00 - 上午11:30(约3.5小时)',
        kr: '오전 8:00 - 오전 11:30 (약 3.5시간)',
        jp: '午前8:00 - 午前11:30(約3.5時間)',
      },
      durationLabel: {
        vi: 'Khoảng 3,5 tiếng (8:00 – 11:30)',
        en: 'About 3.5 hours (8:00 AM – 11:30 AM)',
        cn: '约3.5小时（上午8:00 - 11:30）',
        kr: '약 3.5시간 (오전 8:00 - 11:30)',
        jp: '約3.5時間（午前8:00 - 11:30）',
      },
      highlights: [
        {
          image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80',
          images: [
            'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
          ],
          title: {
            vi: 'Dạo Bước Đường Đồng Khởi',
            en: 'Walking Dong Khoi Street',
            cn: '漫步同起街',
            kr: '동커이 거리 산책',
            jp: 'ドンコイ通りの散策',
          },
          subtitle: {
            vi: 'Khởi hành từ Oria Spa bên bờ sông, đi dọc con đường lâu đời nhất thành phố.',
            en: 'Starting right from Oria Spa on the riverfront along the city\'s oldest road.',
            cn: '从西贡河畔的Oria Spa出发，漫步城市最古老的街道。',
            kr: '강변 Oria Spa에서 출발해 도시에서 가장 오래된 거리를 걷습니다.',
            jp: '川沿いのOria Spaから、街で最も古い通りを歩く。',
          },
        },
        {
          image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=900&q=80',
          images: [
            'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
          ],
          title: {
            vi: 'Tuyệt Tác Kiến Trúc Pháp',
            en: 'French Colonial Icons',
            cn: '法式经典双建筑',
            kr: '프랑스식 건축 명소',
            jp: 'フランス統治時代の建築美',
          },
          subtitle: {
            vi: 'Nhà thờ Đức Bà và Bưu điện Thành phố đối diện nhau qua mặt đường.',
            en: 'Notre Dame Cathedral and Central Post Office sitting directly across from each other.',
            cn: '红教堂和中央邮政局在马路两侧相对而立，过街即达。',
            kr: '노트르담 대성당과 중앙우체국이 길 하나를 사이에 두고 마주보고 있습니다.',
            jp: '大教会と中央郵便局が道を挟んで向かい合っています。',
          },
        },
        {
          image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
          images: [
            'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80',
          ],
          title: {
            vi: 'Dấu Mốc Lịch Sử Sâu Lắng',
            en: 'Profound Historical Narrative',
            cn: '深沉的历史印记',
            kr: '역사의 마침표',
            jp: '深みへと続く歴史の物語',
          },
          subtitle: {
            vi: 'Từ Dinh Độc Lập đến Bảo tàng Chứng tích Chiến tranh kể lại câu chuyện đất nước.',
            en: 'Independence Palace and War Remnants Museum forming one continuous narrative.',
            cn: '从统一宫到战争遗迹博物馆，串联起一段深刻厚重的历史。',
            kr: '통일궁에서 전쟁증적박물관까지 이어지는 가벼움에서 깊이로의 여정.',
            jp: '統一会堂から戦争証跡博物館まで、この国が歩んできた物語を辿る。',
          },
        },
      ],
      schedule: [
        {
          vi: '8:00 - 8:30 — Khởi hành từ Oria Spa bên bờ sông, dạo bước đường Đồng Khởi',
          en: '8:00 - 8:30 — Start from Oria Spa on the riverbank, walk along Dong Khoi Street',
          cn: '8:00 - 8:30 — 从西贡河畔的Oria Spa出发，沿着同起街漫步',
          kr: '8:00 - 8:30 — 사이공 강변 Oria Spa에서 출발, 동커이 거리를 따라 산책',
          jp: '8:00 - 8:30 — サイゴン川沿いのOria Spaから出発、ドンコイ通りを散策',
        },
        {
          vi: '8:30 - 9:45 — Khám phá Nhà Thờ Đức Bà & Bưu Điện Thành Phố',
          en: '8:30 - 9:45 — Explore Notre Dame Cathedral & Central Post Office',
          cn: '8:30 - 9:45 — 前往红教堂与中央邮政局',
          kr: '8:30 - 9:45 — 노트르담 대성당 및 중앙우체국 탐방',
          jp: '8:30 - 9:45 — サイゴン大教会と中央郵便局を見学',
        },
        {
          vi: '9:45 - 10:45 — Dạo bước tham quan Dinh Độc Lập',
          en: '9:45 - 10:45 — Walk to and explore Independence Palace',
          cn: '9:45 - 10:45 — 漫步游览统一宫',
          kr: '9:45 - 10:45 — 통일궁 관람',
          jp: '9:45 - 10:45 — 統一会堂を見学',
        },
        {
          vi: '10:45 - 11:30 — Lắng đọng tại Bảo Tàng Chứng Tích Chiến Tranh',
          en: '10:45 - 11:30 — Conclude at War Remnants Museum with the fullest story of Vietnam',
          cn: '10:45 - 11:30 — 行程最后在战争遗迹博物馆画上句点',
          kr: '10:45 - 11:30 — 전쟁증적박물관에서 여정 마무리',
          jp: '10:45 - 11:30 — 戦争証跡博物館で旅程を締めくくる',
        },
      ],
      paragraphs: [
        {
          vi: 'Xuất phát ngay từ Oria Spa bên bờ sông Sài Gòn, bạn đi dọc đường Đồng Khởi - con đường lâu đời nhất thành phố - để đến Nhà thờ Đức Bà và Bưu điện Thành phố. Hai công trình Pháp cổ nằm đối diện nhau, chỉ cần băng qua đường là sang.',
          en: 'Starting right from Oria Spa on the banks of the Saigon River, you\'ll walk along Dong Khoi Street - the city\'s oldest road - to Notre Dame Cathedral and the Central Post Office. These two old French buildings sit directly across from each other; you just cross the street to get from one to the other.',
          cn: '从西贡河畔的Oria Spa出发,沿着这座城市最古老的街道——同起街,步行前往红教堂和中央邮政局。这两座法式老建筑就在马路两侧相对而立,过个马路就到。',
          kr: '사이공 강변의 Oria Spa에서 바로 출발해, 도시에서 가장 오래된 거리인 동커이 거리를 따라 걸으며 노트르담 대성당과 중앙우체국으로 향합니다. 두 프랑스식 옛 건물은 길 하나를 사이에 두고 마주 보고 있어, 길만 건너면 바로 이동할 수 있습니다.',
          jp: 'サイゴン川のほとりにあるOria Spaから出発し、街で最も古い通りであるドンコイ通りを歩いて、サイゴン大教会と中央郵便局へ向かいます。この2つのフランス統治時代の建物は道を挟んで向かい合っており、通りを渡るだけで移動できます。',
        },
        {
          vi: 'Từ đó đi tiếp một quãng ngắn đến Dinh Độc Lập, rồi khép lại hành trình ở Bảo tàng Chứng tích Chiến tranh.',
          en: 'From there it\'s a short walk to Independence Palace, before the route closes at the War Remnants Museum.',
          cn: '从那里再走一小段路就是统一宫,行程最后在战争遗迹博物馆画上句点。',
          kr: '거기서 조금만 더 걸으면 통일궁이 나오고, 여정은 전쟁증적박물관에서 마무리됩니다.',
          jp: 'そこから少し歩けば統一会堂があり、旅程は戦争証跡博物館で締めくくられます。',
        },
        {
          vi: 'Thứ tự này không phải ngẫu nhiên. Bạn bắt đầu từ vẻ đẹp kiến trúc thời Pháp, đi qua nơi đánh dấu thời khắc kết thúc chiến tranh, rồi kết thúc ở nơi kể lại câu chuyện đầy đủ nhất về những gì đất nước này đã đi qua. Một mạch chuyện đi từ nhẹ nhàng đến sâu lắng, thay vì chỉ là bốn điểm rời rạc.',
          en: 'The order isn\'t random. You begin with the beauty of French colonial architecture, pass through the place that marked the end of the war, and finish where the fullest story of what this country has been through is told. It\'s a narrative that moves from light to profound, rather than four disconnected stops.',
          cn: '这个顺序并非随意安排。你从法式殖民建筑之美开始,经过标志战争结束的地方,最后来到讲述这个国家所经历过的最完整故事的地方。这是一条从轻松走向深沉的叙事线,而不是四个彼此无关的景点。',
          kr: '이 순서는 우연이 아닙니다. 프랑스 식민지 시대 건축의 아름다움에서 시작해, 전쟁의 끝을 알린 장소를 지나, 이 나라가 겪어온 이야기를 가장 온전하게 들려주는 곳에서 끝납니다. 서로 무관한 네 곳을 둘러보는 게 아니라, 가벼움에서 깊이로 이어지는 하나의 이야기입니다.',
          jp: 'この順番は偶然ではありません。フランス統治時代の建築美から始まり、戦争の終わりを刻んだ場所を通り、この国が歩んできた物語を最も深く語る場所で終わります。ばらばらの4か所を回るのではなく、軽やかさから深みへと続く一つの物語なのです。',
        },
        {
          vi: 'Đi buổi sáng cũng là để tránh nắng gắt - đến trưa là bạn đã xong, còn nguyên cả buổi chiều tự do.',
          en: 'Going in the morning also means avoiding the harshest sun - you\'ll be done by midday, with the entire afternoon still free.',
          cn: '选择上午出发,也是为了避开最烈的日头——中午就能结束,整个下午还完全属于你自己。',
          kr: '오전에 출발하는 것은 가장 뜨거운 햇볕을 피하기 위해서이기도 합니다 - 정오면 일정이 끝나, 오후 시간은 온전히 자유롭게 쓸 수 있습니다.',
          jp: '午前中の出発は、一番強い日差しを避けるためでもあります - 正午には終わるので、午後はまるまる自由に使えます。',
        },
      ],
      bestFor: {
        vi: 'ai có ít thời gian nhưng vẫn muốn hiểu Sài Gòn không chỉ qua những tấm hình.',
        en: 'anyone short on time who still wants to understand Saigon beyond just the photographs.',
        cn: '时间不多,但仍想真正了解西贡、而不只是拍拍照的人。',
        kr: '시간은 많지 않지만, 사진 그 이상으로 사이공을 이해하고 싶은 분.',
        jp: '時間は限られているけれど、写真以上にサイゴンを理解したい方。',
      },
      destinationIds: [
        1,
        2,
        3,
        4,
        5,
      ],
    },
    {
      id: 'pkg-2',
      slug: 'saigon-tron-ven',
      orderNumber: '02',
      title: {
        vi: 'Gói 2: Sài Gòn Trọn Vẹn',
        en: 'Package 2: Complete Saigon',
        cn: '套餐二:完整西贡',
        kr: '패키지 2: 온전한 사이공',
        jp: 'パッケージ2:まるごとサイゴン',
      },
      tagline: {
        vi: 'Vừa khám phá, vừa chăm sóc bản thân: Tour di sản sáng, bữa trưa bản địa và 70 phút massage Oria Spa.',
        en: 'Explore and take care of yourself: Morning heritage route, authentic lunch, and 70-minute Oria Spa massage.',
        cn: '既探索城市又照顾好自己：上午游览名胜、享用传统午餐，并在Oria Spa享受70分钟按摩。',
        kr: '여행도 하고 자신도 챙기는 하루: 오전 관광 코스, 베트남 현지 점심, Oria Spa 70분 마사지.',
        jp: '観光もセルフケアも諦めない：午前の名所巡り、本場ランチ、Oria Spaでの70分マッサージ。',
      },
      heroImage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1800&q=85',
      time: {
        vi: '8:00 sáng - 2:30 chiều (khoảng 6,5 tiếng)',
        en: '8:00 AM - 2:30 PM (about 6.5 hours)',
        cn: '上午8:00 - 下午2:30(约6.5小时)',
        kr: '오전 8:00 - 오후 2:30 (약 6.5시간)',
        jp: '午前8:00 - 午後2:30(約6.5時間)',
      },
      durationLabel: {
        vi: 'Khoảng 6,5 tiếng (8:00 – 14:30)',
        en: 'About 6.5 hours (8:00 AM – 2:30 PM)',
        cn: '约6.5小时（上午8:00 - 下午2:30）',
        kr: '약 6.5시간 (오전 8:00 - 오후 2:30)',
        jp: '約6.5時間（午前8:00 - 午後2:30）',
      },
      highlights: [
        {
          image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=900&q=80',
          images: [
            'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80',
          ],
          title: {
            vi: 'Toàn Bộ Lịch Trình Gói 1',
            en: 'Full Route of Package 1',
            cn: '套餐一完整行程',
            kr: '패키지 1 전체 일정',
            jp: 'パッケージ1の観光すべて',
          },
          subtitle: {
            vi: 'Khám phá trọn vẹn 5 điểm đến lịch sử mang đậm chất Sài Gòn buổi sáng.',
            en: 'Full morning exploration of Saigon\'s most iconic architectural and historic sights.',
            cn: '上午完整游览西贡5大标志性历史名胜。',
            kr: '오전 내내 사이공을 대표하는 5대 명소를 온전히 둘러봅니다.',
            jp: '午前中、サイゴンを代表する歴史遺産をしっかりと巡ります。',
          },
        },
        {
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
          images: [
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
          ],
          title: {
            vi: 'Dùng Bữa Tại Nhà Hàng Việt',
            en: 'Authentic Vietnamese Lunch',
            cn: '越南地道家常午餐',
            kr: '진짜 베트남 음식 식사',
            jp: '本場のベトナム料理',
          },
          subtitle: {
            vi: 'Ăn món Việt ở nơi người Việt vẫn ăn, không phải nhà hàng làm riêng cho khách du lịch.',
            en: 'Real Vietnamese food where locals actually eat, not a place built for tourists.',
            cn: '在当地人经常光顾的餐厅品尝正宗越南菜，拒绝游客化餐饮。',
            kr: '관광객용 식당이 아닌, 베트남 사람들이 실제로 가는 곳에서 맛보는 정통 음식.',
            jp: '観光客向けではなく、地元の人が実際に通うお店で本物の味を。',
          },
        },
        {
          image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80',
          images: [
            'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
          ],
          title: {
            vi: '70 Phút Massage Oria Spa',
            en: '70-Min Oria Spa Massage',
            cn: 'Oria Spa 70分钟按摩',
            kr: 'Oria Spa 70분 마사지',
            jp: 'Oria Spaで70分マッサージ',
          },
          subtitle: {
            vi: 'Tự chọn body massage hoặc foot massage, thả lỏng trọn vẹn và bước ra khỏe khoắn.',
            en: 'Choose body or foot massage, release fatigue, and leave refreshed for the evening.',
            cn: '自选全身或足部按摩，洗去疲惫，步履轻盈地迎接美好的夜晚。',
            kr: '바디 또는 발 마사지 선택, 몸을 완전히 풀고 개운한 컨디션으로 나섭니다.',
            jp: 'ボディまたはフットから選べ、疲れをほぐして爽快な午後に。',
          },
        },
      ],
      schedule: [
        {
          vi: '8:00 - 11:30 — Toàn bộ lịch trình tham quan của gói 1',
          en: '8:00 - 11:30 — The full sightseeing route from Package 1',
          cn: '8:00 - 11:30 — 套餐一的完整游览行程',
          kr: '8:00 - 11:30 — 패키지 1의 전체 관광 일정',
          jp: '8:00 - 11:30 — パッケージ1の観光行程すべて',
        },
        {
          vi: '11:45 - 13:00 — Dùng bữa tại nhà hàng Việt, đúng nghĩa ăn món Việt ở nơi người Việt vẫn ăn, không phải kiểu nhà hàng làm riêng cho khách du lịch',
          en: '11:45 - 13:00 — A meal at a Vietnamese restaurant - real Vietnamese food where Vietnamese people actually eat, not a place built for tourists',
          cn: '11:45 - 13:00 — 在越南餐厅用餐——是越南人真正会去吃的地道越南菜,而不是专为游客打造的餐厅',
          kr: '11:45 - 13:00 — 베트남 레스토랑에서 식사 - 관광객용으로 만들어진 곳이 아니라, 베트남 사람들이 실제로 가는 곳에서 맛보는 진짜 베트남 음식',
          jp: '11:45 - 13:00 — ベトナム料理店でお食事 - 観光客向けに作られた店ではなく、ベトナムの人が実際に通う店で味わう本物のベトナム料理',
        },
        {
          vi: '13:15 - 14:30 — Quay lại Oria Spa cho buổi massage 70 phút, bạn tự chọn body massage hoặc foot massage',
          en: '13:15 - 14:30 — Back to Oria Spa for a 70-minute massage; you choose between a body massage or a foot massage',
          cn: '13:15 - 14:30 — 回到Oria Spa享受70分钟按摩,可自行选择全身按摩或足部按摩',
          kr: '13:15 - 14:30 — Oria Spa로 돌아와 70분 마사지, 바디 마사지와 발 마사지 중 직접 선택',
          jp: '13:15 - 14:30 — Oria Spaに戻って70分のマッサージ。ボディマッサージかフットマッサージをお選びいただけます',
        },
      ],
      paragraphs: [
        {
          vi: 'Cơ thể vừa đi bộ khám phá cả buổi sáng, đầu óc vừa tiếp nhận nhiều câu chuyện, giờ là lúc được thả lỏng hoàn toàn. Bạn bước ra khỏi Oria Spa lúc đầu giờ chiều với cảm giác đã đi được nhiều nơi mà vẫn khỏe khoắn, không mệt mỏi - và vẫn còn cả buổi tối cho riêng mình.',
          en: 'Your body has been walking and exploring all morning, your mind has taken in a lot of stories - now it\'s time to fully let go. You\'ll walk out of Oria Spa in the early afternoon feeling like you\'ve seen a great deal while still being refreshed rather than exhausted - and with the whole evening still yours.',
          cn: '身体走了一上午,脑海里装满了各种故事,现在正是彻底放松的时刻。下午稍早时分,你会带着"看了很多地方却依然神清气爽"的感觉离开Oria Spa——而整个晚上仍然属于你自己。',
          kr: '오전 내내 걸으며 둘러본 몸과, 많은 이야기를 받아들인 머리를 이제 완전히 내려놓을 시간입니다. 이른 오후, 많은 곳을 다녔지만 지치기는커녕 개운한 상태로 Oria Spa를 나서게 됩니다 - 그리고 저녁 시간은 여전히 온전히 당신의 것입니다.',
          jp: '午前中ずっと歩き回った体と、たくさんの物語を受け止めた頭を、今こそ完全にゆるめる時間です。午後の早い時間、たくさん見て回ったのに疲れではなく爽快さを感じながらOria Spaを後にできます - そして夜の時間はまだ丸ごとあなたのものです。',
        },
      ],
      bestFor: {
        vi: 'ai muốn vừa khám phá, vừa chăm sóc bản thân, không phải chọn giữa hai thứ đó.',
        en: 'anyone who wants to explore and take care of themselves, without having to choose between the two.',
        cn: '既想探索城市、又想照顾好自己,不愿意在两者之间做取舍的人。',
        kr: '여행도 하고 자신도 챙기고 싶은, 둘 중 하나를 포기하고 싶지 않은 분.',
        jp: '観光も自分のケアも、どちらかを諦めたくない方。',
      },
      destinationIds: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
      ],
    },
    {
      id: 'pkg-3',
      slug: 'saigon-ve-dem',
      orderNumber: '03',
      title: {
        vi: 'Gói 3: Sài Gòn Về Đêm',
        en: 'Package 3: Saigon by Night',
        cn: '套餐三:西贡之夜',
        kr: '패키지 3: 사이공의 밤',
        jp: 'パッケージ3:サイゴンの夜',
      },
      tagline: {
        vi: 'Một ngày đầy đặn không thiếu điều gì: Di sản, ẩm thực, massage phục hồi và thăng hoa cùng À Ố Show.',
        en: 'A full day with nothing missing: Heritage, authentic dining, restorative massage, and À Ố Show.',
        cn: '毫无遗憾的圆满一天：历史、美馔、舒缓按摩，并在西贡大剧院欣赏《À Ố Show》。',
        kr: '아쉬움 없이 꽉 찬 하루: 역사 탐방, 식사, 힐링 마사지, 그리고 아오쇼 관람까지.',
        jp: '何一つ心残りのない充実の一日：歴史探訪、絶品料理、マッサージ、そしてÀ Ố Show鑑賞。',
      },
      heroImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1800&q=85',
      time: {
        vi: '9:00 sáng - 7:00 tối (trọn ngày)',
        en: '9:00 AM - 7:00 PM (full day)',
        cn: '上午9:00 - 晚上7:00(全天)',
        kr: '오전 9:00 - 저녁 7:00 (하루 종일)',
        jp: '午前9:00 - 午後7:00(終日)',
      },
      durationLabel: {
        vi: 'Trọn ngày (9:00 – 19:00)',
        en: 'Full day (9:00 AM – 7:00 PM)',
        cn: '全天（上午9:00 - 晚上7:00）',
        kr: '하루 종일 (오전 9:00 - 저녁 7:00)',
        jp: '終日（午前9:00 - 午後7:00）',
      },
      highlights: [
        {
          image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80',
          images: [
            'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
          ],
          title: {
            vi: 'Di Sản, Bữa Trưa & 70 Phút Spa',
            en: 'Heritage, Lunch & 70-Min Spa',
            cn: '名胜游览、午餐与70分钟SPA',
            kr: '유적 탐방, 점심 & 70분 스파',
            jp: '名所巡り・昼食・70分マッサージ',
          },
          subtitle: {
            vi: 'Tham quan buổi sáng, dùng bữa tại nhà hàng Việt và thư giãn trước giờ diễn.',
            en: 'Sightseeing, authentic dining, and a rejuvenating massage timed right before the show.',
            cn: '白天观光游历、享用地道越南菜，并在演出前通过按摩调理身心。',
            kr: '오전 관광, 베트남 음식 식사, 그리고 공연 직전 최상의 컨디션을 위한 마사지.',
            jp: '午前の観光、本格ランチ、そして開演直前のマッサージで心身を整える。',
          },
        },
        {
          image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80',
          images: [
            'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80',
          ],
          title: {
            vi: 'Nhà Hát Thành Phố Về Đêm',
            en: 'Saigon Opera House at Night',
            cn: '夜色中的西贡大剧院',
            kr: '밤의 사이공 오페라 하우스',
            jp: '夜のサイゴン・オペラハウス',
          },
          subtitle: {
            vi: 'Di chuyển vài phút từ Oria Spa đến công trình kiến trúc đẹp nhất Sài Gòn.',
            en: 'Just minutes from Oria Spa to the most breathtaking architectural icon in Saigon.',
            cn: '距离Oria Spa仅几分钟路程，步入西贡最壮丽典雅的百年剧院。',
            kr: 'Oria Spa에서 몇 분 거리, 사이공에서 가장 아름다운 건축물 안으로 입장합니다.',
            jp: 'Oria Spaから数分、サイゴンで最も美しい建築物へ。',
          },
        },
        {
          image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=900&q=80',
          images: [
            'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
          ],
          title: {
            vi: 'Thưởng Thức À Ố Show',
            en: 'Spectacular À Ố Show',
            cn: '观赏震撼的《À Ố Show》',
            kr: '아오쇼(À Ồ Show) 감동 관람',
            jp: 'À Ố Show 鑑賞',
          },
          subtitle: {
            vi: 'Xiếc tre và nghệ thuật đường phố kể câu chuyện Việt Nam từ làng quê ra thành thị.',
            en: 'Bamboo circus and street art telling Vietnam\'s story from countryside to city.',
            cn: '竹子马戏与街头艺术，生动演绎越南从乡村走向现代都市的动人篇章。',
            kr: '대나무 서커스와 거리 예술로 베트남의 시골 생활에서 현대 도시로의 이야기를 풀어냅니다.',
            jp: '竹を使ったサーカスとストリートアートで、農村から現代都市への物語を体感。',
          },
        },
      ],
      schedule: [
        {
          vi: '9:00 - 12:30 — Toàn bộ lịch trình tham quan',
          en: '9:00 - 12:30 — The full sightseeing route',
          cn: '9:00 - 12:30 — 完整游览行程',
          kr: '9:00 - 12:30 — 전체 관광 일정',
          jp: '9:00 - 12:30 — 観光行程すべて',
        },
        {
          vi: '12:30 - 14:00 — Dùng bữa tại nhà hàng Việt',
          en: '12:30 - 14:00 — A meal at a Vietnamese restaurant',
          cn: '12:30 - 14:00 — 在越南餐厅用餐',
          kr: '12:30 - 14:00 — 베트남 레스토랑에서 식사',
          jp: '12:30 - 14:00 — ベトナム料理店でお食事',
        },
        {
          vi: '14:00 - 15:30 — Thời gian tự do, nghỉ ngơi',
          en: '14:00 - 15:30 — Free time to rest',
          cn: '14:00 - 15:30 — 自由时间,稍作休息',
          kr: '14:00 - 15:30 — 자유 시간, 휴식',
          jp: '14:00 - 15:30 — 自由時間、休憩',
        },
        {
          vi: '15:30 - 16:40 — Massage 70 phút tại Oria Spa, bạn tự chọn body massage hoặc foot massage',
          en: '15:30 - 16:40 — A 70-minute massage at Oria Spa; you choose between a body massage or a foot massage',
          cn: '15:30 - 16:40 — 在Oria Spa享受70分钟按摩,可自行选择全身按摩或足部按摩',
          kr: '15:30 - 16:40 — Oria Spa에서 70분 마사지, 바디 마사지와 발 마사지 중 직접 선택',
          jp: '15:30 - 16:40 — Oria Spaで70分のマッサージ。ボディマッサージかフットマッサージをお選びいただけます',
        },
        {
          vi: '16:40 - 17:30 — Nghỉ ngơi, thay đồ chuẩn bị cho buổi tối',
          en: '16:40 - 17:30 — Rest and change for the evening',
          cn: '16:40 - 17:30 — 休息、更衣,为晚上做准备',
          kr: '16:40 - 17:30 — 휴식 및 저녁을 위한 옷 갈아입기',
          jp: '16:40 - 17:30 — 休憩、夜に向けてのお着替え',
        },
        {
          vi: '17:30 — Di chuyển đến Nhà hát Thành phố (chỉ vài phút từ Oria Spa)',
          en: '17:30 — Head to the Saigon Opera House (just minutes from Oria Spa)',
          cn: '17:30 — 前往西贡大剧院(距离Oria Spa仅几分钟路程)',
          kr: '17:30 — 사이공 오페라 하우스로 이동 (Oria Spa에서 몇 분 거리)',
          jp: '17:30 — サイゴン・オペラハウスへ移動(Oria Spaから数分)',
        },
        {
          vi: '18:00 - 19:00 — Xem À Ố Show',
          en: '18:00 - 19:00 — À Ố Show',
          cn: '18:00 - 19:00 — 观赏À Ố Show',
          kr: '18:00 - 19:00 — À Ố Show 관람',
          jp: '18:00 - 19:00 — À Ố Show 鑑賞',
        },
      ],
      paragraphs: [
        {
          vi: 'À Ố Show là màn trình diễn xiếc tre và nghệ thuật đường phố kể câu chuyện Việt Nam từ làng quê ra thành thị - không cần biết tiếng Việt vẫn hiểu và cảm được trọn vẹn.',
          en: 'À Ố Show is a bamboo circus and street-art performance telling the story of Vietnam from village life to the modern city - you don\'t need to speak Vietnamese to follow it and feel it completely.',
          cn: 'À Ố Show是一场以竹子马戏和街头艺术为形式的表演,讲述越南从乡村生活走向现代都市的故事——即使不懂越南语,也能完全看懂并感受其中的情感。',
          kr: 'À Ố Show는 대나무 서커스와 거리 예술로 베트남의 시골 생활에서 현대 도시로의 이야기를 풀어내는 공연입니다 - 베트남어를 몰라도 충분히 이해하고 온전히 느낄 수 있습니다.',
          jp: 'À Ố Showは、竹を使ったサーカスとストリートアートで、ベトナムの農村の暮らしから現代都市への物語を描く公演です - ベトナム語が分からなくても、十分に理解でき、心から感じ取ることができます。',
        },
        {
          vi: 'Một ngày bắt đầu bằng lịch sử, giữa ngày là bữa ăn và thư giãn, rồi khép lại bằng nghệ thuật ngay trong công trình đẹp nhất Sài Gòn. Đặc biệt, buổi massage được xếp ngay trước giờ diễn - nên bạn bước vào nhà hát trong trạng thái thoải mái nhất, không phải kiểu lê lết sau một ngày dài.',
          en: 'A day that opens with history, pauses mid-way for a meal and relaxation, then closes with art inside the most beautiful building in Saigon. The massage is deliberately scheduled right before showtime - so you walk into the theater feeling your best, rather than dragging yourself in after a long day.',
          cn: '一天从历史开始,中途是一顿饭和一段放松时光,最后在西贡最美的建筑里以艺术收尾。特别的是,按摩被特意安排在演出之前——让你以最舒服的状态走进剧院,而不是拖着疲惫的身体勉强赴约。',
          kr: '역사로 시작해, 중간엔 식사와 휴식이 있고, 사이공에서 가장 아름다운 건물 안에서 예술로 마무리되는 하루. 특히 마사지를 공연 직전에 배치한 이유가 있습니다 - 긴 하루 끝에 지친 몸을 끌고 가는 게 아니라, 가장 좋은 컨디션으로 극장에 들어설 수 있도록요.',
          jp: '歴史で始まり、途中で食事とくつろぎの時間があり、サイゴンで最も美しい建物の中で芸術によって締めくくられる一日。特にマッサージを開演直前に組み込んでいるのには理由があります - 長い一日の疲れを引きずって劇場に入るのではなく、最高のコンディションで席に着いていただくためです。',
        },
      ],
      bestFor: {
        vi: 'ai muốn một ngày ở Sài Gòn thật đầy đặn, không thiếu điều gì.',
        en: 'anyone who wants a full day in Saigon with nothing missing.',
        cn: '想在西贡度过毫无遗憾、圆满充实一天的人。',
        kr: '사이공에서 아쉬움 없이 꽉 찬 하루를 보내고 싶은 분.',
        jp: 'サイゴンで何一つ心残りのない、充実した一日を過ごしたい方。',
      },
      destinationIds: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
      ],
    },
  ],
  destinations: DEFAULT_DESTINATIONS,
};

export function hydrateLocalTourConfig(raw: any): LocalTourConfig {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_LOCAL_TOUR_CONFIG;
  }

  const rawPackages = Array.isArray(raw.packages) && raw.packages.length > 0 ? raw.packages : DEFAULT_LOCAL_TOUR_CONFIG.packages;

  // Merge default slugs, heroImage, highlights if missing in raw DB records
  const hydratedPackages = rawPackages.map((pkg: any) => {
    const defaultPkg = DEFAULT_LOCAL_TOUR_CONFIG.packages.find((p) => p.id === pkg.id);
    const rawHighlights = pkg.highlights || defaultPkg?.highlights;
    const hydratedHighlights = Array.isArray(rawHighlights)
      ? rawHighlights.map((hl: any) => {
          const rawImgs = Array.isArray(hl.images) ? hl.images.filter(Boolean) : [];
          const imagesList = rawImgs.length > 0 ? rawImgs : (hl.image ? [hl.image] : []);
          return {
            ...hl,
            images: imagesList.length > 0 ? imagesList : (hl.image ? [hl.image] : []),
            image: hl.image || imagesList[0] || '',
          };
        })
      : defaultPkg?.highlights;

    return {
      ...defaultPkg,
      ...pkg,
      slug: pkg.slug || defaultPkg?.slug || pkg.id,
      heroImage: pkg.heroImage || defaultPkg?.heroImage,
      tagline: pkg.tagline || defaultPkg?.tagline,
      durationLabel: pkg.durationLabel || defaultPkg?.durationLabel,
      highlights: hydratedHighlights,
    };
  });

  return {
    docTitle: raw.docTitle || DEFAULT_LOCAL_TOUR_CONFIG.docTitle,
    docScript: raw.docScript || DEFAULT_LOCAL_TOUR_CONFIG.docScript,
    docIntro: raw.docIntro || DEFAULT_LOCAL_TOUR_CONFIG.docIntro,
    docIntroSub: raw.docIntroSub || DEFAULT_LOCAL_TOUR_CONFIG.docIntroSub,
    forLabel: raw.forLabel || DEFAULT_LOCAL_TOUR_CONFIG.forLabel,
    docClosing: raw.docClosing || DEFAULT_LOCAL_TOUR_CONFIG.docClosing,
    address: raw.address || DEFAULT_LOCAL_TOUR_CONFIG.address,
    packages: hydratedPackages,
    destinations: Array.isArray(raw.destinations) && raw.destinations.length > 0
      ? raw.destinations
      : DEFAULT_LOCAL_TOUR_CONFIG.destinations,
  };
}

export function getPackageBySlugOrId(
  slugOrId: string,
  packages: LocalTourPackage[] = DEFAULT_LOCAL_TOUR_CONFIG.packages
): LocalTourPackage | undefined {
  if (!slugOrId) return undefined;
  const normalized = slugOrId.toLowerCase().trim();
  return packages.find(
    (p) =>
      p.id.toLowerCase() === normalized ||
      p.slug?.toLowerCase() === normalized ||
      (normalized === 'goi-1' && p.id === 'pkg-1') ||
      (normalized === 'goi-2' && p.id === 'pkg-2') ||
      (normalized === 'goi-3' && p.id === 'pkg-3') ||
      (normalized === 'saigon-xua' && p.id === 'pkg-1') ||
      (normalized === 'saigon-tron-ven' && p.id === 'pkg-2') ||
      (normalized === 'saigon-ve-dem' && p.id === 'pkg-3')
  );
}
