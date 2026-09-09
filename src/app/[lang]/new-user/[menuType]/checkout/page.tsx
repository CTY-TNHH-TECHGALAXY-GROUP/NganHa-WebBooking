'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, Minus, Plus, X, Edit2, Edit3, Trash2, Calendar, RotateCcw, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SmartLogo from '@/components/SmartLogo';
import AlertModal from '@/components/Shared/AlertModal';
import OrderConfirmModal from '@/components/Checkout/OrderConfirmModal';
import CustomForYouModal from '@/components/CustomForYou';
import { CustomPreferences } from '@/components/CustomForYou/types';
import { CATEGORIES } from '@/components/Menu/constants';
import { useMenuData } from '@/components/Menu/MenuContext';
import type { CartItem, Service, SupportedLanguage } from '@/components/Menu/types';
import { formatCurrency } from '@/components/Menu/utils';
import { getDictionary } from '@/lib/dictionaries';
import { useTranslation } from '@/components/TranslationProvider';
import styles from './checkout-demo.module.css';

type PageParams = Promise<{ lang: string; menuType: string }>;
type ContactMethod = 'email' | 'phone';

import { PHONE_COUNTRIES } from '@/lib/countryCodes';

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
  addServices: { vi: 'Mở + Thêm dịch vụ', en: 'Open + Add service(s)', cn: '打开 + 添加服务', jp: '開く + サービス追加', kr: '열기 + 서비스 추가' },
  addMoreTitle: { vi: 'Thêm dịch vụ', en: 'Add service(s)', cn: '添加服务', jp: 'サービス追加', kr: '서비스 추가' },
  invoice: { vi: 'Chi tiết hóa đơn', en: 'Invoice details', cn: '账单明细', jp: '明細', kr: '결제 내역' },
  emptyCart: { vi: 'Chưa chọn dịch vụ', en: 'No selected service', cn: '尚未选择服务', jp: 'サービスが選択されていません', kr: '선택된 서비스가 없습니다' },
  duration: { vi: 'Thời gian', en: 'Time', cn: '时长', jp: '時間', kr: '시간' },
  date: { vi: 'Ngày hẹn', en: 'Booking date', cn: '预约日期', jp: '予約日', kr: '예약 날짜' },
  time: { vi: 'Giờ hẹn', en: 'Booking time', cn: '预约时间', jp: '予約時間', kr: '예약 시간' },
  total: { vi: 'Tổng cộng', en: 'Total Bill', cn: '总计', jp: '合計', kr: '총액' },
  vat: { vi: '*Giá đã bao gồm VAT', en: '*Price includes VAT', cn: '*价格含VAT', jp: '*税込価格', kr: '*VAT 포함' },
  confirm: { vi: 'Xác nhận đặt lịch', en: 'Confirm order', cn: '确认预约', jp: '予約を確定', kr: '예약 확정' },
  select: { vi: 'Chọn', en: 'Select', cn: '选择', jp: '選択', kr: '선택' },
  edit: { vi: 'Sửa', en: 'Edit', cn: '编辑', jp: '編集', kr: '편집' },
  remove: { vi: 'Xóa', en: 'Remove', cn: '删除', jp: '削除', kr: '삭제' },
  selectService: { vi: 'Vui lòng chọn ít nhất 1 dịch vụ.', en: 'Please select at least 1 service.', cn: '请至少选择1项服务。', jp: 'サービスを1つ以上選択してください。', kr: '서비스를 1개 이상 선택해 주세요.' },
  showMoreTimes: { vi: 'Xem thêm', en: 'More', cn: '更多', jp: 'もっと見る', kr: '더 보기' },
  showLessTimes: { vi: 'Thu gọn', en: 'Less', cn: '收起', jp: '閉じる', kr: '접기' },
  back: { vi: 'Quay lại', en: 'Back', cn: '返回', jp: '戻る', kr: '뒤로가기' },
  openCalendar: { vi: 'Mở lịch chọn ngày bất kỳ', en: 'Open calendar to pick date', cn: '打开日历选择日期', jp: 'カレンダーを開く', kr: '달력 열기' },
  resetToday: { vi: 'Quay về ngày hôm nay', en: 'Reset to today', cn: '回到今天', jp: '今日に戻る', kr: '오늘로 가기' },
  pickAnotherDate: { vi: 'Mở lịch chọn ngày khác', en: 'Pick a date from calendar', cn: '从日历选择其他日期', jp: '別の日付を選択', kr: '다른 날짜 선택' },
  more: { vi: 'Ngày khác', en: 'More', cn: '更多', jp: 'もっと見る', kr: '더보기' },
  selectTime: { vi: 'Chưa chọn giờ', en: 'Select time', cn: '选择时间', jp: '時間を選択', kr: '시간 선택' },
  editService: { vi: 'Chỉnh sửa dịch vụ', en: 'Edit service', cn: '修改服务', jp: 'サービス編集', kr: '서비스 수정' },
  service: { vi: 'Dịch vụ', en: 'Service', cn: '服务', jp: 'サービス', kr: '서비스' },
  updatedPrice: { vi: 'Giá cập nhật', en: 'Updated price', cn: '更新后价格', jp: '更新後の価格', kr: '업데이트된 가격' },
  additionalNotes: { vi: 'Ghi chú thêm...', en: 'Additional notes...', cn: '补充备注...', jp: '追加メモ...', kr: '추가 메모...' },
  save: { vi: 'Lưu', en: 'Save', cn: '保存', jp: '保存', kr: '저장' },
  fromPrice: { vi: 'Từ', en: 'From', cn: '起', jp: '〜', kr: '~' },
  optionsCount: { vi: 'lựa chọn', en: 'options', cn: '个选项', jp: 'つの選択肢', kr: '개 옵션' },
  loadingServices: { vi: 'Đang tải dịch vụ...', en: 'Loading services...', cn: '正在加载服务...', jp: 'サービスを読み込み中...', kr: '서비스를 불러오는 중...' },
  noServicesFound: { vi: 'Chưa có dịch vụ phù hợp.', en: 'No matching services found.', cn: '没有找到匹配的服务。', jp: '該当するサービスが見つかりません。', kr: '해당하는 서비스가 없습니다.' },
  close: { vi: 'Đóng', en: 'Close', cn: '关闭', jp: '閉じる', kr: '닫기' },
  chooseDuration: { vi: 'Chọn thời lượng phù hợp', en: 'Choose suitable duration', cn: '选择合适的时长', jp: '適切な時間を選択', kr: '적합한 시간을 선택하세요' },
  yourSelection: { vi: 'Lựa chọn của bạn', en: 'Your selection', cn: '您的选择', jp: 'あなたの選択', kr: '선택 항목' },
  quantity: { vi: 'Số lượng', en: 'Quantity', cn: '数量', jp: '数量', kr: '수량' },
  selectedServices: { vi: 'dịch vụ đã chọn', en: 'service(s) selected', cn: '项服务已选择', jp: '件のサービスを選択', kr: '개 서비스 선택됨' },
  selectedOptions: { vi: 'Lựa chọn đã thêm', en: 'Selected options', cn: '已添加的选项', jp: '追加済みの選択', kr: '추가한 옵션' },
  addAnotherOption: { vi: 'Thêm lựa chọn khác', en: 'Add another option', cn: '添加其他选项', jp: '別のオプションを追加', kr: '다른 옵션 추가' },
  gender: { vi: 'Giới tính', en: 'Gender', cn: '性别', jp: '性別', kr: '성별' },
  cartRevalUnavailable: {
    vi: 'Một số dịch vụ trong giỏ hàng đã ngừng hoạt động và được tự động cập nhật lại.',
    en: 'Some unavailable services were refreshed or removed from your cart.',
    cn: '购物车中的部分不可用服务已自动更新。',
    jp: 'ご利用いただけない一部のサービスがカートから自動更新されました。',
    kr: '장바구니의 일부 이용 불가 서비스가 자동으로 업데이트되었습니다.',
  },
  cartRevalPrice: {
    vi: 'Giá một số dịch vụ trong giỏ hàng đã được đồng bộ chuẩn xác từ hệ thống.',
    en: 'Your cart pricing has been refreshed with current system rates.',
    cn: '购物车价格已根据系统最新费率更新。',
    jp: 'カート内の料金が最新のシステム料金に更新されました。',
    kr: '장바구니의 서비스 가격이 시스템 최신 요금으로 갱신되었습니다.',
  },
  timeRequired: { vi: 'Vui lòng chọn giờ hẹn còn khả dụng.', en: 'Please choose an available booking time.', cn: '请选择可用的预约时间。', jp: '利用可能な予約時間を選択してください。', kr: '예약 가능한 시간을 선택해 주세요.' },
  reviewCart: { vi: 'Giá hoặc dịch vụ đã thay đổi. Vui lòng kiểm tra lại giỏ hàng trước khi xác nhận.', en: 'A price or service changed. Please review your cart before confirming.', cn: '价格或服务已发生变化，请确认购物车后再提交。', jp: '料金またはサービスが変更されました。カートを確認してから確定してください。', kr: '가격 또는 서비스가 변경되었습니다. 확인 전에 장바구니를 검토해 주세요.' },
  temporaryUnavailable: { vi: 'Hệ thống đang bận. Thông tin của bạn và giỏ hàng vẫn được giữ lại, vui lòng thử lại.', en: 'The booking system is temporarily unavailable. Your details and cart are kept; please try again.', cn: '预约系统暂时不可用，您的信息和购物车已保留，请稍后重试。', jp: '予約システムが一時的に利用できません。入力内容とカートは保持されています。もう一度お試しください。', kr: '예약 시스템을 잠시 사용할 수 없습니다. 입력 내용과 장바구니는 보존됩니다. 다시 시도해 주세요.' },
  submitTimeout: { vi: 'Kết nối hết thời gian. Thông tin của bạn và giỏ hàng vẫn được giữ lại, vui lòng thử lại.', en: 'The request timed out. Your details and cart are kept; please try again.', cn: '请求超时，您的信息和购物车已保留，请重试。', jp: '接続がタイムアウトしました。入力内容とカートは保持されています。もう一度お試しください。', kr: '요청 시간이 초과되었습니다. 입력 내용과 장바구니는 보존됩니다. 다시 시도해 주세요.' },
};

const COLLAPSED_TIME_SLOT_COUNT = 16;
const SPA_TIME_ZONE = 'Asia/Ho_Chi_Minh';


const t = (key: keyof typeof COPY, lang: string) => (COPY[key] as Record<string, string>)[lang] || COPY[key].en;
const langKey = (lang: string): SupportedLanguage =>
  ['vi', 'en', 'cn', 'jp', 'kr'].includes(lang) ? (lang as SupportedLanguage) : 'en';

const getSpaDateTime = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SPA_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value])) as Record<string, string>;
};

const spaTodayISO = () => {
  const parts = getSpaDateTime();
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const localISODate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysToISO = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return localISODate(date);
};

const translatePart = (key: string, lang: string) => {
  const map: Record<string, any> = {
    HEAD: { vi: 'Đầu', en: 'Head', jp: '頭', kr: '머리', cn: '头' },
    NECK: { vi: 'Cổ', en: 'Neck', jp: '首', kr: '목', cn: '颈' },
    SHOULDER: { vi: 'Vai', en: 'Shoulder', jp: '肩', kr: '어깨', cn: '肩' },
    BACK: { vi: 'Lưng', en: 'Back', jp: '背中', kr: '등', cn: '背部' },
    ARM: { vi: 'Tay', en: 'Arm', jp: '腕', kr: '팔', cn: '手臂' },
    THIGH: { vi: 'Đùi', en: 'Thigh', jp: '太もも', kr: '허벅지', cn: '大腿' },
    KNEE: { vi: 'Đầu gối', en: 'Knee', jp: '膝', kr: '무릎', cn: '膝盖' },
    CALF: { vi: 'Bắp chân', en: 'Calf', jp: 'ふくらはぎ', kr: '종아리', cn: '小腿' },
    FOOT: { vi: 'Bàn chân', en: 'Foot', jp: '足', kr: '발', cn: '脚' },
    WHOLE_BODY: { vi: 'Toàn thân', en: 'Full Body', jp: '全身', kr: '전신', cn: '全身' },
    FULL_BODY: { vi: 'Toàn thân', en: 'Full Body', jp: '全身', kr: '전신', cn: '全身' },
  };
  return map[key]?.[lang] || map[(key || '').toUpperCase()]?.[lang] || key.toLowerCase();
};

const isWholeBodyParts = (parts?: string[]) => {
  if (!parts || parts.length === 0) return false;
  if (parts.length >= 6) return true;
  return parts.some(p => {
    const u = (p || '').toUpperCase().trim();
    return u === 'WHOLE_BODY' || u === 'FULL_BODY' || u === 'WHOLEBODY' || u === 'FULLBODY';
  });
};

const displayDate = (iso: string, lang: string = 'en') => {
  const [year, month, day] = iso.split('-');
  if (lang === 'vi') return `${day}/${month}/${year}`;
  if (lang === 'cn' || lang === 'jp') return `${year}年${month}月${day}日`;
  if (lang === 'kr') return `${year}년 ${month}월 ${day}일`;
  
  const [, monthValue, dayValue] = iso.split('-');
  const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(monthValue) - 1];
  return `${m} ${Number(dayValue)}, ${year}`;
};

const formatUSD = (amount: number) => `$${(Number(amount) || 0).toFixed(2)} USD`;

const isDateToday = (isoOrDate: string | Date) => {
  const todayISO = spaTodayISO();
  const targetISO = typeof isoOrDate === 'string' ? isoOrDate : localISODate(isoOrDate);
  return targetISO === todayISO;
};

const formatFullDate = (iso: string, lang: string = 'en') => {
  if (!iso) return '';
  const [yearStr, monthStr, dayStr] = iso.split('-');
  const date = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)));

  const dowsFull: Record<string, string[]> = {
    vi: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    cn: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    jp: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
    kr: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  };

  const dow = (dowsFull[lang] || dowsFull.en)[date.getUTCDay()];

  if (lang === 'vi') return `${dow}, ${dayStr}/${monthStr}/${yearStr}`;
  if (lang === 'cn' || lang === 'jp') return `${dow}, ${yearStr}年${monthStr}月${dayStr}日`;
  if (lang === 'kr') return `${dow}, ${yearStr}년 ${monthStr}월 ${dayStr}일`;

  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${dow}, ${monthsEn[date.getUTCMonth()]} ${Number(dayStr)}, ${yearStr}`;
};

const getFormattedDow = (iso: string, lang: string) => {
  if (isDateToday(iso)) {
    const todayMap: Record<string, string> = {
      vi: 'Hôm nay', en: 'Today', cn: '今天', jp: '今日', kr: '오늘'
    };
    return todayMap[lang] || todayMap.en;
  }
  const dows: Record<string, string[]> = {
    vi: ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    cn: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    jp: ['日', '月', '火', '水', '木', '金', '土'],
    kr: ['일', '월', '화', '수', '목', '금', '토']
  };
  return (dows[lang] || dows.en)[new Date(`${iso}T00:00:00Z`).getUTCDay()];
};

const getFormattedMonth = (iso: string, lang: string) => {
  const m = Number(iso.split('-')[1]) - 1;
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (lang === 'en') return monthsEn[m];
  if (lang === 'vi') return `Tháng ${m + 1}`;
  if (lang === 'cn' || lang === 'jp') return `${m + 1}月`;
  if (lang === 'kr') return `${m + 1}월`;
  return monthsEn[m];
};

const buildTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 9; hour <= 22; hour += 1) {
    slots.push(`${String(hour).padStart(2, '0')}:00`);
    slots.push(`${String(hour).padStart(2, '0')}:30`);
  }
  return slots;
};

const busySlotsForDate = (_iso: string) => {
  return [] as string[]; // Temporarily open all slots until real API is connected
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
  cart,
  onUpdateCartItem,
  lang,
  dict,
}: {
  group: Service[] | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (service: Service, quantity: number) => void;
  cart: CartItem[];
  onUpdateCartItem: (cartId: string, quantity: number) => void;
  lang: SupportedLanguage;
  dict: any;
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (group && group.length > 0) {
      setSelectedVariantId(group[0].id);
      setQuantity(1);
    }
  }, [group]);

  const selectedOptions = useMemo(() => {
    if (!group) return [];
    const serviceIds = new Set(group.map((service) => service.id));
    return cart.filter((item) => serviceIds.has(item.id));
  }, [cart, group]);

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
          <button className={styles.drawerClose} onClick={onClose} aria-label={t('close', lang)}>×</button>
        </div>
        <div className={styles.drawerBody}>
          <div className={styles.drawerLabel}>{dict.checkout?.chooseDuration || t('chooseDuration', lang)}</div>
          <div className={styles.drawerOptions}>
            {group.map((v) => (
              <button
                key={v.id}
                className={`${styles.drawerOption} ${v.id === selectedVariantId ? styles.drawerOptionActive : ''}`}
                onClick={() => {
                  setSelectedVariantId(v.id);
                  setQuantity(1);
                }}
              >
                <span>{v.timeValue} {dict.checkout?.mins || 'mins'}</span>
                <strong>{formatCurrency(v.priceVND)} VND <small>{formatUSD(v.priceUSD)}</small></strong>
              </button>
            ))}
          </div>
          {selectedOptions.length > 0 && (
            <div className={styles.drawerSavedOptions}>
              <div className={styles.drawerLabel}>{t('selectedOptions', lang)}</div>
              {selectedOptions.map((item) => (
                <div className={styles.drawerSavedOption} key={item.cartId}>
                  <div>
                    <strong>{item.timeValue} {dict.checkout?.mins || 'mins'}</strong>
                    <span>{item.options?.therapist || ''}{item.options?.strength ? ` · ${item.options.strength}` : ''}</span>
                  </div>
                  <div className={styles.drawerQuantityControl}>
                    <button type="button" onClick={() => onUpdateCartItem(item.cartId, item.qty - 1)} aria-label="Decrease quantity"><Minus size={14} /></button>
                    <span>{item.qty}</span>
                    <button type="button" onClick={() => onUpdateCartItem(item.cartId, item.qty + 1)} aria-label="Increase quantity"><Plus size={14} /></button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className={styles.drawerAddAnother}
                onClick={() => {
                  setSelectedVariantId(group[0].id);
                  setQuantity(1);
                }}
              >
                {t('addAnotherOption', lang)} <Plus size={14} />
              </button>
            </div>
          )}
          <div className={styles.drawerFooter}>
            <div className={styles.drawerSelection}>
              {dict.checkout?.yourSelection || t('yourSelection', lang)}
              <strong>
                {selectedVariant.timeValue} {dict.checkout?.mins || 'mins'} · {formatCurrency(selectedVariant.priceVND * quantity)} VND · {formatUSD(selectedVariant.priceUSD * quantity)}
              </strong>
            </div>
            <div className={styles.drawerQuantityControl}>
              <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Decrease quantity"><Minus size={14} /></button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((current) => current + 1)} aria-label="Increase quantity"><Plus size={14} /></button>
            </div>
            <button 
              className={styles.drawerConfirm} 
              onClick={() => onConfirm(selectedVariant, quantity)}
            >
              {t('select', lang)}
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
  cart,
  onUpdateCartItem,
  onEditCustomItem,
}: {
  group: Service[];
  lang: SupportedLanguage;
  dict: any;
  addService: (service: Service, quantity?: number) => void;
  openDurationDrawer: (group: Service[]) => void;
  openVideoPreview: (media: any) => void;
  cart: CartItem[];
  onUpdateCartItem: (cartId: string, quantity: number) => void;
  onEditCustomItem?: (item: CartItem) => void;
}) => {
  const selectedVariant = group[0];
  const groupSelections = cart.filter((item) => group.some((service) => service.id === item.id));
  const singleSelection = groupSelections.length === 1 ? groupSelections[0] : null;
  const totalSelectedQuantity = groupSelections.reduce((total, item) => total + item.qty, 0);

  const handleAddClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (group.length > 1) {
      openDurationDrawer(group);
    } else {
      addService(group[0], 1);
    }
  };

  return (
    <article 
      className={`${styles.pickerServiceCard} ${totalSelectedQuantity > 0 ? styles.pickerServiceCardSelected : ''}`}
      onClick={totalSelectedQuantity === 0 ? handleAddClick : undefined}
    >
      <div className={styles.pickerCardMain}>
        <div className={styles.pickerCardMedia}>
          {renderCheckoutServiceMedia(selectedVariant, openVideoPreview)}
        </div>
        <div className={styles.pickerCardInfo}>
          <h3 className={styles.pickerServiceTitle}>{serviceName(selectedVariant, lang)}</h3>
          <p className={styles.pickerServiceDesc}>{serviceDescription(selectedVariant, lang)}</p>
          <div className={styles.pickerPriceRow}>
            {group.length > 1 ? (
              <>
                <span className={styles.pickerFromLabel}>{t('fromPrice', lang)}</span>
                <span className={styles.pickerPriceVND}>{formatCurrency(group[0].priceVND)} VND</span>
                <span className={styles.pickerPriceUSD}>{formatUSD(group[0].priceUSD)}</span>
              </>
            ) : (
              <>
                <span className={styles.pickerPriceVND}>{formatCurrency(selectedVariant.priceVND)} VND</span>
                <span className={styles.pickerPriceUSD}>{formatUSD(selectedVariant.priceUSD)}</span>
                <span className={styles.pickerPriceDuration}>{selectedVariant.timeValue} {dict.checkout?.mins || 'mins'}</span>
              </>
            )}
          </div>
        </div>

        <div className={styles.pickerCardAction} onClick={(event) => event.stopPropagation()}>
          {totalSelectedQuantity > 0 ? (
            singleSelection ? (
              <div className={styles.pickerQuantityControl}>
                <button
                  type="button"
                  onClick={() => onUpdateCartItem(singleSelection.cartId, singleSelection.qty - 1)}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span>{singleSelection.qty}</span>
                <button
                  type="button"
                  onClick={() => onUpdateCartItem(singleSelection.cartId, singleSelection.qty + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <div className={styles.pickerSelectedBadge}>
                <span>{totalSelectedQuantity}</span>
              </div>
            )
          ) : (
            <div className={styles.pickerUnselectedAction}>
              <button
                type="button"
                className={styles.pickerAddButton}
                onClick={handleAddClick}
                aria-label={`${t('add', lang)} ${serviceName(selectedVariant, lang)}`}
              >
                <Plus size={16} />
              </button>
              {group.length > 1 && (
                <span className={styles.pickerOptionsCount}>
                  {group.length} {t('optionsCount', lang)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {totalSelectedQuantity > 0 && (
        <div className={styles.pickerCardBottom} onClick={(event) => event.stopPropagation()}>
          <div className={styles.pickerBottomHeader}>
            <span className={styles.pickerSelectedServicesLabel}>
              {totalSelectedQuantity} {t('selectedServices', lang)}
            </span>
            <button
              type="button"
              className={styles.pickerAddAnotherOptionBtn}
              onClick={handleAddClick}
              aria-label={`${t('addAnotherOption', lang)} ${serviceName(selectedVariant, lang)}`}
            >
              {t('addAnotherOption', lang)} +
            </button>
          </div>
          <div className={styles.pickerSelectedPills} aria-label={t('selectedOptions', lang)}>
            {groupSelections.map((item) => (
              <button
                key={item.cartId}
                type="button"
                className={styles.pickerPill}
                onClick={() => onEditCustomItem?.(item)}
                title="Click to customize"
              >
                <span>{item.timeValue} {dict.checkout?.mins || 'mins'}</span>
                {item.options?.therapist ? <span> · {item.options.therapist}</span> : ''}
                {item.options?.strength ? <span> · {item.options.strength}</span> : ''}
                <strong>×{item.qty}</strong>
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};


const CATEGORY_ICONS: Record<string, string> = {
  'BODY': '/category-icons-svg/body-massage.svg',
  'FOOT': '/category-icons-svg/foot-massage.svg',
  'ADDITIONAL': '/category-icons-svg/adds-on.svg',
  'ADD-ON': '/category-icons-svg/adds-on.svg',
  'EAR CLEAN': '/category-icons-svg/ear-clean.svg',
  'BARBER': '/category-icons-svg/haircut.svg',
  'PREMIUM': '/category-icons-svg/combo-king.svg',
  'VIP PACKAGE': '/category-icons-svg/combo-king.svg',
  'PACKAGE': '/category-icons-svg/package.svg',
  'FACIAL': '/category-icons-svg/facial-care.svg',
  'ALL': '/category-icons-svg/combo-king.svg'
};

function getCategoryIcon(catName: string) {
  const upper = catName.toUpperCase();
  if (CATEGORY_ICONS[upper]) return CATEGORY_ICONS[upper];
  if (upper.includes('PREMIUM') || upper.includes('VIP')) return '/category-icons-svg/combo-king.svg';
  if (upper.includes('ADDITIONAL') || upper.includes('ADD')) return '/category-icons-svg/adds-on.svg';
  if (upper.includes('BODY')) return '/category-icons-svg/body-massage.svg';
  if (upper.includes('FOOT')) return '/category-icons-svg/foot-massage.svg';
  if (upper.includes('EAR')) return '/category-icons-svg/ear-clean.svg';
  if (upper.includes('BARBER')) return '/category-icons-svg/haircut.svg';
  if (upper.includes('PACKAGE')) return '/category-icons-svg/package.svg';
  return '/category-icons-svg/package.svg';
}

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const isValidPhone = (phone: string) => {
  const value = phone.trim();
  const digits = value.replace(/\D/g, '');
  return /^\+?[0-9\s().-]+$/.test(value) && digits.length >= 8 && digits.length <= 15;
};

export default function CheckoutPage({ params }: { params: PageParams }) {
  const router = useRouter();
  const { lang: rawLang, menuType: rawMenuType } = use(params);
  const { currentLang, setCurrentLang } = useTranslation();
  const lang = langKey(rawLang || currentLang);
  const menuType = rawMenuType === 'vip' ? 'vip' : 'standard';
  const dict = getDictionary(lang);
  const { services, cart, loading: servicesLoading, error: servicesError, addToCart, removeFromCart, updateCartItem, updateCartItemOptions, replaceCartItemService, revalidateCart } = useMenuData();
  const [idempotencyKey] = useState(() => 'idemp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8));
  const [bookingQuote, setBookingQuote] = useState<string>();
  const quoteLoading = useRef(false);

  // Sync route lang with global TranslationProvider
  useEffect(() => {
    if (rawLang && rawLang !== currentLang && ['vi', 'en', 'cn', 'jp', 'kr'].includes(rawLang)) {
      setCurrentLang(rawLang);
    }
  }, [rawLang, currentLang, setCurrentLang]);

  // PHASE 4 & 6.B: Auto-revalidate cart with server canonical rates on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!cart || cart.length === 0) return;
      const res = await revalidateCart();
      if (!isMounted) return;
      if (res.unavailableItems && res.unavailableItems.length > 0) {
        setAlertState({
          isOpen: true,
          type: 'info',
          message: t('cartRevalUnavailable', lang),
        });
      } else if (res.hasPriceChanged) {
        setAlertState({
          isOpen: true,
          type: 'info',
          message: t('cartRevalPrice', lang),
        });
      }
    })();
    return () => { isMounted = false; };
  }, [lang]);

  const [editingCartId, setEditingCartId] = useState<string | null>(null);
  const [editServiceId, setEditServiceId] = useState<string | null>(null);
  const [editBaseName, setEditBaseName] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [guestCount, setGuestCount] = useState<number>(1);
  const [editingCustomCartId, setEditingCustomCartId] = useState<string | null>(null);
  const [editingCustomInitialData, setEditingCustomInitialData] = useState<CustomPreferences | null>(null);
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email');
  const [genderKey, setGenderKey] = useState<'male' | 'female' | 'other'>('male');
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', gender: t('male', lang) });
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'name' | 'phone' | 'email' | 'time', string>>>({});

  const [phoneCountry, setPhoneCountry] = useState(() => phoneCountryForLang(lang));
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isPhoneCountryOpen, setIsPhoneCountryOpen] = useState(false);
  const [isTimeExpanded, setIsTimeExpanded] = useState(false);
  const [spaToday, setSpaToday] = useState<string | null>(null);
  const [spaClockKey, setSpaClockKey] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [note, setNote] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [customizingService, setCustomizingService] = useState<Service | null>(null);
  const [pendingServiceQuantity, setPendingServiceQuantity] = useState(1);
  const [isServicePickerOpen, setIsServicePickerOpen] = useState(false);
  const [returnToServicePickerOnCancel, setReturnToServicePickerOnCancel] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [returnToConfirmAfterEdit, setReturnToConfirmAfterEdit] = useState(false);
  const [videoPreview, setVideoPreview] = useState<ReturnType<typeof resolveServiceMedia> | null>(null);
  const [isVideoPreviewClosing, setIsVideoPreviewClosing] = useState(false);
  const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ isOpen: false, message: '' });
  const [activeDrawerGroup, setActiveDrawerGroup] = useState<Service[] | null>(null);

  useEffect(() => {
    setCustomerInfo((prev) => ({ ...prev, gender: t(genderKey, lang) }));
  }, [genderKey, lang]);

  useEffect(() => {
    if (!isGenderOpen && !isPhoneCountryOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest?.('.' + styles.genderField)) {
        setIsGenderOpen(false);
      }
      if (!target.closest?.('.' + styles.phoneCountryField)) {
        setIsPhoneCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isGenderOpen, isPhoneCountryOpen]);

  const calendarInputRef = useRef<HTMLInputElement>(null);
  // Dải 7 ngày hiển thị linh hoạt bắt đầu từ stripAnchorDate (mặc định là hôm nay)
  const [stripAnchorDate, setStripAnchorDate] = useState<string | null>(null);

  useEffect(() => {
    const refreshSpaClock = () => {
      const today = spaTodayISO();
      const now = getSpaDateTime();
      setSpaToday(today);
      setSpaClockKey(`${today}T${now.hour}:${now.minute}`);
      setBookingDate((current) => current || today);
      setStripAnchorDate((current) => current || today);
    };
    refreshSpaClock();
    const interval = window.setInterval(refreshSpaClock, 30_000);
    window.addEventListener('focus', refreshSpaClock);
    document.addEventListener('visibilitychange', refreshSpaClock);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshSpaClock);
      document.removeEventListener('visibilitychange', refreshSpaClock);
    };
  }, []);

  const dateOptions = useMemo(() => {
    if (!stripAnchorDate) return [];
    return Array.from({ length: 7 }, (_, index) => addDaysToISO(stripAnchorDate, index));
  }, [stripAnchorDate]);

  const handleCustomDateSelect = (pickedDate: string) => {
    if (!pickedDate) return;
    const todayISO = spaToday || spaTodayISO();
    const validDate = pickedDate < todayISO ? todayISO : pickedDate;
    setBookingDate(validDate);
    // Khi chọn ngày qua calendar, dải 7 ngày chuyển sang hiển thị bắt đầu từ ngày được chọn
    // Giúp ngày được chọn hiển thị rõ ràng ngay ô đầu tiên và được active màu gold rực rỡ
    setStripAnchorDate(validDate);
  };

  const handleResetToToday = () => {
    const todayISO = spaToday || spaTodayISO();
    setBookingDate(todayISO);
    setStripAnchorDate(todayISO);
  };
  const allSlots = useMemo(() => {
    if (!spaToday || !spaClockKey || !bookingDate || bookingDate < spaToday) return [];
    const slots = buildTimeSlots();
    const spaNow = getSpaDateTime();
    const todayISO = spaToday || spaTodayISO();
    if (bookingDate === todayISO) {
      const currentTimeStr = `${spaNow.hour}:${spaNow.minute}`;
      return slots.filter((slot) => slot > currentTimeStr);
    }
    return slots;
  }, [bookingDate, spaToday, spaClockKey]);
  const busySlots = useMemo(() => busySlotsForDate(bookingDate), [bookingDate]);
  const availableSlots = useMemo(() => allSlots.filter((slot) => !busySlots.includes(slot)), [allSlots, busySlots]);

  useEffect(() => {
    if (bookingTime && !availableSlots.includes(bookingTime)) {
      setBookingTime('');
    }
  }, [availableSlots, bookingTime]);

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
    () => apiServices,
    [apiServices, menuType]
  );

  const privateRoomAddon = useMemo(
    () => services.find((service) => service.id === 'NHS0900' && service.ACTIVE !== false),
    [services]
  );

  const categoryIds = useMemo(
    () => {
      const cats = new Set<string>();
      serviceOptions.forEach(service => {
        if (service.cats && service.cats.length > 0) {
          service.cats.forEach(c => cats.add(c));
        } else if (service.cat) {
          cats.add(service.cat);
        }
      });
      const catArray = Array.from(cats);
      const order = ['Premium', 'Body', 'Foot', 'Ear Clean', 'Barber', 'Package', 'Additional'];
      catArray.sort((a, b) => {
        const idxA = order.indexOf(a);
        const idxB = order.indexOf(b);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      });
      return catArray;
    },
    [serviceOptions]
  );

  useEffect(() => {
    if (!activeCategory && categoryIds.length > 0) setActiveCategory(categoryIds[0]);
    if (activeCategory && categoryIds.length > 0 && !categoryIds.includes(activeCategory)) {
      setActiveCategory(categoryIds[0]);
    }
  }, [categoryIds, activeCategory]);

  const visibleServices = useMemo(
    () => {
      if (activeCategory === 'all') return serviceOptions;
      return serviceOptions.filter((service) => {
        return service.cat === activeCategory || (service.cats && service.cats.includes(activeCategory));
      });
    },
    [activeCategory, serviceOptions]
  );

  const groupedVisibleServices = useMemo(() => {
    return Object.values(
      visibleServices.reduce((acc, service) => {
        const rawNameEn = service.names?.en?.trim().toLowerCase() || service.id;
        // Strip duration identifiers like 60', 90 mins, etc. to group base services together
        const baseNameEn = rawNameEn.replace(/\s*\d+\s*(mins?|'|phút).*$/i, '').trim();
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
  const totalUSD = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.priceUSD) || 0) * item.qty, 0), [cart]);
  const visibleTimeSlots = isTimeExpanded ? allSlots : allSlots.slice(0, COLLAPSED_TIME_SLOT_COUNT);
  const hasMoreTimeSlots = allSlots.length > COLLAPSED_TIME_SLOT_COUNT;

  const updateCustomer = (field: keyof typeof customerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
    if (field === 'name' || field === 'phone' || field === 'email') {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const updateContact = (value: string) => {
    updateCustomer(contactMethod, value);
  };

  const currentContactValue = contactMethod === 'email' ? customerInfo.email : customerInfo.phone;
  const genderOptions = [t('male', lang), t('female', lang), t('other', lang)];

  const addService = (service: Service, quantity = 1) => {
    setActiveDrawerGroup(null);
    setIsServicePickerOpen(false);
    setReturnToServicePickerOnCancel(true);
    setPendingServiceQuantity(Math.max(1, quantity));
    setCustomizingService(service);
  };

  const handleSaveCustom = (prefs: CustomPreferences) => {
    const shouldReturnToPicker = returnToServicePickerOnCancel;
    setReturnToServicePickerOnCancel(false);

    if (editingCustomCartId && customizingService) {
      replaceCartItemService(editingCustomCartId, customizingService, {
        strength: prefs.strength,
        therapist: prefs.therapist,
        notes: prefs.notes,
        bodyParts: prefs.bodyParts,
        addons: prefs.addons
      });
      setEditingCustomCartId(null);
      setEditingCustomInitialData(null);
      setPendingServiceQuantity(1);
      setCustomizingService(null);
      if (returnToConfirmAfterEdit) {
        setReturnToConfirmAfterEdit(false);
        window.setTimeout(() => setIsConfirmOpen(true), 100);
      } else if (shouldReturnToPicker) {
        setIsServicePickerOpen(true);
      }
      return;
    }

    if (!customizingService) return;
    addToCart(customizingService, pendingServiceQuantity, {
      strength: prefs.strength,
      therapist: prefs.therapist,
      notes: prefs.notes,
      bodyParts: prefs.bodyParts,
      addons: prefs.addons
    });
    setPendingServiceQuantity(1);
    setCustomizingService(null);
    if (returnToConfirmAfterEdit) {
      setReturnToConfirmAfterEdit(false);
      window.setTimeout(() => setIsConfirmOpen(true), 100);
    } else if (shouldReturnToPicker) {
      setIsServicePickerOpen(true);
    } else {
      window.requestAnimationFrame(() => document.getElementById('cart')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const validate = () => {
    setHasAttemptedSubmit(true);
    if (cart.length === 0) {
      setAlertState({ isOpen: true, message: t('selectService', lang), type: 'error' });
      return false;
    }

    const nameMissing = !customerInfo.name.trim();
    const phoneMissing = !customerInfo.phone.trim();
    const phoneInvalid = !phoneMissing && !isValidPhone(customerInfo.phone);
    const emailMissing = !customerInfo.email.trim();
    const emailInvalid = !emailMissing && !isValidEmail(customerInfo.email);
    const errors: Partial<Record<'name' | 'phone' | 'email' | 'time', string>> = {};
    const now = getSpaDateTime();
    const today = spaTodayISO();
    if (!bookingTime || !availableSlots.includes(bookingTime) || bookingDate < today ||
      (bookingDate === today && bookingTime <= `${now.hour}:${now.minute}`)) errors.time = t('timeRequired', lang);
    if (nameMissing) errors.name = lang === 'vi' ? 'Vui lòng nhập họ và tên của bạn.' : lang === 'cn' ? '请输入您的全名。' : lang === 'jp' ? 'お名前を入力してください。' : lang === 'kr' ? '성함을 입력해 주세요.' : 'Please enter your full name.';
    if (phoneMissing && emailMissing) {
      errors.phone = lang === 'vi' ? 'Vui lòng nhập số điện thoại.' : lang === 'cn' ? '请输入电话号码。' : lang === 'jp' ? '電話番号を入力してください。' : lang === 'kr' ? '전화번호를 입력해 주세요.' : 'Please enter your phone number.';
      errors.email = lang === 'vi' ? 'Vui lòng nhập địa chỉ email.' : lang === 'cn' ? '请输入电子邮件。' : lang === 'jp' ? 'メールアドレスを入力してください。' : lang === 'kr' ? '이메일 주소를 입력해 주세요.' : 'Please enter your email address.';
    } else if (phoneMissing) {
      errors.phone = lang === 'vi' ? 'Vui lòng nhập số điện thoại.' : lang === 'cn' ? '请输入电话号码。' : lang === 'jp' ? '電話番号を入力してください。' : lang === 'kr' ? '전화번호를 입력해 주세요.' : 'Please enter your phone number.';
    } else if (phoneInvalid) {
      errors.phone = lang === 'vi' ? 'Số điện thoại không hợp lệ (tối thiểu 8 chữ số).' : lang === 'cn' ? '电话号码无效（至少8位数字）。' : lang === 'jp' ? '無効な電話番号です（8桁以上）。' : lang === 'kr' ? '유효하지 않은 전화번호입니다 (8자리 이상).' : 'Invalid phone number (minimum 8 digits).';
    }
    if (emailMissing && !phoneMissing) errors.email = lang === 'vi' ? 'Vui lòng nhập địa chỉ email.' : lang === 'cn' ? '请输入电子邮件。' : lang === 'jp' ? 'メールアドレスを入力してください。' : lang === 'kr' ? '이메일 주소를 입력해 주세요.' : 'Please enter your email address.';
    if (emailInvalid) errors.email = lang === 'vi' ? 'Định dạng email không hợp lệ.' : lang === 'cn' ? '电子邮件格式无效。' : lang === 'jp' ? '無効なメールアドレス形式です。' : lang === 'kr' ? '이메일 형식이 유효하지 않습니다.' : 'Invalid email format.';

    setFieldErrors(errors);
    const firstError = errors.time || errors.name || errors.phone || errors.email;
    if (firstError) {
      setAlertState({ isOpen: true, message: firstError, type: 'error' });
      return false;
    }
    return true;
  };

  const handleEditCartItemCustomization = (item: CartItem) => {
    const s = services.find((srv) => srv.id === item.id) || {
      id: item.id,
      names: item.names,
      priceVND: item.priceVND,
      priceUSD: item.priceUSD || 0,
      timeValue: item.timeValue,
      timeDisplay: item.timeDisplay,
      SHOW_STRENGTH: true,
      SHOW_NOTES: true,
      SHOW_PREFERENCES: true,
      SHOW_GENDER: true,
      SHOW_FOCUS: true,
    } as any;
    if (isServicePickerOpen) {
      setIsServicePickerOpen(false);
      setReturnToServicePickerOnCancel(true);
    }
    setCustomizingService(s);
    setEditingCustomCartId(item.cartId);
    setEditingCustomInitialData({
      strength: (item.options?.strength as any) || 'medium',
      therapist: (item.options?.therapist as any) || 'random',
      notes: {
        tag0: item.options?.notes?.tag0 ?? false,
        tag1: item.options?.notes?.tag1 ?? false,
        content: item.options?.notes?.content || '',
      },
      bodyParts: {
        focus: item.options?.bodyParts?.focus || [],
        avoid: item.options?.bodyParts?.avoid || [],
      },
      addons: item.options?.addons,
    });
  };

  const handleConfirmOrder = async () => {
    if (!validate()) return;
    if (quoteLoading.current) return;
    quoteLoading.current = true;
    try {
      const result = await revalidateCart();
      if (!result.valid || !result.quote) {
        setAlertState({ isOpen: true, type: 'error', message: t(result.unavailableItems.length ? 'reviewCart' : 'temporaryUnavailable', lang) });
        return;
      }
      if (result.hasPriceChanged) {
        setAlertState({ isOpen: true, type: 'info', message: t('cartRevalPrice', lang) });
        return;
      }
      setBookingQuote(result.quote);
      setIsConfirmOpen(true);
    } finally {
      quoteLoading.current = false;
    }
  };

  const handleFinalSubmit = async (data?: {
    paymentMethod?: string;
    customerInfo?: { name: string; email: string; phone: string; gender: string };
    guestCount?: number;
    bookingDate?: string;
    bookingTime?: string;
  }) => {
    const chosenMethod = data?.paymentMethod || paymentMethod || 'cash_vnd';
    setPaymentMethod(chosenMethod);

    const effectiveName = (data?.customerInfo?.name || customerInfo.name).trim();
    const rawPhone = (data?.customerInfo?.phone || customerInfo.phone).trim();
    const effectiveEmail = (data?.customerInfo?.email || customerInfo.email).trim();
    const effectiveGender = genderKey;
    const effectiveGuests = data?.guestCount || guestCount;
    const effectiveDate = data?.bookingDate || bookingDate;
    const effectiveTime = data?.bookingTime || bookingTime;

    const phoneWithCountry = rawPhone
      ? rawPhone.startsWith('+')
        ? rawPhone
        : `${phoneCountry.code}${rawPhone.replace(/^0+/, '')}`
      : '';

    // Gửi minimal identifiers, server tự fetch DB & tính toán giá
    const selectedServices = cart.map((item) => ({
      variantId: item.id,
      serviceId: item.id,
      quantity: item.qty || 1,
      options: item.options || {},
    }));

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20_000);
    let response: Response;
    try {
      response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          idempotencyKey,
          quote: bookingQuote,
          name: effectiveName,
          phone: phoneWithCountry,
          email: effectiveEmail,
          customerGender: effectiveGender,
          note,
          date: effectiveDate,
          time: effectiveTime,
          branchId: 'ngan-ha-spa',
          branchName: 'ORIA SPA',
          guests: effectiveGuests,
          staffGender: 'any',
          lang,
          selectedServices,
          paymentMethod: chosenMethod,
          amountPaid: 0,
          changeDenominations: [],
        }),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(t('submitTimeout', lang));
      }
      throw new Error(t('temporaryUnavailable', lang));
    } finally {
      window.clearTimeout(timeoutId);
    }

    const resData = await response.json().catch(() => ({}));
    if (!response.ok || resData?.success === false) {
      if (resData?.code === 'CART_REQUIRES_REVIEW' || resData?.code === 'PRICE_CHANGED') {
        await revalidateCart();
        setIsConfirmOpen(false);
        setBookingQuote(undefined);
      }
      if (response.status === 409 || resData?.code === 'PRICE_CHANGED') {
        throw new Error(t('reviewCart', lang));
      }
      if (response.status === 503 || resData?.code === 'BOOKING_TEMPORARILY_UNAVAILABLE') {
        throw new Error(t('temporaryUnavailable', lang));
      }
      throw new Error(resData?.error || 'Failed to submit booking');
    }
    return resData?.data?.bookingId || resData?.bookingId;
  };

  return (
    <div className={styles.page}>
      <div className={styles.nebula} />
      <div className={styles.stars} />

      <header className="relative z-10 flex flex-col items-center pt-[max(2rem,calc(env(safe-area-inset-top)+1rem))] md:pt-12 pb-6 mb-6">
        <button 
          className="absolute left-4 md:left-8 top-[max(5rem,calc(env(safe-area-inset-top)+2.5rem))] md:top-28 flex items-center gap-1 text-[#c9a96e] hover:text-white transition-colors z-20" 
          type="button" 
          onClick={() => router.back()}
        >
          <ChevronLeft size={18} />
          <span className="text-base font-semibold uppercase tracking-[0.15em]">{t('back', lang)}</span>
        </button>
        
        <SmartLogo theme="dark" className="h-20 md:h-28 lg:h-32 w-auto object-contain mb-5 drop-shadow-xl" />
        
        <h1 className="text-3xl md:text-[30px] font-serif text-[#f1e9dc] tracking-wide">
          {t('title', lang)}
        </h1>
        
        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-[#c9a96e]/40 to-transparent mt-5" />
      </header>

      <main className={styles.stage}>
        <div className={styles.grid}>
          <div className={styles.stack}>
            <section className={styles.panel}>
              <p className={styles.eyebrow}>{t('customer', lang)}</p>

              {/* Full Name & Gender */}
              <div style={{ marginBottom: '12px', position: 'relative', zIndex: isGenderOpen ? 60 : 3 }}>
                <div className={styles.fieldRow} style={{ marginBottom: 0, position: 'relative', zIndex: isGenderOpen ? 60 : 3 }}>
                  <label 
                    className={styles.field} 
                    style={{ 
                      flex: 2,
                      ...(hasAttemptedSubmit && !customerInfo.name.trim() ? { borderColor: '#ef4444', boxShadow: '0 0 0 1px #ef4444' } : {}) 
                    }}
                  >
                    <input
                      value={customerInfo.name}
                      onChange={(event) => updateCustomer('name', event.target.value)}
                      placeholder={lang === 'vi' ? 'Họ và tên *' : lang === 'cn' ? '姓名 *' : lang === 'jp' ? 'お名前 *' : lang === 'kr' ? '성함 *' : 'Full Name *'}
                    />
                  </label>
                  <div className={`${styles.field} ${styles.genderField} ${isGenderOpen ? styles.genderOpen : ''}`}>
                    <button
                      type="button"
                      className={styles.genderTrigger}
                      onClick={() => setIsGenderOpen((open) => !open)}
                      aria-haspopup="listbox"
                      aria-expanded={isGenderOpen}
                      aria-label={t('gender', lang)}
                    >
                      <span>{t(genderKey, lang)}</span>
                      <span className={styles.genderChevron}>⌄</span>
                    </button>
                    <div className={styles.genderMenu} role="listbox">
                      {(['male', 'female', 'other'] as const).map((key) => (
                        <button
                          key={key}
                          type="button"
                          className={`${styles.genderOption} ${genderKey === key ? styles.genderOptionActive : ''}`}
                          onClick={() => {
                            setGenderKey(key);
                            updateCustomer('gender', t(key, lang));
                            setIsGenderOpen(false);
                          }}
                          role="option"
                          aria-selected={genderKey === key}
                        >
                          {t(key, lang)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {fieldErrors.name && (
                  <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '5px', paddingLeft: '4px', fontWeight: 500 }}>
                    * {lang === 'vi' ? 'Vui lòng nhập họ và tên của bạn' : lang === 'cn' ? '请输入您的全名' : lang === 'jp' ? 'お名前を入力してください' : lang === 'kr' ? '성함을 입력해 주세요' : 'Please enter your full name'}
                  </div>
                )}
              </div>

              {/* Phone Number (Required) */}
              <div style={{ marginBottom: '12px' }}>
                <div className={styles.phoneGroup} style={{ position: isPhoneCountryOpen ? 'relative' : 'static', zIndex: isPhoneCountryOpen ? 9999 : 'auto', marginBottom: 0 }}>
                  <div className={`${styles.field} ${styles.phoneCountryField}`} style={{ position: 'relative', zIndex: isPhoneCountryOpen ? 50 : 1 }}>
                    <div 
                      className={styles.phoneCountrySelect} 
                      onClick={() => setIsPhoneCountryOpen(!isPhoneCountryOpen)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
                    >
                      {phoneCountry.flag} {phoneCountry.code}
                    </div>
                    
                    {isPhoneCountryOpen && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: 'max-content', minWidth: '120px', background: '#17162b', border: '1px solid rgba(226,190,111,0.15)', borderRadius: '12px', zIndex: 100, maxHeight: '250px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        {PHONE_COUNTRIES.map((country, idx) => {
                           const isSelected = phoneCountry.iso === country.iso;
                           return (
                             <div 
                               key={`${country.iso}-${idx}`}
                               onClick={() => {
                                 setPhoneCountry(country);
                                 setIsPhoneCountryOpen(false);
                               }}
                               style={{ 
                                 padding: '10px 14px', 
                                 color: isSelected ? '#e2be6f' : '#efeadf', 
                                 background: isSelected ? 'rgba(226,190,111,0.05)' : 'transparent',
                                 cursor: 'pointer',
                                 borderBottom: '1px solid rgba(255,255,255,0.03)',
                                 fontSize: '14px',
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '8px',
                                 transition: 'background 0.2s'
                               }}
                               onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                               onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(226,190,111,0.05)' : 'transparent'; }}
                             >
                               <span>{country.flag}</span>
                               <span style={{ opacity: 0.7, fontSize: '12px' }}>{country.code}</span>
                               <span style={{ marginLeft: '4px', fontSize: '13px' }}>{country.label}</span>
                             </div>
                           );
                        })}
                      </div>
                    )}
                  </div>
                  <label 
                    className={styles.field}
                    style={{
                      ...(hasAttemptedSubmit && (!customerInfo.phone.trim() || !isValidPhone(customerInfo.phone)) ? { borderColor: '#ef4444', boxShadow: '0 0 0 1px #ef4444' } : {})
                    }}
                  >
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(event) => updateCustomer('phone', event.target.value)}
                      placeholder={lang === 'vi' ? 'Số điện thoại *' : lang === 'cn' ? '电话号码 *' : lang === 'jp' ? 'お電話番号 *' : lang === 'kr' ? '전화번호 *' : 'Phone Number *'}
                    />
                  </label>
                </div>
                {fieldErrors.phone && (
                  <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '5px', paddingLeft: '4px', fontWeight: 500 }}>
                    * {lang === 'vi' ? 'Vui lòng nhập số điện thoại' : lang === 'cn' ? '请输入电话号码' : lang === 'jp' ? '電話番号を入力してください' : lang === 'kr' ? '전화번호를 입력해 주세요' : 'Please enter phone number'}
                  </div>
                )}
              </div>

              {/* Email Address (Required with @) */}
              <div style={{ marginBottom: '12px' }}>
                <label 
                  className={styles.field}
                  style={{
                    ...(hasAttemptedSubmit && (!customerInfo.email.trim() || !isValidEmail(customerInfo.email)) ? { borderColor: '#ef4444', boxShadow: '0 0 0 1px #ef4444' } : {})
                  }}
                >
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(event) => updateCustomer('email', event.target.value)}
                    placeholder={lang === 'vi' ? 'Địa chỉ Email * (ví dụ: name@gmail.com)' : lang === 'cn' ? '电子邮件 * (例如: name@gmail.com)' : lang === 'jp' ? 'メールアドレス * (例: name@gmail.com)' : lang === 'kr' ? '이메일 주소 * (예: name@gmail.com)' : 'Email Address * (e.g. name@gmail.com)'}
                  />
                </label>
                {fieldErrors.email && (
                  <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '5px', paddingLeft: '4px', fontWeight: 500 }}>
                    * {lang === 'vi' ? 'Vui lòng nhập địa chỉ email' : lang === 'cn' ? '请输入电子邮件地址' : lang === 'jp' ? 'メールアドレスを入力してください' : lang === 'kr' ? '이메일 주소를 입력해 주세요' : 'Please enter email address'}
                  </div>
                )}
              </div>

              {/* Privacy / Security Notice */}
              <p style={{ fontSize: '11px', color: '#9b99a8', marginTop: '8px', marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.5 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', minWidth: '14px', borderRadius: '50%', background: 'rgba(201,169,110,0.2)', color: '#f2d58d', fontSize: '10px', fontWeight: 'bold', fontStyle: 'italic', fontFamily: 'serif', marginTop: '1px' }}>
                  i
                </span>
                <span>
                  {lang === 'vi'
                    ? 'Thông tin của bạn được bảo mật tuyệt đối, chỉ phục vụ cho việc đặt lịch và hỗ trợ trải nghiệm dịch vụ tại Oria Spa.'
                    : lang === 'cn'
                    ? '您的信息受到严格保密，仅用于 Oria Spa 的预约和服务体验。'
                    : lang === 'jp'
                    ? 'お客様の個人情報は厳重に保護され、Oria Spaでのご予約およびサービス提供のみに使用されます。'
                    : lang === 'kr'
                    ? '고객님의 정보는 안전하게 보호되며, Oria Spa 예약 및 서비스 제공 목적으로만 사용됩니다.'
                    : 'Your information is strictly confidential and used solely for booking and service experience at Oria Spa.'}
                </span>
              </p>

              {/* Number of Guests - Transparent Matching Style */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
                <span style={{ fontWeight: 500, fontSize: '14px', color: '#c9a96e' }}>
                  {lang === 'vi' ? 'Số lượng khách' : lang === 'cn' ? '人数' : lang === 'jp' ? 'ご利用人数' : lang === 'kr' ? '인원수' : 'Number of Guests'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setGuestCount(prev => Math.max(1, prev - 1))}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: guestCount <= 1 ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: guestCount <= 1 ? 0.4 : 1 }}
                    disabled={guestCount <= 1}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 'bold', color: '#f2d58d', fontSize: '15px', minWidth: '24px', textAlign: 'center' }}>
                    {guestCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuestCount(prev => Math.min(20, prev + 1))}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(201,169,110,0.15)', color: '#f2d58d', border: '1px solid rgba(201,169,110,0.3)', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.bookingBlock}>
                <div className={styles.bookingHeading}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div className={styles.bookingTitle}>{t('booking', lang)}</div>
                    {/* Calendar Icon Button */}
                    <button
                      type="button"
                      onClick={() => calendarInputRef.current?.showPicker?.() || calendarInputRef.current?.focus()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(201, 169, 110, 0.18)',
                        border: '1px solid rgba(201, 169, 110, 0.45)',
                        color: '#f2d58d',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}
                      title={t('openCalendar', lang)}
                    >
                      <Calendar size={15} color="#f2d58d" />
                      <span>{lang === 'vi' ? 'Mở lịch' : lang === 'cn' ? '选日期' : lang === 'jp' ? 'カレンダー' : lang === 'kr' ? '달력' : 'Calendar'}</span>
                    </button>
                    <input
                      ref={calendarInputRef}
                      type="date"
                      min={spaToday || undefined}
                      value={bookingDate}
                      onChange={(e) => handleCustomDateSelect(e.target.value)}
                      className={styles.hiddenDateInput}
                    />
                  </div>
                </div>

                {/* Hiển Thị Ngày & Giờ Đã Chọn Tinh Tế - Không Khung, Không Nút Bấm */}
                <div
                  style={{
                    marginTop: '6px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px 16px',
                    padding: '2px 0 6px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        color: '#c9a96e',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <Calendar size={13} color="#c9a96e" />
                      <span>{lang === 'vi' ? 'Lịch hẹn đã chọn' : lang === 'cn' ? '已选预约时间' : lang === 'jp' ? '選択した日時' : lang === 'kr' ? '선택된 예약 일시' : 'Selected Schedule'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.2px' }}>
                        {formatFullDate(bookingDate, lang)}
                      </span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '16px' }}>·</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#f2d58d', letterSpacing: '0.5px' }}>
                        {bookingTime || t('selectTime', lang)}
                      </span>
                    </div>
                  </div>

                  {!isDateToday(bookingDate) && (
                    <button
                      type="button"
                      onClick={handleResetToToday}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '0',
                        color: '#c9a96e',
                        fontSize: '12.5px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        transition: 'color 0.2s',
                        marginBottom: '2px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#c9a96e')}
                      title={t('resetToday', lang)}
                    >
                      <RotateCcw size={12} />
                      <span>{lang === 'vi' ? 'Về hôm nay' : lang === 'cn' ? '回到今天' : lang === 'jp' ? '今日に戻る' : lang === 'kr' ? '오늘로 가기' : 'Back to today'}</span>
                    </button>
                  )}
                </div>

                <div className={styles.dateScroller} aria-label={t('booking', lang)}>
                  {dateOptions.map((iso) => {
                    return (
                      <button
                        key={iso}
                        type="button"
                        className={`${styles.dateChip} ${bookingDate === iso ? styles.selectedDate : ''}`}
                        onClick={() => setBookingDate(iso)}
                      >
                        <span className={styles.dow}>
                          {getFormattedDow(iso, lang)}
                        </span>
                        <span className={styles.day}>{Number(iso.slice(-2))}</span>
                        <span className={styles.month}>{getFormattedMonth(iso, lang)}</span>
                      </button>
                    );
                  })}
                  {/* Calendar Chip at end of scroller */}
                  <button
                    type="button"
                    className={styles.dateChip}
                    style={{
                      borderStyle: 'dashed',
                      borderColor: 'rgba(201, 169, 110, 0.5)',
                      backgroundColor: 'rgba(201, 169, 110, 0.08)',
                      minWidth: '68px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => calendarInputRef.current?.showPicker?.() || calendarInputRef.current?.focus()}
                    title={t('pickAnotherDate', lang)}
                  >
                    <Calendar size={18} color="#f2d58d" style={{ marginBottom: '2px' }} />
                    <span className={styles.dow} style={{ color: '#f2d58d' }}>{lang === 'vi' ? 'Lịch' : lang === 'cn' ? '日历' : lang === 'jp' ? 'カレンダー' : lang === 'kr' ? '달력' : 'Calendar'}</span>
                    <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}>{t('more', lang)}</span>
                  </button>
                </div>

                <div className={styles.timeLabelRow}>
                  <strong>{t('available', lang)}</strong>
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

                {fieldErrors.time && <p className={styles.fieldError} role="alert">{fieldErrors.time}</p>}

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
                    <span>{index + 1}. {serviceName(item, lang)} <small className="whitespace-nowrap text-[#c9a96e]">x{item.qty}</small></span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span className={styles.pricePair}>
                        <span>{formatCurrency(item.priceVND * item.qty)} VND</span>
                        <small>{formatUSD(item.priceUSD * item.qty)}</small>
                      </span>
                      <button onClick={() => { setEditingCartId(item.cartId); setEditServiceId(item.id); setEditBaseName(null); setEditNote(item.options?.notes?.content || ''); }} className="text-[#c9a96e] hover:text-white transition-colors" title={t('edit', lang) || 'Edit'}><Edit2 size={16} /></button>
                      <button onClick={() => removeFromCart(item.cartId)} className="text-[#c9a96e] hover:text-red-500 transition-colors" title={t('remove', lang) || 'Remove'}><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className={styles.detail}>
                    <span>{t('duration', lang)}</span>
                    <strong>{item.timeValue} {dict.checkout.mins || 'mins'}</strong>
                  </div>
                  <div className={styles.detail}>
                    <span>{t('date', lang)}</span>
                    <strong>{displayDate(bookingDate, lang)}</strong>
                  </div>
                  <div className={styles.detail}>
                    <span>{t('time', lang)}</span>
                    <strong>{bookingTime}</strong>
                  </div>
                  
                  {/* Custom Preferences */}
                  {(item.options?.therapist || item.options?.strength || (item.options?.bodyParts?.focus?.length || 0) > 0 || (item.options?.bodyParts?.avoid?.length || 0) > 0 || item.options?.notes?.content) && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      {item.options?.therapist && (
                        <div className={styles.detail}>
                          <span style={{ fontSize: '12px' }}>{dict.checkout?.therapist || (lang === 'vi' ? 'KTV' : lang === 'cn' ? '技师' : lang === 'jp' ? 'セラピスト' : lang === 'kr' ? '관리사' : 'Therapist')}</span>
                          <strong style={{ fontSize: '12px', textTransform: 'capitalize' }}>
                            {/* @ts-ignore */}
                            {dict.options?.therapist_options?.[item.options.therapist?.toLowerCase()] || item.options.therapist}
                          </strong>
                        </div>
                      )}
                      {item.options?.strength && (
                        <div className={styles.detail}>
                          <span style={{ fontSize: '12px' }}>{dict.checkout?.strength || (lang === 'vi' ? 'Lực massage' : lang === 'cn' ? '按摩力度' : lang === 'jp' ? '強さ' : lang === 'kr' ? '강도' : 'Strength')}</span>
                          <strong style={{ fontSize: '12px', textTransform: 'capitalize' }}>
                            {/* @ts-ignore */}
                            {dict.options?.strength_levels?.[item.options.strength?.toLowerCase()] || item.options.strength}
                          </strong>
                        </div>
                      )}
                      {item.options?.bodyParts?.focus && item.options.bodyParts.focus.length > 0 && (
                        <div className={styles.detail}>
                          <span style={{ fontSize: '12px' }}>{dict.checkout?.focus || (lang === 'vi' ? 'Vùng tập trung' : lang === 'cn' ? '重点部位' : lang === 'jp' ? '重点部位' : lang === 'kr' ? '집중 부위' : 'Focus Area')}</span>
                          <strong style={{ fontSize: '12px', textAlign: 'right', maxWidth: '60%' }}>{isWholeBodyParts(item.options.bodyParts.focus) ? (dict.custom_for_you?.full_body || (lang === 'vi' ? 'Toàn thân' : lang === 'cn' ? '全身' : lang === 'jp' ? '全身' : lang === 'kr' ? '전신' : 'Full Body')) : item.options.bodyParts.focus.map(p => translatePart(p, lang)).join(', ')}</strong>
                        </div>
                      )}
                      {item.options?.bodyParts?.avoid && item.options.bodyParts.avoid.length > 0 && (
                        <div className={styles.detail}>
                          <span style={{ fontSize: '12px' }}>{dict.checkout?.avoid || (lang === 'vi' ? 'Vùng cần tránh' : lang === 'cn' ? '避开部位' : lang === 'jp' ? '避ける部位' : lang === 'kr' ? '피할 부위' : 'Avoid Area')}</span>
                          <strong style={{ fontSize: '12px', textAlign: 'right', maxWidth: '60%', color: '#ef4444' }}>{isWholeBodyParts(item.options.bodyParts.avoid) ? (dict.custom_for_you?.full_body || (lang === 'vi' ? 'Toàn thân' : lang === 'cn' ? '全身' : lang === 'jp' ? '全身' : lang === 'kr' ? '전신' : 'Full Body')) : item.options.bodyParts.avoid.map(p => translatePart(p, lang)).join(', ')}</strong>
                        </div>
                      )}
                      {item.options?.addons?.privateRoom && (
                        <div className={styles.detail}>
                          <span style={{ fontSize: '12px' }}>{lang === 'vi' ? 'Tiện ích' : lang === 'cn' ? '附加项目' : lang === 'jp' ? 'アドオン' : lang === 'kr' ? '추가 항목' : 'Add-on'}</span>
                          <strong style={{ fontSize: '12px', textAlign: 'right', maxWidth: '60%', color: '#c9a96e' }}>
                            {lang === 'vi' ? 'Phòng riêng' : lang === 'cn' ? '包间' : lang === 'kr' ? '프라이빗 룸' : lang === 'jp' ? '個室' : 'Private Room'}
                            {privateRoomAddon && (
                              <small style={{ display: 'block', fontSize: '10px', color: '#b9a77c' }}>
                                +{formatCurrency(Number(privateRoomAddon.priceVND) || 0)} VND · {formatUSD(Number(privateRoomAddon.priceUSD) || 0)}
                              </small>
                            )}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {editingCartId === item.cartId ? (() => {
                    const rawOriginalName = item.names?.en?.trim().toLowerCase() || item.id;
                    const originalBaseNameEn = rawOriginalName.replace(/\s*\d+\s*(mins?|'|phút).*$/i, '').trim();
                    const activeBaseNameEn = editBaseName || originalBaseNameEn;
                    
                    const group = groupedVisibleServices.find(g => {
                      const first = g[0];
                      const firstRawName = first.names?.en?.trim().toLowerCase() || first.id;
                      const firstBaseName = firstRawName.replace(/\s*\d+\s*(mins?|'|phút).*$/i, '').trim();
                      return firstBaseName === activeBaseNameEn;
                    }) || [item];
                    
                    const sortedGroup = [...group].sort((a, b) => a.timeValue - b.timeValue);
                    const currentEditService = sortedGroup.find(s => s.id === editServiceId) || sortedGroup[0] || item;

                    return (
                      <div style={{ marginTop: '14px', borderRadius: '18px', background: 'linear-gradient(180deg, rgba(20,19,38,0.98), rgba(14,14,29,0.98))', border: '1px solid rgba(226,190,111,0.28)', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <strong style={{ fontSize: '16px', color: '#f2d58d' }}>{t('editService', lang)}</strong>
                          <button onClick={() => { setEditingCartId(null); setEditServiceId(null); setEditBaseName(null); }} style={{ width: '34px', height: '34px', border: 0, background: 'transparent', color: '#e2be6f', cursor: 'pointer', fontSize: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover:bg-[#e2be6f]/10" aria-label={t('close', lang)}>×</button>
                        </div>
                        
                        <div style={{ padding: '20px' }}>
                          <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8e8b9a', marginBottom: '8px', fontWeight: 750 }}>{t('service', lang)}</div>
                          <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <div 
                              onClick={() => {
                                const el = document.getElementById('custom-dropdown-options');
                                if (el) {
                                  el.style.display = el.style.display === 'none' ? 'block' : 'none';
                                }
                              }}
                              style={{ width: '100%', height: '48px', borderRadius: '12px', background: '#111226', border: '1px solid rgba(255,255,255,0.07)', padding: '0 14px', color: '#efeadf', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {(() => {
                                  const group = groupedVisibleServices.find(g => {
                                    const first = g[0];
                                    const firstRawName = first.names?.en?.trim().toLowerCase() || first.id;
                                    const firstBaseName = firstRawName.replace(/\s*\d+\s*(mins?|'|phút).*$/i, '').trim();
                                    return firstBaseName === activeBaseNameEn;
                                  });
                                  if (!group) return activeBaseNameEn;
                                  const f = group[0];
                                  const raw = f.names?.en?.trim() || f.id;
                                  const name = raw.replace(/\s*\d+\s*(mins?|'|phút).*$/i, '').trim();
                                  const rawDisplay = f.names?.[lang]?.replace(/\s*\d+\s*(mins?|'|phút).*$/i, '').trim() || f.names?.en?.replace(/\s*\d+\s*(mins?|'|phút).*$/i, '').trim() || name;
                                  return rawDisplay.replace(/\b\w/g, c => c.toUpperCase());
                                })()}
                              </span>
                              <ChevronDown size={14} style={{ color: '#8e8b9a' }} />
                            </div>
                            
                            <div id="custom-dropdown-options" style={{ display: 'none', position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#17162b', border: '1px solid rgba(226,190,111,0.15)', borderRadius: '12px', zIndex: 100, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                              {groupedVisibleServices.map(g => {
                                 const f = g[0];
                                 const raw = f.names?.en?.trim().toLowerCase() || f.id;
                                 const name = raw.replace(/\s*\d+\s*(mins?|'|phút).*$/i, '').trim();
                                 const rawDisplayName = f.names?.[lang]?.replace(/\s*\d+\s*(mins?|'|phút).*$/i, '').trim() || f.names?.en?.replace(/\s*\d+\s*(mins?|'|phút).*$/i, '').trim() || name;
                                 const displayName = rawDisplayName.replace(/\b\w/g, c => c.toUpperCase());
                                 const isSelected = activeBaseNameEn === name;
                                 
                                 return (
                                   <div 
                                     key={name}
                                     onClick={() => {
                                       setEditBaseName(name);
                                       const newGroup = groupedVisibleServices.find(grp => {
                                         const first = grp[0];
                                         const firstRaw = first.names?.en?.trim().toLowerCase() || first.id;
                                         return firstRaw.replace(/\s*\d+\s*(mins?|'|phút).*$/i, '').trim() === name;
                                       });
                                       if (newGroup && newGroup.length > 0) {
                                         const sortedNewGroup = [...newGroup].sort((a, b) => a.timeValue - b.timeValue);
                                         setEditServiceId(sortedNewGroup[0].id);
                                       }
                                       const el = document.getElementById('custom-dropdown-options');
                                       if (el) el.style.display = 'none';
                                     }}
                                     style={{ 
                                       padding: '12px 14px', 
                                       color: isSelected ? '#e2be6f' : '#efeadf', 
                                       background: isSelected ? 'rgba(226,190,111,0.05)' : 'transparent',
                                       cursor: 'pointer',
                                       borderBottom: '1px solid rgba(255,255,255,0.03)',
                                       fontSize: '14px',
                                       transition: 'background 0.2s'
                                     }}
                                     onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                     onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(226,190,111,0.05)' : 'transparent'; }}
                                   >
                                     {displayName}
                                   </div>
                                 );
                              })}
                            </div>
                          </div>

                          <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8e8b9a', marginBottom: '8px', fontWeight: 750 }}>{t('duration', lang)}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                            {sortedGroup.map(svc => {
                              const isActive = editServiceId === svc.id || currentEditService.id === svc.id;
                              return (
                                <button
                                  key={svc.id}
                                  onClick={() => setEditServiceId(svc.id)}
                                  style={{
                                    border: isActive ? '1px solid rgba(226,190,111,0.45)' : '1px solid rgba(255,255,255,0.08)',
                                    background: isActive ? 'rgba(226,190,111,0.13)' : '#111226',
                                    color: isActive ? '#f2d58d' : '#9b99a7',
                                    padding: '9px 13px',
                                    borderRadius: '999px',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                  }}
                                >
                                  {svc.timeValue} {dict.checkout?.mins || 'min'}
                                </button>
                              );
                            })}
                          </div>

                          {/* Custom Preferences Card with Edit Icon in Top Right */}
                          <div
                            onClick={() => {
                              setCustomizingService(currentEditService);
                              setEditingCustomCartId(item.cartId);
                              setEditingCustomInitialData({
                                strength: (item.options?.strength as any) || 'medium',
                                therapist: (item.options?.therapist as any) || 'random',
                                notes: {
                                  tag0: item.options?.notes?.tag0 ?? false,
                                  tag1: item.options?.notes?.tag1 ?? false,
                                  content: item.options?.notes?.content || '',
                                },
                                bodyParts: {
                                  focus: item.options?.bodyParts?.focus || [],
                                  avoid: item.options?.bodyParts?.avoid || [],
                                },
                                addons: item.options?.addons,
                              });
                            }}
                            className="group relative cursor-pointer p-3.5 mb-3 rounded-2xl bg-white/[0.03] hover:bg-[#c9a96e]/10 border border-white/10 hover:border-[#c9a96e]/40 transition-all shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#c9a96e]">
                                {lang === 'vi' ? 'Tùy chỉnh của bạn' : lang === 'cn' ? '您的个性化定制' : lang === 'jp' ? 'お客様のカスタマイズ' : lang === 'kr' ? '맞춤 설정' : 'Custom Preferences'}
                              </span>
                              <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-[#c9a96e]/20 flex items-center justify-center text-[#c9a96e] transition-colors">
                                <Edit3 size={13} />
                              </div>
                            </div>
                            <div className="text-xs text-[#d1cbbd] flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>{lang === 'vi' ? 'Lực:' : lang === 'cn' ? '力度:' : lang === 'jp' ? '強さ:' : lang === 'kr' ? '강도:' : 'Strength:'} <strong className="text-[#f2d58d] capitalize">{(item.options?.strength && (dict.options?.strength_levels as any)?.[item.options.strength.toLowerCase()]) || item.options?.strength || 'Medium'}</strong></span>
                              <span>{lang === 'vi' ? 'KTV:' : lang === 'cn' ? '技师:' : lang === 'jp' ? 'セラピスト:' : lang === 'kr' ? '관리사:' : 'Therapist:'} <strong className="text-[#f2d58d] capitalize">{(item.options?.therapist && (dict.options?.therapist_options as any)?.[item.options.therapist.toLowerCase()]) || item.options?.therapist || 'Random'}</strong></span>
                              {item.options?.bodyParts?.focus?.length ? (
                                <span>{lang === 'vi' ? 'Tập trung:' : lang === 'cn' ? '重点:' : lang === 'jp' ? '重点:' : lang === 'kr' ? '집중:' : 'Focus:'} <strong className="text-[#f2d58d]">{isWholeBodyParts(item.options.bodyParts.focus) ? (dict.custom_for_you?.full_body || (lang === 'vi' ? 'Toàn thân' : lang === 'cn' ? '全身' : lang === 'jp' ? '全身' : lang === 'kr' ? '전신' : 'Full Body')) : item.options.bodyParts.focus.map(p => translatePart(p, lang)).join(', ')}</strong></span>
                              ) : null}
                              {item.options?.bodyParts?.avoid?.length ? (
                                <span>{lang === 'vi' ? 'Tránh:' : lang === 'cn' ? '避开:' : lang === 'jp' ? '避ける:' : lang === 'kr' ? '피할:' : 'Avoid:'} <strong className="text-red-400">{isWholeBodyParts(item.options.bodyParts.avoid) ? (dict.custom_for_you?.full_body || (lang === 'vi' ? 'Toàn thân' : lang === 'cn' ? '全身' : lang === 'jp' ? '全身' : lang === 'kr' ? '전신' : 'Full Body')) : item.options.bodyParts.avoid.map(p => translatePart(p, lang)).join(', ')}</strong></span>
                              ) : null}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ color: '#858391' }}>{t('updatedPrice', lang)}</span>
                            <strong style={{ color: '#f2d58d', fontSize: '25px' }}>
                              {formatCurrency(currentEditService.priceVND)} VND <small>{formatUSD(currentEditService.priceUSD)}</small>
                            </strong>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 px-4 pb-4 sm:px-5 sm:pb-5">
                           <input 
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              placeholder={t('additionalNotes', lang)}
                              className="h-[48px] flex-1 w-full rounded-[14px] bg-transparent border border-white/10 text-[#a3a1ad] px-4 outline-none focus:border-[#c9a96e]/50 text-base"
                           />
                           <button 
                             onClick={() => {
                               replaceCartItemService(item.cartId, currentEditService, { ...item.options, notes: { tag0: item.options?.notes?.tag0 ?? false, tag1: item.options?.notes?.tag1 ?? false, content: editNote } });
                               setEditingCartId(null);
                               setEditServiceId(null);
                               setEditBaseName(null);
                             }}
                             className="h-[48px] px-6 rounded-[14px] font-bold text-[15px] bg-gradient-to-r from-[#ecd38f] to-[#c6a55f] text-[#2c2416] whitespace-nowrap shrink-0 w-full sm:w-auto"
                           >
                             {t('save', lang)}
                           </button>
                        </div>
                      </div>
                    );
                  })() : (
                    (item.options?.notes?.content || item.options?.notes?.tag0 || item.options?.notes?.tag1) && (
                      <div className={styles.detail}>
                        <span>{t('note', lang)}</span>
                        <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%', textAlign: 'right' }}>
                          {[
                            item.options?.notes?.tag0 ? (dict.tags?.pregnant || 'Pregnant') : null,
                            item.options?.notes?.tag1 ? (dict.tags?.allergy || 'Allergy') : null,
                            item.options?.notes?.content
                          ].filter(Boolean).join(', ')}
                        </strong>
                      </div>
                    )
                  )}
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
              <span className={styles.amount}>
                <span>{formatCurrency(totalVND)} VND</span>
                <small>{formatUSD(totalUSD)}</small>
              </span>
            </div>
            <div className={styles.vatNote}>{t('vat', lang)}</div>

            <button 
              className={styles.primaryButton} 
              type="button" 
              disabled={cart.length === 0} 
              onClick={handleConfirmOrder}
            >
              {t('confirm', lang)}
            </button>
          </aside>
        </div>
      </main>

      
      {customizingService && (
        <CustomForYouModal
            isOpen={!!customizingService}
            onClose={() => {
              setCustomizingService(null);
              setPendingServiceQuantity(1);
              setEditingCustomCartId(null);
              setEditingCustomInitialData(null);
              if (returnToConfirmAfterEdit) {
                setReturnToConfirmAfterEdit(false);
                window.setTimeout(() => setIsConfirmOpen(true), 100);
              } else if (returnToServicePickerOnCancel) {
                setReturnToServicePickerOnCancel(false);
                setIsServicePickerOpen(true);
              }
            }}
            onSave={handleSaveCustom}
            serviceData={{
                ID: customizingService.id,
                NAMES: customizingService.names as Record<string, string>,
                FOCUS_POSITION: customizingService.FOCUS_POSITION as any,
                TAGS: customizingService.TAGS as any,
                SHOW_STRENGTH: customizingService.SHOW_STRENGTH,
                HINT: customizingService.HINT as Record<string, string>,
                PRICE_VN: customizingService.priceVND,
                PRICE_USD: customizingService.priceUSD,
                SHOW_NOTES: customizingService.SHOW_NOTES,
                SHOW_PREFERENCES: customizingService.SHOW_PREFERENCES,
                SHOW_GENDER: customizingService.SHOW_GENDER,
                SHOW_FOCUS: customizingService.SHOW_FOCUS,
            }}
            lang={lang as any}
            initialData={editingCustomInitialData || undefined}
            privateRoomPriceVND={privateRoomAddon ? Number(privateRoomAddon.priceVND) || 0 : undefined}
            privateRoomPriceUSD={privateRoomAddon ? Number(privateRoomAddon.priceUSD) || 0 : undefined}
        />
      )}

      <OrderConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleFinalSubmit}
        lang={lang}
        dict={dict}
        cart={cart}
        customerInfo={customerInfo}
        paymentMethod={paymentMethod}
        amountPaid={0}
        guestCount={guestCount}
        bookingDate={bookingDate}
        bookingTime={bookingTime}
        onEditService={(item) => {
          setIsConfirmOpen(false);
          setReturnToConfirmAfterEdit(true);
          handleEditCartItemCustomization(item);
        }}
        onEditCustomerInfo={() => {
          setIsConfirmOpen(false);
        }}
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
        onConfirm={(service, quantity) => {
          addService(service, quantity);
        }}
        cart={cart}
        onUpdateCartItem={updateCartItem}
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
            <button type="button" className={styles.videoPreviewClose} onClick={closeVideoPreview} aria-label={t('close', lang)}>
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
              <button type="button" className={styles.servicePickerClose} onClick={() => setIsServicePickerOpen(false)} aria-label={t('close', lang)}>
                <X size={22} />
              </button>
            </header>

            <div className={styles.tabsScrollWrapper}>
              <div className={styles.servicePickerTabs}>
                
                {categoryIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={`${styles.pickerTab} ${activeCategory === id ? styles.activeTab : ''}`}
                    onClick={(event) => {
                      setActiveCategory(id);
                      event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }}
                  >
                    {id !== 'all' && (
                      <div
                        className={styles.categoryIcon}
                        style={{
                          maskImage: `url(${getCategoryIcon(id)})`,
                          WebkitMaskImage: `url(${getCategoryIcon(id)})`
                        }}
                        aria-hidden="true"
                      />
                    )}
                    <span>{categoryName(id, lang)}</span>
                  </button>
                ))}
              </div>
              <div className={styles.tabsScrollArrow} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
            </div>

            <div className={styles.servicePickerList}>
              {servicesLoading ? (
                <div className={styles.servicePickerState}>{t('loadingServices', lang)}</div>
              ) : servicesError ? (
                <div className={styles.servicePickerState} role="alert">
                  {lang === 'vi' ? 'Không thể tải dịch vụ. Vui lòng thử lại.' : lang === 'cn' ? '无法加载服务，请重试。' : lang === 'jp' ? 'サービスを読み込めません。もう一度お試しください。' : lang === 'kr' ? '서비스를 불러올 수 없습니다. 다시 시도해 주세요.' : 'Services are unavailable. Please try again.'}
                </div>
              ) : groupedVisibleServices.length ? (
                groupedVisibleServices.map((group) => (
                  <CheckoutGroupedServiceCard
                    key={group[0].id}
                    group={group}
                    lang={lang}
                    dict={dict}
                    addService={addService}
                    openDurationDrawer={setActiveDrawerGroup}
                    openVideoPreview={openVideoPreview}
                    cart={cart}
                    onUpdateCartItem={updateCartItem}
                    onEditCustomItem={handleEditCartItemCustomization}
                  />
                ))
              ) : (
                <div className={styles.servicePickerState}>{t('noServicesFound', lang)}</div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
