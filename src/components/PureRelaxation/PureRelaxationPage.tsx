'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { DoorOpen, ShoppingBag, Timer, UserRound, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import type { CartItem, Service } from '@/components/Menu/types';
import {
  appendBookingCartItem,
  readBookingCart,
  removeOneBookingCartItem,
  updateBookingCartItemOptions,
} from '@/lib/bookingCartStorage';
import CustomForYouModal from '@/components/CustomForYou';
import { CustomPreferences } from '@/components/CustomForYou/types';
import { getPureRelaxationSections } from './pureRelaxationData';
import type {
  PureRelaxationDuration,
  PureRelaxationMedia,
  PureRelaxationPrivilege,
  PureRelaxationSection,
  PureRelaxationService,
  PureRelaxationVariant,
} from './pureRelaxationData';
import styles from './PureRelaxationPage.module.css';

type ActiveItem = {
  name: string;
  subtitle: string;
  media: PureRelaxationMedia;
  durations: PureRelaxationDuration[];
  privilege: PureRelaxationPrivilege;
};

const formatVnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value) + ' đ';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const hasVariants = (service: PureRelaxationService): service is PureRelaxationService & { variants: PureRelaxationVariant[] } =>
  Array.isArray(service.variants) && service.variants.length > 0;

const getActiveItem = (service: PureRelaxationService, variantIndex: number, contentMedia: any = {}, currentLang: string = 'vi'): ActiveItem => {
  let active: ActiveItem;
  if (hasVariants(service)) {
    const variant = service.variants[Math.min(variantIndex, service.variants.length - 1)];
    active = {
      name: currentLang === 'vi' ? (variant.subtitle || variant.name) : variant.name,
      subtitle: '',
      media: variant.media,
      durations: variant.durations,
      privilege: variant.privilege,
    };
  } else {
    active = {
      name: service.name,
      subtitle: service.description,
      media: service.media!,
      durations: service.durations!,
      privilege: service.privilege!,
    };
  }

  // Apply admin overrides
  const override = contentMedia[active.name];
  if (override) {
    const langData = override[currentLang] || {};
    if (langData.description) active.subtitle = langData.description;
    if (langData.privilege) {
      active.privilege = { ...active.privilege, ...langData.privilege };
    }
    const mediaSrc = langData.src || override.src;
    const mediaType = langData.type || override.type;
    const objectPosition = langData.objectPosition || override.objectPosition;
    
    if (mediaSrc) {
      active.media = {
        ...active.media,
        type: mediaType as 'image' | 'video',
        src: mediaSrc,
        ...(objectPosition ? { objectPosition } : {})
      } as any;
    }
  }

  return active;
};

const MediaPreview = ({ media, label }: { media: any; label: string }) => {
  const objPos = media.objectPosition || 'center';
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  useEffect(() => {
    if (media.type === 'video') {
      setIsVideoLoading(true);
    }
  }, [media.src, media.type]);
  
  return (
    <div className={styles.mediaFrame}>
      <div className={styles.mediaFade} key={media.src}>
        {media.type === 'video' ? (
          <>
            <video
              className={styles.media}
              src={media.src}
              poster={media.poster}
              muted
              autoPlay
              loop
              playsInline
              preload="metadata"
              style={{ objectPosition: objPos }}
              onPlaying={() => setIsVideoLoading(false)}
              onCanPlay={() => setIsVideoLoading(false)}
              onWaiting={() => setIsVideoLoading(true)}
            />
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10 pointer-events-none transition-opacity duration-300">
                <div className="flex flex-col items-center gap-2 text-white/90">
                  <div className="w-8 h-8 border-[2.5px] border-[var(--gold-soft)] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[9px] uppercase tracking-[0.2em] font-medium opacity-80" style={{ color: 'var(--gold-soft)' }}>Loading Video</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <img className={styles.media} src={media.src} alt={label} loading="lazy" style={{ objectPosition: objPos }} />
        )}
      </div>
      <div className={styles.mediaOverlay} />
      <div className="media-watermark" />
      <span className={styles.mediaCaption}>{media.tag}</span>
    </div>
  );
};

const PreferenceNote = ({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) => (
  <div className={styles.preferenceNote} aria-label={`${title}: ${copy}`}>
    <span className={styles.preferenceIcon}>{icon}</span>
    <span>
      <strong>{title}</strong>
      <small>{copy}</small>
    </span>
  </div>
);

const ServiceSection = ({ section, contentMedia }: { section: PureRelaxationSection, contentMedia: any }) => {
  const [serviceIndex, setServiceIndex] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [durationIndex, setDurationIndex] = useState(0);
  const [notice, setNotice] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCustomForYou, setShowCustomForYou] = useState(false);
  const [lastAddedCartIds, setLastAddedCartIds] = useState<string[]>([]);
  const [modalServiceData, setModalServiceData] = useState<any>(null);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const router = useRouter();
  const { currentLang } = useTranslation();

  const humanTouchContent = currentLang === 'vi' ? {
    eyebrow: 'Body Massage Perspective',
    headline: <>Body Massage<br/>Nghệ thuật xoa bóp thủ công tại Oria Spa</>,
    lead: 'Body Massage tại Oria Spa là nghệ thuật xoa bóp 100% thủ công bằng đôi bàn tay của người nghệ nhân. Mỗi chuyển động không chỉ được thực hiện theo kỹ thuật, mà còn dựa trên kinh nghiệm, sự tinh tế và khả năng cảm nhận cơ thể của từng khách hàng.',
    signature: ['100% thủ công', 'Hơi ấm con người', 'Lực ấn linh hoạt', 'Trải nghiệm cá nhân hóa'],
    rows: [
      { index: '01', title: 'Hơi ấm mà máy móc không thể thay thế', text: 'Hơi ấm tự nhiên từ đôi bàn tay khi tiếp xúc với cơ thể tạo nên một cảm giác rất riêng gần gũi, dễ chịu và khó có thể thay thế bằng máy móc. Qua từng vùng cơ căng cứng, từng phản ứng nhỏ và mức độ chịu lực khác nhau, người nghệ nhân liên tục điều chỉnh lực ấn, nhịp điệu và kỹ thuật để phù hợp với trạng thái thực tế của cơ thể.' },
      { index: '02', title: 'Một liệu trình thay đổi theo từng vị khách', text: 'Chính vì vậy, mỗi liệu trình Body Massage tại Oria Spa không phải là một chuỗi động tác được lặp lại giống nhau. Đó là một trải nghiệm mang tính cá nhân, được hình thành từ đôi bàn tay, kinh nghiệm và sự cảm nhận của người nghệ nhân trong chính thời điểm đó.' }
    ],
    pullQuote: 'Giữa một cuộc sống ngày càng phụ thuộc vào thiết bị và máy móc, Oria Spa lựa chọn giữ lại giá trị nguyên bản của massage sự chăm sóc trực tiếp giữa con người với con người',
    pullSign: 'Triết lý Oria Spa',
    finalBig: <>100% đôi bàn tay.<br/>100% sự cảm nhận.</>,
    finalSmall: 'Một nghệ thuật được tạo nên từ kỹ thuật, hơi ấm và sự tinh tế của người nghệ nhân.'
  } : {
    eyebrow: 'Body Massage Perspective',
    headline: <>Body Massage<br/>The Art of Manual Therapy at Oria Spa</>,
    lead: 'Body Massage at Oria Spa is a 100% manual art performed by the hands of our artisans. Every movement is not just executed by technique, but relies on experience, finesse, and the ability to sense each guest’s body.',
    signature: ['100% manual', 'Human warmth', 'Adaptive pressure', 'Personalized experience'],
    rows: [
      { index: '01', title: 'Warmth that machines cannot replicate', text: 'The natural warmth from the hands touching the body creates a uniquely intimate and comforting feeling that machines can hardly replace. Through every tight muscle, every small reaction, and varying levels of pressure tolerance, the artisan continuously adjusts the applied force, rhythm, and technique to suit the actual state of the body.' },
      { index: '02', title: 'A treatment that changes with every guest', text: 'Because of this, every Body Massage treatment at Oria Spa is not a repetitive sequence of movements. It is a highly personalized experience, shaped by the hands, experience, and feeling of the artisan in that exact moment.' }
    ],
    pullQuote: 'In a world increasingly dependent on devices and machines, Oria Spa chooses to preserve the original value of massage: direct human-to-human care.',
    pullSign: 'Oria Spa Philosophy',
    finalBig: <>100% human hands.<br/>100% sensation.</>,
    finalSmall: 'An art created from technique, warmth, and the finesse of the artisan.'
  };

  const footCareContent = currentLang === 'vi' ? {
    eyebrow: 'Foot Massage Perspective',
    headline: 'Foot Massage – Thư giãn bắt đầu từ đôi chân',
    lead: 'Trải nghiệm Foot Massage tại OriaSpa được mở đầu bằng làn nước ấm hòa cùng hơn 12 loại thảo dược do chính OriaSpa trồng, chăm sóc và thu hoạch. Khi được hòa vào nước nóng, hơi ấm và hương thảo mộc nhẹ nhàng bao lấy đôi chân, giúp cơ thể dần thả lỏng ngay từ những phút đầu tiên.',
    quote: '',
    body1: 'Sau khi đôi chân được làm ấm, thảo dược tiếp tục được kết hợp trong bước làm sạch và tẩy tế bào chết bàn chân. Sự hòa quyện giữa nguyên liệu thảo mộc và thao tác chăm sóc bằng tay giúp bề mặt da trở nên mềm mại, sạch thoáng và dễ chịu hơn, đồng thời giữ lại cảm giác tự nhiên đặc trưng của liệu trình OriaSpa.',
    body2: 'Trong lúc đôi chân được massage, một túi chườm thảo dược ấm được đặt nhẹ tại vùng cổ – vai. Hơi ấm từ túi chườm lan dần quanh vùng cổ, tạo cảm giác được bao bọc và thư giãn đồng thời ở cả hai đầu cơ thể: đôi chân phía dưới được chăm sóc bằng thảo dược và đôi tay người thợ, trong khi vùng cổ – vai phía trên được giữ ấm nhẹ nhàng.',
    body3: 'Từ ngâm chân thảo mộc, tẩy tế bào chết bằng nguyên liệu kết hợp thảo dược, túi chườm cổ ấm đến từng thao tác massage thủ công, mỗi bước đều được kết nối để tạo nên một trải nghiệm chăm sóc trọn vẹn hơn cho đôi chân và toàn bộ cơ thể.',
    chips: [] as string[],
    closing: 'Bắt đầu từ làn nước thảo mộc ấm, tiếp nối bằng sự chăm sóc trên từng vùng da, lan lên hơi ấm nơi cổ – vai và hoàn thiện bằng đôi tay người thợ.',
    panelTitle: '',
    points: [] as any[]
  } : {
    eyebrow: 'Foot Massage Perspective',
    headline: 'Foot Massage – Relaxation begins at the feet',
    lead: 'The Foot Massage experience at OriaSpa begins with warm water blended with over 12 types of herbs grown, cared for, and harvested by OriaSpa. When mixed with hot water, the warmth and gentle herbal aroma wrap around your feet, helping the body gradually relax from the very first moments.',
    quote: '',
    body1: 'After warming the feet, herbs continue to be used in the cleansing and exfoliating step. The combination of herbal ingredients and manual care helps the skin surface become soft, clean, and comfortable, while maintaining the natural feel characteristic of OriaSpa treatments.',
    body2: 'While the feet are being massaged, a warm herbal pack is gently placed on the neck and shoulders. The warmth spreads around the neck, creating a sense of being enveloped and relaxed at both ends of the body: the feet below are cared for with herbs and therapist’s hands, while the neck and shoulders above are gently kept warm.',
    body3: 'From the herbal foot soak, exfoliation with herbal ingredients, and warm neck pack to each manual massage technique, every step is connected to create a more complete care experience for the feet and the whole body.',
    chips: [] as string[],
    closing: 'Starting with warm herbal water, followed by care for each skin area, spreading warmth to the neck and shoulders, and completed by the therapist’s hands.',
    panelTitle: '',
    points: [] as any[]
  };

  const earCleanContent = currentLang === 'vi' ? {
    eyebrow: 'Ear Clean Perspective',
    headline: 'Ráy tai tại Oria Spa – Thư giãn, thú vị và đầy cảm giác mới lạ',
    lead: 'Ráy tai tại OriaSpa nổi bật với trải nghiệm ráy tai thư giãn, nhưng bên cạnh sự nhẹ nhàng còn là một cảm giác rất riêng: thú vị, đặc trưng và có chút lạ lẫm.',
    quote: 'Chính sự đan xen giữa thư giãn và cảm giác mới lạ khiến ráy tai tại Oria Spa không chỉ dừng lại ở việc làm sạch.',
    body1: 'Từng chuyển động nhỏ quanh vùng tai tạo nên những cảm nhận mà khách hiếm khi chú ý trong đời sống thường ngày. Có lúc êm dịu, có lúc hơi nhột, có lúc lại mang đến sự tò mò khi những âm thanh rất nhỏ và sự tiếp xúc tinh tế diễn ra ngay sát bên tai.',
    body2: 'Mỗi thao tác đều tạo nên một trải nghiệm riêng, đủ nhẹ nhàng để cơ thể thả lỏng nhưng cũng đủ đặc biệt để khách cảm thấy thích thú và muốn khám phá từng cảm giác đang diễn ra.',
    body3: 'Nhiều khách hàng đến với Oria Spa mà không thực sự biết bên trong tai mình đang ở trạng thái như thế nào. Chỉ khi trải nghiệm ráy tai và từng phần được làm sạch một cách nhẹ nhàng, khách mới bắt đầu cảm nhận rõ sự khác biệt.',
    chips: [] as string[],
    closing: 'Sau khi liệu trình kết thúc, cảm giác còn lại không chỉ là đôi tai sạch sẽ và thông thoáng hơn, mà còn là sự nhẹ nhõm, dễ chịu và thoải mái rất đặc trưng như vừa giải phóng một cảm giác nặng nề nhỏ mà trước đó chính mình cũng không nhận ra.',
    panelTitle: '',
    points: [] as any[]
  } : {
    eyebrow: 'Ear Clean Perspective',
    headline: 'Ear Cleaning at Oria Spa – Relaxing, interesting, and full of novel sensations',
    lead: 'Ear cleaning at OriaSpa stands out as a relaxing experience, but alongside the gentleness is a very distinct feeling: interesting, characteristic, and slightly unfamiliar.',
    quote: 'It is this blend of relaxation and novel sensation that makes ear cleaning at Oria Spa more than just a cleansing process.',
    body1: 'Every small movement around the ear creates sensations that guests rarely notice in daily life. At times soothing, at times slightly ticklish, and at times sparking curiosity as tiny sounds and delicate touches occur right next to the ear.',
    body2: 'Each technique creates its own experience, gentle enough for the body to relax but special enough for guests to feel intrigued and want to explore every unfolding sensation.',
    body3: 'Many guests come to Oria Spa without truly knowing the condition inside their ears. Only when experiencing ear cleaning and having each part gently cleansed do they begin to clearly feel the difference.',
    chips: [] as string[],
    closing: 'After the treatment concludes, the lingering feeling is not just of cleaner, clearer ears, but a very distinct lightness, ease, and comfort—like releasing a small, heavy burden that they hadn\'t even realized was there.',
    panelTitle: '',
    points: [] as any[]
  };

  const barberContent = currentLang === 'vi' ? {
    eyebrow: 'Barber Perspective',
    headline: 'Barber – Chăm sóc dành riêng cho quý ông',
    lead: 'Barber tại Oria Spa được thiết kế dành riêng cho nam giới, với cắt tóc là một lựa chọn riêng biệt dành cho những khách hàng muốn chỉnh sửa kiểu tóc, làm mới diện mạo hoặc đơn giản là giữ mái tóc luôn gọn gàng và chỉn chu.',
    quote: 'Một lần ghé. Nhiều nhu cầu được chăm sóc. Gọn gàng, chỉn chu và tiện lợi đúng với nhịp sống của quý ông hiện đại.',
    body1: 'Bên cạnh đó, Oria Spa xây dựng các gói chăm sóc kết hợp gồm nhiều dịch vụ như cạo râu, ráy tai, cắt móng, đắp mặt nạ, gội đầu và giãn cơ, giúp quý ông hoàn thiện nhiều bước chăm sóc trong cùng một lần trải nghiệm.',
    body2: 'Các dịch vụ được sắp xếp theo hướng thực tế và tiện lợi, tập trung vào những điều nam giới thường cần trong cuộc sống hằng ngày từ mái tóc gọn gàng, khuôn mặt sạch sẽ, diện mạo chỉn chu đến những phút thư giãn sau công việc.',
    body3: 'Thay vì phải lựa chọn từng dịch vụ riêng lẻ, khách có thể chọn một gói phù hợp để chăm sóc diện mạo và thư giãn trong cùng một khoảng thời gian.',
    chips: [] as string[],
    closing: '',
    panelTitle: '',
    points: [] as any[]
  } : {
    eyebrow: 'Barber Perspective',
    headline: 'Barber – Exclusive care for gentlemen',
    lead: 'Barber at Oria Spa is designed specifically for men, offering haircuts as a distinct choice for guests wanting to touch up their style, refresh their look, or simply keep their hair neat and well-groomed.',
    quote: 'One visit. Many needs met. Neat, well-groomed, and convenient—perfectly suited for the modern gentleman’s lifestyle.',
    body1: 'Additionally, Oria Spa has created combination packages featuring services like shaving, ear cleaning, nail trimming, facial masks, hair washing, and muscle stretching, allowing gentlemen to complete multiple grooming steps in a single experience.',
    body2: 'These services are arranged for practicality and convenience, focusing on what men often need in their daily lives—from neat hair and a clean face to a polished appearance and moments of relaxation after work.',
    body3: 'Instead of selecting individual services, guests can choose a suitable package to care for their appearance and unwind all at the same time.',
    chips: [] as string[],
    closing: '',
    panelTitle: '',
    points: [] as any[]
  };

  const packagesContent = currentLang === 'vi' ? {
    eyebrow: 'Packages Perspective',
    headline: 'Packages – Nhiều trải nghiệm trong một hành trình chăm sóc',
    lead: 'Packages tại OriaSpa được xây dựng dành cho những khách hàng muốn kết hợp nhiều dịch vụ trong cùng một lần trải nghiệm, thay vì lựa chọn từng dịch vụ riêng lẻ.',
    quote: 'Nhiều trải nghiệm trong một hành trình chăm sóc.',
    body1: 'Mỗi package là sự kết hợp có chủ đích giữa các bước chăm sóc như massage cơ thể, massage chân, chăm sóc da mặt, gội đầu, ráy tai hoặc những dịch vụ thư giãn khác, giúp khách có thêm thời gian dành cho bản thân và trải nghiệm nhiều hình thức chăm sóc trong cùng một hành trình.',
    body2: 'Các dịch vụ trong từng package được sắp xếp theo trình tự phù hợp để cảm giác thư giãn được tiếp nối từ bước này sang bước khác. Từ việc làm dịu cơ thể, chăm sóc những vùng thường xuyên chịu áp lực đến những khoảng thời gian nhẹ nhàng dành cho da, tóc và giác quan, mỗi phần đều góp vào một trải nghiệm hoàn chỉnh hơn.',
    body3: 'Thay vì chỉ tập trung vào một nhu cầu, Packages hướng đến việc chăm sóc nhiều khía cạnh của cơ thể và cảm xúc trong cùng một khoảng thời gian — phù hợp cho những ngày khách muốn nghỉ ngơi lâu hơn, muốn trải nghiệm nhiều dịch vụ hơn hoặc đơn giản là dành cho mình một khoảng thời gian trọn vẹn.',
    chips: [] as string[],
    closing: '',
    panelTitle: '',
    points: [] as any[]
  } : {
    eyebrow: 'Packages Perspective',
    headline: 'Packages – Multiple experiences in one journey of care',
    lead: 'Packages at OriaSpa are designed for guests who wish to combine multiple services into a single experience, rather than selecting individual treatments.',
    quote: 'Multiple experiences in one journey of care.',
    body1: 'Each package is a purposeful combination of care steps such as body massage, foot massage, facial care, hair washing, ear cleaning, or other relaxing services, giving guests more time for themselves to experience various forms of care in one continuous journey.',
    body2: 'The services within each package are arranged in a suitable sequence so that the feeling of relaxation flows seamlessly from one step to the next. From soothing the body and tending to areas under frequent pressure, to gentle moments dedicated to the skin, hair, and senses—each part contributes to a more complete experience.',
    body3: 'Instead of focusing on just one need, Packages aim to care for multiple aspects of the body and emotions simultaneously—ideal for days when guests want to rest longer, experience more services, or simply dedicate uninterrupted time to themselves.',
    chips: [] as string[],
    closing: '',
    panelTitle: '',
    points: [] as any[]
  };

  const vipPackagesContent = currentLang === 'vi' ? {
    headline: <>VIP Packages<br/><span className={styles.vipTitleAccent}>Dành trọn thời gian cho chính mình</span></>,
    lead: 'VIP Packages tại OriaSpa được tạo nên cho những lúc khách muốn tạm rời khỏi công việc, lịch trình và những áp lực thường ngày để dành trọn một khoảng thời gian cho chính mình.',
    paragraphs: [
      'Hành trình kết hợp cạo râu bằng dao, Facial, ráy tai thư giãn, Body Massage 4 Hands và gội đầu — mỗi dịch vụ mang đến một cảm giác khác nhau, nhưng cùng hướng đến một điều duy nhất: giúp cơ thể chậm lại và tâm trí được nghỉ ngơi.',
      'Từ những chuyển động chậm rãi khi cạo râu, cảm giác dịu nhẹ trong Facial, sự thú vị và thư giãn đặc trưng của ráy tai, đến Body Massage 4 Hands với hai người thợ cùng chăm sóc cơ thể trong một nhịp điệu đồng thời. Nhiều điểm chạm xuất hiện cùng lúc khiến cơ thể dần buông lỏng, tâm trí không còn tập trung vào một chuyển động riêng biệt mà được cuốn vào dòng cảm giác liên tục và sâu hơn.',
      'Sau cùng, gội đầu trở thành khoảng thư giãn nhẹ nhàng để khép lại hành trình — khi khách không cần làm gì, không cần nghĩ đến điều gì, chỉ đơn giản là nằm xuống và để bản thân được chăm sóc.',
      'VIP Packages không hướng đến việc làm thật nhiều dịch vụ trong một lần. Giá trị nằm ở khoảng thời gian đủ dài để khách thật sự ngắt kết nối với bên ngoài, trải qua nhiều tầng cảm giác và trở về với trạng thái nhẹ nhàng hơn cả về cơ thể lẫn tâm trí.'
    ],
    specialText: 'Không cần vội. Không cần nghĩ đến công việc tiếp theo.\nChỉ là một khoảng thời gian được dành hoàn toàn cho chính mình.'
  } : {
    headline: <>VIP Packages<br/><span className={styles.vipTitleAccent}>Dedicating time to yourself</span></>,
    lead: 'VIP Packages at OriaSpa are created for those moments when guests want to step away from work, schedules, and daily pressures to dedicate an uninterrupted period entirely to themselves.',
    paragraphs: [
      'A journey combining straight razor shaving, facial care, relaxing ear cleaning, 4-Hands Body Massage, and hair washing—each service offers a distinct sensation, yet all point toward a single goal: helping the body slow down and the mind to rest.',
      'From the slow movements of the shave, the soothing touch of the facial, the unique intrigue of ear cleaning, to the 4-Hands Body Massage where two artisans care for the body in a synchronized rhythm. Multiple touchpoints occurring simultaneously cause the body to gradually loosen, allowing the mind to drift into a continuous, deeper flow of sensation.',
      'Finally, hair washing becomes a gentle interlude to close the journey—when the guest doesn\'t need to do anything, think about anything, but simply lie down and be cared for.',
      'VIP Packages are not about cramming many services into one visit. The value lies in a duration long enough for guests to truly disconnect from the outside world, experience multiple layers of sensation, and return to a lighter state in both body and mind.'
    ],
    specialText: 'No need to rush. No need to think about the next task.\nJust a moment dedicated completely to yourself.'
  };

  const sectionContent = section.id === 'foot-care' ? footCareContent : 
                         section.id === 'ear-clean' ? earCleanContent : 
                         section.id === 'barber' ? barberContent : 
                         section.id === 'package' ? packagesContent : 
                         section.id === 'vip-package' ? vipPackagesContent : 
                         humanTouchContent;

  const adminNarrative = contentMedia?.narratives?.[section.id]?.[currentLang || 'vi'];
  const finalSectionContent = {
    ...sectionContent,
    ...adminNarrative
  };

  // Fetch dynamic services and content from admin panel
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        setDbServices(Array.isArray(data) ? data : []);
        setIsDbLoaded(true);
      })
      .catch((e) => {
        console.error(e);
        setIsDbLoaded(true);
      });
  }, []);

  
  const filteredServices = useMemo(() => {
    if (!isDbLoaded) return section.services;
    return section.services.map(svc => {
      let newSvc = { ...svc };
      if (newSvc.variants) {
         newSvc.variants = newSvc.variants.map((v: any) => ({
             ...v,
             durations: v.durations?.filter((d: any) => dbServices.some(db => db.id === d.id))
         })).filter((v: any) => v.durations && v.durations.length > 0);
      }
      if (newSvc.durations) {
         newSvc.durations = newSvc.durations.filter((d: any) => dbServices.some(db => db.id === d.id));
      }
      return newSvc;
    }).filter(svc => {
      if (svc.variants) return svc.variants.length > 0;
      if (svc.durations) return svc.durations.some((d: any) => dbServices.some(db => db.id === d.id));
      return false;
    });
  }, [section.services, dbServices, isDbLoaded]);

  useEffect(() => {
    if (filteredServices.length > 0 && serviceIndex >= filteredServices.length) {
      setServiceIndex(0);
      setVariantIndex(0);
      setDurationIndex(0);
    }
  }, [filteredServices.length, serviceIndex]);

  const selectedService = filteredServices[serviceIndex] || filteredServices[0];
  
  if (!selectedService) {
    return (
       <section className={styles.serviceSection} id={section.id}>
         <div className="text-center py-20 opacity-60">Coming soon / Đang cập nhật</div>
       </section>
    );
  }

  const active = useMemo(() => getActiveItem(selectedService, variantIndex, contentMedia, currentLang), [selectedService, variantIndex, contentMedia, currentLang]);
  
  const displayDurations = useMemo(() => {
    return (active.durations || []).map(duration => {
      const dbService = dbServices.find(s => s.id === duration.id);
      return {
        ...duration,
        price: dbService ? dbService.priceVND : duration.price,
        priceUSD: dbService ? dbService.priceUSD : 0
      };
    });
  }, [active.durations, dbServices]);

  const activeDuration = displayDurations[Math.min(durationIndex, displayDurations.length - 1)];

  const selectedCartServiceId = useMemo(
    () => activeDuration.id || `pure-relaxation-${section.id}-${slugify(active.name)}-${slugify(activeDuration.label)}`,
    [active.name, activeDuration.label, section.id, activeDuration.id]
  );
  const selectedCartQuantity = useMemo(
    () =>
      cartItems
        .filter((item) => item.id === selectedCartServiceId)
        .reduce((total, item) => total + (item.qty || 1), 0),
    [cartItems, selectedCartServiceId]
  );

  const syncCart = useCallback((cart?: CartItem[]) => {
    const next = cart ?? readBookingCart();
    setCartItems(next);
    window.dispatchEvent(new CustomEvent('nganha:cart-updated', { detail: { count: next.length } }));
    return next;
  }, []);

  useEffect(() => {
    setVariantIndex(0);
    setDurationIndex(0);
    setNotice('');
  }, [serviceIndex]);

  useEffect(() => {
    setDurationIndex(0);
    setNotice('');
  }, [variantIndex]);

  // Override media with admin video/image if available
  const displayMedia = useMemo(() => {
    const defaultMedia = active.media;
    if (!defaultMedia) return null;
    
    // Find matching media from contentMedia
    const adminMedia = contentMedia[active.name];

    if (adminMedia && adminMedia.src) {
      return {
        ...defaultMedia,
        type: adminMedia.type as 'image' | 'video',
        src: adminMedia.src,
      };
    }
    return defaultMedia;
  }, [active.media, active.name, contentMedia]);

  useEffect(() => {
    setCartItems(readBookingCart());

    const handleCartUpdate = () => setCartItems(readBookingCart());
    window.addEventListener('nganha:cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    return () => {
      window.removeEventListener('nganha:cart-updated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  const buildServicePayload = useCallback((): Service => {
    const minutes = Number(activeDuration.label.replace(/\D/g, '')) || 0;
    const dbService = dbServices.find(s => s.id === selectedCartServiceId) || dbServices.find(s => s.id === activeDuration.id);
    
    return {
      id: selectedCartServiceId,
      cat: `Pure Relaxation · ${section.title}`,
      names: dbService?.names || {
        vi: active.name,
        en: active.name,
        cn: active.name,
        jp: active.name,
        kr: active.name,
      },
      descriptions: dbService?.descriptions || {
        vi: active.subtitle,
        en: active.subtitle,
        cn: active.subtitle,
        jp: active.subtitle,
        kr: active.subtitle,
      },
      img: displayMedia?.type === 'image' ? displayMedia.src : displayMedia?.poster || displayMedia?.src || '',
      priceVND: activeDuration.price,
      priceUSD: activeDuration.priceUSD || 0,
      timeValue: minutes,
      timeDisplay: activeDuration.label,
      menuType: 'standard',
    };
  }, [active, activeDuration, section.title, selectedCartServiceId, displayMedia, dbServices]);

  const handleSaveCustom = useCallback((prefs: CustomPreferences) => {
    lastAddedCartIds.forEach(cartId => {
      updateBookingCartItemOptions(cartId, {
        strength: prefs.strength,
        therapist: prefs.therapist,
        bodyParts: prefs.bodyParts,
        notes: prefs.notes,
        addons: prefs.addons
      });
    });
    syncCart();
    setShowCustomForYou(false);
    if (pendingCheckout) {
      setPendingCheckout(false);
      router.push(`/${currentLang || 'en'}/new-user/standard/checkout`);
    }
  }, [lastAddedCartIds, syncCart, pendingCheckout, currentLang, router]);

  const addToCart = useCallback((onSuccess?: any) => {
    const payload = buildServicePayload();
    const dbService = dbServices.find(s => s.id === payload.id) || dbServices.find(s => s.id === activeDuration.id);
    if (dbService) {
      payload.FOCUS_POSITION = dbService.FOCUS_POSITION;
      payload.SHOW_STRENGTH = dbService.SHOW_STRENGTH;
      payload.SHOW_NOTES = dbService.SHOW_NOTES;
      payload.SHOW_PREFERENCES = dbService.SHOW_PREFERENCES;
      payload.SHOW_CUSTOM_FOR_YOU = dbService.SHOW_CUSTOM_FOR_YOU;
      payload.SHOW_GENDER = dbService.SHOW_GENDER;
      payload.SHOW_FOCUS = dbService.SHOW_FOCUS;
      payload.HINT = dbService.HINT;
      payload.TAGS = dbService.TAGS;
    }

    const cart = appendBookingCartItem(payload, 1);
    syncCart(cart);

    const newlyAddedItem = cart[cart.length - 1];
    const showCustomForYou = dbService ? dbService.SHOW_CUSTOM_FOR_YOU !== false : true;
    
    if (showCustomForYou) {
      setModalServiceData(payload);
      setLastAddedCartIds([newlyAddedItem.cartId]);
      setShowCustomForYou(true);
      if (typeof onSuccess === 'function') setPendingCheckout(true);
    } else {
      setNotice('Added to cart');
      window.setTimeout(() => setNotice(''), 2200);
      if (typeof onSuccess === 'function') onSuccess();
    }
    return cart;
  }, [buildServicePayload, syncCart, dbServices, activeDuration]);

  const decreaseQuantity = useCallback(() => {
    const cart = removeOneBookingCartItem(selectedCartServiceId);
    syncCart(cart);
    setNotice(cart.some((item) => item.id === selectedCartServiceId) ? 'Updated cart' : 'Removed from cart');
    window.setTimeout(() => setNotice(''), 2200);
    return cart;
  }, [selectedCartServiceId, syncCart]);

  const bookNow = useCallback(() => {
    addToCart(() => {
      router.push(`/${currentLang || 'en'}/new-user/standard/checkout`);
    });
  }, [addToCart, currentLang, router]);

  const translatedName = useMemo(() => {
    if (!dbServices.length) return active.name;
    const firstDurationId = active.durations?.[0]?.id;
    const dbSvc = dbServices.find(s => s.id === firstDurationId);
    if (dbSvc && dbSvc.names && dbSvc.names[currentLang]) {
      return dbSvc.names[currentLang];
    }
    return active.name;
  }, [active.name, active.durations, dbServices, currentLang]);

  const translatedSubtitle = useMemo(() => {
    if (!dbServices.length) return active.subtitle;
    const firstDurationId = active.durations?.[0]?.id;
    const dbSvc = dbServices.find(s => s.id === firstDurationId);
    if (dbSvc && dbSvc.descriptions && dbSvc.descriptions[currentLang]) {
      return dbSvc.descriptions[currentLang];
    }
    return active.subtitle;
  }, [active.subtitle, active.durations, dbServices, currentLang]);

  return (
    <section className={styles.serviceSection} id={section.id}>
      <div className={styles.sectionGrid}>
        <div className={styles.mediaPane}>
          {active.media && <MediaPreview media={active.media} label={translatedName} />}
        </div>

        <div className={styles.sectionContent}>

          <div className={styles.choiceBlock}>
            <div className={styles.choiceLabel}>
              {{
                vi: 'Chọn dịch vụ',
                en: 'Choose service',
                cn: '选择服务',
                jp: 'サービスを選択',
                kr: '서비스 선택'
              }[currentLang] || 'Choose service'}
            </div>
            <div className={styles.pillGrid}>
              {filteredServices.map((service, index) => {
                let svcName = service.name;
                if (hasVariants(service)) {
                  const groupTranslations: Record<string, Record<string, string>> = {
                    'Hair Wash & Facial': {
                      vi: 'Gội Đầu & Da Mặt',
                      en: 'Hair Wash & Facial',
                      cn: '洗发与面部护理',
                      jp: '洗髪＆フェイシャル',
                      kr: '샴푸 & 페이셜'
                    },
                    'Heel Care & Nail Cut': {
                      vi: 'Chà Gót & Cắt Móng',
                      en: 'Heel Care & Nail Cut',
                      cn: '脚跟护理与修甲',
                      jp: 'かかとケア＆爪切り',
                      kr: '발뒤꿈치 케어 & 손발톱 정리'
                    }
                  };
                  svcName = groupTranslations[service.name]?.[currentLang] || service.name;
                } else {
                  const svcDurId = service.durations?.[0]?.id;
                  const svDb = dbServices.find(s => s.id === svcDurId);
                  svcName = svDb?.names?.[currentLang] || (currentLang === 'vi' ? (service.variants?.[0]?.subtitle || service.name) : service.name);
                }

                return (
                  <button
                    className={`${styles.pill} ${serviceIndex === index ? styles.pillActive : ''}`}
                    key={service.name}
                    type="button"
                    onClick={() => setServiceIndex(index)}
                  >
                    {svcName}
                  </button>
                );
              })}
            </div>
          </div>

          {hasVariants(selectedService) && (
            <div className={styles.choiceBlock}>
              <div className={styles.choiceLabel}>
                {{
                  vi: 'Chọn gói',
                  en: 'Choose package',
                  cn: '选择套餐',
                  jp: 'パッケージを選択',
                  kr: '패키지 선택'
                }[currentLang] || 'Choose package'}
              </div>
              <div className={styles.variantStack}>
                {selectedService.variants.map((variant, index) => {
                  const varDurId = variant.durations?.[0]?.id;
                  const varDb = dbServices.find(s => s.id === varDurId);
                  const varName = varDb?.names?.[currentLang] || (currentLang === 'vi' ? (variant.subtitle || variant.name) : variant.name);
                  return (
                    <button
                      className={`${styles.variantButton} ${variantIndex === index ? styles.variantActive : ''}`}
                      key={variant.name}
                      type="button"
                      onClick={() => setVariantIndex(index)}
                    >
                      <span>{varName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.selectedPanel}>
            <h3>{translatedName}</h3>
            <p>{translatedSubtitle}</p>
          </div>

          <div className={styles.choiceBlock}>
            <div className={styles.choiceLabel}>
              {{
                vi: 'Chọn thời gian',
                en: 'Choose duration',
                cn: '选择时长',
                jp: '期間を選択',
                kr: '시간 선택'
              }[currentLang] || 'Choose duration'}
            </div>
            <div className={styles.durationGrid}>
              {displayDurations.map((duration, index) => (
                <button
                  className={`${styles.durationButton} ${durationIndex === index ? styles.durationActive : ''}`}
                  key={duration.label}
                  type="button"
                  onClick={() => setDurationIndex(index)}
                >
                  <span>{duration.label}</span>
                  <small>{formatVnd(duration.price)}</small>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.purchaseRow}>
            <div>
              <span className={styles.priceLabel}>
                {{
                  vi: 'Giá',
                  en: 'Selected price',
                  cn: '所选价格',
                  jp: '選択した価格',
                  kr: '선택한 가격'
                }[currentLang] || 'Selected price'}
              </span>
              <strong>{formatVnd(activeDuration.price)}</strong>
              <div style={{ fontSize: '12px', color: '#7a705e', marginTop: '4px', fontStyle: 'italic', letterSpacing: '0.02em' }}>
                *{{
                  vi: 'Giá đã bao gồm VAT',
                  en: 'Price includes VAT',
                  cn: '价格已含增值税',
                  jp: '付加価値税込み',
                  kr: 'VAT 포함 가격'
                }[currentLang as 'vi'|'en'|'cn'|'jp'|'kr'] || 'Price includes VAT'}
              </div>
            </div>
            <div className={styles.actions}>
              {selectedCartQuantity > 0 ? (
                <div className={styles.quantityStepper} aria-label={`${translatedName} quantity in cart`}>
                  <button type="button" onClick={decreaseQuantity} aria-label="Decrease quantity">
                    -
                  </button>
                  <span>{selectedCartQuantity}</span>
                  <button type="button" onClick={addToCart} aria-label="Increase quantity">
                    +
                  </button>
                </div>
              ) : (
                <button className={styles.secondaryButton} type="button" onClick={addToCart}>
                  <ShoppingBag size={17} />
                  {{
                    vi: 'Thêm vào giỏ',
                    en: 'Add to cart',
                    cn: '加入购物车',
                    jp: 'カートに追加',
                    kr: '장바구니에 추가'
                  }[currentLang] || 'Add to cart'}
                </button>
              )}
              <button className={styles.primaryButton} type="button" onClick={bookNow}>
                {{
                  vi: 'Đặt ngay',
                  en: 'Book now',
                  cn: '立即预订',
                  jp: '今すぐ予約',
                  kr: '지금 예약'
                }[currentLang] || 'Book now'}
              </button>
            </div>
          </div>

          {notice && <p className={styles.notice}>{notice}</p>}

          {active.privilege?.image && (
            <div className={styles.privilegeCard}>
              <img src={active.privilege.image} alt={active.privilege.title} loading="lazy" />
              <div>
                <span className={styles.choiceLabel}>
                  {{
                    vi: 'Ưu đãi bao gồm',
                    en: 'Privilege Included',
                    cn: '包含特权',
                    jp: '特典が含まれています',
                    kr: '특전 포함'
                  }[currentLang] || 'Privilege Included'}
                </span>
                <h4>{active.privilege.title}</h4>
                <p>{active.privilege.copy}</p>
                <small>
                  <Timer size={14} />
                  {active.privilege.time}
                </small>
              </div>
            </div>
          )}
        </div>
      </div>

      {section.id === 'body-care' ? (
        <div className={styles.humanTouchSection} style={{ padding: 0, border: 'none', background: 'transparent' }}>
          <div className={styles.narrativeHero}>
            <div className={styles.narrativeKicker}>{(sectionContent as any).eyebrow}</div>
            <h2 className={styles.narrativeHeadline}>{(sectionContent as any).headline}</h2>
            <p className={styles.narrativeIntro}>{(sectionContent as any).lead}</p>
            {(sectionContent as any).signature && (sectionContent as any).signature.length > 0 && (
              <div className={styles.narrativeSignature}>
                {(sectionContent as any).signature.map((item: string, i: number) => (
                  <span key={i}>{item}</span>
                ))}
              </div>
            )}
          </div>
          <div className={styles.narrativeStory}>
            {(sectionContent as any).rows?.map((row: any, i: number) => (
              <div key={i} className={styles.narrativeRow}>
                <div className={styles.narrativeIndex}>{row.index}</div>
                <div className={styles.narrativeContent}>
                  <h2>{row.title}</h2>
                  <p>{row.text}</p>
                </div>
              </div>
            ))}
            
            {(sectionContent as any).pullQuote && (
              <div className={styles.narrativePull}>
                <div className={styles.narrativePullQuote}>{(sectionContent as any).pullQuote}</div>
                {(sectionContent as any).pullSign && <div className={styles.narrativePullSign}>{(sectionContent as any).pullSign}</div>}
              </div>
            )}

            {(sectionContent as any).finalBig && (
              <div className={styles.narrativeFinal}>
                <div className={styles.narrativeFinalBig}>{(sectionContent as any).finalBig}</div>
                <div className={styles.narrativeFinalSmall}>{(sectionContent as any).finalSmall}</div>
              </div>
            )}
          </div>
        </div>
      ) : section.id === 'vip-package' ? (
        <div className={styles.humanTouchSection} style={{ padding: 0, border: 'none', background: 'transparent' }}>
          <div className={styles.vipStory}>
            <div className={styles.vipStoryInner}>
              <h2 className={styles.vipHeadline}>{(finalSectionContent as any).headline}</h2>
              <p className={styles.vipLead}>{(finalSectionContent as any).lead}</p>
              {(finalSectionContent as any).paragraphs?.map((p: string, i: number) => (
                <p key={i} className={styles.vipCopy}>{p}</p>
              ))}
              {(finalSectionContent as any).specialText && (
                <div className={styles.vipSpecialText}>{(finalSectionContent as any).specialText}</div>
              )}
            </div>
          </div>
        </div>
      ) : (section.id === 'foot-care' || section.id === 'ear-clean' || section.id === 'barber' || section.id === 'package') ? (
        <div className={styles.humanTouchSection}>
          <div className={styles.humanInner}>
            <div>
              <span className={styles.humanEyebrow}>{(finalSectionContent as any).eyebrow}</span>
              <h2 className={styles.humanHeadline}>{(finalSectionContent as any).headline}</h2>
              <p className={styles.humanLead}>{(finalSectionContent as any).lead}</p>
              
              {(finalSectionContent as any).quote && (
                <div className={styles.humanQuote}>
                  {(finalSectionContent as any).quote}
                </div>
              )}

              {(finalSectionContent as any).body1 && <p className={styles.humanBodyCopy}>{(finalSectionContent as any).body1}</p>}
              {(finalSectionContent as any).body2 && <p className={styles.humanBodyCopy}>{(finalSectionContent as any).body2}</p>}
              {(finalSectionContent as any).body3 && <p className={styles.humanBodyCopy}>{(finalSectionContent as any).body3}</p>}

              {(finalSectionContent as any).chips && (finalSectionContent as any).chips.length > 0 && (
                <div className={styles.chipRow}>
                  {(finalSectionContent as any).chips.map((chip: string, i: number) => (
                    <span key={i} className={styles.chip}>{chip}</span>
                  ))}
                </div>
              )}

              <div className={styles.humanClosing}>{(finalSectionContent as any).closing}</div>
            </div>

            {(finalSectionContent as any).points && (finalSectionContent as any).points.length > 0 && (
              <aside className={styles.insightPanel}>
                <div className={styles.panelTitle}>{(finalSectionContent as any).panelTitle}</div>
                {(finalSectionContent as any).points.map((point: any, i: number) => (
                  <div key={i} className={styles.insightPoint}>
                    <h4>{point.title}</h4>
                    <p>{point.desc}</p>
                  </div>
                ))}
              </aside>
            )}
          </div>
        </div>
      ) : null}
      {showCustomForYou && modalServiceData && (
        <CustomForYouModal
          isOpen={showCustomForYou}
          onClose={() => {
            setShowCustomForYou(false);
            setPendingCheckout(false);
          }}
          onSave={handleSaveCustom}
          serviceData={{
            ID: modalServiceData.id,
            NAMES: modalServiceData.names as Record<string, string>,
            FOCUS_POSITION: modalServiceData.FOCUS_POSITION,
            TAGS: modalServiceData.TAGS,
            SHOW_STRENGTH: modalServiceData.SHOW_STRENGTH,
            HINT: modalServiceData.HINT,
            PRICE_VN: modalServiceData.priceVND,
            PRICE_USD: modalServiceData.priceUSD,
            SHOW_NOTES: modalServiceData.SHOW_NOTES,
            SHOW_PREFERENCES: modalServiceData.SHOW_PREFERENCES,
            SHOW_GENDER: modalServiceData.SHOW_GENDER,
            SHOW_FOCUS: modalServiceData.SHOW_FOCUS,
          }}
          lang={currentLang as any}
        />
      )}
    </section>
  );
};

const bgImages = [
  '/images/services/aroma-oil.png',
  '/images/services/barber.JPG',
  '/images/services/coconut-oil.png',
  '/images/services/earclean.png',
  '/images/services/facial.png',
  '/images/services/foot-massage.png',
  '/images/services/hairwash.png',
  '/images/services/hotstone.png',
  '/images/services/shave.JPG',
  '/images/services/shiatsu.png',
  '/images/services/thai.png'
];

const TRANSLATIONS = {
  en: {
    randomRoom: "Random Room",
    roomSub: "Assigned by the spa team for the smoothest flow.",
    randomStaff: "Random Staff",
    staffSub: "A suitable therapist will be arranged for your chosen ritual."
  },
  vi: {
    randomRoom: "Phòng Ngẫu Nhiên",
    roomSub: "Được sắp xếp bởi lễ tân để quá trình diễn ra trơn tru nhất.",
    randomStaff: "KTV Ngẫu Nhiên",
    staffSub: "KTV phù hợp sẽ được sắp xếp cho dịch vụ của bạn."
  },
  cn: {
    randomRoom: "随机房间",
    roomSub: "由前台安排，确保流程最顺畅。",
    randomStaff: "随机理疗师",
    staffSub: "将为您选择的服务安排合适的理疗师。"
  },
  kr: {
    randomRoom: "무작위 객실",
    roomSub: "원활한 진행을 위해 리셉션에서 배정합니다.",
    randomStaff: "무작위 테라피스트",
    staffSub: "선택하신 서비스에 적합한 테라피스트가 배정됩니다."
  },
  jp: {
    randomRoom: "ランダムな部屋",
    roomSub: "最もスムーズな進行のためにフロントが割り当てます。",
    randomStaff: "ランダムなセラピスト",
    staffSub: "選択したサービスに最適なセラピストが手配されます。"
  }
};

const PureRelaxationPage = () => {
  const navRef = useRef<HTMLDivElement>(null);
  const [bgIndex, setBgIndex] = useState(0);

  const [contentMedia, setContentMedia] = useState<any>({});
  
  useEffect(() => {
    fetch('/api/public/site-content')
      .then(res => res.json())
      .then(json => {
        if (json.content) setContentMedia(json.content.pure_relaxation_media || {});
      })
      .catch(console.error);
  }, []);

  const { currentLang } = useTranslation();
  const pureRelaxationSections = useMemo(() => getPureRelaxationSections(contentMedia, currentLang), [contentMedia, currentLang]);
  
  const [activeSection, setActiveSection] = useState(pureRelaxationSections[0]?.id || 'body-care');

  const displayBgImages = contentMedia.slideshow && contentMedia.slideshow.length > 0 ? contentMedia.slideshow : bgImages;

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % displayBgImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [displayBgImages.length]);

  useEffect(() => {
    // Scroll nav to center active item on mobile
    const nav = navRef.current;
    const activeButton = nav?.querySelector<HTMLButtonElement>(`[data-section="${activeSection}"]`);
    if (!nav || !activeButton) return;

    const targetLeft = activeButton.offsetLeft - (nav.clientWidth - activeButton.clientWidth) / 2;
    nav.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  }, [activeSection]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    if (navRef.current) {
      const navTop = navRef.current.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > navTop - 100) {
        window.scrollTo({ top: navTop - 100, behavior: 'smooth' });
      }
    }
  };

  const t = TRANSLATIONS[currentLang as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;

  return (
    <main className={styles.page}>
      {/* Fixed Background Image Slideshow for Parallax */}
      {displayBgImages.map((src: string, i: number) => (
        <div
          key={src + i}
          className={`${styles.fixedBackground} ${i === bgIndex ? styles.activeBg : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}

      <div className={styles.topPanel}>
        <div className={styles.heroContent}>
          <h1>Pure Relaxation</h1>

          <div className={styles.preferenceWrap}>
            <PreferenceNote icon={<DoorOpen size={18} />} title={t.randomRoom} copy={t.roomSub} />
            <PreferenceNote icon={<UserRound size={18} />} title={t.randomStaff} copy={t.staffSub} />
          </div>
        </div>
      </div>

      <div className={styles.imageSpacer} />

      {/* Solid background wrapper for the rest of the content to scroll over the fixed image */}
      <div className={styles.contentWrapper}>

      <nav className={styles.sectionNavShell} aria-label="Pure Relaxation categories">
        <div className={styles.sectionNav} ref={navRef}>
          {pureRelaxationSections.map((section, idx) => (
            <button
              className={`${styles.navButton} ${activeSection === section.id ? styles.navActive : ''}`}
              data-section={section.id}
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              <div
                className={styles.categoryIcon}
                style={{
                  maskImage: `url(${section.icon})`,
                  WebkitMaskImage: `url(${section.icon})`
                }}
                aria-hidden="true"
              />
              <span className={styles.categoryTitle}>{section.title}</span>
            </button>
          ))}
        </div>
        <div className={styles.scrollHint}>
          <ChevronRight size={24} />
        </div>
      </nav>

      <div className={styles.sectionsWrap}>
        {pureRelaxationSections
          .filter((section) => section.id === activeSection)
          .map((section) => (
            <ServiceSection key={section.id} section={section} contentMedia={contentMedia} />
          ))}
      </div>
      </div>
    </main>
  );
};

export default PureRelaxationPage;
