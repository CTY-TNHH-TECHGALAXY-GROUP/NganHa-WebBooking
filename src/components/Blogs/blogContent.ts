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

export const DEFAULT_BLOG_CONTENT: Record<Locale, BlogLocaleContent> = {
  en: compose({}),
  vi: compose({ hero: { ...compose({}).hero, kicker: 'Kiến thức, không chỉ là nội dung', title: 'Sài Gòn,\ndễ hiểu hơn.', body: 'Những câu hỏi rất đời thường, được trả lời để bạn dùng ngay.', askLabel: 'Hỏi Oria', askPlaceholder: 'Tối nay nên đi đâu?', quickPrompts: ['Quanh Oria Spa', 'Ăn tối Quận 1', 'Một buổi chiều yên', 'Đi đâu sau 9PM', 'Local, không touristy'], mediaLabel: 'SGN · Cẩm nang chọn lọc bởi Oria Spa.' }, discovery: { ...compose({}).discovery, eyebrow: 'Khám phá', title: 'Bạn đang tìm điều gì?', intro: 'Bắt đầu từ điều bạn cần lúc này, không phải một danh mục cứng.' }, featured: { ...compose({}).featured, eyebrow: 'Ghi chú nổi bật', title: 'Cách đọc thành phố.' }, insight: { ...compose({}).insight, eyebrow: 'Oria quick intelligence', title: 'Câu trả lời\ntrước bài viết.' }, city: { ...compose({}).city, eyebrow: 'Khám phá thành phố theo lớp', title: 'Một thành phố. Nhiều lăng kính.', intro: 'Đọc Sài Gòn qua thời gian, khu vực, ngân sách và nhịp sống.' }, latest: { eyebrow: 'Mới từ Oria', title: 'Ghi chú hôm nay.', empty: 'Bài viết mới sẽ xuất hiện tại đây.', readMore: 'Đọc bài', minutes: 'phút đọc' }, footer: { eyebrow: 'Oria Knowledge', title: 'Biết thêm.\nChọn đúng hơn.', topics: 'Ẩm thực · Thành phố · Wellness · Văn hoá · Góc nhìn địa phương', credit: 'TECHGALAXY GROUP / ORIA' } }),
  cn: compose({ hero: { ...compose({}).hero, kicker: '不只是内容，而是知识', title: '西贡，\n更容易理解。', body: '把日常问题变成可以立刻使用的答案。', askLabel: '询问 Oria', askPlaceholder: '今晚该去哪里？', quickPrompts: ['Oria Spa 附近', '第一郡晚餐', '安静的下午', '晚上九点后', '本地而非游客路线'], mediaLabel: 'SGN · Oria Spa 精选指南。' }, discovery: { ...compose({}).discovery, eyebrow: '探索', title: '您在寻找什么？', intro: '从您当下需要的开始，而不是固定分类。' }, featured: { ...compose({}).featured, eyebrow: '精选笔记', title: '如何阅读这座城市。' }, latest: { eyebrow: 'Oria 最新内容', title: '今日笔记。', empty: '新笔记即将出现在这里。', readMore: '阅读笔记', minutes: '分钟阅读' } }),
  jp: compose({ hero: { ...compose({}).hero, kicker: 'コンテンツ以上の知識', title: 'サイゴンを、\nもっと分かりやすく。', body: '日常の小さな疑問を、すぐ役立つ答えにします。', askLabel: 'Oria に聞く', askPlaceholder: '今夜はどこへ行く？', quickPrompts: ['Oria Spa 周辺', '1区で夕食', '静かな午後', '夜9時以降', '観光地ではない場所'], mediaLabel: 'SGN · Oria Spa の厳選ガイド。' }, discovery: { ...compose({}).discovery, eyebrow: '発見', title: '何をお探しですか？', intro: '固定されたカテゴリーではなく、今の目的から始めましょう。' }, featured: { ...compose({}).featured, eyebrow: '注目のノート', title: '街の読み方。' }, latest: { eyebrow: 'Oria の最新記事', title: '今日のノート。', empty: '新しいノートはまもなくここに表示されます。', readMore: '読む', minutes: '分で読めます' } }),
  kr: compose({ hero: { ...compose({}).hero, kicker: '콘텐츠를 넘어선 지식', title: '사이공을,\n더 쉽게 이해하세요.', body: '일상의 작은 질문을 바로 쓸 수 있는 답으로 바꿉니다.', askLabel: 'Oria 에게 묻기', askPlaceholder: '오늘 밤 어디로 갈까요?', quickPrompts: ['Oria Spa 근처', '1군 저녁 식사', '조용한 오후', '밤 9시 이후', '관광지가 아닌 곳'], mediaLabel: 'SGN · Oria Spa 큐레이션 가이드.' }, discovery: { ...compose({}).discovery, eyebrow: '발견', title: '무엇을 찾고 계신가요?', intro: '고정된 카테고리가 아닌 지금의 필요에서 시작하세요.' }, featured: { ...compose({}).featured, eyebrow: '추천 노트', title: '도시를 읽는 법.' }, latest: { eyebrow: 'Oria 최신 소식', title: '오늘의 노트.', empty: '새로운 노트가 곧 이곳에 표시됩니다.', readMore: '읽기', minutes: '분 읽기' } }),
};

export const resolveBlogContent = (source: unknown, locale: Locale) => {
  const content = source as Partial<Record<Locale, BlogLocaleContent>> | undefined;
  return content?.[locale] || content?.en || content?.vi || DEFAULT_BLOG_CONTENT[locale] || DEFAULT_BLOG_CONTENT.en;
};
