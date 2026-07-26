'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AlertModal from '@/components/Shared/AlertModal';
import OrderConfirmModal from '@/components/Checkout/OrderConfirmModal';
import PaymentModal from '@/components/Checkout/PaymentModal';
import { CATEGORIES } from '@/components/Menu/constants';
import { useMenuData } from '@/components/Menu/MenuContext';
import type { CartItem, Service, SupportedLanguage } from '@/components/Menu/types';
import { formatCurrency } from '@/components/Menu/utils';
import { getDictionary } from '@/lib/dictionaries';
import styles from './checkout-demo.module.css';

type PageParams = Promise<{ lang: string; menuType: string }>;
type ContactMethod = 'email' | 'phone';

const PHONE_COUNTRIES = [
  { lang: 'vi', code: '+84', flag: '🇻🇳', label: 'Vietnam' },
  { lang: 'en', code: '+1', flag: '🇺🇸', label: 'United States' },
  { lang: 'cn', code: '+86', flag: '🇨🇳', label: 'China' },
  { lang: 'jp', code: '+81', flag: '🇯🇵', label: 'Japan' },
  { lang: 'kr', code: '+82', flag: '🇰🇷', label: 'Korea' },
];

const phoneCountryForLang = (lang: SupportedLanguage) =>
  PHONE_COUNTRIES.find((country) => country.lang === lang) || PHONE_COUNTRIES[0];

const COPY = {
  title: { vi: 'Thông tin thanh toán', en: 'Payment Information', cn: '支付信息', jp: 'お支払い情報', kr: '결제 정보' },
  menu: { vi: 'Menu', en: 'Menu', cn: '菜单', jp: 'メニュー', kr: '메뉴' },
  customer: { vi: 'Thông tin khách hàng', en: 'Customer info', cn: '客户信息', jp: 'お客様情報', kr: '고객 정보' },
  fullName: { vi: 'Họ và tên*', en: 'Full Name*', cn: '姓名*', jp: '氏名*', kr: '이름*' },
  email: { vi: 'Email (abc@gmail.com)*', en: 'Email (abc@gmail.com)*', cn: '邮箱*', jp: 'メール*', kr: '이메일*' },
  phone: { vi: 'Số điện thoại*', en: 'Phone No.*', cn: '电话*', jp: '電話番号*', kr: '전화번호*' },
  male: { vi: 'Nam', en: 'Male', cn: '男', jp: '男性', kr: '남성' },
  female: { vi: 'Nữ', en: 'Female', cn: '女', jp: '女性', kr: '여성' },
  other: { vi: 'Khác', en: 'Other', cn: '其他', jp: 'その他', kr: '기타' },
  booking: { vi: 'Chọn lịch hẹn', en: 'Choose booking time', cn: '选择预约时间', jp: '予約日時を選択', kr: '예약 시간 선택' },
  summaryEmpty: { vi: 'Vui lòng chọn ngày và giờ', en: 'Please choose date and time', cn: '请选择日期和时间', jp: '日時を選択してください', kr: '날짜와 시간을 선택해 주세요' },
  available: { vi: 'Khung giờ khả dụng', en: 'Available time slots', cn: '可预约时间', jp: '予約可能時間', kr: '가능한 시간' },
  slotNote: { vi: 'Mỗi slot cách nhau 30 phút', en: 'Each slot is 30 minutes apart', cn: '每个时段间隔30分钟', jp: '各枠は30分間隔', kr: '각 슬롯은 30분 간격' },
  guests: { vi: 'Số khách', en: 'Guests', cn: '人数', jp: '人数', kr: '인원' },
  note: { vi: 'Ghi chú cho spa', en: 'Notes for spa', cn: '备注', jp: 'メモ', kr: '메모' },
  services: { vi: 'Chọn dịch vụ', en: 'Choose services', cn: '选择服务', jp: 'サービスを選択', kr: '서비스 선택' },
  all: { vi: 'Tất cả', en: 'All', cn: '全部', jp: 'すべて', kr: '전체' },
  bookNow: { vi: 'Book now', en: 'Book now', cn: '立即预约', jp: '今すぐ予約', kr: '바로 예약' },
  add: { vi: 'Thêm', en: 'Add', cn: '添加', jp: '追加', kr: '추가' },
  addServices: { vi: 'Mở + Add service(s)', en: 'Open + Add service(s)', cn: '打开 + 添加服务', jp: '開く + サービス追加', kr: '열기 + 서비스 추가' },
  addMoreTitle: { vi: 'Thêm dịch vụ', en: 'Add service(s)', cn: '添加服务', jp: 'サービス追加', kr: '서비스 추가' },
  invoice: { vi: 'Chi tiết hóa đơn', en: 'Invoice details', cn: '账单明细', jp: '明細', kr: '결제 내역' },
  emptyCart: { vi: 'Chưa chọn dịch vụ', en: 'No selected service', cn: '尚未选择服务', jp: 'サービスが選択されていません', kr: '선택된 서비스가 없습니다' },
  duration: { vi: 'Thời gian', en: 'Time', cn: '时长', jp: '時間', kr: '시간' },
  date: { vi: 'Ngày hẹn', en: 'Booking date', cn: '预约日期', jp: '予約日', kr: '예약 날짜' },
  time: { vi: 'Giờ hẹn', en: 'Booking time', cn: '预约时间', jp: '予約時間', kr: '예약 시간' },
  total: { vi: 'Tổng cộng', en: 'Total Bill', cn: '总计', jp: '合計', kr: '총액' },
  vat: { vi: '*Giá đã bao gồm VAT', en: '*Price includes VAT', cn: '*价格含VAT', jp: '*税込価格', kr: '*VAT 포함' },
  confirm: { vi: 'Xác nhận đặt lịch', en: 'Confirm order', cn: '确认预约', jp: '予約を確定', kr: '예약 확정' },
  selectService: { vi: 'Vui lòng chọn ít nhất 1 dịch vụ.', en: 'Please select at least 1 service.', cn: '请至少选择1项服务。', jp: 'サービスを1つ以上選択してください。', kr: '서비스를 1개 이상 선택해 주세요.' },
  showMoreTimes: { vi: 'Xem thêm', en: 'More', cn: '更多', jp: 'もっと見る', kr: '더 보기' },
  showLessTimes: { vi: 'Thu gọn', en: 'Less', cn: '收起', jp: '閉じる', kr: '접기' },
};

const COLLAPSED_TIME_SLOT_COUNT = 16;

const fallbackServices: Service[] = [
  {
    id: 'body-60',
    cat: 'Body',
    names: { vi: "Massage Body 60'", en: "Body Massage 60'" },
    descriptions: { vi: 'Nhịp lực êm, dầu thơm nhẹ, phù hợp phục hồi sau ngày dài.', en: 'Gentle rhythm, light aromatic oil, ideal after a long day.' },
    img: '/flipmenu/standalone-celestial-menu%20(2)/public/images/services/thai.png',
    priceVND: 450000,
    priceUSD: 18,
    timeValue: 60,
    timeDisplay: '60 mins',
    menuType: 'standard',
  },
  {
    id: 'hot-stone-90',
    cat: 'Body',
    names: { vi: "Đá nóng thư giãn 90'", en: "Hot Stone Relaxation 90'" },
    descriptions: { vi: 'Nhiệt đá ấm và thao tác chậm giúp thả lỏng vùng cổ vai gáy.', en: 'Warm stones and slow pressure help release neck and shoulder tension.' },
    img: '/flipmenu/standalone-celestial-menu%20(2)/public/images/services/hotstone.png',
    priceVND: 690000,
    priceUSD: 28,
    timeValue: 90,
    timeDisplay: '90 mins',
    menuType: 'standard',
  },
  {
    id: 'ear-clean',
    cat: 'Ear Clean',
    names: { vi: 'Lấy ráy tai thư giãn', en: 'Relaxing Ear Clean' },
    descriptions: { vi: 'Làm sạch nhẹ nhàng, kết hợp massage vùng tai và thái dương.', en: 'Gentle ear care with ear and temple massage.' },
    img: '/flipmenu/standalone-celestial-menu%20(2)/public/images/services/ear-clean.png',
    priceVND: 180000,
    priceUSD: 8,
    timeValue: 30,
    timeDisplay: '30 mins',
    menuType: 'standard',
  },
  {
    id: 'herbal-wash',
    cat: 'Hair Wash',
    names: { vi: 'Gội đầu thảo mộc', en: 'Herbal Hair Wash' },
    descriptions: { vi: 'Gội, xả, massage đầu cổ vai gáy với hương thảo mộc dịu.', en: 'Wash, rinse, and head-neck-shoulder massage with soft herbal scent.' },
    img: '/flipmenu/standalone-celestial-menu%20(2)/public/images/services/hair-wash.png',
    priceVND: 260000,
    priceUSD: 11,
    timeValue: 45,
    timeDisplay: '45 mins',
    menuType: 'standard',
  },
  {
    id: 'foot-reflex',
    cat: 'Foot',
    names: { vi: 'Ấn huyệt bàn chân', en: 'Foot Reflexology' },
    descriptions: { vi: 'Tập trung lòng bàn chân, bắp chân, giúp giảm mỏi khi di chuyển nhiều.', en: 'Focused foot and calf relief for tired legs.' },
    img: '/flipmenu/standalone-celestial-menu%20(2)/public/images/services/foot-massage.png',
    priceVND: 280000,
    priceUSD: 12,
    timeValue: 45,
    timeDisplay: '45 mins',
    menuType: 'standard',
  },
  {
    id: 'facial-ritual',
    cat: 'Facial',
    names: { vi: 'Facial Ritual', en: 'Facial Ritual' },
    descriptions: { vi: 'Làm sạch, massage nâng cơ nhẹ và cấp ẩm cho làn da mệt mỏi.', en: 'Cleanse, gentle lifting massage, and hydration for tired skin.' },
    img: '/flipmenu/standalone-celestial-menu%20(2)/public/images/services/facial.png',
    priceVND: 520000,
    priceUSD: 21,
    timeValue: 60,
    timeDisplay: '60 mins',
    menuType: 'standard',
  },
];

const t = (key: keyof typeof COPY, lang: string) => (COPY[key] as Record<string, string>)[lang] || COPY[key].en;
const langKey = (lang: string): SupportedLanguage =>
  ['vi', 'en', 'cn', 'jp', 'kr'].includes(lang) ? (lang as SupportedLanguage) : 'en';

const localISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const displayDate = (iso: string) => {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
};

const nextDates = (count = 7) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return localISODate(date);
  });
};

const buildTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 9; hour <= 22; hour += 1) {
    slots.push(`${String(hour).padStart(2, '0')}:00`);
    if (hour < 22) slots.push(`${String(hour).padStart(2, '0')}:30`);
  }
  return slots;
};

const busySlotsForDate = (iso: string) => {
  const day = Number(iso.slice(-2));
  const patterns = [
    ['10:00', '10:30', '15:00', '18:00', '18:30'],
    ['09:30', '11:30', '14:00', '17:30', '20:30'],
    ['12:00', '12:30', '16:30', '19:00'],
    ['09:00', '13:30', '14:00', '19:30', '21:00'],
  ];
  return patterns[day % patterns.length];
};

const serviceName = (service: Service | CartItem, lang: string) =>
  service.names?.[langKey(lang)] || service.names?.en || service.id;

const serviceDescription = (service: Service, lang: string) =>
  service.descriptions?.[langKey(lang)] || service.descriptions?.en || '';

const resolveServiceMedia = (service: Service) => {
  // Ưu tiên dùng media_url / media_type từ DB (admin đã upload)
  if (service.media_type === 'video' && service.media_url) {
    return {
      type: 'video' as const,
      src: service.media_url,
      poster: service.img || service.poster || service.thumbnail,
      alt: serviceName(service, 'en'),
      start: 0,
      end: 9999,
    };
  }

  if (service.media_url) {
    return {
      type: 'image' as const,
      src: service.media_url,
      poster: service.media_url,
      alt: serviceName(service, 'en'),
      start: 0,
      end: 0,
    };
  }

  // Fallback: hiển thị ảnh mặc định, KHÔNG dùng video hardcoded
  return {
    type: 'image' as const,
    src: service.img || 'https://placehold.co/300x200?text=SPA',
    poster: service.img || 'https://placehold.co/300x200?text=SPA',
    alt: serviceName(service, 'en'),
    start: 0,
    end: 0,
  };
};

const seekServiceClipStart = (video: HTMLVideoElement, start: number, end: number) => {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return;
  const safeStart = Math.min(Math.max(0, start), Math.max(0, video.duration - 0.25));
  const safeEnd = Math.min(Math.max(safeStart + 0.5, end), video.duration);
  video.dataset.clipStart = String(safeStart);
  video.dataset.clipEnd = String(safeEnd);
  if (Math.abs(video.currentTime - safeStart) > 0.2) video.currentTime = safeStart;
};

const CheckoutVideoThumbnail = ({ media, onVideoPreview }: { media: any, onVideoPreview?: any }) => {
  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <div className={styles.serviceMedia} style={{ position: 'relative', overflow: 'hidden' }}>
      <video
        className={styles.serviceMedia}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        src={media.src}
        poster={media.poster}
        muted
        autoPlay
        playsInline
        preload="metadata"
        aria-label={media.alt}
        data-clip-start={media.start}
        data-clip-end={media.end}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onVideoPreview?.(media);
        }}
        onLoadedMetadata={(event) => seekServiceClipStart(event.currentTarget, media.start, media.end)}
        onCanPlay={(event) => {
          setIsLoading(false);
          event.currentTarget.play().catch(() => undefined);
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          const start = Number(video.dataset.clipStart || media.start);
          const end = Number(video.dataset.clipEnd || media.end);
          if (Number.isFinite(end) && video.currentTime >= end) {
            video.currentTime = Number.isFinite(start) ? start : 0;
            video.play().catch(() => undefined);
          }
        }}
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.7)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}
    </div>
  );
};

const renderCheckoutServiceMedia = (
  service: Service,
  onVideoPreview?: (media: ReturnType<typeof resolveServiceMedia>) => void
) => {
  const media = resolveServiceMedia(service);

  if (media.type !== 'video') {
    return (
      <img
        className={styles.serviceMedia}
        src={media.src}
        alt={serviceName(service, 'en')}
        onError={(event) => { event.currentTarget.src = 'https://placehold.co/172x116?text=SPA'; }}
      />
    );
  }

  return <CheckoutVideoThumbnail media={media} onVideoPreview={onVideoPreview} />;
};

const categoryName = (categoryId: string, lang: string) => {
  const category = CATEGORIES.find((item) => item.id === categoryId);
  return category?.names?.[langKey(lang)] || category?.names?.en || categoryId;
}

const DurationDrawer = ({
  group,
  isOpen,
  onClose,
  onConfirm,
  lang,
  dict,
}: {
  group: Service[] | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (service: Service) => void;
  lang: SupportedLanguage;
  dict: any;
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');

  useEffect(() => {
    if (group && group.length > 0) {
      setSelectedVariantId(group[0].id);
    }
  }, [group]);

  if (!group || group.length === 0) return null;

  const selectedVariant = group.find((v) => v.id === selectedVariantId) || group[0];

  return (
    <>
      <div 
        className={`${styles.drawerBackdrop} ${isOpen ? styles.drawerShow : ''}`} 
        onClick={onClose}
        role="presentation"
      />
      <section 
        className={`${styles.durationDrawer} ${isOpen ? styles.drawerShow : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.drawerHandle}></div>
        <div className={styles.drawerHead}>
          <div 
            className={styles.drawerThumb} 
            style={{ 
              backgroundImage: `url('${group[0].img || '/images/placeholders/service-placeholder.jpg'}')` 
            }}
          />
          <div>
            <h2 className={styles.drawerTitle}>{serviceName(group[0], lang)}</h2>
            <div className={styles.drawerSub}>{serviceDescription(group[0], lang)}</div>
          </div>
          <button className={styles.drawerClose} onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <div className={styles.drawerBody}>
          <div className={styles.drawerLabel}>{dict.checkout?.chooseDuration || 'Chọn thời lượng phù hợp'}</div>
          <div className={styles.drawerOptions}>
            {group.map((v) => (
              <button
                key={v.id}
                className={`${styles.drawerOption} ${v.id === selectedVariantId ? styles.drawerOptionActive : ''}`}
                onClick={() => setSelectedVariantId(v.id)}
              >
                <span>{v.timeValue} {dict.checkout?.mins || 'mins'}</span>
                <strong>{formatCurrency(v.priceVND)} {lang === 'vi' ? 'đ' : 'VND'}</strong>
              </button>
            ))}
          </div>
          <div className={styles.drawerFooter}>
            <div className={styles.drawerSelection}>
              {dict.checkout?.yourSelection || 'Lựa chọn của bạn'}
              <strong>
                {selectedVariant.timeValue} {dict.checkout?.mins || 'mins'} · {formatCurrency(selectedVariant.priceVND)} {lang === 'vi' ? 'đ' : 'VND'}
              </strong>
            </div>
            <button 
              className={styles.drawerConfirm} 
              onClick={() => onConfirm(selectedVariant)}
            >
              {dict.checkout?.addToCart || 'THÊM VÀO GIỎ'}
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

const CheckoutGroupedServiceCard = ({
  group,
  lang,
  dict,
  addService,
  openDurationDrawer,
  openVideoPreview,
}: {
  group: Service[];
  lang: SupportedLanguage;
  dict: any;
  addService: (service: Service) => void;
  openDurationDrawer: (group: Service[]) => void;
  openVideoPreview: (media: any) => void;
}) => {
  const selectedVariant = group[0];

  return (
    <article className={styles.pickerServiceCard}>
      {renderCheckoutServiceMedia(selectedVariant, openVideoPreview)}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
        <h3>{serviceName(selectedVariant, lang)}</h3>
        <p>{serviceDescription(selectedVariant, lang)}</p>
        <div className={styles.serviceMeta} style={{ marginTop: '0.5rem', flexWrap: 'wrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {group.length > 1 ? (
            <>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9b978e' }}>Từ</span>
              <strong>{formatCurrency(group[0].priceVND)} {lang === 'vi' ? 'đ' : 'VND'}</strong>
              <span style={{ fontSize: '11px', color: '#b29e5d', marginLeft: 'auto' }}>{group.length} lựa chọn</span>
            </>
          ) : (
            <>
              <span>{selectedVariant.timeValue} {dict.checkout?.mins || 'mins'}</span>
              <strong>{formatCurrency(selectedVariant.priceVND)} {lang === 'vi' ? 'đ' : 'VND'}</strong>
            </>
          )}
        </div>
      </div>
      <button 
        type="button" 
        className={styles.pickerAddButton} 
        onClick={() => {
          if (group.length > 1) {
            openDurationDrawer(group);
          } else {
            addService(selectedVariant);
          }
        }} 
        aria-label={`${t('add', lang)} ${serviceName(selectedVariant, lang)}`}
        style={{ alignSelf: 'center', minWidth: '80px' }}
      >
        <Plus size={17} />
        <span>{t('add', lang)}</span>
      </button>
    </article>
  );
};

export default function CheckoutPage({ params }: { params: PageParams }) {
  const router = useRouter();
  const { lang: rawLang, menuType: rawMenuType } = use(params);
  const lang = langKey(rawLang);
  const menuType = rawMenuType === 'vip' ? 'vip' : 'standard';
  const dict = getDictionary(lang);
  const { services, cart, addToCart } = useMenuData();

  const [contactMethod, setContactMethod] = useState<ContactMethod>('email');
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', gender: t('male', lang) });
  const [phoneCountry, setPhoneCountry] = useState(() => phoneCountryForLang(lang));
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isTimeExpanded, setIsTimeExpanded] = useState(false);
  const [bookingDate, setBookingDate] = useState(() => localISODate(new Date()));
  const [bookingTime, setBookingTime] = useState('');
  const [note, setNote] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isServicePickerOpen, setIsServicePickerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [changeDenominations, setChangeDenominations] = useState<number[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [videoPreview, setVideoPreview] = useState<ReturnType<typeof resolveServiceMedia> | null>(null);
  const [isVideoPreviewClosing, setIsVideoPreviewClosing] = useState(false);
  const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ isOpen: false, message: '' });
  const [activeDrawerGroup, setActiveDrawerGroup] = useState<Service[] | null>(null);

  const dateOptions = useMemo(() => nextDates(), []);
  const allSlots = useMemo(() => buildTimeSlots(), []);
  const busySlots = useMemo(() => busySlotsForDate(bookingDate), [bookingDate]);
  const availableSlots = useMemo(() => allSlots.filter((slot) => !busySlots.includes(slot)), [allSlots, busySlots]);

  useEffect(() => {
    if (!bookingTime || busySlots.includes(bookingTime)) {
      setBookingTime(availableSlots[0] || '');
    }
  }, [availableSlots, bookingTime, busySlots]);

  useEffect(() => {
    setPhoneCountry(phoneCountryForLang(lang));
  }, [lang]);

  useEffect(() => {
    if (window.location.hash === '#cart') {
      window.requestAnimationFrame(() => document.getElementById('cart')?.scrollIntoView({ block: 'start' }));
    }
  }, []);

  useEffect(() => {
    if (!isServicePickerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsServicePickerOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isServicePickerOpen]);

  useEffect(() => {
    if (!videoPreview) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeVideoPreview();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoPreview]);

  const apiServices = useMemo(
    () => services.filter((service) => !service.menuType || service.menuType === menuType),
    [services, menuType]
  );

  const serviceOptions = useMemo(
    () => (apiServices.length ? apiServices : fallbackServices.filter((service) => service.menuType === menuType)),
    [apiServices, menuType]
  );

  const categoryIds = useMemo(
    () => Array.from(new Set(serviceOptions.map((service) => service.cat).filter(Boolean))),
    [serviceOptions]
  );

  const visibleServices = useMemo(
    () => activeCategory === 'all'
      ? serviceOptions
      : serviceOptions.filter((service) => service.cat === activeCategory),
    [activeCategory, serviceOptions]
  );

  const groupedVisibleServices = useMemo(() => {
    return Object.values(
      visibleServices.reduce((acc, service) => {
        const baseNameEn = service.names?.en?.trim().toLowerCase() || service.id;
        if (!acc[baseNameEn]) acc[baseNameEn] = [];
        acc[baseNameEn].push(service);
        return acc;
      }, {} as Record<string, Service[]>)
    );
  }, [visibleServices]);

  const openVideoPreview = (media: ReturnType<typeof resolveServiceMedia>) => {
    setIsVideoPreviewClosing(false);
    setVideoPreview(media);
  };

  const closeVideoPreview = () => {
    setIsVideoPreviewClosing(true);
    window.setTimeout(() => {
      setVideoPreview(null);
      setIsVideoPreviewClosing(false);
    }, 240);
  };

  const totalVND = useMemo(() => cart.reduce((sum, item) => sum + item.priceVND * item.qty, 0), [cart]);
  const totalUSD = useMemo(() => cart.reduce((sum, item) => sum + item.priceUSD * item.qty, 0), [cart]);
  const visibleTimeSlots = isTimeExpanded ? allSlots : allSlots.slice(0, COLLAPSED_TIME_SLOT_COUNT);
  const hasMoreTimeSlots = allSlots.length > COLLAPSED_TIME_SLOT_COUNT;

  const updateCustomer = (field: keyof typeof customerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  };

  const updateContact = (value: string) => {
    updateCustomer(contactMethod, value);
  };

  const currentContactValue = contactMethod === 'email' ? customerInfo.email : customerInfo.phone;
  const genderOptions = [t('male', lang), t('female', lang), t('other', lang)];

  const addService = (service: Service, jumpToCart = false) => {
    addToCart(service, 1);
    if (jumpToCart) {
      window.requestAnimationFrame(() => document.getElementById('cart')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const validate = () => {
    if (cart.length === 0) {
      setAlertState({ isOpen: true, message: t('selectService', lang), type: 'error' });
      return false;
    }
    if (!customerInfo.name.trim()) {
      setAlertState({ isOpen: true, message: dict.checkout.alerts?.fill_name || 'Please enter your Full Name', type: 'error' });
      return false;
    }
    if (!customerInfo.email.trim() && !customerInfo.phone.trim()) {
      setAlertState({ isOpen: true, message: dict.checkout.alerts?.fill_phone_or_email || 'Please enter Phone Number or Email', type: 'error' });
      return false;
    }
    return true;
  };

  const handleConfirmOrder = () => {
    if (!validate()) return;
    setIsPaymentModalOpen(true);
  };

  const handlePaymentNext = (data: { paymentMethod: string; amountPaid: string; changeDenominations: number[] }) => {
    setPaymentMethod(data.paymentMethod);
    setAmountPaid(data.amountPaid);
    setChangeDenominations(data.changeDenominations);
    setIsPaymentModalOpen(false);
    window.setTimeout(() => setIsConfirmOpen(true), 220);
  };

  const handleFinalSubmit = async () => {
    const rawPhone = customerInfo.phone.trim();
    const phoneWithCountry = rawPhone
      ? rawPhone.startsWith('+')
        ? rawPhone
        : `${phoneCountry.code}${rawPhone.replace(/^0+/, '')}`
      : '';

    const selectedServices = cart.map((item) => ({
      variantId: item.id,
      name: serviceName(item, lang),
      duration: item.timeValue,
      priceVND: item.priceVND,
      quantity: item.qty,
      options: item.options || {},
    }));

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: customerInfo.name,
        phone: phoneWithCountry,
        email: customerInfo.email,
        note,
        date: bookingDate,
        time: bookingTime,
        branchId: 'ngan-ha-spa',
        branchName: 'ORIARETREAT Spa',
        guests: 1,
        staffGender: 'any',
        lang,
        selectedServices,
        paymentMethod,
        amountPaid: parseInt(amountPaid.replace(/\./g, '') || '0', 10),
        changeDenominations,
      }),
    });

    const data = await response.json();
    if (!response.ok || data?.success === false) {
      throw new Error(data?.error || 'Failed to submit booking');
    }
    return data?.data?.bookingId || data?.bookingId;
  };

  return (
    <div className={styles.page}>
      <div className={styles.nebula} />
      <div className={styles.stars} />

      <header className={styles.topbar}>
        <button className={styles.back} type="button" onClick={() => router.push('/#services')}>
          <ChevronLeft size={18} />
          <span>{t('menu', lang)}</span>
        </button>
        <h1>{t('title', lang)}</h1>
      </header>

      <div className={styles.brandline}>
        <div className={styles.mark}>ORIARETREAT Spa</div>
        <div className={styles.divider} />
      </div>

      <main className={styles.stage}>
        <div className={styles.grid}>
          <div className={styles.stack}>
            <section className={styles.panel}>
              <p className={styles.eyebrow}>{t('customer', lang)}</p>

              <div className={styles.fieldRow}>
                <label className={styles.field} style={{ flex: 2 }}>
                  <input
                    value={customerInfo.name}
                    onChange={(event) => updateCustomer('name', event.target.value)}
                    placeholder={t('fullName', lang)}
                  />
                </label>
                <div className={`${styles.field} ${styles.genderField} ${isGenderOpen ? styles.genderOpen : ''}`}>
                  <button
                    type="button"
                    className={styles.genderTrigger}
                    onClick={() => setIsGenderOpen((open) => !open)}
                    aria-haspopup="listbox"
                    aria-expanded={isGenderOpen}
                    aria-label="Gender"
                  >
                    <span>{customerInfo.gender}</span>
                    <span className={styles.genderChevron}>⌄</span>
                  </button>
                  <div className={styles.genderMenu} role="listbox">
                    {genderOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`${styles.genderOption} ${customerInfo.gender === option ? styles.genderOptionActive : ''}`}
                        onClick={() => {
                          updateCustomer('gender', option);
                          setIsGenderOpen(false);
                        }}
                        role="option"
                        aria-selected={customerInfo.gender === option}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.togglePair}>
                <button
                  type="button"
                  className={contactMethod === 'email' ? styles.activeTab : ''}
                  onClick={() => setContactMethod('email')}
                >
                  Email
                </button>
                <button
                  type="button"
                  className={contactMethod === 'phone' ? styles.activeTab : ''}
                  onClick={() => setContactMethod('phone')}
                >
                  {lang === 'vi' ? 'Số điện thoại' : 'Phone No.'}
                </button>
              </div>

              {contactMethod === 'phone' ? (
                <label className={`${styles.field} ${styles.phoneField}`}>
                  <select
                    className={styles.phoneCountry}
                    value={phoneCountry.code}
                    onChange={(event) => {
                      const nextCountry = PHONE_COUNTRIES.find((country) => country.code === event.target.value);
                      if (nextCountry) setPhoneCountry(nextCountry);
                    }}
                    aria-label="Phone country code"
                  >
                    {PHONE_COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <span className={styles.phoneDivider} aria-hidden="true" />
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(event) => updateContact(event.target.value)}
                    placeholder={t('phone', lang)}
                  />
                </label>
              ) : (
                <label className={styles.field}>
                  <input
                    type="email"
                    value={currentContactValue}
                    onChange={(event) => updateContact(event.target.value)}
                    placeholder={t('email', lang)}
                  />
                </label>
              )}

              <div className={styles.bookingBlock}>
                <div className={styles.bookingHeading}>
                  <div className={styles.bookingTitle}>{t('booking', lang)}</div>
                  <div className={styles.bookingSummary}>
                    {bookingDate && bookingTime ? `${displayDate(bookingDate)} · ${bookingTime}` : t('summaryEmpty', lang)}
                  </div>
                </div>

                <div className={styles.dateScroller} aria-label={t('booking', lang)}>
                  {dateOptions.map((iso, index) => {
                    const date = new Date(`${iso}T00:00:00`);
                    return (
                      <button
                        key={iso}
                        type="button"
                        className={`${styles.dateChip} ${bookingDate === iso ? styles.selectedDate : ''}`}
                        onClick={() => setBookingDate(iso)}
                      >
                        <span className={styles.dow}>
                          {index === 0 ? (lang === 'vi' ? 'Hôm nay' : 'Today') : date.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' })}
                        </span>
                        <span className={styles.day}>{date.getDate()}</span>
                        <span className={styles.month}>{lang === 'vi' ? `Tháng ${date.getMonth() + 1}` : date.getMonth() + 1}</span>
                      </button>
                    );
                  })}
                </div>

                <div className={styles.timeLabelRow}>
                  <strong>{t('available', lang)}</strong>
                  <span className={styles.slotLegend}>{t('slotNote', lang)}</span>
                </div>

                <div className={styles.timeSlots}>
                  {visibleTimeSlots.map((slot) => {
                    const disabled = busySlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={disabled}
                        className={`${styles.timeSlot} ${bookingTime === slot ? styles.selectedTime : ''}`}
                        onClick={() => setBookingTime(slot)}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                {hasMoreTimeSlots && (
                  <button
                    type="button"
                    className={`${styles.timeExpandButton} ${isTimeExpanded ? styles.timeExpanded : ''}`}
                    onClick={() => setIsTimeExpanded((expanded) => !expanded)}
                    aria-expanded={isTimeExpanded}
                  >
                    <span>{isTimeExpanded ? t('showLessTimes', lang) : t('showMoreTimes', lang)}</span>
                    <ChevronDown size={16} />
                  </button>
                )}

                <div className={styles.noteOnly}>
                  <label className={styles.field}>
                    <input
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder={t('note', lang)}
                    />
                  </label>
                </div>
              </div>
            </section>

          </div>

          <aside className={styles.panel} id="cart">
            <p className={styles.eyebrow}>{t('invoice', lang)}</p>

            {cart.length ? (
              cart.map((item, index) => (
                <article key={item.cartId} className={styles.invoiceItem}>
                  <div className={styles.invoiceRow1}>
                    <span>{index + 1}. {serviceName(item, lang)}</span>
                    <span>{formatCurrency(item.priceVND * item.qty)} VNĐ</span>
                  </div>
                  <div className={styles.detail}>
                    <span>{t('duration', lang)}</span>
                    <strong>{item.timeValue} {dict.checkout.mins || 'mins'}</strong>
                  </div>
                  <div className={styles.detail}>
                    <span>{t('date', lang)}</span>
                    <strong>{displayDate(bookingDate)}</strong>
                  </div>
                  <div className={styles.detail}>
                    <span>{t('time', lang)}</span>
                    <strong>{bookingTime}</strong>
                  </div>
                </article>
              ))
            ) : (
              <div className={styles.emptyCart}>{t('emptyCart', lang)}</div>
            )}

            <button type="button" className={styles.addServicesSlot} onClick={() => setIsServicePickerOpen(true)}>
              <span className={styles.addServicesIcon}><Plus size={18} /></span>
              <span>{t('addServices', lang)}</span>
            </button>

            <div className={styles.dividerLine} />
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>{t('total', lang)}</span>
              <span className={styles.amount}>{formatCurrency(totalVND)} VNĐ</span>
            </div>
            <div className={styles.vatNote}>{t('vat', lang)}</div>

            <button className={styles.primaryButton} type="button" disabled={cart.length === 0} onClick={handleConfirmOrder}>
              {t('confirm', lang)}
            </button>
          </aside>
        </div>
      </main>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onNext={handlePaymentNext}
        lang={lang}
        dict={dict}
        totalVND={totalVND}
        totalUSD={totalUSD}
      />

      <OrderConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleFinalSubmit}
        lang={lang}
        dict={dict}
        cart={cart}
        customerInfo={customerInfo}
        paymentMethod={paymentMethod}
        amountPaid={parseInt(amountPaid.replace(/\./g, '') || '0', 10)}
      />

      <AlertModal
        isOpen={alertState.isOpen}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState((prev) => ({ ...prev, isOpen: false }))}
        lang={lang}
      />

      <DurationDrawer
        group={activeDrawerGroup}
        isOpen={!!activeDrawerGroup}
        onClose={() => setActiveDrawerGroup(null)}
        onConfirm={(service) => {
          addService(service);
        }}
        lang={lang}
        dict={dict}
      />

      {videoPreview?.type === 'video' && (
        <div
          className={`${styles.videoPreviewOverlay} ${isVideoPreviewClosing ? styles.videoPreviewClosing : ''}`}
          role="presentation"
          onMouseDown={closeVideoPreview}
        >
          <section
            className={styles.videoPreviewStage}
            role="dialog"
            aria-modal="true"
            aria-label={videoPreview.alt}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className={styles.videoPreviewClose} onClick={closeVideoPreview} aria-label="Close video">
              <X size={24} />
            </button>
            <video
              className={styles.videoPreviewPlayer}
              src={videoPreview.src}
              poster={videoPreview.poster}
              controls
              autoPlay
              playsInline
              preload="metadata"
              onLoadedMetadata={(event) => {
                event.currentTarget.currentTime = 0;
                event.currentTarget.play().catch(() => undefined);
              }}
              onEnded={closeVideoPreview}
            />
          </section>
        </div>
      )}

      {isServicePickerOpen && (
        <div className={styles.servicePickerOverlay} role="presentation" onMouseDown={() => setIsServicePickerOpen(false)}>
          <section
            className={styles.servicePicker}
            role="dialog"
            aria-modal="true"
            aria-label={t('addMoreTitle', lang)}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.servicePickerHeader}>
              <div>
                <p className={styles.eyebrow}>{t('services', lang)}</p>
                <h2>{t('addMoreTitle', lang)}</h2>
              </div>
              <button type="button" className={styles.servicePickerClose} onClick={() => setIsServicePickerOpen(false)} aria-label="Close">
                <X size={22} />
              </button>
            </header>

            <div className={styles.servicePickerTabs}>
              <button
                type="button"
                className={activeCategory === 'all' ? styles.activeTab : ''}
                onClick={() => setActiveCategory('all')}
              >
                {t('all', lang)}
              </button>
              {categoryIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={activeCategory === id ? styles.activeTab : ''}
                  onClick={() => setActiveCategory(id)}
                >
                  {categoryName(id, lang)}
                </button>
              ))}
            </div>

            <div className={styles.servicePickerList}>
              {groupedVisibleServices.map((group) => (
                <CheckoutGroupedServiceCard
                  key={group[0].id}
                  group={group}
                  lang={lang}
                  dict={dict}
                  addService={addService}
                  openDurationDrawer={setActiveDrawerGroup}
                  openVideoPreview={openVideoPreview}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
