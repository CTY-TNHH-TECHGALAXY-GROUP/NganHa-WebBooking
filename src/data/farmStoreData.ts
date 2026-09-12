import type { Locale } from '@/lib/constants';

export interface FarmStoreSection {
  id: string;
  heading: Record<Locale, string>;
  paragraphs: Record<Locale, string>[];
}

export interface FarmStorePillar {
  title: Record<Locale, string>;
  desc: Record<Locale, string>;
}

export interface FarmStoreConfig {
  heroImage: string;
  heroMediaType: 'image' | 'video';
  heroWatermarkEnabled: boolean;
  heroWatermarkOpacity?: number;
  preTitle: Record<Locale, string>;
  pageTitle: Record<Locale, string>;
  pageSubtitle: Record<Locale, string>;
  introLead: Record<Locale, string>;
  introParagraphs: Record<Locale, string>[];
  storyPhotos: string[];
  storyPhotosWatermark: boolean[];
  storyPhotosWatermarkOpacity?: number[];
  pillars: FarmStorePillar[];
  sections: FarmStoreSection[];
  motto: Record<Locale, string>;
  tagline: Record<Locale, string>;
  hashtags: string;
  closingText: Record<Locale, string>;
  address: Record<Locale, string>;
  ctaText: Record<Locale, string>;
  ctaLink: string;
}

export const DEFAULT_FARM_STORE_CONFIG: FarmStoreConfig = {
  heroImage: '',
  heroMediaType: 'image',
  heroWatermarkEnabled: true,
  heroWatermarkOpacity: 15,
  preTitle: {
    vi: '',
    en: '',
    cn: '',
    jp: '',
    kr: '',
  },
  pageTitle: {
    vi: 'ORIAFARM STORE',
    en: 'ORIAFARM STORE',
    cn: 'ORIAFARM STORE',
    jp: 'ORIAFARM STORE',
    kr: 'ORIAFARM STORE',
  },
  pageSubtitle: {
    vi: 'Dinh dưỡng xanh từ chính khu vườn Oria Farm',
    en: 'Green nutrition from our own farm',
    cn: '来自 ORIAFARM 自家果园的绿色营养',
    jp: 'ORIAFARMの自家農園から生まれる、グリーンな栄養',
    kr: 'ORIAFARM의 자체 농장에서 시작되는 그린 뉴트리션',
  },
  introLead: {
    vi: 'Chăm sóc cơ thể mỗi ngày bắt đầu từ nguồn dinh dưỡng thuần khiết nhất.',
    en: 'Caring for your body every day begins with the purest source of nutrition.',
    cn: '对身体的日常关怀，始于最纯净的天然营养。',
    jp: '毎日の身体のケアは、最も純粋な栄養の恵みから始まります。',
    kr: '매일 내 몸을 돌보는 일은 가장 순수한 자연의 영양에서 시작됩니다.',
  },
  introParagraphs: [
    {
      vi: 'Giữa nhịp sống ngày càng bận rộn, chúng ta có thể dành rất nhiều thời gian cho công việc, những cuộc hẹn và trách nhiệm mỗi ngày, nhưng lại không phải lúc nào cũng có đủ thời gian để chăm sóc cơ thể bằng một chế độ dinh dưỡng chỉn chu.',
      en: 'In today’s increasingly busy world, we spend so much of our time on work, appointments, and daily responsibilities. Yet, we do not always have enough time to properly care for our bodies through balanced, thoughtful nutrition.',
      cn: '在日益忙碌的生活节奏中，我们把大量时间投入工作、约会与每天的责任，却不一定总有足够的时间，通过均衡而用心的营养来照顾自己的身体。',
      jp: '忙しさを増す日々の中で、私たちは仕事や予定、さまざまな責任に多くの時間を使っています。その一方で、バランスの取れた食生活を通して、自分の身体を丁寧にいたわる時間を十分に確保できないこともあります。',
      kr: '점점 더 바빠지는 일상 속에서 우리는 업무와 약속, 매일의 책임에 많은 시간을 사용합니다. 하지만 정작 균형 잡힌 영양을 통해 내 몸을 제대로 돌볼 시간은 충분하지 않을 때가 많습니다.',
    },
  ],
  storyPhotos: ['', '', '', '', '', ''],
  storyPhotosWatermark: [true, true, true, true, true, true],
  storyPhotosWatermarkOpacity: [15, 15, 15, 15, 15, 15],
  pillars: [
    {
      title: {
        vi: '100% Thiên Nhiên',
        en: '100% Natural',
        cn: '100% 天然成分',
        jp: '100% 自然由来',
        kr: '100% 천연 원료',
      },
      desc: {
        vi: 'Trái cây vườn và nguyên liệu hữu cơ thuần khiết, không chất bảo quản.',
        en: 'Garden-fresh fruits and pure organic ingredients, zero preservatives.',
        cn: '自家果园鲜果与纯净有机原料，绝无人工防腐剂。',
        jp: '農園の採れたて果実と自然素材、保存料は一切不使用。',
        kr: '농장에서 갓 수확한 과일과 유기농 원료, 무방부제 원칙.',
      },
    },
    {
      title: {
        vi: 'Tự Trồng & Chăm Sóc',
        en: 'Farm-Grown Journey',
        cn: '自家种植照料',
        jp: '自家栽培・徹底管理',
        kr: '직접 재배 및 관리',
      },
      desc: {
        vi: 'Hiểu rõ hành trình từ khi còn trên cành cây đến ly nước cầm trên tay.',
        en: 'Transparent journey from the branch on the tree to the cup in your hand.',
        cn: '透明了解原料从树上生长到送到手中的全过程。',
        jp: '樹上で実を結ぶ瞬間から、手元の一杯に届くまでを熟知。',
        kr: '나무에서 자라는 순간부터 손에 들린 한 잔까지 투명한 여정.',
      },
    },
    {
      title: {
        vi: 'Dinh Dưỡng Thực Thụ',
        en: 'Real Nutrition',
        cn: '专注真实营养',
        jp: '本物の栄養価値',
        kr: '진정한 영양 가치',
      },
      desc: {
        vi: 'Tập trung vào giá trị dinh dưỡng nuôi dưỡng cơ thể, không chỉ để giải khát.',
        en: 'Focused on deep nourishment to sustain your day, not just quenching thirst.',
        cn: '注重为身体注入健康滋养，而不只是满足一时解渴。',
        jp: '単なる喉の渇きを癒すだけでなく、身体を育む栄養価に特化。',
        kr: '단순한 갈증 해소를 넘어 몸을 채우는 건강한 영양에 집중.',
      },
    },
  ],
  sections: [
    {
      id: 'origin',
      heading: {
        vi: 'Ra đời từ chính khu vườn của ORIAFARM',
        en: 'Born from the very heart of ORIAFARM',
        cn: '诞生于 ORIAFARM 自己的果园',
        jp: 'ORIAFARM STOREは、ORIAFARM自身の農園から生まれました',
        kr: 'ORIAFARM STORE는 자체 농장에서 시작되었습니다',
      },
      paragraphs: [
        {
          vi: 'Trái cây sử dụng trong các sản phẩm tại ORIAFARM STORE được chính ORIAFARM trồng và chăm sóc, từ khu vườn đến khi thu hoạch và trở thành nguyên liệu cho từng món nước.',
          en: 'The fruits used in our products are grown and cared for by ORIAFARM itself — from cultivation in our own garden, through harvesting, to becoming the ingredients in every drink we make.',
          cn: 'ORIAFARM STORE 产品中使用的水果，均由 ORIAFARM 亲自种植与照料。从果园里的生长、成熟与采收，到成为每一杯饮品中的原料，我们都参与其中。',
          jp: 'ORIAFARM STOREで使用する果物は、ORIAFARMが自ら育て、手入れしたものです。農園で育つところから収穫され、一杯一杯のドリンクの材料になるまで、その過程を私たち自身が見守っています。',
          kr: 'ORIAFARM STORE의 제품에 사용되는 과일은 ORIAFARM이 직접 재배하고 관리합니다. 농장에서 자라고 수확되는 순간부터 한 잔의 음료에 들어가는 원료가 되기까지, 그 모든 과정을 함께합니다.',
        },
        {
          vi: 'Chúng tôi hiểu nguyên liệu đến từ đâu. Hiểu cách chúng được trồng. Hiểu hành trình từ khi còn trên cây cho đến lúc có mặt trong một sản phẩm dành cho khách hàng.',
          en: 'We know where our ingredients come from. We know how they are grown. We know their journey from the moment they grow on the tree to the moment they become part of something made for you.',
          cn: '我们知道原料从哪里来。知道它们如何被种植。也了解它们从树上生长，到最终成为送到顾客手中的产品，经历了怎样的过程。',
          jp: '私たちは、原料がどこから来たのかを知っています。どのように育てられたのかを知っています。木の上で育った果実が、お客様の手に届く商品になるまでの道のりを知っています。',
          kr: '우리는 원료가 어디에서 왔는지 알고 있습니다. 어떻게 재배되었는지 알고 있습니다. 나무에서 자란 과일이 고객을 위한 제품이 되기까지의 여정을 알고 있습니다.',
        },
      ],
    },
    {
      id: 'green-nutrition',
      heading: {
        vi: 'Nguồn dinh dưỡng xanh, sạch và tự nhiên',
        en: 'Clean, natural, and green nutrition',
        cn: '用自己种植的作物，创造绿色纯净营养',
        jp: 'クリーンで自然なグリーン栄養を生み出すこと',
        kr: '직접 기른 원료로 만드는 깨끗한 그린 뉴트리션',
      },
      paragraphs: [
        {
          vi: 'Đó cũng là nền tảng để ORIAFARM STORE theo đuổi một điều rất rõ ràng: Tạo ra nguồn dinh dưỡng xanh, sạch và tự nhiên từ chính những gì ORIAFARM nuôi trồng.',
          en: 'This is the foundation behind one clear purpose at ORIAFARM STORE: To create clean, natural, green nutrition from what ORIAFARM grows itself.',
          cn: '这也是 ORIAFARM STORE 坚持一个明确目标的基础：用 ORIAFARM 自己种植的作物，创造绿色、洁净、天然的营养。',
          jp: 'それが、ORIAFARM STOREが大切にしている明確な考え方の原点です：ORIAFARMが自ら育てたものから、クリーンで自然なグリーン栄養を生み出すこと。',
          kr: '이것이 ORIAFARM STORE가 추구하는 분명한 하나의 가치입니다: ORIAFARM이 직접 기른 자연의 원료로 깨끗하고 자연스러운 그린 뉴트리션을 만드는 것.',
        },
        {
          vi: 'Các sản phẩm được làm từ trái cây vườn và nguyên liệu tự nhiên, 100% thiên nhiên, không chất bảo quản, tập trung vào giá trị dinh dưỡng thay vì chỉ đơn thuần tạo ra một món nước ngon.',
          en: 'Our products are made with farm-grown fruits and natural ingredients — 100% natural and free from preservatives — with a focus on nutritional value rather than simply creating something that tastes good.',
          cn: '我们的产品以自家果园水果与天然原料制成，100% 天然，不添加防腐剂，重点不只是做出一杯好喝的饮品，而是真正关注它所能带来的营养价值。',
          jp: '私たちの商品は、自家農園の果物と自然由来の素材から作られ、100%ナチュラル・保存料不使用。ただ「おいしいドリンク」を作るだけではなく、その一杯が持つ栄養価を大切にしています。',
          kr: '우리의 제품은 자체 농장에서 재배한 과일과 자연 원료로 만들어지며, 100% 자연 그대로, 보존료 없이 제조됩니다. 단순히 맛있는 음료를 만드는 데 그치지 않고, 한 잔이 전달할 수 있는 영양적 가치에 집중합니다.',
        },
      ],
    },
    {
      id: 'daily-energy',
      heading: {
        vi: 'Mỗi công thức là một nguồn năng lượng cho ngày dài',
        en: 'Every recipe offers sustained energy for your day',
        cn: '每一款配方，都是日常生活的一份能量支持',
        jp: '一杯一杯のレシピが、一日を支えるエネルギーに',
        kr: '모든 레시피는 하루를 살아가는 에너지가 됩니다',
      },
      paragraphs: [
        {
          vi: 'Mỗi công thức tại ORIAFARM STORE được phát triển để mang đến nhiều hơn một thức uống.',
          en: 'Every recipe at ORIAFARM STORE is developed to offer more than just a drink.',
          cn: 'ORIAFARM STORE 的每一款配方，都希望带给你比一杯饮品更多的价值。',
          jp: 'ORIAFARM STOREのすべてのレシピは、単なる飲み物以上の価値を届けるために考えられています。',
          kr: 'ORIAFARM STORE의 모든 레시피는 단순한 음료 이상의 가치를 제공하기 위해 만들어집니다.',
        },
        {
          vi: 'Đó có thể là nguồn năng lượng cho một buổi sáng bận rộn. Là một món dinh dưỡng giữa ngày khi bạn chưa có thời gian chuẩn bị bữa ăn.',
          en: 'It can be a source of energy for a busy morning. A nourishing option during the day when there is simply not enough time to prepare a proper meal.',
          cn: '它可以是忙碌早晨的一份能量补充。可以是在没有时间准备完整餐食时，为身体补充营养的一种方式。',
          jp: '忙しい朝のエネルギー補給として。きちんとした食事を準備する時間がない日の、栄養を補う一品として。',
          kr: '바쁜 아침을 위한 에너지원이 될 수 있습니다. 제대로 된 식사를 준비할 시간이 없는 날, 몸에 필요한 영양을 보충하는 한 끼의 대안이 될 수도 있습니다.',
        },
        {
          vi: 'Là sự kết hợp giữa trái cây, ngũ cốc và những nguyên liệu tự nhiên giúp cơ thể được bổ sung thêm dưỡng chất và duy trì năng lượng trong ngày.',
          en: 'Or a combination of fruits, grains, and natural ingredients designed to provide additional nutrients and help sustain your energy throughout the day.',
          cn: '也可以是水果、谷物与天然食材的结合，为身体补充更多营养，并帮助维持一整天所需的能量。',
          jp: 'あるいは、果物・穀物・自然由来の素材を組み合わせ、必要な栄養を補いながら、一日のエネルギーを支えるものとして。',
          kr: '또는 과일, 곡물, 자연 원료의 조합을 통해 필요한 영양소를 더하고 하루 동안 필요한 에너지를 유지하는 데 도움을 줄 수도 있습니다.',
        },
        {
          vi: 'Bởi ORIAFARM STORE hiểu rằng cuộc sống hiện đại không phải lúc nào cũng cho chúng ta đủ thời gian để dừng lại và chăm sóc bản thân một cách trọn vẹn.',
          en: 'ORIAFARM STORE understands that modern life does not always give us enough time to stop and take proper care of ourselves.',
          cn: 'ORIAFARM STORE 明白，现代生活并不总能给我们足够的时间停下来，好好照顾自己。',
          jp: 'ORIAFARM STOREは、現代の暮らしの中で、いつでも立ち止まり、自分自身を十分にケアできるとは限らないことを理解しています。',
          kr: 'ORIAFARM STORE는 현대적인 삶이 언제나 우리에게 멈춰 서서 스스로를 충분히 돌볼 시간을 주는 것은 아니라는 점을 이해합니다.',
        },
      ],
    },
    {
      id: 'farm-to-cup',
      heading: {
        vi: 'Từ khu vườn Oria Farm đến ly nước bạn cầm trên tay',
        en: 'From our garden to the drink in your hands',
        cn: '从 ORIAFARM 的果园，到你手中的这一杯',
        jp: 'ORIAFARMの農園から、あなたの手の中の一杯へ',
        kr: 'ORIAFARM의 농장에서, 당신의 손에 들린 한 잔까지',
      },
      paragraphs: [
        {
          vi: 'Vì vậy, chúng tôi muốn biến việc bổ sung dinh dưỡng mỗi ngày trở nên đơn giản hơn, tự nhiên hơn và gần gũi hơn.',
          en: 'That is why we want to make everyday nutrition simpler, more natural, and easier to incorporate into daily life.',
          cn: '因此，我们希望让每天补充营养这件事变得更简单、更自然，也更容易融入日常生活。',
          jp: 'だからこそ、毎日の栄養補給をもっとシンプルに、もっと自然に、そして日常に取り入れやすくしたいと考えています。',
          kr: '그래서 우리는 매일의 영양 보충을 더 간단하게, 더 자연스럽게, 그리고 일상 속에 더 쉽게 스며들 수 있도록 만들고자 합니다.',
        },
        {
          vi: 'Không phải một nguyên liệu không rõ hành trình. Không phải một sản phẩm chỉ được tạo ra để giải khát.',
          en: 'Not ingredients with an unknown journey. Not products made simply to quench your thirst.',
          cn: '不是来源不明的原料。也不是只为了止渴而制作的产品。',
          jp: 'どこから来たのかわからない原料ではありません。ただ喉を潤すためだけの商品でもありません。',
          kr: '어디에서 왔는지 알 수 없는 원료가 아닙니다. 단순히 갈증을 해소하기 위해 만들어진 제품도 아닙니다.',
        },
        {
          vi: 'Mà là những gì được ORIAFARM tự tay trồng, chăm sóc và tạo thành nguồn dinh dưỡng dành cho cuộc sống mỗi ngày.',
          en: 'But something grown, cared for, and transformed by ORIAFARM into everyday nourishment for you.',
          cn: '而是由 ORIAFARM 亲自种植、照料，并转化为适合日常生活的营养来源。',
          jp: 'ORIAFARMが自ら育て、手入れし、毎日の暮らしを支える栄養へと形にしたものです。',
          kr: 'ORIAFARM이 직접 재배하고 돌본 원료를, 매일의 삶을 위한 영양으로 만들어낸 것입니다.',
        },
      ],
    },
  ],
  motto: {
    vi: 'Tự trồng. Tự nhiên. Dinh dưỡng thật.',
    en: 'Grown by us. Naturally made. Real nutrition.',
    cn: '亲自种植。天然制作。真实营养。',
    jp: '自分たちで育てる。自然のままにつくる。本物の栄養を届ける。',
    kr: '직접 재배하고. 자연 그대로 만들고. 진짜 영양을 전합니다.',
  },
  tagline: {
    vi: 'From our farm, for your everyday nutrition.',
    en: 'From our farm, for your everyday nutrition.',
    cn: 'From our farm, for your everyday nutrition.',
    jp: 'From our farm, for your everyday nutrition.',
    kr: 'From our farm, for your everyday nutrition.',
  },
  hashtags: '#OriaFarmStore · #FromFarmToCup · #FarmToTable · #NaturalNutrition · #GreenNutrition · #HealthyDrinks · #FarmFresh',
  closingText: {
    vi: 'Tạo ra nguồn dinh dưỡng xanh, sạch và tự nhiên từ chính những gì ORIAFARM nuôi trồng. Chăm sóc cơ thể bằng những gì thuần khiết nhất từ thiên nhiên.',
    en: 'Creating clean, natural, and green nutrition from what we cultivate ourselves. Nourishing your body with nature’s purest gifts.',
    cn: '用 ORIAFARM 自己种植的作物，创造绿色纯净的天然营养。用来自大自然最纯粹的滋养呵护您的身心。',
    jp: 'ORIAFARMが自ら育てた自然の恵みから、クリーンな栄養をお届けします。大自然の純粋な力で身体をいたわりましょう。',
    kr: 'ORIAFARM이 직접 기른 자연의 원료로 깨끗한 영양을 전합니다. 자연이 주는 가장 순수한 선물로 내 몸을 채워보세요.',
  },
  address: {
    vi: 'Toạ lạc tại SH04, khu đô thị Thủ Thiêm, 19 Tố Hữu, phường An Khánh, Thành Phố Hồ Chí Minh.',
    en: 'Located at SH04, Thu Thiem Urban Area, 19 To Huu, An Khanh Ward, Ho Chi Minh City.',
    cn: '坐落于胡志明市安庆坊素有街19号，首添新城区 SH04。',
    jp: 'ホーチミン市アンカイン街区、トーフー通り19番地、トゥーティエム都市区 SH04に位置。',
    kr: '호치민시 안카인동 또흐우 거리 19번지, 투티엠 신도시 SH04에 위치.',
  },
  ctaText: {
    vi: 'Khám phá Menu Oria Farm Store',
    en: 'Discover Oria Farm Store Menu',
    cn: '探索 Oria Farm Store 菜单',
    jp: 'Oria Farm Storeのメニューを見る',
    kr: 'Oria Farm Store 메뉴 살펴보기',
  },
  ctaLink: 'tel:+84964090277',
};

export function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  return /\.(mp4|mov|webm)(\?.*)?$/i.test(url) || url.includes('/videos/') || url.includes('.mp4');
}

export function sanitizeFarmStorePhoto(url: unknown): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed.toLowerCase().includes('unsplash.com')) {
    return '';
  }
  return trimmed;
}

export function hydrateFarmStoreConfig(raw: any): FarmStoreConfig {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_FARM_STORE_CONFIG;
  }

  const heroRaw = sanitizeFarmStorePhoto(raw.heroImage);
  const heroMediaType = raw.heroMediaType === 'video' || isVideoUrl(heroRaw) ? 'video' : 'image';
  const heroWatermarkEnabled = raw.heroWatermarkEnabled !== false;
  const heroWatermarkOpacity =
    typeof raw.heroWatermarkOpacity === 'number' && raw.heroWatermarkOpacity >= 0 && raw.heroWatermarkOpacity <= 100
      ? Math.round(raw.heroWatermarkOpacity)
      : 15;

  const rawPhotos = Array.isArray(raw.storyPhotos) ? raw.storyPhotos : [];
  const storyPhotos: string[] = rawPhotos.map(sanitizeFarmStorePhoto);
  // Ensure at least 6 slots for core editorial section structure
  while (storyPhotos.length < 6) {
    storyPhotos.push('');
  }

  const rawWm = Array.isArray(raw.storyPhotosWatermark) ? raw.storyPhotosWatermark : [];
  const storyPhotosWatermark: boolean[] = storyPhotos.map((_, idx) => rawWm[idx] !== false);

  const rawWmOpacity = Array.isArray(raw.storyPhotosWatermarkOpacity) ? raw.storyPhotosWatermarkOpacity : [];
  const storyPhotosWatermarkOpacity: number[] = storyPhotos.map((_, idx) => {
    const val = rawWmOpacity[idx];
    return typeof val === 'number' && val >= 0 && val <= 100 ? Math.round(val) : 15;
  });

  return {
    heroImage: heroRaw,
    heroMediaType,
    heroWatermarkEnabled,
    heroWatermarkOpacity,
    preTitle: { ...DEFAULT_FARM_STORE_CONFIG.preTitle, ...(raw.preTitle || {}) },
    pageTitle: { ...DEFAULT_FARM_STORE_CONFIG.pageTitle, ...(raw.pageTitle || {}) },
    pageSubtitle: { ...DEFAULT_FARM_STORE_CONFIG.pageSubtitle, ...(raw.pageSubtitle || {}) },
    introLead: { ...DEFAULT_FARM_STORE_CONFIG.introLead, ...(raw.introLead || {}) },
    introParagraphs: Array.isArray(raw.introParagraphs) && raw.introParagraphs.length > 0
      ? raw.introParagraphs
      : DEFAULT_FARM_STORE_CONFIG.introParagraphs,
    storyPhotos,
    storyPhotosWatermark,
    storyPhotosWatermarkOpacity,
    pillars: Array.isArray(raw.pillars) && raw.pillars.length === 3
      ? raw.pillars
      : DEFAULT_FARM_STORE_CONFIG.pillars,
    sections: Array.isArray(raw.sections) && raw.sections.length > 0
      ? raw.sections
      : DEFAULT_FARM_STORE_CONFIG.sections,
    motto: { ...DEFAULT_FARM_STORE_CONFIG.motto, ...(raw.motto || {}) },
    tagline: { ...DEFAULT_FARM_STORE_CONFIG.tagline, ...(raw.tagline || {}) },
    hashtags: typeof raw.hashtags === 'string' ? raw.hashtags : DEFAULT_FARM_STORE_CONFIG.hashtags,
    closingText: { ...DEFAULT_FARM_STORE_CONFIG.closingText, ...(raw.closingText || {}) },
    address: { ...DEFAULT_FARM_STORE_CONFIG.address, ...(raw.address || {}) },
    ctaText: { ...DEFAULT_FARM_STORE_CONFIG.ctaText, ...(raw.ctaText || {}) },
    ctaLink: typeof raw.ctaLink === 'string' && raw.ctaLink ? raw.ctaLink : DEFAULT_FARM_STORE_CONFIG.ctaLink,
  };
}
