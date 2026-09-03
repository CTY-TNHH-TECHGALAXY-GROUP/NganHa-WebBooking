export const HISTORY_LOCALES = ['vi', 'en', 'jp', 'kr', 'cn'] as const;

export type HistoryLocale = (typeof HISTORY_LOCALES)[number];

export const HISTORY_LANGUAGE_TABS: Array<{ code: HistoryLocale; label: string; flag: string }> = [
  { code: 'vi', label: 'VI', flag: '🇻🇳' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'jp', label: 'JP', flag: '🇯🇵' },
  { code: 'kr', label: 'KR', flag: '🇰🇷' },
  { code: 'cn', label: 'ZH', flag: '🇨🇳' },
];

export const HISTORY_HERO_DEFAULTS: Record<HistoryLocale, { eyebrow: string; title1: string; title2: string; body: string }> = {
  vi: {
    eyebrow: 'Hành trình đáng dõi theo',
    title1: 'Lịch Sử',
    title2: 'Ngân Hà',
    body: 'Từ một không gian nhỏ ban đầu đến một điểm đến spa chỉn chu hơn, mỗi cột mốc đều giữ cùng một lời hứa: chăm sóc tốt hơn, đón tiếp ấm hơn và trải nghiệm bình yên hơn.',
  },
  en: {
    eyebrow: 'A story worth following',
    title1: 'Our',
    title2: 'History',
    body: 'From a humble beginning to a refined spa destination, every milestone carries the same promise: better care, warmer hospitality, and a more peaceful experience.',
  },
  jp: {
    eyebrow: 'たどりたい物語',
    title1: '私たちの',
    title2: '歩み',
    body: '小さな空間から始まり、より洗練されたスパへ。どの節目にも、より良いケア、より温かな歓迎、より穏やかな時間を届けるという約束があります。',
  },
  kr: {
    eyebrow: '함께 따라가는 이야기',
    title1: '우리의',
    title2: '역사',
    body: '작은 공간에서 시작해 한층 정제된 스파로 성장하기까지, 모든 순간에는 더 나은 케어와 따뜻한 환대, 평온한 경험을 전하겠다는 약속이 담겨 있습니다.',
  },
  cn: {
    eyebrow: '值得追随的故事',
    title1: '我们的',
    title2: '历程',
    body: '从最初的小空间到更精致的水疗目的地，每一个里程碑都承载着同一份承诺：更用心的护理、更温暖的接待，以及更宁静的体验。',
  },
};

export const HISTORY_FINALE_DEFAULTS: Record<HistoryLocale, { eyebrow: string; title: string; body: string }> = {
  vi: {
    eyebrow: 'Câu chuyện còn tiếp tục',
    title: 'Ít cảm giác giao diện hơn. Nhiều cảm xúc hơn.',
    body: 'Lịch sử trở thành một hành trình điện ảnh nhẹ nhàng qua thương hiệu, con người và những không gian đã tạo nên Ngân Hà.',
  },
  en: {
    eyebrow: 'The story continues',
    title: 'Less interface. More feeling.',
    body: 'History becomes a quiet cinematic journey through the brand, its people, and the spaces that shaped Ngan Ha.',
  },
  jp: {
    eyebrow: '物語は続きます',
    title: '画面よりも、心に残るものを。',
    body: 'ブランド、人、そしてNgân Hàを形づくった空間をめぐる、静かな映像のような旅として歴史を感じてください。',
  },
  kr: {
    eyebrow: '이야기는 계속됩니다',
    title: '화면은 덜하게. 감정은 더 깊게.',
    body: 'Ngân Hà를 만들어 온 브랜드와 사람, 공간을 따라가는 잔잔하고 영화 같은 여정으로 역사를 느껴 보세요.',
  },
  cn: {
    eyebrow: '故事仍在继续',
    title: '少一点界面，多一点感受。',
    body: '历史化作一段安静而富有电影感的旅程，穿过品牌、人与塑造了Ngân Hà的空间。',
  },
};

export const HISTORY_INTERFACE_COPY: Record<HistoryLocale, {
  scrollCue: string;
  introEyebrow: string;
  introTitle: string;
  introBody: string;
  currentMoment: string;
  imageSequence: string;
  imageSequenceHint: string;
  changeImage: string;
  previousImage: string;
  nextImage: string;
  sceneMoments: string;
  viewImage: string;
  historyYears: string;
}> = {
  vi: {
    scrollCue: 'Cuộn để theo dõi hành trình', introEyebrow: 'Dòng thời gian điện ảnh', introTitle: 'Một cách bình yên hơn để cảm nhận câu chuyện thương hiệu.', introBody: 'Giao diện lùi nhẹ về sau; hình ảnh, nhịp kể và ký ức trở thành trọng tâm của trải nghiệm.', currentMoment: 'Khoảnh khắc hiện tại', imageSequence: 'Chuỗi ảnh của', imageSequenceHint: 'Bấm hoặc nhấn Enter để xem tiếp.', changeImage: 'Chuyển ảnh', previousImage: 'Ảnh trước', nextImage: 'Ảnh tiếp theo', sceneMoments: 'Các khoảnh khắc', viewImage: 'Xem ảnh', historyYears: 'Các năm lịch sử',
  },
  en: {
    scrollCue: 'Scroll to follow the journey', introEyebrow: 'Cinematic timeline', introTitle: 'A calmer way to feel the brand story.', introBody: 'The interface fades into the background; image, rhythm, and memory become the main experience.', currentMoment: 'Current moment', imageSequence: 'Image sequence for', imageSequenceHint: 'Click or press Enter to continue.', changeImage: 'Change image', previousImage: 'Previous image', nextImage: 'Next image', sceneMoments: 'Scene moments', viewImage: 'View image', historyYears: 'History years',
  },
  jp: {
    scrollCue: 'スクロールして旅をたどる', introEyebrow: 'シネマティック・タイムライン', introTitle: 'ブランドの物語を、もっと穏やかに感じる方法。', introBody: '画面は少し後ろへ退き、写真、物語のリズム、記憶が体験の中心になります。', currentMoment: 'いまの瞬間', imageSequence: '年の写真シリーズ', imageSequenceHint: 'クリックまたはEnterキーで次の写真を見られます。', changeImage: '写真を切り替える', previousImage: '前の写真', nextImage: '次の写真', sceneMoments: '写真の瞬間', viewImage: '写真を見る', historyYears: '沿革の年',
  },
  kr: {
    scrollCue: '스크롤하여 여정을 따라가세요', introEyebrow: '시네마틱 타임라인', introTitle: '브랜드 이야기를 더 평온하게 느끼는 방법.', introBody: '인터페이스는 뒤로 물러나고 이미지, 이야기의 리듬, 기억이 경험의 중심이 됩니다.', currentMoment: '현재의 순간', imageSequence: '연도의 이미지 순서', imageSequenceHint: '클릭하거나 Enter를 눌러 다음 이미지를 보세요.', changeImage: '이미지 변경', previousImage: '이전 이미지', nextImage: '다음 이미지', sceneMoments: '장면의 순간', viewImage: '이미지 보기', historyYears: '역사의 연도',
  },
  cn: {
    scrollCue: '向下滚动，追随这段旅程', introEyebrow: '电影感时间线', introTitle: '以更宁静的方式感受品牌故事。', introBody: '界面轻轻退后，影像、叙事节奏与记忆成为体验的核心。', currentMoment: '此刻', imageSequence: '该年份的图片序列', imageSequenceHint: '点击或按 Enter 查看下一张图片。', changeImage: '切换图片', previousImage: '上一张图片', nextImage: '下一张图片', sceneMoments: '影像瞬间', viewImage: '查看图片', historyYears: '品牌历程年份',
  },
};

type LocalizedChapter = {
  eyebrow: string;
  title: string;
  body: string;
  meta: string[];
  scenes: Array<{ title: string; label: string; body: string }>;
};

// Default translations retain the same calm, factual storytelling tone as the Vietnamese and English source.
export const HISTORY_CHAPTER_TRANSLATIONS: Record<'jp' | 'kr' | 'cn', LocalizedChapter[]> = {
  jp: [
    { eyebrow: '創業', title: '美容とウェルネスの場としての始まり', body: '小さな空間、最初のチーム、そして日々の細やかなサービスから育まれた品質への約束。ここがNgân Hàの最初の章でした。', meta: ['最初の店舗', '創業チーム', 'オープン'], scenes: [
      { title: '創業当時のNgân Hàサロン', label: '最初のサロン', body: 'Beauty Salon Ngân Hàの初期を記録した店頭写真です。なじみのお客さまと丁寧な日々のケアを通じて、ブランドが育っていきました。' },
      { title: '最初の品質への約束', label: '約束', body: 'お客さまに良質な製品を使うという誓いは、創業時から大切にしてきた誠実なケアの精神を表しています。' },
      { title: 'オープン日のNgân Hàチーム', label: 'チーム', body: '店先に集ったチームの姿には、整ったおもてなしとお客さまへの思いを大切にした出発点が残っています。' },
    ] },
    { eyebrow: '存在感', title: 'お客さまの目に映るブランドがより鮮明に', body: '2018年、Ngân Hàの個性はより確かなものになりました。明るい店頭、わかりやすい運営、そして記憶に残るサービスのリズムです。', meta: ['アイデンティティ', '店頭', '安定したサービス'], scenes: [
      { title: '昼のNgân Hà店頭', label: '昼の店頭', body: '62A Hồ Hảo Hớnの昼の外観は、より明確で覚えやすいサロンの存在感を伝えています。' },
      { title: '初期のヘアサービス空間', label: 'サロン席', body: 'スタイリングチェアと製品棚は、サロンのサービスがより整えられていった時期を記録しています。' },
      { title: '夜のNgân Hà店頭', label: '夜の店頭', body: '夜に輝く看板は通りの中でブランドを際立たせ、お客さまの記憶に残る存在にしました。' },
    ] },
    { eyebrow: '成長', title: 'チームと空間がともに成熟した時期', body: '物語は外観だけのものではなくなりました。人、サービスのスタイル、そして空間の雰囲気がより自然に調和していきます。', meta: ['チーム', '空間', 'プロフェッショナル'], scenes: [
      { title: 'Salon Ngân Hàの看板', label: '看板', body: 'ヘアウォッシュ、耳かき、コンボサービスを示す店頭看板は、Nguyễn Cư Trinhの店舗をより見つけやすくしました。' },
      { title: '青いユニフォームのチーム', label: 'ブルーチーム', body: '青いユニフォームの集合写真は、より統一され専門性を高めていったNgân Hàの運営の姿を伝えます。' },
      { title: 'より明るいお迎えの空間', label: 'エントランス', body: '明るさ、待合席、わかりやすい動線によって、店内はより開かれた空間になりました。' },
      { title: 'サイゴンの記憶を映すアオザイのチーム', label: 'アオザイチーム', body: '色彩豊かなアオザイをまとったチームは、Ngân Hàがブランドらしさと体験を磨いた時期を象徴しています。' },
    ] },
    { eyebrow: '拡大', title: 'より強い視覚的アイデンティティを持つ新しい住所', body: '2021年は、Ngân HàがNgô Đức Kếの店舗でサービス空間を広げ、ブランドの印象をより明確にした時期です。', meta: ['Ngô Đức Kế', '看板', 'サービス空間'], scenes: [
      { title: '11 Ngô Đức Kếの金色の看板', label: 'ゴールドの外観', body: '大きな金色の看板は通りから店舗を見つけやすくし、ヘア、ネイル、耳かき、フット、ボディという主要サービスを明確に伝えました。' },
      { title: 'より温かくプライベートな施術室', label: '施術室', body: '施術ベッド、やわらかな光、温かい素材から、ボディケアの心地よさへの投資がよりはっきり見えます。' },
      { title: '営業中のサービスフロア', label: 'ゲストサービス', body: 'お客さまを迎えるフロアの様子は、より明るく、清潔で、親しみやすい日常のリズムを映しています。' },
    ] },
    { eyebrow: '第2店舗', title: 'Thi Sách支店が新しいサービスのリズムを生む', body: 'Sauna Salonのメニューから6B Thi Sáchの店頭まで、ブランドは場所、規模、サービスの見せ方をより明確に広げていきました。', meta: ['第2店舗', 'Thi Sách', 'Sauna Salon'], scenes: [
      { title: '6B Thi Sáchの店頭', label: 'Thi Sách', body: '第2店舗の外観は、マッサージ、耳かき、リラクゼーションケアを求めるゲストに向けた、中心地での存在感を示しています。' },
      { title: 'Thi Sách支店のメニューアイデンティティ', label: '支店メニュー', body: '木製のスパメニューは二つの住所を紹介するNgân Hàの姿を記録し、Thi Sách支店が重要な拡大の拠点となったことを伝えます。' },
    ] },
    { eyebrow: '認知', title: '新しい看板、新しい空間、広がる評価', body: '看板と空間を更新した後、Ngân Hàは実際の来店、レビュー、サービス紹介を通じて、より多くの記録と認知を得ました。', meta: ['新しい看板', '刷新した空間', 'レビュー'], scenes: [
      { title: 'Ngô Đức Kếの新しい看板', label: '新しい看板', body: '更新された店頭は11 Ngô Đức Kếをより現代的でわかりやすい場所にしました。' },
      { title: '空間更新後の店内', label: '刷新した空間', body: 'サービスチェア、待合席、照明を整え、より明るく清潔で専門的な雰囲気をつくりました。' },
      { title: 'サービス紹介リストでの掲載', label: 'メディア掲載', body: 'サイゴンの安全な耳かき店を紹介する記事への掲載は、Ngân Hàのオンラインでの認知が広がったことを示します。' },
      { title: 'ブログに記録されたSalon Ngân Hà', label: 'ブログ掲載', body: 'ブログの画面にはBeauty Salon Ngân Hàの店頭と来店記が残され、オンラインでの存在感をより明確にしました。' },
      { title: 'ホーチミン市での体験を語るレビュー', label: 'トラベルブログ', body: 'マッサージサービスとNgân Hàの場所に触れたレビューは、実際のゲスト体験からの確かな記録を加えています。' },
    ] },
    { eyebrow: 'ブランド統合', title: 'Oriaブランドの統合とFnBへの拡大', body: '2026年、ブランドの輪郭はより明確になりました。Oria SpaはTechGalaxy Groupのエコシステムと連携し、OriaFarm StoreはFnBの新しい拠点を開きました。', meta: ['Oria Spa', 'OriaFarm Store', 'FnB'], scenes: [
      { title: 'TechGalaxy GroupによるOria Spaの看板', label: 'ブランド統合', body: '11 Ngô Đức KếのOria Spa看板は、ケアを大切にする精神を保ちながら、Oriaという名前を前面に出した新しい統合を示します。' },
      { title: 'FnBへ広がるOriaFarm Store', label: 'FnB店頭', body: 'OriaFarm Storeの店頭は、飲み物、果物、新鮮な商品を通じて日常のゲストに届けるOriaエコシステムの新しい体験を紹介します。' },
      { title: 'OriaFarm Storeの新鮮な果物とドリンク', label: 'フレッシュバー', body: '果物、野菜、Rainbow Cupのラインは、拡大するブランドの中で、より新鮮で明るいFnBの方向性を示しています。' },
    ] },
  ],
  kr: [
    { eyebrow: '시작', title: '뷰티와 웰니스 공간의 첫걸음', body: '작은 공간, 첫 번째 팀, 그리고 매일의 서비스 디테일로 다져진 품질의 약속. 이것이 Ngân Hà의 첫 장이었습니다.', meta: ['첫 매장', '초기 팀', '오픈'], scenes: [
      { title: '초창기 Ngân Hà 살롱', label: '첫 살롱', body: 'Beauty Salon Ngân Hà의 초창기를 담은 매장 사진입니다. 익숙한 고객과 세심한 일상의 케어를 통해 브랜드가 만들어졌습니다.' },
      { title: '첫 번째 품질 약속', label: '약속', body: '고객에게 좋은 제품을 사용하겠다는 약속은 시작부터 이어져 온 진심 어린 케어의 정신을 보여 줍니다.' },
      { title: '오픈 날의 Ngân Hà 팀', label: '팀', body: '매장 입구에 함께 선 팀의 모습에는 정돈되고 따뜻하며 고객 경험을 향한 시작의 마음이 담겨 있습니다.' },
    ] },
    { eyebrow: '존재감', title: '고객에게 더 선명해진 브랜드', body: '2018년, Ngân Hà의 정체성은 더 단단해졌습니다. 밝아진 외관, 분명한 운영, 그리고 기억에 남는 서비스의 흐름입니다.', meta: ['아이덴티티', '외관', '안정적인 서비스'], scenes: [
      { title: '낮의 Ngân Hà 외관', label: '낮 외관', body: '62A Hồ Hảo Hớn의 낮 풍경은 더 뚜렷하고 알아보기 쉬워진 살롱의 정체성을 보여 줍니다.' },
      { title: '초기의 헤어 서비스 공간', label: '살롱 스테이션', body: '스타일링 의자와 제품 진열장은 살롱 서비스가 더 체계적으로 자리 잡아 가던 시기를 기록합니다.' },
      { title: '밤의 Ngân Hà 외관', label: '밤 외관', body: '밤에 빛나는 간판은 거리에서 브랜드를 돋보이게 하며 고객의 기억에 더 오래 남게 했습니다.' },
    ] },
    { eyebrow: '성장', title: '팀과 공간이 함께 성장한 시간', body: '이야기는 더 이상 외관에만 머물지 않았습니다. 사람, 서비스 방식, 공간의 분위기가 한층 자연스럽게 조화를 이루기 시작했습니다.', meta: ['팀', '공간', '전문성'], scenes: [
      { title: 'Salon Ngân Hà 간판', label: '간판', body: '헤어 워시, 귀 청소, 콤보 서비스를 알린 매장 간판은 Nguyễn Cư Trinh 지점을 더 쉽게 찾을 수 있게 했습니다.' },
      { title: '파란 유니폼의 팀', label: '블루 팀', body: '파란 유니폼을 입은 팀의 모습은 더 통일되고 전문적으로 성장한 Ngân Hà의 운영 정신을 보여 줍니다.' },
      { title: '더 밝아진 고객 맞이 공간', label: '입구', body: '밝은 조명, 대기석, 분명한 동선으로 내부 공간은 더 열려 있고 편안해졌습니다.' },
      { title: '사이공의 기억을 담은 아오자이 팀', label: '아오자이 팀', body: '다채로운 아오자이를 입은 팀 사진은 Ngân Hà가 브랜드 정체성과 고객 경험을 다듬어 가던 시기를 보여 줍니다.' },
    ] },
    { eyebrow: '확장', title: '더 강한 시각적 정체성을 지닌 새 주소', body: '2021년은 Ngân Hà가 Ngô Đức Kế 지점에서 서비스 공간을 넓히고 브랜드의 인상을 더 선명하게 다진 시기입니다.', meta: ['Ngô Đức Kế', '간판', '서비스 공간'], scenes: [
      { title: '11 Ngô Đức Kế의 금색 간판', label: '골드 외관', body: '커다란 금색 간판은 거리에서 지점을 더 잘 보이게 하고, 헤어, 네일, 귀 청소, 풋, 바디라는 주요 서비스를 분명하게 전했습니다.' },
      { title: '더 따뜻하고 프라이빗한 테라피 룸', label: '테라피 룸', body: '테라피 베드, 부드러운 조명, 따뜻한 소재는 바디 케어의 편안함에 더 깊이 투자한 모습을 보여 줍니다.' },
      { title: '운영 시간의 서비스 플로어', label: '고객 서비스', body: '고객을 맞이하는 살롱 공간은 더 밝고 깨끗하며 친근해진 일상의 운영 리듬을 보여 줍니다.' },
    ] },
    { eyebrow: '두 번째 지점', title: 'Thi Sách 지점이 더한 새로운 서비스의 흐름', body: 'Sauna Salon의 메뉴 아이덴티티에서 6B Thi Sách 외관까지, 브랜드는 위치, 규모, 서비스 소개 방식에서 더 분명한 확장을 이루었습니다.', meta: ['두 번째 지점', 'Thi Sách', 'Sauna Salon'], scenes: [
      { title: '6B Thi Sách 매장 외관', label: 'Thi Sách', body: '두 번째 지점의 외관은 마사지, 귀 청소, 휴식 케어를 찾는 고객에게 중심 지역에서 더 강한 존재감을 보여 줍니다.' },
      { title: 'Thi Sách 지점의 메뉴 아이덴티티', label: '지점 메뉴', body: '목재 스파 메뉴는 Ngân Hà가 두 주소를 함께 소개한 방식을 기록하며 Thi Sách 지점이 중요한 확장의 거점이 되었음을 보여 줍니다.' },
    ] },
    { eyebrow: '인정', title: '새 간판, 새 공간, 더 넓어진 인지도', body: '간판과 공간을 새롭게 다듬은 뒤, Ngân Hà는 실제 방문, 리뷰, 서비스 추천 채널을 통해 더 많은 기록과 인지도를 얻었습니다.', meta: ['새 간판', '새 공간', '리뷰'], scenes: [
      { title: 'Ngô Đức Kế의 새 간판', label: '새 간판', body: '새롭게 정비한 외관은 11 Ngô Đức Kế 주소를 더 현대적이고 쉽게 알아볼 수 있게 했습니다.' },
      { title: '공간 업데이트 후의 내부', label: '업데이트된 공간', body: '서비스 의자, 대기석, 조명을 다시 구성해 더 밝고 깨끗하며 전문적인 분위기를 만들었습니다.' },
      { title: '서비스 추천 목록에 소개되다', label: '미디어 소개', body: '사이공의 안전한 귀 청소 장소를 소개하는 글은 Ngân Hà의 온라인 인지도가 높아졌음을 보여 줍니다.' },
      { title: '블로그에 담긴 Salon Ngân Hà', label: '블로그 소개', body: '블로그 화면에는 Beauty Salon Ngân Hà의 외관과 방문 후기가 담겨 온라인에서의 존재감을 더 분명하게 만들었습니다.' },
      { title: '호치민시 방문 경험을 담은 리뷰', label: '여행 블로그', body: '마사지 서비스와 Ngân Hà의 위치를 언급한 리뷰는 실제 고객 경험에서 나온 또 하나의 기록을 더합니다.' },
    ] },
    { eyebrow: '브랜드 정렬', title: 'Oria 브랜드 정렬과 FnB로의 확장', body: '2026년, 브랜드의 모습은 더욱 분명해졌습니다. Oria Spa는 TechGalaxy Group 생태계 안에서 정렬되었고 OriaFarm Store는 새로운 FnB 지점을 열었습니다.', meta: ['Oria Spa', 'OriaFarm Store', 'FnB'], scenes: [
      { title: 'TechGalaxy Group의 Oria Spa 간판', label: '브랜드 정렬', body: '11 Ngô Đức Kế의 Oria Spa 간판은 케어 중심의 마음을 유지하면서 Oria 이름을 전면에 내세운 더 분명한 브랜드 정렬을 보여 줍니다.' },
      { title: 'FnB로 확장하는 OriaFarm Store', label: 'FnB 매장', body: 'OriaFarm Store의 외관은 음료, 과일, 신선한 상품을 통해 일상의 고객에게 다가가는 Oria 생태계의 새로운 경험을 소개합니다.' },
      { title: 'OriaFarm Store의 신선한 과일과 음료', label: '프레시 바', body: '과일, 채소, Rainbow Cup 라인은 확장되는 브랜드 여정 안에서 더 신선하고 밝은 FnB 방향을 보여 줍니다.' },
    ] },
  ],
  cn: [
    { eyebrow: '起点', title: '一处美容与疗愈目的地的开始', body: '一个小空间、第一支团队，以及从每日服务细节中建立的品质承诺。这是Ngân Hà故事的开篇。', meta: ['首家门店', '创始团队', '开业'], scenes: [
      { title: '早期的Ngân Hà沙龙', label: '首家沙龙', body: '这张门面资料记录了Beauty Salon Ngân Hà的起点。品牌由熟悉的客人与细致的日常护理一点点建立。' },
      { title: '最初的品质承诺', label: '承诺', body: '为客人使用优质产品的承诺，体现了品牌从一开始便珍视的真诚护理精神。' },
      { title: '开业日的Ngân Hà团队', label: '团队', body: '团队一起站在店门前的瞬间，保留了起步时整洁、亲切并专注于顾客体验的精神。' },
    ] },
    { eyebrow: '建立形象', title: '品牌在顾客眼中更加清晰', body: '来到2018年，Ngân Hà的形象更加稳固：更明亮的门面、更清晰的运营，以及更令人记住的服务节奏。', meta: ['品牌形象', '门面', '稳定服务'], scenes: [
      { title: '白天的Ngân Hà门面', label: '白天门面', body: '62A Hồ Hảo Hớn的日间门面展现了更清晰、更容易辨识的沙龙形象。' },
      { title: '早期的美发服务空间', label: '沙龙工位', body: '造型椅与产品架记录了沙龙服务逐渐变得更有条理的阶段。' },
      { title: '夜晚的Ngân Hà门面', label: '夜晚门面', body: '夜间明亮的招牌让品牌在街道上更醒目，也更容易留在顾客记忆中。' },
    ] },
    { eyebrow: '成长', title: '团队与空间一同成熟', body: '故事不再只停留在外观。人、服务方式与空间氛围开始更加自然地协调在一起。', meta: ['团队', '空间', '专业'], scenes: [
      { title: 'Salon Ngân Hà招牌', label: '招牌', body: '门面招牌突出洗发、采耳与套餐服务，让Nguyễn Cư Trinh门店更容易被识别。' },
      { title: '身穿蓝色制服的团队', label: '蓝色团队', body: '蓝色制服的团队合影记录了Ngân Hà更加统一、专业的运营精神。' },
      { title: '更明亮的迎宾空间', label: '入口', body: '通过更好的采光、等候座位和清晰动线，室内空间变得更加开放舒适。' },
      { title: '在旧西贡氛围中的奥黛团队', label: '奥黛团队', body: '身着彩色奥黛的团队照片，呈现了Ngân Hà细致打磨品牌个性与顾客体验的阶段。' },
    ] },
    { eyebrow: '扩展', title: '拥有更强视觉形象的新地址', body: '2021年记录了Ngân Hà在Ngô Đức Kế门店扩大服务空间，并让品牌形象更清晰的阶段。', meta: ['Ngô Đức Kế', '招牌', '服务空间'], scenes: [
      { title: '11 Ngô Đức Kế的金色招牌', label: '金色门面', body: '大型金色招牌让门店从街上更容易被看到，也清楚呈现了美发、美甲、采耳、足部和身体护理等核心服务。' },
      { title: '更温暖私密的护理室', label: '护理室', body: '护理床、柔和灯光与温暖材质，展现了品牌对身体护理舒适度更明确的投入。' },
      { title: '营业时间的服务区', label: '顾客服务', body: '顾客正在接受服务的画面，展现了沙龙更明亮、洁净且亲切的日常节奏。' },
    ] },
    { eyebrow: '第二分店', title: 'Thi Sách分店带来新的服务节奏', body: '从Sauna Salon的菜单形象到6B Thi Sách的门面，品牌在地点、规模与服务呈现上进入了更明确的扩展阶段。', meta: ['第二分店', 'Thi Sách', 'Sauna Salon'], scenes: [
      { title: '6B Thi Sách门面', label: 'Thi Sách', body: '第二分店的门面展现了品牌在市中心更强的存在感，服务寻求按摩、采耳和放松护理的客人。' },
      { title: 'Thi Sách分店的菜单形象', label: '分店菜单', body: '木质水疗菜单记录了Ngân Hà如何同时介绍两处地址，而Thi Sách分店成为重要的扩展据点。' },
    ] },
    { eyebrow: '认可', title: '新招牌、新空间与更广的认可', body: '更新招牌并整理空间后，Ngân Hà通过真实到访、评价和服务推荐渠道积累了更多记录与认知。', meta: ['新招牌', '更新空间', '评价'], scenes: [
      { title: 'Ngô Đức Kế的新招牌', label: '新招牌', body: '更新后的门面让11 Ngô Đức Kế地址更现代、更清晰，也更容易从街上识别。' },
      { title: '空间更新后的室内', label: '更新空间', body: '服务椅、等候座位与灯光经过重新安排，营造出更明亮、洁净、专业的氛围。' },
      { title: '被收录于服务推荐名单', label: '媒体提及', body: '一篇介绍西贡安全采耳地点的推荐文章，说明Ngân Hà获得了更多线上关注。' },
      { title: '博客记录中的Salon Ngân Hà', label: '博客提及', body: '博客截图保留了Beauty Salon Ngân Hà的门面与到访文字，让线上认可更为清晰。' },
      { title: '讲述胡志明市体验的评价', label: '旅行博客', body: '提到按摩服务与Ngân Hà位置的评价，为真实顾客体验增添了另一层记录。' },
    ] },
    { eyebrow: '品牌同步', title: 'Oria品牌同步与FnB业务扩展', body: '2026年，品牌形象更加清晰：Oria Spa与TechGalaxy Group生态体系协同，OriaFarm Store则开启了新的FnB分支。', meta: ['Oria Spa', 'OriaFarm Store', 'FnB'], scenes: [
      { title: 'TechGalaxy Group旗下Oria Spa招牌', label: '品牌同步', body: '11 Ngô Đức Kế的Oria Spa招牌标志着更清晰的品牌同步，在保留以护理为核心的精神同时，让Oria名称走到前方。' },
      { title: 'OriaFarm Store扩展至FnB', label: 'FnB门店', body: 'OriaFarm Store门面为Oria生态带来新的体验分支：饮品、水果与新鲜产品服务日常客人。' },
      { title: 'OriaFarm Store的新鲜水果与饮品', label: '鲜果吧', body: '水果、蔬菜与Rainbow Cup系列呈现了品牌扩展旅程中更清新、明亮的FnB方向。' },
    ] },
  ],
};
