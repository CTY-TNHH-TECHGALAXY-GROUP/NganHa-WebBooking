import type { Locale } from '@/lib/constants';

export type BlogCard = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  meta: string;
  image?: string;
};

export type BlogLocaleContent = {
  hero: { kicker: string; title: string; body: string; askLabel: string; askPlaceholder: string; quickPrompts: string[]; image: string; mediaLabel: string };
  discovery: { eyebrow: string; title: string; intro: string; intents: BlogCard[] };
  featured: { eyebrow: string; title: string; cards: BlogCard[] };
  insight: { eyebrow: string; title: string; cards: BlogCard[] };
  city: { eyebrow: string; title: string; intro: string; cards: BlogCard[] };
  latest: { eyebrow: string; title: string; empty: string; readMore: string; minutes: string };
  footer: { eyebrow: string; title: string; topics: string; credit: string };
};

const image = 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=2940&auto=format&fit=crop';
const coffee = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2787&auto=format&fit=crop';
const architecture = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2947&auto=format&fit=crop';

const compose = (locale: Partial<BlogLocaleContent>): BlogLocaleContent => ({
  hero: { kicker: 'Knowledge, not just content', title: 'Saigon,\nexplained.', body: 'A useful way to read Saigon, one small question at a time.', askLabel: 'Ask Oria', askPlaceholder: 'Where should I go tonight?', quickPrompts: ['Near Oria Spa', 'Dinner in District 1', 'A quiet afternoon', 'After 9 PM', 'Local, not touristy'], image, mediaLabel: 'SGN · A curated guide by Oria Spa.' },
  discovery: { eyebrow: 'Discovery', title: 'What are you looking for?', intro: 'Start with what you need now, not a rigid category.', intents: [
    { id: 'eat', eyebrow: '01', title: 'I need a place to eat.', body: 'A small local answer.', meta: 'Food' },
    { id: 'quiet', eyebrow: '02', title: 'I want to sit somewhere quiet.', body: 'A slower corner of the city.', meta: 'Quiet' },
    { id: 'time', eyebrow: '03', title: 'I have 2 hours to kill.', body: 'A gentle short plan.', meta: 'Time' },
    { id: 'local', eyebrow: '04', title: 'Take me somewhere local.', body: 'Look beyond the obvious.', meta: 'Local' },
    { id: 'walk', eyebrow: '05', title: 'I want to walk around.', body: 'A walkable route.', meta: 'Walk' },
    { id: 'buy', eyebrow: '06', title: 'I need to buy something.', body: 'A useful stop.', meta: 'Shop' },
  ] },
  featured: { eyebrow: 'Featured Notes', title: 'How to read the city.', cards: [
    { id: 'coffee', eyebrow: 'Culture lens', title: 'How Saigon drinks coffee.', body: 'It is not only about the bean or the machine, but who you sit with and how you watch the street.', meta: 'Coffee culture · 5 min', image: coffee },
    { id: 'cafe', eyebrow: 'Quick answer', title: 'How to tell if a cafe is good for a slow afternoon.', body: 'Look at the acoustics, ergonomics, lighting, and pace of the staff.', meta: '3 min' },
    { id: 'meal', eyebrow: 'Wellness', title: 'What feels better than a heavy meal after a massage?', body: 'Keep the return to the city gentle.', meta: '4 min' },
  ] },
  insight: { eyebrow: 'Oria quick intelligence', title: 'Answers before articles.', cards: [
    { id: 'ninety', eyebrow: '90 MIN', title: 'Only 90 minutes in central Saigon?', body: 'Learn to read one part of the city.', meta: 'Quick plan' },
    { id: 'food', eyebrow: 'FOOD', title: 'Want to eat local but worried about choosing wrong?', body: 'Authenticity is easier to recognise than it looks.', meta: 'Local lens' },
    { id: 'after-spa', eyebrow: 'AFTER SPA', title: 'Where next without breaking the relaxed mood?', body: 'Let the city return gradually.', meta: 'Nearby' },
  ] },
  city: { eyebrow: 'Explore the city by layers', title: 'One city. Many lenses.', intro: 'Read Saigon by time, area, budget and rhythm.', cards: [
    { id: 'night', eyebrow: 'Night', title: 'HCMC after 6 PM', body: 'The streets become more visible after dark.', meta: '12 stories', image },
    { id: 'spaces', eyebrow: 'Architecture · Coffee', title: 'Spaces worth noticing', body: 'Saigon often hides its best spaces badly.', meta: 'City lens', image: architecture },
    { id: 'budget', eyebrow: 'Budget lens', title: '100k / 300k / 1m: what changes?', body: 'Price is not authenticity.', meta: 'Price' },
  ] },
  latest: { eyebrow: 'Latest from Oria', title: 'Notes for today.', empty: 'New notes will arrive here soon.', readMore: 'Read note', minutes: 'min read' },
  footer: { eyebrow: 'Oria Knowledge', title: 'Know more.\nChoose better.', topics: 'Food · City · Wellness · Culture · Local Intelligence', credit: 'TECHGALAXY GROUP / ORIA' },
  ...locale,
});

const english = compose({});

export const DEFAULT_BLOG_CONTENT: Record<Locale, BlogLocaleContent> = {
  en: english,
  vi: compose({
    hero: { ...english.hero, kicker: 'Kiến thức, không chỉ là nội dung', title: 'Sài Gòn,\ndễ hiểu hơn.', body: 'Những câu hỏi rất đời thường, được trả lời để bạn dùng ngay.', askLabel: 'Hỏi Oria', askPlaceholder: 'Tối nay nên đi đâu?', quickPrompts: ['Quanh Oria Spa', 'Ăn tối Quận 1', 'Một buổi chiều yên', 'Đi đâu sau 9PM', 'Local, không touristy'], mediaLabel: 'SGN · Cẩm nang chọn lọc bởi Oria Spa.' },
    discovery: { eyebrow: 'Khám phá', title: 'Bạn đang tìm điều gì?', intro: 'Bắt đầu từ điều bạn cần lúc này, không phải một danh mục cứng.', intents: [
      { id: 'eat', eyebrow: '01', title: 'Tôi cần một nơi để ăn.', body: 'Một gợi ý nhỏ, thật địa phương.', meta: 'Ẩm thực' },
      { id: 'quiet', eyebrow: '02', title: 'Tôi muốn ngồi đâu đó yên tĩnh.', body: 'Một góc thành phố chậm hơn.', meta: 'Yên tĩnh' },
      { id: 'time', eyebrow: '03', title: 'Tôi có 2 tiếng rảnh.', body: 'Một kế hoạch ngắn, nhẹ nhàng.', meta: 'Thời gian' },
      { id: 'local', eyebrow: '04', title: 'Đưa tôi đến một nơi local.', body: 'Đi xa hơn những điểm quen thuộc.', meta: 'Địa phương' },
      { id: 'walk', eyebrow: '05', title: 'Tôi muốn đi bộ.', body: 'Một cung đường dễ đi.', meta: 'Dạo bộ' },
      { id: 'buy', eyebrow: '06', title: 'Tôi cần mua vài thứ.', body: 'Một điểm dừng hữu ích.', meta: 'Mua sắm' },
    ] },
    featured: { eyebrow: 'Ghi chú nổi bật', title: 'Cách đọc thành phố.', cards: [
      { id: 'coffee', eyebrow: 'Góc nhìn văn hóa', title: 'Người Sài Gòn uống cà phê thế nào.', body: 'Không chỉ là hạt hay máy pha, mà còn là người bạn ngồi cùng và cách bạn nhìn phố xá.', meta: 'Văn hóa cà phê · 5 phút', image: coffee },
      { id: 'cafe', eyebrow: 'Câu trả lời nhanh', title: 'Làm sao biết một quán cà phê hợp cho buổi chiều chậm.', body: 'Hãy để ý âm thanh, chỗ ngồi, ánh sáng và nhịp phục vụ.', meta: '3 phút' },
      { id: 'meal', eyebrow: 'Wellness', title: 'Sau massage, điều gì dễ chịu hơn một bữa ăn nặng bụng?', body: 'Hãy để nhịp trở lại thành phố thật nhẹ nhàng.', meta: '4 phút' },
    ] },
    insight: { eyebrow: 'Oria giải đáp nhanh', title: 'Câu trả lời\ntrước bài viết.', cards: [
      { id: 'ninety', eyebrow: '90 PHÚT', title: 'Chỉ có 90 phút ở trung tâm Sài Gòn?', body: 'Hãy đọc một lát cắt của thành phố.', meta: 'Gợi ý nhanh' },
      { id: 'food', eyebrow: 'ẨM THỰC', title: 'Muốn ăn local nhưng sợ chọn nhầm?', body: 'Sự chân thật dễ nhận ra hơn bạn nghĩ.', meta: 'Góc nhìn địa phương' },
      { id: 'after-spa', eyebrow: 'SAU SPA', title: 'Đi đâu tiếp mà không làm vỡ nhịp thư giãn?', body: 'Hãy để thành phố trở lại từ từ.', meta: 'Gần đây' },
    ] },
    city: { eyebrow: 'Khám phá thành phố theo lớp', title: 'Một thành phố.\nNhiều lăng kính.', intro: 'Đọc Sài Gòn qua thời gian, khu vực, ngân sách và nhịp sống.', cards: [
      { id: 'night', eyebrow: 'Đêm', title: 'TP.HCM sau 6 giờ tối', body: 'Đường phố rõ nét hơn khi trời tối.', meta: '12 câu chuyện', image },
      { id: 'spaces', eyebrow: 'Kiến trúc · Cà phê', title: 'Những không gian đáng để ý', body: 'Sài Gòn thường giấu những không gian hay theo cách rất vụng về.', meta: 'Góc nhìn thành phố', image: architecture },
      { id: 'budget', eyebrow: 'Góc nhìn ngân sách', title: '100k / 300k / 1 triệu: điều gì thay đổi?', body: 'Giá tiền không phải là sự chân thật.', meta: 'Chi phí' },
    ] },
    latest: { eyebrow: 'Mới từ Oria', title: 'Ghi chú hôm nay.', empty: 'Bài viết mới sẽ xuất hiện tại đây.', readMore: 'Đọc bài', minutes: 'phút đọc' },
    footer: { eyebrow: 'Oria Knowledge', title: 'Biết thêm.\nChọn đúng hơn.', topics: 'Ẩm thực · Thành phố · Wellness · Văn hóa · Góc nhìn địa phương', credit: 'TECHGALAXY GROUP / ORIA' },
  }),
  cn: compose({
    hero: { ...english.hero, kicker: '不只是内容，而是知识', title: '西贡，\n更容易理解。', body: '把日常问题变成可以立刻使用的答案。', askLabel: '询问 Oria', askPlaceholder: '今晚该去哪里？', quickPrompts: ['Oria Spa 附近', '第一郡晚餐', '安静的下午', '晚上九点后', '本地而非游客路线'], mediaLabel: 'SGN · Oria Spa 精选指南。' },
    discovery: { eyebrow: '探索', title: '您在寻找什么？', intro: '从您当下需要的开始，而不是固定分类。', intents: [
      { id: 'eat', eyebrow: '01', title: '我想找个吃饭的地方。', body: '一个小而地道的建议。', meta: '美食' },
      { id: 'quiet', eyebrow: '02', title: '我想在安静的地方坐坐。', body: '城市里更慢的一角。', meta: '安静' },
      { id: 'time', eyebrow: '03', title: '我有两个小时可以安排。', body: '一个温和的短计划。', meta: '时间' },
      { id: 'local', eyebrow: '04', title: '带我去一个本地的地方。', body: '看看显而易见之外的城市。', meta: '本地' },
      { id: 'walk', eyebrow: '05', title: '我想散散步。', body: '一条适合步行的路线。', meta: '散步' },
      { id: 'buy', eyebrow: '06', title: '我需要买点东西。', body: '一个实用的停留点。', meta: '购物' },
    ] },
    featured: { eyebrow: '精选笔记', title: '如何阅读这座城市。', cards: [
      { id: 'coffee', eyebrow: '文化视角', title: '西贡人如何喝咖啡。', body: '不只是咖啡豆或机器，更是和谁同坐、如何望着街道。', meta: '咖啡文化 · 5 分钟', image: coffee },
      { id: 'cafe', eyebrow: '快速回答', title: '如何判断一家咖啡馆适合慢慢度过下午。', body: '留意声音、座椅、光线和店员的节奏。', meta: '3 分钟' },
      { id: 'meal', eyebrow: '健康', title: '按摩后，什么比一顿油腻的饭更舒服？', body: '让自己温柔地回到城市。', meta: '4 分钟' },
    ] },
    insight: { eyebrow: 'Oria 快速情报', title: '先有答案，\n再读文章。', cards: [
      { id: 'ninety', eyebrow: '90 分钟', title: '在西贡市中心只有 90 分钟？', body: '读懂城市的一小部分。', meta: '快速计划' },
      { id: 'food', eyebrow: '美食', title: '想吃本地菜，却担心选错？', body: '真实感比想象中更容易辨认。', meta: '本地视角' },
      { id: 'after-spa', eyebrow: 'SPA 之后', title: '接下来去哪里才不打破放松的心情？', body: '让城市慢慢回来。', meta: '附近' },
    ] },
    city: { eyebrow: '分层探索城市', title: '一座城市。\n多种视角。', intro: '从时间、区域、预算和节奏阅读西贡。', cards: [
      { id: 'night', eyebrow: '夜晚', title: '晚上六点后的胡志明市', body: '天黑后，街道变得更清晰。', meta: '12 个故事', image },
      { id: 'spaces', eyebrow: '建筑 · 咖啡', title: '值得留意的空间', body: '西贡常常不擅长隐藏它最好的空间。', meta: '城市视角', image: architecture },
      { id: 'budget', eyebrow: '预算视角', title: '10万 / 30万 / 100万：有什么不同？', body: '价格不等于真实。', meta: '价格' },
    ] },
    latest: { eyebrow: 'Oria 最新内容', title: '今日笔记。', empty: '新笔记即将出现在这里。', readMore: '阅读笔记', minutes: '分钟阅读' },
    footer: { eyebrow: 'Oria 知识', title: '了解更多。\n选择更好。', topics: '美食 · 城市 · 健康 · 文化 · 本地情报', credit: 'TECHGALAXY GROUP / ORIA' },
  }),
  jp: compose({
    hero: { ...english.hero, kicker: 'コンテンツ以上の知識', title: 'サイゴンを、\nもっと分かりやすく。', body: '日常の小さな疑問を、すぐ役立つ答えにします。', askLabel: 'Oria に聞く', askPlaceholder: '今夜はどこへ行く？', quickPrompts: ['Oria Spa 周辺', '1区で夕食', '静かな午後', '夜9時以降', '観光地ではない場所'], mediaLabel: 'SGN · Oria Spa の厳選ガイド。' },
    discovery: { eyebrow: '発見', title: '何をお探しですか？', intro: '固定されたカテゴリーではなく、今の目的から始めましょう。', intents: [
      { id: 'eat', eyebrow: '01', title: '食事をする場所を探しています。', body: '小さなローカルの答え。', meta: '食' },
      { id: 'quiet', eyebrow: '02', title: '静かな場所で座りたい。', body: '街のゆっくりした一角。', meta: '静けさ' },
      { id: 'time', eyebrow: '03', title: '2時間ほど時間があります。', body: 'やさしい短いプラン。', meta: '時間' },
      { id: 'local', eyebrow: '04', title: 'ローカルな場所へ連れて行って。', body: '定番の向こう側を見つけましょう。', meta: 'ローカル' },
      { id: 'walk', eyebrow: '05', title: '散歩をしたい。', body: '歩きやすいルート。', meta: '散歩' },
      { id: 'buy', eyebrow: '06', title: '何か買いたい。', body: '役に立つ立ち寄り先。', meta: '買い物' },
    ] },
    featured: { eyebrow: '注目のノート', title: '街の読み方。', cards: [
      { id: 'coffee', eyebrow: 'カルチャーレンズ', title: 'サイゴンのコーヒーの飲み方。', body: '豆やマシンだけでなく、誰と座り、どのように通りを見るかも大切です。', meta: 'コーヒー文化 · 5分', image: coffee },
      { id: 'cafe', eyebrow: 'クイックアンサー', title: 'ゆっくりした午後に合うカフェの見分け方。', body: '音、座り心地、光、スタッフのテンポを見てください。', meta: '3分' },
      { id: 'meal', eyebrow: 'ウェルネス', title: 'マッサージの後、重い食事より心地よいものは？', body: 'やさしく街へ戻りましょう。', meta: '4分' },
    ] },
    insight: { eyebrow: 'Oria クイックインテリジェンス', title: '記事の前に、\n答えを。', cards: [
      { id: 'ninety', eyebrow: '90分', title: 'サイゴン中心部で90分だけ？', body: '街の一部分を読み解きましょう。', meta: 'クイックプラン' },
      { id: 'food', eyebrow: '食', title: 'ローカルフードを食べたいけれど、選び間違いが心配？', body: '本物らしさは思うより見つけやすいものです。', meta: 'ローカルレンズ' },
      { id: 'after-spa', eyebrow: 'SPA の後', title: 'リラックスした気分を壊さずに次はどこへ？', body: '街を少しずつ戻しましょう。', meta: '近く' },
    ] },
    city: { eyebrow: '層で街を巡る', title: '一つの街。\n多くのレンズ。', intro: '時間、エリア、予算、リズムからサイゴンを読みます。', cards: [
      { id: 'night', eyebrow: '夜', title: '午後6時以降のホーチミン', body: '暗くなると通りがより見えてきます。', meta: '12のストーリー', image },
      { id: 'spaces', eyebrow: '建築 · コーヒー', title: '気づくべき空間', body: 'サイゴンは最高の空間を隠すのがあまり得意ではありません。', meta: 'シティレンズ', image: architecture },
      { id: 'budget', eyebrow: '予算レンズ', title: '10万 / 30万 / 100万：何が変わる？', body: '価格は本物らしさではありません。', meta: '価格' },
    ] },
    latest: { eyebrow: 'Oria の最新記事', title: '今日のノート。', empty: '新しいノートはまもなくここに表示されます。', readMore: '読む', minutes: '分で読めます' },
    footer: { eyebrow: 'Oria Knowledge', title: 'もっと知る。\nもっと良く選ぶ。', topics: '食 · 街 · ウェルネス · 文化 · ローカルインテリジェンス', credit: 'TECHGALAXY GROUP / ORIA' },
  }),
  kr: compose({
    hero: { ...english.hero, kicker: '콘텐츠를 넘어선 지식', title: '사이공을,\n더 쉽게 이해하세요.', body: '일상의 작은 질문을 바로 쓸 수 있는 답으로 바꿉니다.', askLabel: 'Oria 에게 묻기', askPlaceholder: '오늘 밤 어디로 갈까요?', quickPrompts: ['Oria Spa 근처', '1군 저녁 식사', '조용한 오후', '밤 9시 이후', '관광지가 아닌 곳'], mediaLabel: 'SGN · Oria Spa 큐레이션 가이드.' },
    discovery: { eyebrow: '발견', title: '무엇을 찾고 계신가요?', intro: '고정된 카테고리가 아닌 지금의 필요에서 시작하세요.', intents: [
      { id: 'eat', eyebrow: '01', title: '식사할 곳이 필요해요.', body: '작고 현지다운 답입니다.', meta: '음식' },
      { id: 'quiet', eyebrow: '02', title: '조용한 곳에 앉아 있고 싶어요.', body: '도시의 더 느린 한 모퉁이.', meta: '고요' },
      { id: 'time', eyebrow: '03', title: '두 시간 정도 시간이 있어요.', body: '부드러운 짧은 계획.', meta: '시간' },
      { id: 'local', eyebrow: '04', title: '현지적인 곳으로 데려가 주세요.', body: '익숙한 곳 너머를 보세요.', meta: '로컬' },
      { id: 'walk', eyebrow: '05', title: '걸어 다니고 싶어요.', body: '걷기 좋은 경로.', meta: '산책' },
      { id: 'buy', eyebrow: '06', title: '무언가 사야 해요.', body: '유용한 들름길.', meta: '쇼핑' },
    ] },
    featured: { eyebrow: '추천 노트', title: '도시를 읽는 법.', cards: [
      { id: 'coffee', eyebrow: '문화의 시선', title: '사이공은 커피를 어떻게 마실까요.', body: '원두나 기계만이 아니라 누구와 앉고 거리를 어떻게 바라보는지에 관한 이야기입니다.', meta: '커피 문화 · 5분', image: coffee },
      { id: 'cafe', eyebrow: '빠른 답변', title: '느린 오후에 어울리는 카페를 알아보는 법.', body: '소리, 자리, 빛, 직원의 리듬을 살펴보세요.', meta: '3분' },
      { id: 'meal', eyebrow: '웰니스', title: '마사지 뒤에 무거운 식사보다 더 좋은 것은 무엇일까요?', body: '도시로 부드럽게 돌아가세요.', meta: '4분' },
    ] },
    insight: { eyebrow: 'Oria 빠른 인사이트', title: '글보다 먼저,\n답을 드립니다.', cards: [
      { id: 'ninety', eyebrow: '90분', title: '사이공 중심에서 90분만 있나요?', body: '도시의 한 장면을 읽어 보세요.', meta: '빠른 계획' },
      { id: 'food', eyebrow: '음식', title: '현지 음식을 먹고 싶지만 잘못 고를까 걱정되나요?', body: '진정성은 생각보다 알아보기 쉽습니다.', meta: '로컬 시선' },
      { id: 'after-spa', eyebrow: 'SPA 후', title: '편안한 기분을 깨지 않고 다음엔 어디로 갈까요?', body: '도시를 천천히 다시 만나세요.', meta: '근처' },
    ] },
    city: { eyebrow: '겹겹이 도시 탐험하기', title: '하나의 도시.\n여러 시선.', intro: '시간, 지역, 예산, 리듬으로 사이공을 읽어 보세요.', cards: [
      { id: 'night', eyebrow: '밤', title: '오후 6시 이후의 호치민', body: '어두워진 뒤 거리가 더 선명해집니다.', meta: '12개의 이야기', image },
      { id: 'spaces', eyebrow: '건축 · 커피', title: '눈여겨볼 공간들', body: '사이공은 가장 좋은 공간을 숨기는 데 서툰 편입니다.', meta: '도시의 시선', image: architecture },
      { id: 'budget', eyebrow: '예산의 시선', title: '10만 / 30만 / 100만: 무엇이 달라질까요?', body: '가격이 진정성은 아닙니다.', meta: '가격' },
    ] },
    latest: { eyebrow: 'Oria 최신 소식', title: '오늘의 노트.', empty: '새로운 노트가 곧 이곳에 표시됩니다.', readMore: '읽기', minutes: '분 읽기' },
    footer: { eyebrow: 'Oria Knowledge', title: '더 알고.\n더 잘 고르세요.', topics: '음식 · 도시 · 웰니스 · 문화 · 로컬 인텔리전스', credit: 'TECHGALAXY GROUP / ORIA' },
  }),
};

export function resolveBlogContent(source: unknown, locale: Locale): BlogLocaleContent {
  const content = source as Partial<Record<Locale, Partial<BlogLocaleContent>>> | undefined;
  const stored = content?.[locale];
  if (!stored) return DEFAULT_BLOG_CONTENT[locale] || DEFAULT_BLOG_CONTENT.en;
  const fallback = DEFAULT_BLOG_CONTENT[locale] || DEFAULT_BLOG_CONTENT.en;
  return {
    ...fallback,
    ...stored,
    hero: { ...fallback.hero, ...stored.hero, quickPrompts: stored.hero?.quickPrompts || fallback.hero.quickPrompts },
    discovery: { ...fallback.discovery, ...stored.discovery, intents: stored.discovery?.intents || fallback.discovery.intents },
    featured: { ...fallback.featured, ...stored.featured, cards: stored.featured?.cards || fallback.featured.cards },
    insight: { ...fallback.insight, ...stored.insight, cards: stored.insight?.cards || fallback.insight.cards },
    city: { ...fallback.city, ...stored.city, cards: stored.city?.cards || fallback.city.cards },
    latest: { ...fallback.latest, ...stored.latest },
    footer: { ...fallback.footer, ...stored.footer },
  };
}
