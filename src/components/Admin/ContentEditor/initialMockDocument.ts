import type { ContentDocument } from '@/types/content';

/**
 * Initial typed mock ContentDocument for Content Builder Admin UI preparation.
 * Strictly conforms to Contract V1 with schemaVersion: 1 and all 5 locales.
 */
export const INITIAL_MOCK_DOCUMENT: ContentDocument = {
  schemaVersion: 1,
  blocks: [
    {
      id: 'blk-head-001',
      type: 'heading',
      settings: {
        width: 'content',
        spacingTop: 'lg',
        spacingBottom: 'md',
        visibility: { vi: true, en: true, cn: true, jp: true, kr: true },
      },
      props: {
        level: 2,
        align: 'center',
        text: {
          vi: 'Hành Trình Nuôi Dưỡng Thân & Tâm Tại Oria',
          en: 'Nurturing Body & Mind: The Oria Wellness Journey',
          cn: '在Oria滋养身心之旅',
          jp: 'Oriaで心と体を育むホリスティックな旅',
          kr: 'Oria에서 몸과 마음을 치유하는 여정',
        },
        subtitle: {
          vi: 'Khám phá sự kết hợp tinh tế giữa thảo mộc cổ truyền và liệu pháp chữa lành hiện đại',
          en: 'Discover the exquisite blend of traditional botanical remedies and modern healing therapies',
          cn: '探索传统植物疗法与现代疗愈艺术的精妙融合',
          jp: '伝統的なハーブ療法と現代のヒーリングセラピーの調和',
          kr: '전통 약초 요법과 현대 힐링 테라피의 조화로운 만남',
        },
      },
    },
    {
      id: 'blk-img-002',
      type: 'image',
      settings: {
        width: 'wide',
        spacingTop: 'sm',
        spacingBottom: 'lg',
        visibility: { vi: true, en: true, cn: true, jp: true, kr: true },
      },
      props: {
        mediaId: 'media-oria-interior-01',
        aspectRatio: '16:9',
        fit: 'cover',
        presentation: 'framed',
        focalPoint: { x: 50, y: 50 },
        zoom: 1.0,
        alt: {
          vi: 'Không gian sảnh chính Oria Spa & Lounge',
          en: 'Main lounge area of Oria Spa with warm ambience',
          cn: 'Oria水疗中心休息室',
          jp: 'Oriaスパのラウンジエリア',
          kr: 'Oria 스파 라운지 전경',
        },
        caption: {
          vi: 'Không gian tĩnh lặng được thiết kế theo triết lý hòa quyện cùng thiên nhiên',
          en: 'A serene sanctuary designed in harmony with natural elements',
          cn: '秉持人与自然和谐哲学的宁静圣所',
          jp: '自然との調和を重視した静寂の空間',
          kr: '자연과 조화를 이루는 평온한 치유 공간',
        },
      },
    },
    {
      id: 'blk-rt-003',
      type: 'richText',
      settings: {
        width: 'content',
        spacingTop: 'sm',
        spacingBottom: 'md',
        visibility: { vi: true, en: true, cn: true, jp: true, kr: true },
      },
      props: {
        content: {
          vi: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Tại Oria Spa, chúng tôi tin rằng sức khỏe toàn diện bắt nguồn từ sự cân bằng giữa thể chất, cảm xúc và môi trường sống. Mỗi buổi trị liệu là một liệu trình cá nhân hóa sâu sắc, sử dụng các tinh chất thảo dược được tuyển chọn nghiêm ngặt từ nông trại Oria Farm.',
                  },
                ],
              },
            ],
          },
          en: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'At Oria Spa, we believe holistic wellbeing stems from the delicate balance of body, emotion, and environment. Every treatment is deeply customized, featuring botanical extracts cultivated organically at Oria Farm.',
                  },
                ],
              },
            ],
          },
          cn: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: '在Oria水疗中心，我们深信全面健康源于身心与自然的和谐平衡。每次护理均量身定制，萃取自Oria农场严选草药。',
                  },
                ],
              },
            ],
          },
        },
      },
    },
    {
      id: 'blk-quote-004',
      type: 'quote',
      settings: {
        width: 'content',
        spacingTop: 'md',
        spacingBottom: 'md',
        visibility: { vi: true, en: true, cn: true, jp: true, kr: true },
      },
      props: {
        variant: 'ornate-gold',
        quote: {
          vi: 'Sự an yên đích thực chỉ bắt đầu khi bạn cho phép bản thân được chậm lại và lắng nghe nhịp thở của chính mình.',
          en: 'True tranquility begins when you allow yourself to slow down and listen to your own breath.',
          cn: '真正的宁静，始于你允许自己放慢脚步，倾听内心的呼吸。',
          jp: '真の静けさは、自らの呼吸に耳を傾けることから始まります。',
          kr: '진정한 평온은 스스로 속도를 늦추고 내면의 숨소리에 귀 기울일 때 시작됩니다.',
        },
        author: {
          vi: 'Nhà sáng lập Oria Heritage',
          en: 'Oria Heritage Founder',
          cn: 'Oria品牌创始人',
          jp: 'Oria創業者',
          kr: 'Oria 창립자',
        },
        role: {
          vi: 'Bậc thầy Chăm sóc Sức khỏe Cổ truyền',
          en: 'Master Holistic Practitioner',
          cn: '传统养生导师',
          jp: 'マスターホリスティックプラクティショナー',
          kr: '홀리스틱 웰니스 마스터',
        },
      },
    },
    {
      id: 'blk-cta-005',
      type: 'cta',
      settings: {
        width: 'content',
        spacingTop: 'md',
        spacingBottom: 'xl',
        visibility: { vi: true, en: true, cn: true, jp: true, kr: true },
      },
      props: {
        variant: 'gold-solid',
        title: {
          vi: 'Bắt Đầu Hành Trình Thư Giãn Ngay Hôm Nay',
          en: 'Begin Your Rejuvenation Journey Today',
          cn: '立即开启您的身心焕活之旅',
          jp: '今日から始めるリフレッシュメントの旅',
          kr: '지금 몸과 마음의 힐링을 시작하세요',
        },
        subtitle: {
          vi: 'Đội ngũ chuyên viên tận tâm sẵn sàng đồng hành cùng quý khách',
          en: 'Our dedicated holistic practitioners are ready to welcome you',
          cn: '专业的理疗团队静候您的光临',
          jp: '専任のセラピストが皆様のお越しをお待ちしております',
          kr: '숙련된 전담 테라피스트가 당신을 맞이합니다',
        },
        buttonText: {
          vi: 'Đặt Lịch Trải Nghiệm',
          en: 'Reserve Experience',
          cn: '预约体验',
          jp: '体験を予約する',
          kr: '체험 예약하기',
        },
        buttonUrl: '/booking',
      },
    },
    {
      id: 'blk-div-006',
      type: 'divider',
      settings: {
        width: 'narrow',
        spacingTop: 'sm',
        spacingBottom: 'lg',
        visibility: { vi: true, en: true, cn: true, jp: true, kr: true },
      },
      props: {
        style: 'gold-flourish',
      },
    },
  ],
};
