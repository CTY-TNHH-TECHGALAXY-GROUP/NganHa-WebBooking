import type {
  ContentDocument,
  MediaAsset,
  RichTextDocument,
  RichTextNode,
  SupportedLocale,
} from '../types/content/content.ts';

const text = (value: string, marks?: RichTextNode['marks']): RichTextNode => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
});

const paragraph = (...content: RichTextNode[]): RichTextNode => ({ type: 'paragraph', content });

const bulletList = (items: string[]): RichTextNode => ({
  type: 'bulletList',
  content: items.map((item) => ({ type: 'listItem', content: [paragraph(text(item))] })),
});

const document = (...content: RichTextNode[]): RichTextDocument => ({ type: 'doc', content });

export const SAIGON_COFFEE_PILOT_MEDIA = {
  'media-saigon-coffee-hero': {
    id: 'media-saigon-coffee-hero',
    title: 'Saigon coffee hero',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1518057111178-44a106bad636?q=80&w=2000&auto=format&fit=crop',
    source: 'external',
    width: 2000,
    height: 2996,
    mime_type: 'image/jpeg',
    file_size: null,
    alt_i18n: {
      vi: 'Một bàn tay cầm tách cà phê nóng bên cửa sổ',
      en: 'A hand holding a steaming coffee cup by a window',
    },
    default_focal_point: { x: 50, y: 58 },
    created_at: '2026-09-19T00:00:00.000Z',
    updated_at: '2026-09-19T00:00:00.000Z',
  },
  'media-saigon-coffee-feature': {
    id: 'media-saigon-coffee-feature',
    title: 'Saigon coffee beans and phin',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=1200',
    source: 'external',
    width: 1200,
    height: 1500,
    mime_type: 'image/jpeg',
    file_size: null,
    alt_i18n: {
      vi: 'Phin cà phê giữa những hạt cà phê rang đậm',
      en: 'A coffee phin surrounded by dark roasted coffee beans',
    },
    default_focal_point: { x: 55, y: 48 },
    created_at: '2026-09-19T00:00:00.000Z',
    updated_at: '2026-09-19T00:00:00.000Z',
  },
} satisfies Record<string, MediaAsset>;

export const resolveSaigonCoffeePilotMedia = (mediaId: string) =>
  SAIGON_COFFEE_PILOT_MEDIA[mediaId as keyof typeof SAIGON_COFFEE_PILOT_MEDIA] || null;

export const SAIGON_COFFEE_PILOT_HEADER = {
  kicker: { vi: 'Góc Văn Hóa', en: 'Culture Lens' },
  title: {
    vi: 'Người Sài Gòn uống cà phê như thế nào.',
    en: 'How Saigon drinks coffee.',
  },
  subtitle: {
    vi: 'Một góc nhìn địa phương đơn giản về cà phê đậm, nhiều đá, những cuộc trò chuyện dài, và vì sao những quán cà phê lại như một phần tất yếu của cuộc sống hàng ngày tại Sài Gòn.',
    en: 'A simple local guide to strong coffee, lots of ice, long conversations — and why cafés feel like part of everyday life in Saigon.',
  },
  author: { vi: 'Bởi Oria Editorial', en: 'By Oria Editorial' },
  cultureTag: { vi: 'Văn hóa Sài Gòn', en: 'Saigon culture' },
  paceTag: { vi: 'Chiều chậm', en: 'Slow afternoon' },
  readTime: { vi: '04 phút đọc', en: '04 min read' },
  sideLabel: { vi: 'Vì sao bài viết này hữu ích', en: 'Why this article matters' },
  sideTitle: {
    vi: 'Cà phê ở đây là nhịp sống mỗi ngày.',
    en: 'Coffee here is part of daily life.',
  },
  sideBody: {
    vi: 'Người ta dừng lại uống cà phê để chuyện trò, làm việc, chờ đợi, ngắm đường phố, hay đơn giản chỉ để ngồi một lát.',
    en: 'People stop for coffee to talk, work, wait, watch the street — or simply sit for a while.',
  },
  bestFor: { vi: 'Phù hợp nhất cho người lần đầu ghé thăm', en: 'Best for first-time visitors' },
} as const;

export const SAIGON_COFFEE_PILOT_DOCUMENT = {
  schemaVersion: 1,
  blocks: [
    {
      id: 'coffee-intro',
      type: 'richText',
      settings: { width: 'wide', spacingTop: 'xl', spacingBottom: 'lg' },
      props: {
        content: {
          vi: document(
            paragraph(text('Để hiểu văn hóa cà phê Sài Gòn, hãy quên đi khái niệm cà phê mua mang đi vội vã. Ở đây, một ly cà phê có thể thật đậm đà, ngọt ngào, mát lạnh, và được thưởng thức thật chậm rãi trong khi thành phố vẫn không ngừng chuyển động xung quanh bạn.')),
            paragraph(text('Điểm nhìn nhanh', [{ type: 'bold' }])),
            bulletList([
              'Cà phê đậm vị, thường phục vụ kèm rất nhiều đá.',
              'Những chiếc ghế đẩu vỉa hè và những quán cà phê sang trọng đều thuộc chung một văn hóa cà phê.',
              'Mọi người thường nán lại, chuyện trò và ngắm nhìn thành phố thay vì chỉ uống rồi vội vã rời đi.',
            ]),
          ),
          en: document(
            paragraph(text('To understand Saigon coffee culture, forget the idea of coffee as a quick takeaway. Here, a cup can be strong, sweet, iced — and enjoyed slowly while the city keeps moving around you.')),
            paragraph(text('In one glance', [{ type: 'bold' }])),
            bulletList([
              'Strong coffee, often served over plenty of ice.',
              'Street stools and polished cafés can belong to the same coffee culture.',
              'People often stay, talk and watch the city rather than drink and leave.',
            ]),
          ),
        },
      },
    },
    {
      id: 'coffee-feature-image',
      type: 'image',
      settings: { width: 'wide', spacingTop: 'none', spacingBottom: 'lg' },
      props: {
        mediaId: 'media-saigon-coffee-feature',
        aspectRatio: '16:9',
        fit: 'cover',
        focalPoint: { x: 55, y: 46 },
        zoom: 1,
        presentation: 'wide',
        alt: {
          vi: 'Phin cà phê giữa những hạt cà phê rang đậm',
          en: 'A coffee phin surrounded by dark roasted coffee beans',
        },
        caption: {
          vi: 'Một khung cảnh Sài Gòn quen thuộc: cà phê, những câu chuyện và thời gian để nán lại.',
          en: 'A familiar Saigon scene: coffee, conversation and time to sit.',
        },
      },
    },
    {
      id: 'coffee-section-one-heading',
      type: 'heading',
      settings: { width: 'content', spacingTop: 'lg', spacingBottom: 'sm' },
      props: {
        level: 2,
        text: {
          vi: 'Hãy bắt đầu với những gì người ta thực sự uống.',
          en: 'Start with what people actually drink.',
        },
        subtitle: { vi: '01 · Ly cà phê', en: '01 · The cup' },
      },
    },
    {
      id: 'coffee-section-one-copy',
      type: 'richText',
      settings: { width: 'content', spacingTop: 'none', spacingBottom: 'sm' },
      props: {
        content: {
          vi: document(
            paragraph(text('Trải nghiệm kinh điển nhất là một ly cà phê đậm đặc với đá. Cà phê sữa đá có thêm sữa đặc; cà phê đen đá giữ nguyên vị đắng và trực diện. Bạc xỉu thì nhiều sữa và êm dịu hơn.')),
            paragraph(text('Hương vị thường đậm hơn so với tưởng tượng của nhiều du khách, nhất là khi được pha qua một chiếc phin kim loại nhỏ.')),
          ),
          en: document(
            paragraph(text('The classic experience is bold coffee with ice. Cà phê sữa đá adds condensed milk; cà phê đen đá keeps it dark and direct. Bạc xỉu is milkier and gentler.')),
            paragraph(text('The flavour is usually stronger than many visitors expect — especially when brewed through a small metal phin.')),
          ),
        },
      },
    },
    {
      id: 'coffee-section-one-quote',
      type: 'quote',
      settings: { width: 'content', spacingTop: 'sm', spacingBottom: 'sm' },
      props: {
        quote: {
          vi: 'Ở Sài Gòn, cà phê hiếm khi chỉ đơn thuần là cà phê.',
          en: 'In Saigon, coffee is rarely only about the coffee.',
        },
        author: { vi: 'Góc nhìn Oria', en: 'Oria take' },
        variant: 'bordered',
      },
    },
    {
      id: 'coffee-section-one-note',
      type: 'richText',
      settings: { width: 'narrow', spacingTop: 'sm', spacingBottom: 'lg' },
      props: {
        content: {
          vi: document(
            paragraph(text('Điểm lưu ý', [{ type: 'bold' }])),
            paragraph(text('Nếu bạn muốn một lựa chọn địa phương dễ nhận biết nhất, hãy bắt đầu với cà phê sữa đá.')),
          ),
          en: document(
            paragraph(text('What to notice', [{ type: 'bold' }])),
            paragraph(text('If you want the most recognisable local order, start with cà phê sữa đá.')),
          ),
        },
      },
    },
    {
      id: 'coffee-divider-one',
      type: 'divider',
      settings: { width: 'content', spacingTop: 'none', spacingBottom: 'none' },
      props: { style: 'subtle-line' },
    },
    {
      id: 'coffee-section-two-heading',
      type: 'heading',
      settings: { width: 'content', spacingTop: 'lg', spacingBottom: 'sm' },
      props: {
        level: 2,
        text: {
          vi: 'Người ta ngồi. Chuyện trò. Và ngắm phố phường.',
          en: 'People sit. They talk. They watch the street.',
        },
        subtitle: { vi: '02 · Cách người ta thưởng thức', en: '02 · How people drink it' },
      },
    },
    {
      id: 'coffee-section-two-copy',
      type: 'richText',
      settings: { width: 'content', spacingTop: 'none', spacingBottom: 'md' },
      props: {
        content: {
          vi: document(
            paragraph(text('Cà phê có thể là một điểm dừng nhanh bên đường trên chiếc ghế đẩu nhỏ, một cuộc trò chuyện dài cùng bạn bè, hay một giờ làm việc một mình với laptop. Dù không gian có thay đổi, việc nán lại một lúc lâu vẫn là điều hoàn toàn bình thường.')),
            paragraph(text('Đối với du khách, đây là điều đáng chú ý: mọi người thường sử dụng quán cà phê như một phần mở rộng của đường phố, văn phòng và cả phòng khách cùng một lúc.')),
          ),
          en: document(
            paragraph(text('Coffee can mean a quick roadside stop on a small stool, a long conversation with friends, or an hour alone with a laptop. The setting changes, but staying for a while feels completely normal.')),
            paragraph(text('For visitors, this is the part worth noticing: people are often using the café as an extension of the street, the office and the living room at the same time.')),
          ),
        },
      },
    },
    {
      id: 'coffee-perspective-quote',
      type: 'quote',
      settings: { width: 'wide', spacingTop: 'md', spacingBottom: 'lg' },
      props: {
        quote: {
          vi: 'Từ một chiếc ghế đẩu vỉa hè nhỏ bé đến một quán cà phê mang đậm tính thiết kế, nghi thức này trôi qua một cách đồng điệu đến bất ngờ: gọi món, ngồi xuống, chuyện trò, và nán lại.',
          en: 'From a tiny sidewalk stool to a design-led café, the ritual is surprisingly similar: order, sit, talk, stay.',
        },
        author: { vi: 'Góc nhìn Oria', en: 'Oria perspective' },
        variant: 'centered-serif',
      },
    },
    {
      id: 'coffee-divider-two',
      type: 'divider',
      settings: { width: 'content', spacingTop: 'none', spacingBottom: 'none' },
      props: { style: 'subtle-line' },
    },
    {
      id: 'coffee-section-three-heading',
      type: 'heading',
      settings: { width: 'content', spacingTop: 'lg', spacingBottom: 'sm' },
      props: {
        level: 2,
        text: {
          vi: 'Sự tương phản là điều làm nên sự thú vị của văn hóa cà phê Sài Gòn.',
          en: 'The contrast is what makes Saigon coffee culture interesting.',
        },
        subtitle: {
          vi: '03 · Điều người nước ngoài thường chú ý',
          en: '03 · What foreigners usually notice',
        },
      },
    },
    {
      id: 'coffee-section-three-copy',
      type: 'richText',
      settings: { width: 'content', spacingTop: 'none', spacingBottom: 'md' },
      props: {
        content: {
          vi: document(
            paragraph(text('Mới khoảnh khắc trước bạn còn đang uống từ một chiếc ly thủy tinh ngay cạnh vỉa hè; ngay khoảnh khắc sau, bạn đã bước vào một quán cà phê với thiết kế tuyệt đẹp phục vụ những hạt cà phê đặc sản. Cả hai trải nghiệm này đều mang một tinh thần Sài Gòn trọn vẹn.')),
            paragraph(text('Điểm chung ở đây không nằm ở sự xa xỉ, mà nằm ở thói quen luôn dành một không gian cho cà phê trong cuộc sống hàng ngày.')),
          ),
          en: document(
            paragraph(text('One moment you are drinking from a glass beside the pavement; the next, you are in a beautifully designed café serving specialty beans. Both can feel completely Saigon.')),
            paragraph(text('The common thread is less about luxury and more about the habit of making space for coffee in everyday life.')),
          ),
        },
      },
    },
    {
      id: 'coffee-ask-oria',
      type: 'cta',
      settings: { width: 'wide', spacingTop: 'md', spacingBottom: 'lg' },
      props: {
        title: {
          vi: 'Hỏi Oria — Muốn trải nghiệm cà phê Sài Gòn như người bản địa?',
          en: 'Ask Oria — Want to experience Saigon coffee like a local?',
        },
        subtitle: {
          vi: 'Hãy nói cho Oria biết bạn muốn trải nghiệm như thế nào: cà phê vỉa hè, một góc quán khuất nẻo, quán cà phê thiết kế hay một nơi nào đó thư giãn để ngồi và ngắm nhìn thành phố.',
          en: 'Tell Oria what kind of experience you want — sidewalk, hidden local spot, design café or somewhere easy to sit and watch the city.',
        },
        buttonText: {
          vi: 'Tìm quán cà phê Sài Gòn của bạn →',
          en: 'Find your Saigon café →',
        },
        buttonUrl: '/blogs',
        variant: 'dark-luxury',
      },
    },
    {
      id: 'coffee-related-heading',
      type: 'heading',
      settings: { width: 'wide', spacingTop: 'lg', spacingBottom: 'sm' },
      props: {
        level: 2,
        text: { vi: 'Tiếp tục khám phá Sài Gòn.', en: 'Keep exploring Saigon.' },
        subtitle: { vi: 'Đọc tiếp', en: 'Continue reading' },
      },
    },
    {
      id: 'coffee-related-copy',
      type: 'richText',
      settings: { width: 'wide', spacingTop: 'none', spacingBottom: 'xl' },
      props: {
        content: {
          vi: document(
            paragraph(text('Những cẩm nang nhỏ để ngắm nhìn thành phố vượt ra khỏi những gì thường thấy.')),
            bulletList([
              'Sức khỏe — 3 phong cách cà phê nên thử tại Sài Gòn. · 04 phút',
              'Góc nhìn thành phố — Người địa phương ăn gì sau một buổi chiều nhẹ nhàng. · 06 phút',
              'Cẩm nang Quận — Quận 1 bên ngoài những tuyến đường du lịch. · 05 phút',
            ]),
          ),
          en: document(
            paragraph(text('Short local guides for seeing the city beyond the obvious.')),
            bulletList([
              'Wellness — 3 coffee styles to try in Saigon. · 04 min',
              'City Lens — What locals eat after a light afternoon. · 06 min',
              'District Guide — District 1 beyond the tourist route. · 05 min',
            ]),
          ),
        },
      },
    },
  ],
} satisfies ContentDocument;

export const SAIGON_COFFEE_PILOT_LOCALES: readonly SupportedLocale[] = ['vi', 'en', 'cn', 'jp', 'kr'];
