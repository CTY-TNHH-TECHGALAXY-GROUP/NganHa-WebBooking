'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { DoorOpen, ShoppingBag, Timer, UserRound } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import type { CartItem, Service } from '@/components/Menu/types';
import {
  appendBookingCartItem,
  readBookingCart,
  removeOneBookingCartItem,
} from '@/lib/bookingCartStorage';
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

const getActiveItem = (service: PureRelaxationService, variantIndex: number): ActiveItem => {
  if (hasVariants(service)) {
    const variant = service.variants[Math.min(variantIndex, service.variants.length - 1)];
    return {
      name: variant.name,
      subtitle: variant.subtitle,
      media: variant.media,
      durations: variant.durations,
      privilege: variant.privilege,
    };
  }

  return {
    name: service.name,
    subtitle: service.description,
    media: service.media!,
    durations: service.durations!,
    privilege: service.privilege!,
  };
};

const MediaPreview = ({ media, label }: { media: PureRelaxationMedia; label: string }) => {
  return (
    <div className={styles.mediaFrame}>
      <div className={styles.mediaFade} key={media.src}>
        {media.type === 'video' ? (
          <video
            className={styles.media}
            src={media.src}
            poster={media.poster}
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <img className={styles.media} src={media.src} alt={label} loading="lazy" />
        )}
      </div>
      <div className={styles.mediaOverlay} />
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
                         (section.id === 'packages' || section.id === 'package') ? packagesContent :
                         humanTouchContent;

  // Fetch dynamic services and content from admin panel
  const [dbServices, setDbServices] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => setDbServices(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const selectedService = section.services[serviceIndex];
  const active = useMemo(() => getActiveItem(selectedService, variantIndex), [selectedService, variantIndex]);
  
  const displayDurations = useMemo(() => {
    return active.durations.map(duration => {
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
    return {
      id: selectedCartServiceId,
      cat: `Pure Relaxation · ${section.title}`,
      names: {
        vi: active.name,
        en: active.name,
        cn: active.name,
        jp: active.name,
        kr: active.name,
      },
      descriptions: {
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
  }, [active, activeDuration, section.title, selectedCartServiceId, displayMedia]);

  const addToCart = useCallback(() => {
    const cart = appendBookingCartItem(buildServicePayload(), 1);
    syncCart(cart);
    setNotice('Added to cart');
    window.setTimeout(() => setNotice(''), 2200);
    return cart;
  }, [buildServicePayload, syncCart]);

  const decreaseQuantity = useCallback(() => {
    const cart = removeOneBookingCartItem(selectedCartServiceId);
    syncCart(cart);
    setNotice(cart.some((item) => item.id === selectedCartServiceId) ? 'Updated cart' : 'Removed from cart');
    window.setTimeout(() => setNotice(''), 2200);
    return cart;
  }, [selectedCartServiceId, syncCart]);

  const bookNow = useCallback(() => {
    addToCart();
    router.push(`/${currentLang || 'en'}/new-user/standard/checkout`);
  }, [addToCart, currentLang, router]);

  return (
    <section className={styles.serviceSection} id={section.id}>
      <div className={styles.sectionGrid}>
        <div className={styles.mediaPane}>
          {displayMedia && <MediaPreview media={displayMedia} label={active.name} />}
        </div>

        <div className={styles.sectionContent}>

          <div className={styles.choiceBlock}>
            <div className={styles.choiceLabel}>Choose service</div>
            <div className={styles.pillGrid}>
              {section.services.map((service, index) => (
                <button
                  className={`${styles.pill} ${serviceIndex === index ? styles.pillActive : ''}`}
                  key={service.name}
                  type="button"
                  onClick={() => setServiceIndex(index)}
                >
                  {service.name}
                </button>
              ))}
            </div>
          </div>

          {hasVariants(selectedService) && (
            <div className={styles.choiceBlock}>
              <div className={styles.choiceLabel}>Choose package</div>
              <div className={styles.variantStack}>
                {selectedService.variants.map((variant, index) => (
                  <button
                    className={`${styles.variantButton} ${variantIndex === index ? styles.variantActive : ''}`}
                    key={variant.name}
                    type="button"
                    onClick={() => setVariantIndex(index)}
                  >
                    <span>{variant.name}</span>
                    <small>{variant.subtitle}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.selectedPanel}>
            <h3>{active.name}</h3>
            <p>{active.subtitle}</p>
          </div>

          <div className={styles.choiceBlock}>
            <div className={styles.choiceLabel}>Choose duration</div>
            <div className={styles.durationGrid}>
              {active.durations.map((duration, index) => (
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
              <span className={styles.priceLabel}>Selected price</span>
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
                <div className={styles.quantityStepper} aria-label={`${active.name} quantity in cart`}>
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
                  Add to cart
                </button>
              )}
              <button className={styles.primaryButton} type="button" onClick={bookNow}>
                Book now
              </button>
            </div>
          </div>

          {notice && <p className={styles.notice}>{notice}</p>}

          {active.privilege && (
            <div className={styles.privilegeCard}>
              <img src={active.privilege.image} alt={active.privilege.title} loading="lazy" />
              <div>
                <span className={styles.choiceLabel}>Privilege Included</span>
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
      ) : (section.id === 'packages' || section.id === 'package') ? (
        <div className={styles.humanTouchSection} style={{ padding: 0, border: 'none', background: 'transparent' }}>
          <div className={styles.vipStory}>
            <div className={styles.vipStoryInner}>
              <h2 className={styles.vipHeadline}>{(sectionContent as any).headline}</h2>
              <p className={styles.vipLead}>{(sectionContent as any).lead}</p>
              {(sectionContent as any).paragraphs?.map((p: string, i: number) => (
                <p key={i} className={styles.vipCopy}>{p}</p>
              ))}
              {(sectionContent as any).specialText && (
                <div className={styles.vipSpecialText}>{(sectionContent as any).specialText}</div>
              )}
            </div>
          </div>
        </div>
      ) : (section.id === 'foot-care' || section.id === 'ear-clean' || section.id === 'barber') ? (
        <div className={styles.humanTouchSection}>
          <div className={styles.humanInner}>
            <div>
              <span className={styles.humanEyebrow}>{(sectionContent as any).eyebrow}</span>
              <h2 className={styles.humanHeadline}>{(sectionContent as any).headline}</h2>
              <p className={styles.humanLead}>{(sectionContent as any).lead}</p>
              
              {(sectionContent as any).quote && (
                <div className={styles.humanQuote}>
                  {(sectionContent as any).quote}
                </div>
              )}

              {(sectionContent as any).body1 && <p className={styles.humanBodyCopy}>{(sectionContent as any).body1}</p>}
              {(sectionContent as any).body2 && <p className={styles.humanBodyCopy}>{(sectionContent as any).body2}</p>}
              {(sectionContent as any).body3 && <p className={styles.humanBodyCopy}>{(sectionContent as any).body3}</p>}

              {(sectionContent as any).chips && (sectionContent as any).chips.length > 0 && (
                <div className={styles.chipRow}>
                  {(sectionContent as any).chips.map((chip: string, i: number) => (
                    <span key={i} className={styles.chip}>{chip}</span>
                  ))}
                </div>
              )}

              <div className={styles.humanClosing}>{(sectionContent as any).closing}</div>
            </div>

            {(sectionContent as any).points && (sectionContent as any).points.length > 0 && (
              <aside className={styles.insightPanel}>
                <div className={styles.panelTitle}>{(sectionContent as any).panelTitle}</div>
                {(sectionContent as any).points.map((point: any, i: number) => (
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

const PureRelaxationPage = () => {
  const navRef = useRef<HTMLDivElement>(null);
  const [bgIndex, setBgIndex] = useState(0);

  const [contentMedia, setContentMedia] = useState<any>({});
  
  useEffect(() => {
    fetch('/api/admin/content')
      .then(res => res.json())
      .then(json => {
        if (json.success) setContentMedia(json.data.pure_relaxation_media || {});
      })
      .catch(console.error);
  }, []);

  const pureRelaxationSections = useMemo(() => getPureRelaxationSections(contentMedia), [contentMedia]);
  
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
            <PreferenceNote icon={<DoorOpen size={18} />} title="Random Room" copy="Assigned by the spa team for the smoothest flow." />
            <PreferenceNote icon={<UserRound size={18} />} title="Random Staff" copy="A suitable therapist will be arranged for your chosen ritual." />
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
