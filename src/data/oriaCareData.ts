export type LocalizedString = Record<string, string>;

export interface OriaCareParagraphImage {
  src: string;
  watermarkEnabled: boolean;
  watermarkOpacity: number;
}

export interface OriaCareSection {
  id: string;
  heading: LocalizedString;
  paragraphs: LocalizedString[];
  paragraphImages?: (OriaCareParagraphImage | null)[];
}

export interface OriaCareConfig {
  pageTitle: LocalizedString;
  pageSubtitle: LocalizedString;
  heroImage?: string;
  heroMediaType?: 'image' | 'video';
  heroWatermarkEnabled?: boolean;
  heroWatermarkOpacity?: number;
  storyPhotos?: string[];
  storyPhotosWatermark?: boolean[];
  storyPhotosWatermarkOpacity?: number[];
  sections: OriaCareSection[];
  closingText: LocalizedString;
  ctaText: LocalizedString;
  ctaLink: string;
}

export const DEFAULT_ORIA_CARE_CONFIG: OriaCareConfig = {
  pageTitle: {
    vi: 'Oria Care',
    en: 'Oria Care',
    cn: 'Oria Care',
    kr: 'Oria Care',
    jp: 'Oria Care',
  },
  pageSubtitle: {
    vi: 'Chăm sóc sức khỏe gia đình tại nhà — Dành cho cha mẹ lớn tuổi & Mẹ bầu',
    en: 'In-home wellness & healthcare — For elderly parents and expectant mothers',
    cn: '家庭上门健康护理 — 关爱年迈父母与孕产妈妈',
    kr: '가정 방문 웰니스 헬스케어 — 부모님과 임산부를 위한 맞춤 케어',
    jp: 'ご自宅でのヘルスケア — ご高齢のご両親と妊婦・産後ママのために',
  },
  heroImage: '',
  heroMediaType: 'image',
  heroWatermarkEnabled: true,
  heroWatermarkOpacity: 15,
  storyPhotos: ['', '', ''],
  storyPhotosWatermark: [true, true, true],
  storyPhotosWatermarkOpacity: [15, 15, 15],
  sections: [
    {
      id: 'sec-1',
      heading: {
        vi: 'Oria Care là gì?',
        en: 'What is Oria Care?',
        cn: '什么是Oria Care?',
        kr: 'Oria Care란 무엇인가요?',
        jp: 'Oria Careとは?',
      },
      paragraphs: [
        {
          vi: 'Oria Care là dịch vụ chăm sóc sức khỏe và phục hồi thể trạng chuyên biệt tại nhà, ra đời từ sự thấu hiểu sâu sắc dành cho những người thân yêu nhất trong gia đình: cha mẹ lớn tuổi và phụ nữ mang thai hoặc sau sinh. Chúng tôi mang các liệu pháp chăm sóc êm ái, an toàn và chuyên môn cao đến tận không gian sống quen thuộc của bạn.',
          en: 'Oria Care is a specialized in-home wellness and physical recovery service, born from deep care for our most cherished loved ones: elderly parents and pregnant or postpartum mothers. We bring gentle, safe, and professional therapeutic care directly to the comfort of your home.',
          cn: 'Oria Care是专注家庭上门的专业健康调理与体质修复服务。源于对家人最细腻的关怀，专为年迈父母与孕产期妈妈量身打造。我们将温和、安全、专业的护理方案直接送到您熟悉的家中。',
          kr: 'Oria Care는 소중한 가족—연로하신 부모님과 임신·산후 산모—을 향한 깊은 배려에서 시작된 가정 방문 전문 헬스케어 서비스입니다. 편안하고 익숙한 집으로 부드럽고 안전하며 전문적인 맞춤 케어를 직접 제공합니다.',
          jp: 'Oria Careは、ご高齢のご両親や妊娠中・産後のお母様など、大切なご家族への深い想いから生まれた訪問型ヘルスケアサービスです。慣れ親しんだご自宅へ、優しく安全で専門性の高いケアをお届けします。',
        },
        {
          vi: 'Không cần phải vất vả đưa đón hay chờ đợi tại các cơ sở đông đúc, kỹ thuật viên được đào tạo chuyên sâu về kỹ thuật chăm sóc người lớn tuổi và mẹ bầu sẽ chuẩn bị chu đáo mọi trang thiết bị, thảo dược tự nhiên lành tính và đến đúng giờ hẹn.',
          en: 'No need for tedious commutes or waiting in crowded facilities. Our specialists, trained specifically in geriatric and prenatal/postnatal care, arrive on time with specialized gentle equipment and natural botanicals.',
          cn: '无需奔波接送或在喧闹场所等候，经长辈护理与孕产理疗专项培训的专业技师将携全套温和工具与天然草本，准时上门服务。',
          kr: '번거로운 이동이나 혼잡한 대기 없이, 어르신 및 임산부 전문 교육을 이수한 전담 테라피스트가 천연 허브와 맞춤 장비를 갖추고 정시에 방문합니다.',
          jp: '移動の負担や混雑した場所での待ち時間もなく、シニアケアやマタニティケアの専門研修を受けたセラピストが、厳選された天然素材と設備を携えて時間通りにお伺いします。',
        },
      ],
    },
    {
      id: 'sec-2',
      heading: {
        vi: 'Chăm sóc trọn vẹn cho cha mẹ lớn tuổi & Mẹ bầu',
        en: 'Dedicated Care for Elderly Parents & Mothers',
        cn: '悉心守护年迈父母与孕产妈妈',
        kr: '부모님과 임산부를 위한 온전한 맞춤 케어',
        jp: 'ご両親とマタニティのためのきめ細やかなケア',
      },
      paragraphs: [
        {
          vi: 'Dành cho cha mẹ lớn tuổi: Khi xương khớp nhức mỏi, tuần hoàn máu kém, giấc ngủ chập chờn hay khó khăn trong việc đi lại. Các liệu pháp xoa bóp dưỡng sinh, bấm huyệt lưu thông khí huyết và ngâm chân thảo dược tại nhà giúp các bậc sinh thành ngủ sâu giấc hơn, giảm đau nhức và cảm nhận sự hiếu thuận, ấm áp từ con cháu.',
          en: 'For elderly parents: When joint ache, poor circulation, sleepless nights, or mobility challenges set in. Our gentle restorative acupressure, circulation therapies, and herbal foot soaks help parents sleep peacefully, ease chronic aches, and feel cherished at home.',
          cn: '关爱年迈父母：针对关节酸痛、气血不畅、睡眠浅浅或行动不便的长辈。舒缓养生按揉、经络温和疏通与天然草本足浴，助父母安稳入眠，缓解身心酸痛，感受儿女的孝心与温暖。',
          kr: '부모님을 위한 케어: 관절 통증, 혈액순환 저하, 불면증 또는 거동이 불편하신 부모님을 위해. 부드러운 양생 지압, 혈액순환 촉진, 천연 허브 족욕을 통해 깊은 수면과 통증 완화를 돕고 자녀의 따뜻한 효심을 전합니다.',
          jp: 'ご両親のために：関節の痛み、血行不良、浅い眠り、移動の負担を感じるご高齢の方へ。優しい養生マッサージや経絡ケア、ハーブ足湯により、深い眠りと痛みの緩和をサポートし、心温まる時間をお届けします。',
        },
        {
          vi: 'Dành cho mẹ bầu & mẹ sau sinh: Giai đoạn mang thai và sau sinh là lúc cơ thể người phụ nữ chịu nhiều áp lực nhất: đau mỏi lưng hông, phù nề tay chân, căng thẳng thể chất và tinh thần. Oria Care áp dụng các động tác massage nâng đỡ an toàn tuyệt đối cho thai kỳ và phác đồ phục hồi sau sinh chuyên sâu, giúp mẹ thư giãn trọn vẹn và nhanh chóng hồi phục thể trạng.',
          en: 'For expectant & postpartum mothers: Pregnancy and early motherhood place immense demands on the body: lower back tension, leg swelling, and emotional fatigue. Oria Care applies certified pregnancy-safe massage techniques and postpartum restorative rituals to melt away tension and restore vitality.',
          cn: '关爱孕产妈妈：孕期与产后身体承受巨大负荷：腰酸背痛、肢体水肿、身心劳累。Oria Care采用经过严格安全认证的孕产专项轻柔手法与产后修复方案，缓解水肿与酸痛，助妈妈身心全面舒缓复原。',
          kr: '임산부 & 산후 산모 케어: 임신과 출산은 허리 통증, 부종, 피로 등 신체에 많은 부담을 줍니다. Oria Care는 임산부에게 철저히 안전한 전용 마사지 기법과 산후 회복 테라피로 붓기와 긴장을 풀고 활력을 되찾아 드립니다.',
          jp: 'マタニティ＆産後ママのために：腰の負担や手足のむくみ、心身の疲労が重なる時期。Oria Careは母体に負担をかけない安全なマタニティ施術と産後リカバリーで、緊張を解きほぐし穏やかな回復を促します。',
        },
      ],
    },
    {
      id: 'sec-3',
      heading: {
        vi: 'An toàn tuyệt đối — Tiêu chuẩn tận tâm trong từng chi tiết',
        en: 'Utmost Safety — Attentive Standards in Every Detail',
        cn: '严苛安全标准 — 始于细节的专注呵护',
        kr: '철저한 안전 기준 — 디테일 하나까지 정성 어린 배려',
        jp: '確かな安全性 — 細部にまで行き届いた安心の基準',
      },
      paragraphs: [
        {
          vi: 'Sức khỏe của người lớn tuổi và phụ nữ mang thai đòi hỏi tiêu chuẩn an toàn cao nhất. Tất cả kỹ thuật viên Oria Care đều có chứng chỉ chuyên môn, am hiểu về giải phẫu sinh lý mẹ bầu và các bệnh lý thường gặp ở người già. Thảo dược sử dụng 100% tự nhiên lành tính, tinh dầu hữu cơ dịu nhẹ không gây kích ứng.',
          en: 'The wellness of seniors and expectant mothers requires the utmost standard of care. Every Oria Care therapist is certified, knowledgeable in maternal anatomy and geriatric physiology. We exclusively utilize 100% natural, hypoallergenic organic botanicals and therapeutic essential oils.',
          cn: '长辈与孕产妇的调理需要至高的安全标准。Oria Care所有技师均持证上岗，深入理解孕期生理与老年常见身体状况。全程严选100%温和纯天然草本与有机精油，无刺激、无负担。',
          kr: '어르신과 임산부의 케어는 최고의 안전 기준을 필요로 합니다. Oria Care의 모든 테라피스트는 전문 자격을 갖추고 신체 특성을 깊이 이해하고 있으며, 100% 저자극 유기농 천연 허브만을 사용합니다.',
          jp: 'ご高齢の方や妊婦さんのケアには、何よりも確かな安全性が求められます。Oria Careのセラピストは専門的な知識と技術を持ち、厳選された低刺激の天然オーガニック素材のみを使用します。',
        },
        {
          vi: 'Mỗi gia đình có một hoàn cảnh và nhu cầu khác nhau. Trước mỗi buổi chăm sóc, chúng tôi luôn trao đổi kỹ lưỡng để điều chỉnh lực ấn, tư thế nằm và liệu trình phù hợp nhất cho người thân của bạn.',
          en: 'Every family has unique needs. Before each session, we consult thoroughly to customize pressure, ergonomic positioning, and personalized care routines for your loved one.',
          cn: '每个家庭的需求各不相同。每次上门前，我们均会细致沟通，为您定制最适宜的按压力度、舒适体位与专属调理方案。',
          kr: '모든 가정마다 상황과 필요가 다릅니다. 케어 전 꼼꼼한 상담을 통해 부모님과 산모에게 가장 편안한 자세와 강도, 맞춤 프로그램을 설정합니다.',
          jp: 'ご家庭ごとの状況に寄り添い、施術前には丁寧なカウンセリングを実施。最適な体勢や力加減、プログラムをきめ細かく調整いたします。',
        },
      ],
    },
  ],
  closingText: {
    vi: 'Trao gửi sự chăm sóc chu đáo, yêu thương và an lành nhất đến cha mẹ và người phụ nữ bạn trân quý ngay tại tổ ấm cùng Oria Care.',
    en: 'Send thoughtful, gentle care and loving wellness to your parents and cherished women right in the warmth of home with Oria Care.',
    cn: '在温馨的家中，将最细致、贴心与安心的关怀献给父母与所爱之人——Oria Care。',
    kr: '소중한 부모님과 사랑하는 가족에게 가장 따뜻하고 안전한 가정 방문 웰니스 케어를 선물하세요 — Oria Care.',
    jp: '大切なご両親と愛するご家族へ、最も温かく安心な訪問ヘルスケアを — Oria Care。',
  },
  ctaText: {
    vi: 'Tư Vấn & Đặt Lịch Chăm Sóc Tại Nhà',
    en: 'Book In-Home Care Consultation',
    cn: '咨询与预约上门护理',
    kr: '가정 방문 케어 상담 및 예약',
    jp: '訪問ケアのご相談・ご予約',
  },
  ctaLink: 'tel:+84964090277',
};

export function hydrateOriaCareConfig(raw: any): OriaCareConfig {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_ORIA_CARE_CONFIG;
  }

  const rawSections = Array.isArray(raw.sections) && raw.sections.length > 0
    ? raw.sections
    : DEFAULT_ORIA_CARE_CONFIG.sections;

  const hydratedSections: OriaCareSection[] = rawSections.map((sec: any, idx: number) => {
    const defaultSec = DEFAULT_ORIA_CARE_CONFIG.sections[idx] || DEFAULT_ORIA_CARE_CONFIG.sections[0];
    return {
      id: sec.id || defaultSec.id || `sec-${idx + 1}`,
      heading: sec.heading || defaultSec.heading,
      paragraphs: Array.isArray(sec.paragraphs) && sec.paragraphs.length > 0
        ? sec.paragraphs
        : defaultSec.paragraphs,
      ...(Array.isArray(sec.paragraphImages) ? {
        paragraphImages: sec.paragraphImages.map((image: any) => image && typeof image.src === 'string' ? {
          src: image.src.trim(),
          watermarkEnabled: image.watermarkEnabled !== false,
          watermarkOpacity: typeof image.watermarkOpacity === 'number' && image.watermarkOpacity >= 0 && image.watermarkOpacity <= 100
            ? Math.round(image.watermarkOpacity)
            : 15,
        } : null),
      } : {}),
    };
  });

  const rawHero = typeof raw.heroImage === 'string' ? raw.heroImage.trim() : '';
  const heroImage = rawHero.includes('unsplash.com') ? '' : (rawHero || DEFAULT_ORIA_CARE_CONFIG.heroImage || '');
  const isVideoDetect = /\.(mp4|mov|webm)(\?.*)?$/i.test(heroImage);
  const heroMediaType: 'image' | 'video' = raw.heroMediaType === 'video' || (raw.heroMediaType !== 'image' && isVideoDetect)
    ? 'video'
    : 'image';

  const rawPhotos: string[] = Array.isArray(raw.storyPhotos)
    ? raw.storyPhotos
    : (DEFAULT_ORIA_CARE_CONFIG.storyPhotos || ['', '', '']);
  const storyPhotos = rawPhotos.map((url) =>
    typeof url === 'string' && !url.includes('unsplash.com') ? url.trim() : ''
  );

  const heroWatermarkOpacity =
    typeof raw.heroWatermarkOpacity === 'number' && raw.heroWatermarkOpacity >= 0 && raw.heroWatermarkOpacity <= 100
      ? Math.round(raw.heroWatermarkOpacity)
      : 15;

  const rawWmOpacity = Array.isArray(raw.storyPhotosWatermarkOpacity) ? raw.storyPhotosWatermarkOpacity : [];
  const storyPhotosWatermarkOpacity: number[] = storyPhotos.map((_, idx) => {
    const val = rawWmOpacity[idx];
    return typeof val === 'number' && val >= 0 && val <= 100 ? Math.round(val) : 15;
  });

  return {
    pageTitle: raw.pageTitle || DEFAULT_ORIA_CARE_CONFIG.pageTitle,
    pageSubtitle: raw.pageSubtitle || DEFAULT_ORIA_CARE_CONFIG.pageSubtitle,
    heroImage,
    heroMediaType,
    heroWatermarkEnabled: raw.heroWatermarkEnabled !== false,
    heroWatermarkOpacity,
    storyPhotos,
    storyPhotosWatermark: Array.isArray(raw.storyPhotosWatermark)
      ? raw.storyPhotosWatermark
      : [true, true, true],
    storyPhotosWatermarkOpacity,
    sections: hydratedSections,
    closingText: raw.closingText || DEFAULT_ORIA_CARE_CONFIG.closingText,
    ctaText: raw.ctaText || DEFAULT_ORIA_CARE_CONFIG.ctaText,
    ctaLink: raw.ctaLink || DEFAULT_ORIA_CARE_CONFIG.ctaLink,
  };
}
