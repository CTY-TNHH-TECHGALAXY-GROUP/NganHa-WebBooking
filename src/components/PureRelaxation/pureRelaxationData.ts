export type PureRelaxationMedia = {
  type: 'image' | 'video';
  src: string;
  poster?: string;
  tag: string;
};

export type PureRelaxationDuration = {
  label: string;
  price: number;
  id?: string;
};

export type PureRelaxationPrivilege = {
  title: string;
  copy: string;
  image: string;
  time: string;
};

export type PureRelaxationVariant = {
  contentKey?: string;
  name: string;
  subtitle: string;
  media: PureRelaxationMedia;
  durations: PureRelaxationDuration[];
  privilege: PureRelaxationPrivilege;
};

export type PureRelaxationService = {
  contentKey?: string;
  name: string;
  description: string;
  media?: PureRelaxationMedia;
  durations?: PureRelaxationDuration[];
  privilege?: PureRelaxationPrivilege;
  variants?: PureRelaxationVariant[];
};

export type PureRelaxationSection = {
  id: string;
  index: string;
  title: string;
  icon: string;
  description: string;
  mediaLabel: string;
  services: PureRelaxationService[];
};

export const getPureRelaxationSections = (contentMedia: any = {}, currentLang: string = 'vi'): PureRelaxationSection[] => {
  const spaVideo = contentMedia.spaVideo?.src || '';
  const massageVideo = contentMedia.massageVideo?.src || '';
  const headSpaVideo = contentMedia.headSpaVideo?.src || '';
  const barberVideo = contentMedia.barberVideo?.src || '';
  const footVideo = contentMedia.footVideo?.src || '';

  const fallbackImg = contentMedia.fallbackImg?.src || '';
  const footImg = contentMedia.footImg?.src || '';
  const teaImg = contentMedia.teaImg?.src || '';
  const herbalImg = contentMedia.herbalImg?.src || '';

  const type = (key: string, def: string) => contentMedia[key]?.type || def;

  const tText = (en: string, vi: string, cn: string, jp: string, kr: string) => {
    switch (currentLang) {
      case 'vi': return vi;
      case 'cn': return cn;
      case 'jp': return jp;
      case 'kr': return kr;
      default: return en;
    }
  };
  const tTitle = tText;

  const herbalFootSoak: PureRelaxationPrivilege = {
    title: tText('Herbal Foot Soak', 'Ngâm chân thảo dược', '草本足浴', '薬草足湯', '허브 족욕'),
    copy: tText(
      'A quiet herbal foot soak is included before the body ritual begins.',
      'Ngâm chân thảo dược thư giãn được bao gồm trước khi bắt đầu liệu trình.',
      '在身体疗程开始前，先享受宁静舒适的草本足浴。',
      'ボディトリートメントの前に、心落ち着く薬草足湯をご用意しております。',
      '바디 리추얼이 시작되기 전, 편안한 허브 족욕이 제공됩니다.'
    ),
    image: herbalImg,
    time: tText('8-10 mins', '8-10 phút', '8-10 分钟', '8〜10 分', '8-10 분'),
  };

  const warmTowel: PureRelaxationPrivilege = {
    title: tText('Warm Towel Finish', 'Khăn ấm thư giãn', '温热毛巾舒缓', '温タオル仕上げ', '따뜻한 타월 마무리'),
    copy: tText(
      'A warm towel finish helps the feet feel lighter before you leave.',
      'Bước ủ khăn ấm giúp đôi chân nhẹ nhàng, sảng khoái trước khi ra về.',
      '温热毛巾护理让双足在离开前倍感轻盈舒爽。',
      '温かいタオルでの仕上げにより、足元を軽やかに整えます。',
      '따뜻한 타월 마무리로 발걸음을 한결 가볍게 해드립니다.'
    ),
    image: footImg,
    time: tText('5 mins', '5 phút', '5 分钟', '5 分', '5 분'),
  };

  const cuticleCare: PureRelaxationPrivilege = {
    title: tText('Cuticle Care Touch', 'Chăm sóc móng & da', '甲缘细致护理', '甘皮ケア', '큐티클 케어'),
    copy: tText(
      'A small grooming touch is included with this practical foot care package.',
      'Gói chăm sóc chân toàn diện bao gồm chăm sóc khóe móng và da chân.',
      '实用足部护理套餐中包含细致的甲缘与角质修护。',
      'フットケアコースに含まれる、丁寧な爪と甘皮のお手入れです。',
      '실속 있는 풋 케어 패키지에 섬세한 큐티클 정리가 포함되어 있습니다.'
    ),
    image: footImg,
    time: tText('5-8 mins', '5-8 phút', '5-8 分钟', '5〜8 分', '5-8 분'),
  };

  const eyePillow: PureRelaxationPrivilege = {
    title: tText('Warm Eye Pillow', 'Gối ấm thư giãn mắt', '温热舒目枕', '温アイピロー', '온열 아이 필로우'),
    copy: tText(
      'A warm eye pillow is included while the ear-cleaning ritual settles in.',
      'Gối thảo dược ấm áp cho vùng mắt trong suốt quá trình lấy ráy tai.',
      '在采耳疗程过程中为您提供温热舒目枕，放松眼部。',
      '耳掃除の施術中、温かいアイピローで目元を心地よく温めます。',
      '귀 청소 리추얼을 진행하는 동안 따뜻한 아이 필로우로 눈가를 편안하게 합니다.'
    ),
    image: herbalImg,
    time: tText('5 mins', '5 phút', '5 分钟', '5 分', '5 분'),
  };

  const hotTowel: PureRelaxationPrivilege = {
    title: tText('Hot Towel Finish', 'Khăn nóng thư giãn', '热毛巾舒缓洁肤', '蒸しタオル仕上げ', '온타월 마무리'),
    copy: tText(
      'A classic hot towel finish completes the grooming sequence.',
      'Khăn nóng kinh điển hoàn thiện quy trình chăm sóc và thư giãn.',
      '经典热毛巾护理，为整套理容流程画上舒适句号。',
      '心地よい蒸しタオルで、グルーミングの締めくくりを。',
      '클래식한 온타월 마무리로 그루밍 과정을 완벽하게 정돈합니다.'
    ),
    image: fallbackImg,
    time: tText('5 mins', '5 phút', '5 分钟', '5 分', '5 분'),
  };

  const silkMask: PureRelaxationPrivilege = {
    title: tText('Silk Eye Mask', 'Mặt nạ mắt lụa', '丝绸眼罩', 'シルクアイマスク', '실크 안대'),
    copy: tText(
      'A soft silk eye mask is included to deepen relaxation during the package.',
      'Mặt nạ lụa mềm mại giúp thư giãn sâu vùng mắt trong suốt liệu trình.',
      '柔软丝绸眼罩助您在套餐体验中深入放松身心。',
      '心地よいシルクアイマスクで、施術中の深いリラックスへと導きます。',
      '부드러운 실크 안대로 패키지 이용 중 한층 깊은 휴식을 선사합니다.'
    ),
    image: footImg,
    time: tText('5-10 mins', '5-10 phút', '5-10 分钟', '5〜10 分', '5-10 분'),
  };

  const refreshingTea: PureRelaxationPrivilege = {
    title: tText('Refreshing Tea', 'Trà thanh nhiệt', '清心茶饮', 'リフレッシュティー', '리프레시 티'),
    copy: tText(
      'Includes a small refreshing tea service after the treatment.',
      'Thưởng thức tách trà thanh nhiệt thơm dịu sau liệu trình chăm sóc.',
      '疗程结束后为您奉上一份清香沁脾的特调茶饮。',
      '施術後に、さっぱりとしたハーブティーをお楽しみいただけます。',
      '트리트먼트 후 상쾌함을 더해주는 티 서비스를 제공합니다.'
    ),
    image: teaImg,
    time: tText('5-10 mins', '5-10 phút', '5-10 分钟', '5〜10 分', '5-10 분'),
  };

  const signatureTea: PureRelaxationPrivilege = {
    title: tText('Signature Herbal Tea', 'Trà thảo mộc đặc trưng', '招牌养生草本茶', '特製ハーブティー', '시그니처 허브티'),
    copy: tText(
      'Includes a signature herbal tea service to complete the full ritual.',
      'Trà thảo mộc bí truyền hoàn thiện trọn vẹn nghi thức chăm sóc VIP.',
      '享用独家招牌草本茶饮，为尊贵的全套仪式完美收尾。',
      'トリートメントの締めくくりに、こだわりの特製ハーブティーをご提供します。',
      '전체 리추얼을 완벽하게 완성하는 시그니처 허브티 서비스를 제공합니다.'
    ),
    image: teaImg,
    time: tText('5-10 mins', '5-10 phút', '5-10 分钟', '5〜10 分', '5-10 분'),
  };

const pureRelaxationSections: PureRelaxationSection[] = [
  {
    id: 'body-care',
    index: '01 / 07',
    title: tTitle('Body Care', 'Chăm sóc cơ thể', '身体护理', 'ボディケア', '바디 케어'),
    icon: '/category-icons-svg/body-massage.svg',
    mediaLabel: tText('Body care', 'Chăm sóc cơ thể', '身体护理', 'ボディケア', '바디 케어'),
    description: tText(
      'Four direct body rituals with clear duration choices, calm pricing, and a privilege included in each booking.',
      'Bốn liệu trình chăm sóc cơ thể chuyên sâu với thời lượng linh hoạt, giá niêm yết rõ ràng và bao gồm đặc quyền kèm theo mỗi gói dịch vụ.',
      '四款专属身体护理疗程，时长选择清晰，价格透明，每次预订均包含专属礼遇。',
      '明瞭な時間設定と安心の価格設定、すべてのコースに特典が付いた4つの本格ボディリチュアル。',
      '명확한 시간 선택, 합리적인 가격, 모든 예약에 특전이 포함된 4가지 바디 케어 리추얼.'
    ),
    services: [
      {
        name: 'Mix',
        description: 'Balanced pressure and flowing relaxation techniques.',
        media: { type: type('massageVideo', 'image'), src: massageVideo, tag: 'Body massage' },
        durations: [
          { label: "70'", price: 685000, id: 'NHS0040' },
          { label: "90'", price: 840000, id: 'NHS0041' },
          { label: "120'", price: 1050000, id: 'NHS0042' },
        ],
        privilege: herbalFootSoak,
      },
      {
        name: 'Aroma Coconut',
        description: 'Warm coconut aroma with a smooth, slow-paced ritual.',
        media: { type: type('spaVideo', 'image'), src: spaVideo, tag: 'Aroma' },
        durations: [
          { label: "60'", price: 580000, id: 'NHS0008' },
          { label: "90'", price: 790000, id: 'NHS0010' },
          { label: "120'", price: 1050000, id: 'NHS0011' },
        ],
        privilege: herbalFootSoak,
      },
      {
        name: 'Hotstone',
        description: 'Heat-supported relaxation for a deeper release.',
        media: { type: type('spaVideo', 'image'), src: spaVideo, tag: 'Hotstone' },
        durations: [
          { label: "70'", price: 685000, id: 'NHS0022' },
          { label: "90'", price: 840000, id: 'NHS0023' },
          { label: "120'", price: 1050000, id: 'NHS0024' },
        ],
        privilege: herbalFootSoak,
      },
      {
        name: 'No Oil',
        description: 'Dry technique for guests who prefer an oil-free treatment.',
        media: { type: type('massageVideo', 'image'), src: massageVideo, tag: 'No oil' },
        durations: [
          { label: "70'", price: 685000, id: 'NHS0047' },
          { label: "90'", price: 840000, id: 'NHS0048' },
          { label: "120'", price: 1050000, id: 'NHS0049' },
        ],
        privilege: herbalFootSoak,
      },

    ],
  },
  {
    id: 'foot-care',
    index: '02 / 07',
    title: tTitle('Foot Care', 'Chăm sóc chân', '足部护理', 'フットケア', '풋 케어'),
    icon: '/category-icons-svg/foot-massage.svg',
    mediaLabel: tText('Foot care', 'Chăm sóc chân', '足部护理', 'フットケア', '풋 케어'),
    description: tText(
      'Compact foot care choices with duration only where the guest needs it.',
      'Các lựa chọn chăm sóc bàn chân tinh gọn, tập trung vào nhu cầu thư giãn của quý khách.',
      '精选足部护理项目，根据客人需求专注呵护双足。',
      'お客様の必要に合わせて選べる、スマートなフットケアメニュー。',
      '고객에게 꼭 필요한 시간에 맞춘 실속 있는 풋 케어 프로그램.'
    ),
    services: [
      {
        name: 'Foot',
        description: 'Relax tired feet and lower legs with focused pressure and release.',
        media: { type: type('footVideo', 'image'), src: footVideo, tag: 'Foot ritual' },
        durations: [
          { label: "45'", price: 315000, id: 'NHS0100' },
          { label: "60'", price: 395000, id: 'NHS0101' },
          { label: "70'", price: 525000, id: 'NHS0102' },
          { label: "90'", price: 685000, id: 'NHS0103' },
          { label: "120'", price: 945000, id: 'NHS0104' },
        ],
        privilege: warmTowel,
      },
      {
        name: 'Foot · Nail Cut · Heel Skin Shave',
        description: 'Mát-xa chân - Cắt móng - Chà gót.',
        media: { type: type('footImg', 'image'), src: footImg, tag: 'Heel care' },
        durations: [{ label: "90'", price: 790000, id: 'NHS1000' }],
        privilege: cuticleCare,
      },
    ],
  },
  {
    id: 'ear-clean',
    index: '03 / 07',
    title: tTitle('Ear Clean', 'Lấy ráy tai', '采耳', '耳掃除', '귀 청소'),
    icon: '/category-icons-svg/ear-clean.svg',
    mediaLabel: tText('Ear clean', 'Lấy ráy tai', '采耳', '耳掃除', '귀 청소'),
    description: tText(
      'Ear-cleaning services are grouped by the real combinations guests choose most often.',
      'Dịch vụ lấy ráy tai được thiết kế theo các tổ hợp được khách hàng yêu thích và lựa chọn nhiều nhất.',
      '采耳服务根据客人最常选择的实用组合进行精心搭配。',
      'お客様に最も選ばれている人気の組み合わせを取り揃えた耳掃除コース。',
      '고객들이 가장 선호하는 맞춤 조합으로 구성된 전문 귀 청소 서비스.'
    ),
    services: [
      {
        name: 'Ear',
        description: 'Focused ear-cleaning with a quiet, careful pace.',
        media: { type: type('herbalImg', 'image'), src: herbalImg, tag: 'Ear clean' },
        durations: [
          { label: "30'", price: 315000, id: 'NHS0600' },
          { label: "45'", price: 385000, id: 'NHS0601' },
          { label: "60'", price: 630000, id: 'NHS0602' },
        ],
        privilege: eyePillow,
      },
      {
        name: 'Ear · Hair Wash · Head Neck Shoulder',
        description: 'Ear care followed by a soothing hair wash and upper-body release.',
        media: { type: type('headSpaVideo', 'image'), src: headSpaVideo, tag: 'Head spa' },
        durations: [
          { label: "70'", price: 685000, id: 'NHS1001' },
          { label: "90'", price: 790000, id: 'NHS1002' },
        ],
        privilege: eyePillow,
      },
      {
        name: 'Ear · Head Neck Shoulder · Foot',
        description: 'A balanced sequence for ear care, shoulder comfort, and foot relaxation.',
        media: { type: type('footVideo', 'image'), src: footVideo, tag: 'Foot add-on' },
        durations: [
          { label: "70'", price: 685000, id: 'NHS1003' },
          { label: "90'", price: 790000, id: 'NHS1004' },
        ],
        privilege: eyePillow,
      },
      {
        name: 'Ear · Head Neck Shoulder · Body',
        description: 'Ear care extended into a fuller body relaxation session.',
        media: { type: type('massageVideo', 'image'), src: massageVideo, tag: 'Body add-on' },
        durations: [
          { label: "70'", price: 705000, id: 'NHS1005' },
          { label: "90'", price: 810000, id: 'NHS1006' },
        ],
        privilege: eyePillow,
      },
      {
        name: 'Ear · Body · Head Neck Shoulder · Hair Wash',
        description: 'A longer complete sequence for guests who want everything handled in one visit.',
        media: { type: type('headSpaVideo', 'image'), src: headSpaVideo, tag: 'Complete' },
        durations: [{ label: "120'", price: 1105000, id: 'NHS1007' }],
        privilege: eyePillow,
      },
    ],
  },
  {
    id: 'barber',
    index: '04 / 07',
    title: tTitle('Barber', 'Cắt tóc nam', '男士理发', '理容室', '이발'),
    icon: '/category-icons-svg/haircut.svg',
    mediaLabel: tText('Barber', 'Cắt tóc nam', '男士理发', '理容', '이발'),
    description: tText(
      'A minimal grooming section with direct selections and no crowded menu wall.',
      'Dịch vụ chăm sóc diện mạo nam tinh tế, lựa chọn dễ dàng và thuận tiện.',
      '简约而专注的男士理容空间，精选项目一目了然。',
      '厳選されたメニューで無駄のない、スマートなメンズグルーミング。',
      '복잡함 없이 직관적으로 선택할 수 있는 정갈한 남성 그루밍 서비스.'
    ),
    services: [
      { name: 'Shave', description: 'Clean facial grooming with a warm finish.', media: { type: type('barberVideo', 'image'), src: barberVideo, tag: 'Shave' }, durations: [{ label: "30'", price: 210000, id: 'NHS0700' }], privilege: hotTowel },
      { name: 'Hair Cut', description: 'A neat haircut service paced for everyday grooming.', media: { type: type('barberVideo', 'image'), src: barberVideo, tag: 'Hair cut' }, durations: [{ label: "45'", price: 265000, id: 'NHS0701' }], privilege: hotTowel },
      { name: 'Barber 1', description: 'A focused barber combination for a clean refresh.', media: { type: type('barberVideo', 'image'), src: barberVideo, tag: 'Barber 1' }, durations: [{ label: "45'", price: 370000, id: 'NHS0702' }], privilege: hotTowel },
      { name: 'Barber 2', description: 'A balanced grooming ritual.', media: { type: type('barberVideo', 'image'), src: barberVideo, tag: 'Barber 2' }, durations: [{ label: "60'", price: 570000, id: 'NHS0703' }], privilege: hotTowel },
      { name: 'Barber 3', description: 'A longer grooming ritual with extra finishing time.', media: { type: type('barberVideo', 'image'), src: barberVideo, tag: 'Barber 3' }, durations: [{ label: "90'", price: 915000, id: 'NHS0704' }], privilege: hotTowel },
      { name: 'Barber 4', description: 'A complete grooming session for a polished look.', media: { type: type('barberVideo', 'image'), src: barberVideo, tag: 'Barber 4' }, durations: [{ label: "90'", price: 630000, id: 'NHS0705' }], privilege: hotTowel },
      { name: 'Barber 5', description: 'The most complete barber sequence in this service family.', media: { type: type('barberVideo', 'image'), src: barberVideo, tag: 'Barber 5' }, durations: [{ label: "120'", price: 840000, id: 'NHS0706' }], privilege: hotTowel },
    ],
  },
  {
    id: 'package',
    index: '05 / 07',
    title: tTitle('Package', 'Gói dịch vụ', '套餐', 'パッケージ', '패키지'),
    icon: '/category-icons-svg/package.svg',
    mediaLabel: tText('Package', 'Gói dịch vụ', '套餐', 'パッケージ', '패키지'),
    description: tText(
      'Choose a package family first, then the specific ritual and duration.',
      'Chọn nhóm gói dịch vụ phù hợp, sau đó chọn liệu trình và thời gian mong muốn.',
      '先选择套餐类别，再选择心仪的护理项目与时长。',
      'パッケージの種類を選び、お好みの施術内容と時間をお選びください。',
      '먼저 패키지 유형을 선택한 후, 세부 코스와 시간을 자유롭게 선택하세요.'
    ),
    services: [
      {
        name: 'Hair Wash & Facial',
        description: 'Choose a hair-wash package variation first. The preview and price both respond to the selected sub-package.',
        variants: [
          { name: 'Hair Wash · Head Neck Shoulder · Foot', subtitle: 'Gội đầu - Cổ vai gáy - Mát-xa chân', privilege: silkMask, media: { type: type('headSpaVideo', 'image'), src: headSpaVideo, tag: 'Hair wash' }, durations: [{ label: "70'", price: 685000, id: 'NHS1009' }, { label: "90'", price: 790000, id: 'NHS1010' }] },
          { name: 'Hair Wash · Head Neck Shoulder · Body', subtitle: 'Gội đầu - Cổ vai gáy - Body', privilege: silkMask, media: { type: type('headSpaVideo', 'image'), src: headSpaVideo, tag: 'Body' }, durations: [{ label: "70'", price: 705000, id: 'NHS1011' }, { label: "90'", price: 810000, id: 'NHS1012' }] },
          { name: 'Hair Wash · Facial · Head Neck Shoulder · Foot · Body', subtitle: 'Gội đầu - Facial - Cổ vai gáy - Chân - Body', privilege: silkMask, media: { type: type('headSpaVideo', 'image'), src: headSpaVideo, tag: 'Complete' }, durations: [{ label: "120'", price: 1105000, id: 'NHS1013' }] },
          { name: 'Facial · Machine Shave · Head Neck Shoulder · Body · Quick Hair Wash', subtitle: 'Facial - Cạo râu - Cổ vai gáy - Body - Gội nhanh', privilege: silkMask, media: { type: type('headSpaVideo', 'image'), src: headSpaVideo, tag: 'Facial' }, durations: [{ label: "90'", price: 840000, id: 'NHS1014' }, { label: "120'", price: 1105000, id: 'NHS1015' }] },
        ],
      },
      {
        name: 'Heel Care & Nail Cut',
        description: 'A smaller package family focused on grooming with foot or body add-ons.',
        variants: [
          { name: 'Heel · Nail Cut · Foot', subtitle: 'Chà gót - Cắt móng - Mát-xa chân', privilege: refreshingTea, media: { type: type('footImg', 'image'), src: footImg, tag: 'Foot' }, durations: [{ label: "90'", price: 790000, id: 'NHS1016' }, { label: "120'", price: 1085000, id: 'NHS1017' }] },
          { name: 'Heel · Nail Cut · Body', subtitle: 'Chà gót - Cắt móng - Body', privilege: refreshingTea, media: { type: type('massageVideo', 'image'), src: massageVideo, tag: 'Body' }, durations: [{ label: "90'", price: 810000, id: 'NHS1018' }, { label: "120'", price: 1105000, id: 'NHS1019' }] },
        ],
      },

    ],
  },
  {
    id: 'adds-on',
    index: '06 / 07',
    title: tTitle('Add on', 'Dịch vụ thêm', '附加服务', '追加', '추가 서비스'),
    icon: '/category-icons-svg/adds-on.svg',
    mediaLabel: tText('Add on', 'Dịch vụ thêm', '附加服务', '追加', '추가 서비스'),
    description: tText(
      'Enhance your experience with these additional services.',
      'Nâng tầm trải nghiệm thư giãn với các dịch vụ bổ sung đa dạng.',
      '通过这些附加服务进一步提升您的水疗体验。',
      '追加サービスをプラスして、より充実したリラクゼーションを。',
      '다양한 추가 서비스로 더욱 풍성한 힐링을 경험해 보세요.'
    ),
    services: [
      {
        name: 'Private room',
        description: 'Enjoy your treatment in a private setting.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: 'Per session', price: 105000, id: 'NHS0900' }]
      },
      {
        name: 'Hairwash',
        description: 'Refreshing hair wash and scalp care.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "45'", price: 420000, id: 'NHS0910' }]
      },
      {
        name: 'Facial',
        description: 'Basic facial care.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "45'", price: 420000, id: 'NHS0904' }]
      },
      {
        name: 'Heel',
        description: 'Heel care and scrub.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "30'", price: 315000, id: 'NHS0905' }]
      },
      {
        name: 'Nailcut',
        description: 'Basic nail trimming and shaping.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "30'", price: 315000, id: 'NHS0906' }]
      },
      {
        name: 'Head, Neck, Shoulder, Arm',
        description: 'Targeted relaxation for upper body.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "45'", price: 370000, id: 'NHS0909' }]
      },
      {
        name: 'Back',
        description: 'Targeted back massage.',
        media: { type: 'image', src: fallbackImg, tag: 'Add on' },
        durations: [{ label: "30'", price: 315000, id: 'NHS0908' }]
      }
    ]
  },
  {
    id: 'vip-package',
    index: '07 / 07',
    title: tTitle('VIP Package', 'Gói VIP', 'VIP 套餐', 'VIP パッケージ', 'VIP 패키지'),
    icon: '/category-icons-svg/combo-king.svg',
    mediaLabel: tText('VIP Package', 'Gói VIP', 'VIP 套餐', 'VIP パッケージ', 'VIP 패키지'),
    description: tText(
      'Exclusive and premium VIP experiences tailored for ultimate relaxation.',
      'Trải nghiệm VIP cao cấp và đặc quyền tối thượng dành cho sự thư giãn trọn vẹn.',
      '专为极致放松打造的尊贵顶级 VIP 水疗体验。',
      '究極のリラクゼーションのために仕立てられた、上質でプレミアムなVIP体験。',
      '최상의 휴식과 힐링을 위해 세심하게 준비된 프리미엄 VIP 스페셜 케어.'
    ),
    services: [

      {
        name: 'King Combo',
        description: 'Razor Shave · Ear Clean · Facial · Heel Skin Shave · Hair Wash · 4-Hand Body Massage.',
        media: { type: type('spaVideo', 'image'), src: spaVideo, tag: 'Signature' },
        durations: [
          { label: "120'", price: 1575000, id: 'NHS0800' },
        ],
        privilege: signatureTea,
      },
    ]
  }
];
  const readCategoryText = (section: PureRelaxationSection, field: 'title' | 'description' | 'mediaLabel') => {
    const category = contentMedia?.categories?.[section.id];
    const localized = category?.[currentLang];
    if (localized && Object.prototype.hasOwnProperty.call(localized, field)) return localized[field];
    return section[field];
  };

  return pureRelaxationSections.map(section => ({
    ...section,
    title: readCategoryText(section, 'title'),
    description: readCategoryText(section, 'description'),
    mediaLabel: readCategoryText(section, 'mediaLabel'),
  }));
};
