// Header.tsx - Sticky Navigation with transparent-to-solid effect
'use client';

import { Z } from '@/lib/zIndex';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MapPin, ChevronUp, ChevronDown, ShoppingCart } from 'lucide-react';
import SmartLogo from '@/components/SmartLogo';
import type { CartItem } from '@/components/Menu/types';
import { formatCurrency } from '@/components/Menu/utils';
import { readBookingCart, removeBookingCartItemByCartId, updateBookingCartItemQuantity, updateBookingCartItemNote } from '@/lib/bookingCartStorage';
import { useHeaderLogic, LANGUAGES } from './Header.logic';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { Locale } from '@/lib/constants';
import { getDictionary } from '@/lib/dictionaries';

// 🔧 UI CONFIGURATION
const HEADER_TRANSITION_DURATION = 0.3;
const MOBILE_MENU_DURATION = 0.25;

type NavChildItem = {
  id?: string;
  label: string;
  href: string;
  target?: string;
  isComingSoon?: boolean;
  badge?: string;
};

type NavItem = {
  id?: string;
  label: string;
  href?: string;
  target?: string;
  isUnclickable?: boolean;
  isComingSoon?: boolean;
  col?: 'left' | 'right';
  children?: NavChildItem[];
};

const BOOK_COPY: Record<string, string> = {
  vi: 'Đặt lịch',
  en: 'Book',
  cn: '预约',
  jp: '予約',
  kr: '예약',
};

const NAV_FALLBACKS: Record<string, Record<Locale, string>> = {
  spaces: { vi: 'Không gian', en: 'Spaces', cn: '空间', jp: '空間', kr: '공간' },
  area_lobby: { vi: 'Khu vực đón tiếp', en: 'Welcome area', cn: '接待区', jp: 'ウェルカムエリア', kr: '웰컴 구역' },
  area_l1: { vi: 'Tầng 1', en: 'First Floor', cn: '一楼', jp: '1階', kr: '1층' },
  area_l2: { vi: 'Tầng 2', en: 'Second Floor', cn: '二楼', jp: '2階', kr: '2층' },
  services: { vi: 'Dịch vụ', en: 'Services', cn: '服务', jp: 'サービス', kr: '서비스' },
  design_journey: { vi: 'Thiết kế hành trình', en: 'Design Your Journey', cn: '定制您的专属旅程', jp: 'ジャーニーをデザイン', kr: '나만의 여정 디자인' },
  pure_relaxation: { vi: 'Thư giãn thuần túy', en: 'Pure relaxation', cn: '纯粹放松', jp: 'ピュアリラクゼーション', kr: '순수한 휴식' },
  therapy: { vi: 'Trị liệu', en: 'Therapy', cn: '理疗', jp: 'セラピー', kr: '테라피' },
  academy: { vi: 'Học viện', en: 'Academy', cn: '学院', jp: 'アカデミー', kr: '아카데미' },
  academy_admissions: { vi: 'Tuyển dụng / Nhập học', en: 'Recruitment/Admission', cn: '招聘/入学', jp: '採用・入学', kr: '채용 / 입학' },
  academy_training: { vi: 'Đào tạo / Trực tuyến', en: 'Training / Online', cn: '培训/在线', jp: 'トレーニング・オンライン', kr: '교육 / 온라인' },
  academy_certification: { vi: 'Chứng nhận', en: 'Certification', cn: '认证', jp: '認定', kr: '인증' },
  academy_understand: { vi: 'Thấu hiểu bản thân', en: 'Understand Yourself', cn: '了解自我', jp: '自分を知る', kr: '자신을 이해하기' },
  local_tour: { vi: 'Tour địa phương', en: 'Local tour', cn: '当地旅游', jp: 'ローカルツアー', kr: '로컬 투어' },
  lost_and_found: { vi: 'Thất lạc & Tìm kiếm', en: 'Lost & Found', cn: '失物招领', jp: '遺失物', kr: '분실물' },
  blogs: { vi: 'Bài viết', en: 'Blogs', cn: '博客', jp: '블로그', kr: '블로그' },
  privileges: { vi: 'Đặc quyền của bạn', en: 'Your privileges', cn: '专属特权', jp: '会員特典', kr: '회원 혜택' },
  our_story: { vi: 'Câu chuyện của chúng tôi', en: 'Our story', cn: '品牌故事', jp: '私たちの物語', kr: '브랜드 이야기' },
  history: { vi: 'Lịch sử', en: 'History', cn: '历史', jp: '履歴', kr: '이용 내역' },
};

const getNavFallback = (id: string, currentLocale: Locale): string => {
  return NAV_FALLBACKS[id]?.[currentLocale] || NAV_FALLBACKS[id]?.en || id;
};

// Navigation items matching Canva design
const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: 'spaces',
    label: 'Spaces',
    href: '/space',
    children: [
      { id: 'area_lobby', label: 'Welcome area', href: '/space#welcome' },
      { id: 'area_l1', label: 'First Floor', href: '/space#floor1' },
      { id: 'area_l2', label: 'Second Floor', href: '/space#floor2' },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    isUnclickable: true,
    children: [
      { id: 'design_journey', label: 'Design Your Journey', href: '/design-your-journey', badge: '50%' },
      { id: 'pure_relaxation', label: 'Pure relaxation', href: '/pure-relaxation', badge: '30%' },
      { id: 'therapy', label: 'Therapy', href: '/therapy', badge: '20%' },
    ],
  },
  {
    id: 'academy',
    label: 'Academy',
    isUnclickable: true,
    children: [
      { id: 'academy_admissions', label: 'Recruitment/Admission', href: '/academy/admissions' },
      { id: 'academy_training', label: 'Training / Online', href: '/academy/training' },
      { id: 'academy_certification', label: 'Certification', href: '/academy/certification' },
      { id: 'academy_understand', label: 'Understand Yourself', href: '/academy/understand-yourself' },
    ],
  },
  { id: 'local_tour', label: 'Local tour', href: '/local-tour' },
  { id: 'lost_and_found', label: 'Lost & Found', href: '/lost-and-found' },
  { id: 'blogs', label: 'Blogs', href: '/blogs' },
  { id: 'privileges', label: 'Your privileges', href: '/privileges' },
  { id: 'our_story', label: 'Our story', href: '/#our-story' },
  { id: 'history', label: 'History', href: '/#history' },
];

const CART_COPY = {
  title: { vi: 'Giỏ hàng', en: 'Cart', cn: '购物车', jp: 'カート', kr: '장바구니' },
  empty: {
    vi: 'Giỏ hàng chưa có dịch vụ.',
    en: 'No selected service',
    cn: '尚未选择服务',
    jp: 'サービスが選択されていません',
    kr: '선택된 서비스가 없습니다',
  },
  subtotal: { vi: 'Tạm tính', en: 'Subtotal', cn: '小计', jp: '小計', kr: '소계' },
  placeOrder: { vi: 'Tiến hành đặt lịch', en: 'Place order', cn: '提交订单', jp: '予約へ進む', kr: '예약하기' },
  taxNote: { vi: 'Thuế và ưu đãi được áp dụng ở bước thanh toán.', en: 'Taxes and discounts calculated at checkout.', cn: '税费和优惠在结账时计算。', jp: '税金と割引は会計時に計算されます。', kr: '세금 및 할인은 결제 시 계산됩니다.' },
  explore: { vi: 'Khám phá dịch vụ', en: 'Explore our services', cn: '探索我们的服务', jp: 'サービスを見る', kr: '서비스 살펴보기' },
  mins: { vi: 'phút', en: 'mins', cn: '分钟', jp: '分', kr: '분' },
  vipRoom: { vi: 'Phòng VIP', en: 'VIP Room', cn: '贵宾室', jp: 'VIPルーム', kr: 'VIP 룸' },
  remove: { vi: 'XÓA', en: 'REMOVE', cn: '删除', jp: '削除', kr: '삭제' },
  addon: { vi: 'Tiện ích bổ sung:', en: 'Add-on:', cn: '附加项目:', jp: 'アドオン:', kr: '추가 항목:' },
  notePlaceholder: {
    vi: 'Ghi chú cho dịch vụ này...',
    en: 'Add a note...',
    cn: '为此服务添加备注...',
    jp: 'メモを追加...',
    kr: '메모 추가...',
  },
};

const cartText = (key: keyof typeof CART_COPY, lang: string) =>
  (CART_COPY[key] as Record<string, string>)[lang] || CART_COPY[key].en;

const itemName = (item: CartItem, lang: string) =>
  item.names?.[lang] || item.names?.en || item.names?.vi || item.id;

const countCartItems = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.qty, 0);

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

const Header = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartSnapshot, setCartSnapshot] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [activeBrandIndex, setActiveBrandIndex] = useState(0);

  const { 
    isMobileMenuOpen, 
    isScrolled, 
    toggleMobileMenu,
    currentLang,
    isLangDropdownOpen,
    toggleLangDropdown,
    handleSelectLanguage,
    langDropdownRef,
    t
  } = useHeaderLogic();
  
  const { systemSettings, getLocalizedText } = useSystemSettings();
  const hpNav = systemSettings?.homepage_content?.navigation;
  const lang = currentLang.code as Locale;
  const dict = getDictionary(lang);

  const BRANDS = useMemo(() => {
    const isVi = currentLang.code === 'vi';
    const isCn = currentLang.code === 'cn';
    const isJp = currentLang.code === 'jp';
    const isKr = currentLang.code === 'kr';

    const hcm = isVi ? 'TP. Hồ Chí Minh' : isCn ? '胡志明市' : isJp ? 'ホーチミン' : isKr ? '호치민' : 'Ho Chi Minh';
    const dongNai = isVi ? 'Đồng Nai' : isCn ? '同奈' : isJp ? 'ドンナイ' : isKr ? '동나이' : 'Dong Nai';
    const store = isVi ? 'Cửa hàng' : isCn ? '商店' : isJp ? 'ストア' : isKr ? '스토어' : 'Store';
    const retreat = isVi ? 'Nghỉ dưỡng' : isCn ? '度假村' : isJp ? 'リトリート' : isKr ? '리트릿' : 'Retreat';

    return [
      { name: 'Oria Spa', location: hcm, href: '/' },
      { name: 'Oria Home', location: hcm, href: '/oriahome' },
      { name: 'Oria Farm', sub: store, location: hcm, href: '/oriafarm-store' },
      { name: 'Oria Farm', sub: retreat, location: dongNai, href: '/oriafarm-retreat' }
    ];
  }, [currentLang.code]);

  const nextBrand = () => {
    setActiveBrandIndex((prev) => (prev + 1) % BRANDS.length);
  };
  
  const prevBrand = () => {
    setActiveBrandIndex((prev) => (prev - 1 + BRANDS.length) % BRANDS.length);
  };

  const NAV_ITEMS = useMemo(() => {
    return [
      {
        id: 'spaces',
        label: getLocalizedText(hpNav?.spaces, lang, getNavFallback('spaces', lang)),
        href: '/space',
        children: [
          { id: 'area_lobby', label: getLocalizedText(hpNav?.welcomeArea, lang, getNavFallback('area_lobby', lang)), href: '/space#welcome' },
          { id: 'area_l1', label: getLocalizedText(hpNav?.firstFloor, lang, getNavFallback('area_l1', lang)), href: '/space#floor1' },
          { id: 'area_l2', label: getLocalizedText(hpNav?.secondFloor, lang, getNavFallback('area_l2', lang)), href: '/space#floor2' }
        ]
      },
      {
        id: 'services',
        label: getLocalizedText(hpNav?.services, lang, getNavFallback('services', lang)),
        isUnclickable: true,
        children: [
          { id: 'design_journey', label: getLocalizedText(hpNav?.designJourney, lang, getNavFallback('design_journey', lang)), href: '/design-your-journey', badge: '50%' },
          { id: 'pure_relaxation', label: getLocalizedText(hpNav?.pureRelaxation, lang, getNavFallback('pure_relaxation', lang)), href: '/pure-relaxation', badge: '30%' },
          { id: 'therapy', label: getLocalizedText(hpNav?.therapy, lang, getNavFallback('therapy', lang)), href: '/therapy', badge: '20%' },
        ],
      },
      {
        id: 'academy',
        label: getLocalizedText(hpNav?.academy, lang, getNavFallback('academy', lang)),
        isUnclickable: true,
        children: [
          { id: 'academy_admissions', label: getLocalizedText(hpNav?.admissions, lang, getNavFallback('academy_admissions', lang)), href: '/academy/admissions' },
          { id: 'academy_training', label: getLocalizedText(hpNav?.training, lang, getNavFallback('academy_training', lang)), href: '/academy/training' },
          { id: 'academy_certification', label: getLocalizedText(hpNav?.certification, lang, getNavFallback('academy_certification', lang)), href: '/academy/certification' },
          { id: 'academy_understand', label: getLocalizedText(hpNav?.understandYourself, lang, getNavFallback('academy_understand', lang)), href: '/academy/understand-yourself' },
        ],
      },
      { id: 'local_tour', label: getLocalizedText(hpNav?.localTour, lang, getNavFallback('local_tour', lang)), href: '/local-tour' },
      { id: 'lost_and_found', label: getLocalizedText(hpNav?.lostAndFound, lang, getNavFallback('lost_and_found', lang)), href: '/lost-and-found' },
      { id: 'blogs', label: getLocalizedText(hpNav?.blogs, lang, getNavFallback('blogs', lang)), href: '/blogs' },
      { id: 'privileges', label: getLocalizedText(hpNav?.privileges, lang, getNavFallback('privileges', lang)), href: '/privileges' },
      { id: 'our_story', label: getLocalizedText(hpNav?.ourStory, lang, getNavFallback('our_story', lang)), href: '/#our-story' },
      { id: 'history', label: getLocalizedText(hpNav?.history, lang, getNavFallback('history', lang)), href: '/#history' },
    ] as NavItem[];
  }, [hpNav, lang, getLocalizedText]);

  const cartSubtotal = useMemo(
    () => cartSnapshot.reduce((sum, item) => sum + item.priceVND * item.qty, 0),
    [cartSnapshot]
  );

  const refreshCartSnapshot = () => {
    const nextCart = readBookingCart();
    setCartSnapshot(nextCart);
    setCartCount(countCartItems(nextCart));
    return nextCart;
  };

  useEffect(() => {
    refreshCartSnapshot();

    const syncCart = () => refreshCartSnapshot();
    window.addEventListener('storage', syncCart);
    window.addEventListener('nganha:cart-updated', syncCart);
    return () => {
      window.removeEventListener('storage', syncCart);
      window.removeEventListener('nganha:cart-updated', syncCart);
    };
  }, []);

  const handleCartClick = () => {
    refreshCartSnapshot();
    setIsCartOpen(true);
  };

  const handlePlaceOrder = () => {
    if (cartSnapshot.length === 0) return;
    window.location.href = `/${currentLang.code}/new-user/standard/checkout#cart`;
  };

  const handleRemoveCartItem = (cartId: string) => {
    const nextCart = removeBookingCartItemByCartId(cartId);
    setCartSnapshot(nextCart);
    setCartCount(countCartItems(nextCart));
    window.dispatchEvent(new CustomEvent('nganha:cart-updated', { detail: { cart: nextCart } }));
  };

  const handleQuantityChange = (cartId: string, delta: number) => {
    const nextCart = updateBookingCartItemQuantity(cartId, delta);
    setCartSnapshot(nextCart);
    setCartCount(countCartItems(nextCart));
    window.dispatchEvent(new CustomEvent('nganha:cart-updated', { detail: { cart: nextCart } }));
  };

  const handleNoteChange = (cartId: string, note: string) => {
    const nextCart = updateBookingCartItemNote(cartId, note);
    setCartSnapshot(nextCart);
    window.dispatchEvent(new CustomEvent('nganha:cart-updated', { detail: { cart: nextCart } }));
  };

  // Lock body scroll and hide floating widgets when fullscreen menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const renderCategory = (item: NavItem) => {
    const label = item.id ? t('header_menu', item.id) || item.label : item.label;
    return (
      <div key={item.id || item.href} className="nav-category-group">
        <h3 className="nav-category-title">
          {item.href ? (
            <Link
              href={item.href}
              target={item.target || undefined}
              onClick={toggleMobileMenu}
              className="hover:text-[#f7ebc7] transition-colors"
            >
              {label}
            </Link>
          ) : (
            label
          )}
        </h3>
        {item.children && (
          <div className="nav-category-children">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                target={child.target || undefined}
                className="nav-child-link"
                onClick={toggleMobileMenu}
              >
                <span>{child.id ? t('header_menu', child.id) || child.label : child.label}</span>
                {child.badge && <span className="text-[#41b8a6] ml-2 font-light">{child.badge}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const pathname = usePathname();
  const isCheckoutPage = pathname.includes('/checkout');
  const isHomepage = pathname === '/' || pathname === '/vi' || pathname === '/en';
  const isPageWithTopLogo = isHomepage || isCheckoutPage;
  const showLogo = !isPageWithTopLogo || isScrolled;

  return (
    <>
      <motion.header
        className={`site-header ${isScrolled ? 'header-scrolled' : 'header-transparent'}`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: HEADER_TRANSITION_DURATION, ease: 'easeOut' }}
      >
        <div className="header-inner-container">
          {/* Top Row: Mobile Toggle, Logo, Right Controls, Desktop Navigation */}
          <div className="header-top-row">
            {/* Mobile Toggle (now used for all screens) on the left */}
            <div className="header-top-left relative z-10">
              <button
                className="header-mobile-toggle !flex text-[#f7ebc7]"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={28} className="text-[#f7ebc7]" /> : <Menu size={28} className="text-[#f7ebc7]" />}
              </button>
            </div>

            {/* Center Logo */}
            <div className={`md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 transition-opacity duration-300 z-0 ml-4 md:ml-0 flex-1 md:flex-none flex justify-start md:justify-center ${showLogo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <a href="/" className="block mt-2 md:mt-3">
                <SmartLogo theme="dark" className="h-10 sm:h-14 md:h-[68px] w-auto object-contain cursor-pointer scale-100 md:scale-125" />
              </a>
            </div>

            {/* Desktop Navigation removed as per request, using Mobile Menu Drawer instead */}

            {/* Right Section: Languages, Login, Cart */}
            <div className="header-right relative z-10 flex items-center">
              {/* Book Button */}
              <Link 
                href={`/${currentLang.code}/new-user/standard/checkout`}
                className="text-[#f7ebc7] hover:text-[#f7ebc7]/80 active:opacity-50 font-bold text-[13px] sm:text-sm uppercase tracking-wider mr-2 sm:mr-3 lg:mr-6 transition-all duration-300 inline-flex items-center"
              >
                {BOOK_COPY[currentLang.code] || 'Book'}
              </Link>

              {/* Cart Button */}
              <button 
                type="button"
                className="relative text-[#f7ebc7] hover:text-[#D4AF37] mr-3 sm:mr-4 lg:mr-6 transition-colors duration-300 flex items-center justify-center p-1"
                onClick={handleCartClick}
                aria-label={
                  currentLang.code === 'vi' ? `Giỏ hàng, đã chọn ${cartCount} dịch vụ` :
                  currentLang.code === 'cn' ? `购物车，已选 ${cartCount} 项服务` :
                  currentLang.code === 'jp' ? `カート、${cartCount} 件選択中` :
                  currentLang.code === 'kr' ? `장바구니, ${cartCount}개 서비스 선택됨` :
                  `Cart, ${cartCount} services selected`
                }
              >
                <div 
                  className="w-[30px] h-[30px] bg-[#f7ebc7]" 
                  style={{
                    maskImage: 'url(/icons/shopping-cart.png)',
                    WebkitMaskImage: 'url(/icons/shopping-cart.png)',
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center'
                  }}
                  aria-hidden="true"
                />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-5 h-5 bg-[#e1272d] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Language Flag Selector (Global) */}
              <div className="lang-selector" ref={langDropdownRef}>
                <button 
                  className="lang-btn" 
                  onClick={toggleLangDropdown}
                  aria-expanded={isLangDropdownOpen}
                  aria-label="Select language"
                >
                  <img
                    src={`https://flagcdn.com/w40/${currentLang.countryCode}.png`}
                    srcSet={`https://flagcdn.com/w80/${currentLang.countryCode}.png 2x`}
                    alt={currentLang.label}
                    className="header-lang-flag-img"
                  />
                  <ChevronDown size={14} className={`lang-chevron text-[#f7ebc7] ${isLangDropdownOpen ? 'rotate' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                <div className={`lang-dropdown-menu ${isLangDropdownOpen ? 'open' : ''}`}>
                  {LANGUAGES.filter(l => l.code !== currentLang.code).map((lang) => (
                    <button
                      key={lang.code}
                      className="lang-dropdown-item"
                      onClick={() => handleSelectLanguage(lang)}
                    >
                      <img
                        src={`https://flagcdn.com/w40/${lang.countryCode}.png`}
                        srcSet={`https://flagcdn.com/w80/${lang.countryCode}.png 2x`}
                        alt={lang.label}
                        className="header-lang-flag-img"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <a href="https://www.google.com/maps/search/?api=1&query=Oria+Spa&query_place_id=ChIJ2ULTMCAvdTERA4I7Sei7vyY" target="_blank" rel="noopener noreferrer" className="header-icon-btn text-[#f7ebc7]" aria-label="Location">
                <MapPin size={20} className="text-[#f7ebc7]" />
              </a>
            </div>
          </div>
        </div>

        {/* Full-screen Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              className="nav-fullscreen-overlay"
              style={{ zIndex: 99 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MOBILE_MENU_DURATION }}
            >
              {/* Sticky Top Header Bar with Close Button and Brand Logo */}
              <div className="nav-fullscreen-header sticky top-0 z-50 flex items-center justify-between w-full px-5 py-3.5 sm:px-8 sm:py-4 md:px-12 md:py-6 bg-[#281B15]/95 backdrop-blur-md border-b border-[rgba(247,235,199,0.1)]">
                <button 
                  className="nav-fullscreen-close text-[#f7ebc7] hover:text-[#D4AF37] active:scale-95 transition-all p-1.5 -ml-1.5 focus:outline-none flex items-center justify-center rounded-lg hover:bg-white/5" 
                  onClick={toggleMobileMenu}
                  aria-label="Close menu"
                >
                  <X size={28} className="sm:w-8 sm:h-8" strokeWidth={1.5} />
                </button>
                <div className="flex-1 flex justify-center md:hidden">
                  <SmartLogo theme="dark" className="h-8 w-auto object-contain" />
                </div>
                <div className="w-8 md:hidden"></div>
              </div>

              <div className="nav-fullscreen-inner">
                {/* Left Panel: Navigation Links */}
                <div className="nav-panel-left">
                  {/* Mobile Flow (<768px): 1 unified sequential list in exact order: 1. Space -> 2. Services -> 3. Academy -> 4. Local tour -> 5. Blogs -> 6. Privileges -> 7. History */}
                  <div className="nav-links-mobile md:hidden flex flex-col gap-7 w-full">
                    {NAV_ITEMS.map((item) => renderCategory(item))}
                  </div>

                  {/* Tablet Flow (768px - 1023px): 2 balanced columns: Col 1 (Space, Services), Col 2 (Academy, Local tour, Blogs, Privileges, History) */}
                  <div className="nav-links-tablet hidden md:flex lg:hidden gap-10 w-full">
                    <div className="nav-links-col flex-1 flex flex-col gap-8">
                      {NAV_ITEMS.filter(item => !!item.id && ['spaces', 'services'].includes(item.id)).map(item => renderCategory(item))}
                    </div>
                    <div className="nav-links-col flex-1 flex flex-col gap-8">
                      {NAV_ITEMS.filter(item => !!item.id && ['academy', 'local_tour', 'lost_and_found', 'blogs', 'privileges', 'history'].includes(item.id)).map(item => renderCategory(item))}
                    </div>
                  </div>

                  {/* Desktop Flow (>=1024px): 2 balanced columns */}
                  <div className="nav-links-desktop hidden lg:flex gap-12 w-full">
                    <div className="nav-links-col flex-1 flex flex-col gap-10">
                      {NAV_ITEMS.filter(item => !!item.id && ['spaces', 'services'].includes(item.id)).map(item => renderCategory(item))}
                    </div>
                    <div className="nav-links-col flex-1 flex flex-col gap-10">
                      {NAV_ITEMS.filter(item => !!item.id && ['academy', 'local_tour', 'lost_and_found', 'blogs', 'privileges', 'history'].includes(item.id)).map(item => renderCategory(item))}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Sub-brands Card */}
                <div 
                  className="nav-panel-right"
                  style={hpNav?.bgImage ? { backgroundImage: `url('${hpNav.bgImage}')` } : undefined}
                >
                  <div className="nav-panel-card">
                    <div className="nav-card-header">
                      <SmartLogo theme="dark" className="nav-card-logo object-contain" />
                      <div className="nav-card-divider"></div>
                    </div>
                    
                    <div className="nav-card-brands flex flex-col gap-4 sm:gap-5">
                      {[0, 1, 2, 3].map((offset) => {
                        const index = (activeBrandIndex + offset) % BRANDS.length;
                        const brand = BRANDS[index];
                        const isFaded = offset === 3;
                        return (
                          <Link 
                            href={brand.href}
                            className="nav-brand-item block cursor-pointer" 
                            key={`${brand.name}-${index}`}
                            style={{ opacity: isFaded ? 0.35 : 1, transition: 'opacity 0.3s' }}
                            onClick={() => { if(isMobileMenuOpen) toggleMobileMenu(); }}
                          >
                            <h4 className="nav-brand-name hover:text-[#D4AF37] transition-colors">
                              {brand.name}
                              {brand.sub && <><br/>{brand.sub}</>}
                            </h4>
                            <p className="text-[#f7ebc7]/60 text-xs tracking-[0.15em] uppercase mt-1.5 font-light">{brand.location}</p>
                          </Link>
                        );
                      })}

                      {/* Side-by-side Arrows */}
                      <div className="flex justify-center gap-6 mt-3 sm:mt-4">
                        <button onClick={prevBrand} className="text-[#f7ebc7] hover:text-[#D4AF37] active:text-[#b89529] active:scale-95 transition-all p-1" aria-label="Previous Brand">
                          <ChevronUp size={26} strokeWidth={1.5} />
                        </button>
                        <button onClick={nextBrand} className="text-[#f7ebc7] hover:text-[#D4AF37] active:text-[#b89529] active:scale-95 transition-all p-1" aria-label="Next Brand">
                          <ChevronDown size={26} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.button
              type="button"
              className="nav-cart-backdrop fixed inset-0 bg-[#3a3528]/80 backdrop-blur-sm" style={{ zIndex: Z.DRAWER_OVERLAY }}
              aria-label="Close cart"
              onClick={() => setIsCartOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="nav-cart-drawer fixed top-0 right-0 bg-[#F4F1EB] flex flex-col px-6" style={{ zIndex: Z.DRAWER, width: '100%', maxWidth: '340px', maxHeight: '100vh', boxShadow: '-6px 0 24px rgba(0,0,0,0.16)' }}
              role="dialog"
              aria-modal="true"
              aria-label={cartText('title', currentLang.code)}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <header className="relative pt-6 pb-4 mb-2 flex-shrink-0">
                <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-2 block">Oria Spa</span>
                <h2 className="font-sans text-3xl text-[#1a1a1a] pb-4 border-b border-[#D4AF37] w-fit pr-10">
                  {cartText('title', currentLang.code)}
                </h2>
                <button type="button" className="absolute top-6 right-0 w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-black transition-colors" onClick={() => setIsCartOpen(false)} aria-label="Close cart">
                  <X size={16} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
                {cartSnapshot.length ? (
                  cartSnapshot.map((item) => (
                    <article className="py-6 border-b border-gray-200 grid grid-cols-[72px_1fr] gap-5" key={item.cartId}>
                      {item.img ? (
                        <img src={item.img} alt={itemName(item, currentLang.code)} className="w-[72px] h-[72px] object-cover bg-[#E5DFD3]" />
                      ) : (
                        <span className="w-[72px] h-[72px] bg-[#E5DFD3] block" aria-hidden="true" />
                      )}
                      <div className="flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <strong className="font-sans text-[16px] font-normal text-[#1a1a1a] block leading-snug">{itemName(item, currentLang.code)}</strong>
                            <p className="font-sans text-[11px] text-gray-500 mt-2 uppercase tracking-wider">
                              {item.timeValue > 0 ? `${item.timeValue} ${cartText('mins', currentLang.code)}` : item.timeDisplay}
                            </p>
                            
                                {/* Render Options */}
                                {(item.options?.therapist || item.options?.strength || (item.options?.bodyParts?.focus?.length || 0) > 0 || (item.options?.bodyParts?.avoid?.length || 0) > 0 || item.options?.addons?.privateRoom) && (
                                  <div className="mt-2 space-y-1">
                                    {item.options?.therapist && (
                                      <p className="font-sans text-[11px] text-gray-600">
                                        <span className="text-gray-400 capitalize">{dict.checkout?.therapist || 'KTV'}:</span> <span style={{ textTransform: 'capitalize' }}>
                                          {/* @ts-ignore */} 
                                          {dict.options?.therapist_options?.[item.options.therapist?.toLowerCase()] || item.options.therapist}
                                        </span>
                                      </p>
                                    )}
                                    {item.options?.strength && (
                                      <p className="font-sans text-[11px] text-gray-600">
                                        <span className="text-gray-400 capitalize">{dict.checkout?.strength || 'Lực'}:</span> <span style={{ textTransform: 'capitalize' }}>
                                          {/* @ts-ignore */} 
                                          {dict.options?.strength_levels?.[item.options.strength?.toLowerCase()] || item.options.strength}
                                        </span>
                                      </p>
                                    )}
                                    {item.options?.bodyParts?.focus && item.options.bodyParts.focus.length > 0 && (
                                      <p className="font-sans text-[11px] text-gray-600">
                                        <span className="text-gray-400 capitalize">{dict.checkout?.focus || (currentLang.code === 'vi' ? 'Tập trung:' : currentLang.code === 'cn' ? '重点部位:' : currentLang.code === 'jp' ? '重点部位:' : currentLang.code === 'kr' ? '집중 부위:' : 'Focus:')}</span> {(item.options.bodyParts.focus.length >= 6 || item.options.bodyParts.focus.some(p => (p || '').toUpperCase().includes('WHOLE') || (p || '').toUpperCase().includes('FULL'))) ? (dict.custom_for_you?.full_body || (currentLang.code === 'vi' ? 'Toàn thân' : currentLang.code === 'cn' ? '全身' : currentLang.code === 'jp' ? '全身' : currentLang.code === 'kr' ? '전신' : 'Full Body')) : item.options.bodyParts.focus.map(p => translatePart(p, currentLang.code)).join(', ')}
                                      </p>
                                    )}
                                    {item.options?.bodyParts?.avoid && item.options.bodyParts.avoid.length > 0 && (
                                      <p className="font-sans text-[11px] text-gray-600">
                                        <span className="text-gray-400 capitalize">{dict.checkout?.avoid || (currentLang.code === 'vi' ? 'Tránh:' : currentLang.code === 'cn' ? '避开部位:' : currentLang.code === 'jp' ? '避ける部位:' : currentLang.code === 'kr' ? '피할 부위:' : 'Avoid:')}</span> {(item.options.bodyParts.avoid.length >= 6 || item.options.bodyParts.avoid.some(p => (p || '').toUpperCase().includes('WHOLE') || (p || '').toUpperCase().includes('FULL'))) ? (dict.custom_for_you?.full_body || (currentLang.code === 'vi' ? 'Toàn thân' : currentLang.code === 'cn' ? '全身' : currentLang.code === 'jp' ? '全身' : currentLang.code === 'kr' ? '전신' : 'Full Body')) : item.options.bodyParts.avoid.map(p => translatePart(p, currentLang.code)).join(', ')}
                                      </p>
                                    )}
                                    {item.options?.addons?.privateRoom && (
                                      <p className="font-sans text-[11px] text-gray-600">
                                        <span className="text-gray-400 capitalize">{cartText('addon', currentLang.code)}</span> <span className="text-[#c9a96e]">{currentLang.code === 'vi' ? 'Phòng riêng (+105K)' : currentLang.code === 'cn' ? '包间 (+105K)' : currentLang.code === 'kr' ? '프라이빗 룸 (+105K)' : currentLang.code === 'jp' ? '個室 (+105K)' : 'Private Room (+105K)'}</span>
                                      </p>
                                    )}
                                  </div>
                                )}
                          </div>
                        </div>
                        <div className="mt-3">
                          <input 
                            type="text" 
                            placeholder={cartText('notePlaceholder', currentLang.code)} 
                            className="w-full text-[12px] p-2 border border-gray-200 bg-white font-sans text-[#1a1a1a] outline-none focus:border-[#D4AF37] transition-colors placeholder-gray-400 rounded-none"
                            value={item.options?.notes?.content || ''}
                            onChange={(e) => handleNoteChange(item.cartId, e.target.value)}
                          />
                        </div>
                        <div className="flex justify-between items-end mt-5">
                          <div className="flex items-center border border-gray-300 text-gray-600 text-[12px] font-sans px-2 py-1">
                            <button type="button" className="px-2 hover:text-black" aria-label="Decrease quantity" onClick={() => handleQuantityChange(item.cartId, -1)}>-</button>
                            <span className="px-3">{item.qty || 1}</span>
                            <button type="button" className="px-2 hover:text-black" aria-label="Increase quantity" onClick={() => handleQuantityChange(item.cartId, 1)}>+</button>
                          </div>
                          <div className="text-right">
                            <div className="font-sans text-[15px] font-medium text-[#1a1a1a] mb-2">{formatCurrency(item.priceVND)} đ</div>
                            <button
                              type="button"
                              className="font-sans text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                              onClick={() => handleRemoveCartItem(item.cartId)}
                              aria-label={currentLang.code === 'vi' ? `Xóa ${itemName(item, currentLang.code)} khỏi giỏ hàng` : `Remove ${itemName(item, currentLang.code)} from cart`}
                            >
                              {cartText('remove', currentLang.code)}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center text-center">
                    <p className="font-sans text-[12px] uppercase tracking-widest text-gray-500 mb-6">{cartText('empty', currentLang.code)}</p>
                    <a href="/#services" className="font-sans text-[11px] uppercase tracking-[0.2em] border-b border-[#D4AF37] pb-1 text-[#1a1a1a] hover:text-[#D4AF37] transition-colors" onClick={() => setIsCartOpen(false)}>
                      {cartText('explore', currentLang.code)}
                    </a>
                  </div>
                )}
              </div>

              <footer className="pt-4 pb-6 bg-[#F4F1EB] sticky bottom-0 border-t border-gray-200 flex-shrink-0">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="font-sans text-[11px] uppercase tracking-widest text-gray-500">{cartText('subtotal', currentLang.code)}</span>
                  <strong className="font-sans text-[18px] font-medium text-[#1a1a1a]">{formatCurrency(cartSubtotal)} đ</strong>
                </div>
                <p className="font-sans text-[11px] text-gray-500 mb-8">{cartText('taxNote', currentLang.code)}</p>
                {cartSnapshot.length > 0 && (
                  <div className="text-center">
                    <button type="button" className="font-sans w-full bg-[#222222] text-[#f7ebc7] py-4 text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-colors" onClick={handlePlaceOrder}>
                      {cartText('placeOrder', currentLang.code)}
                    </button>
                    <div className="w-8 h-[1px] bg-[#D4AF37] mx-auto mt-6"></div>
                  </div>
                )}
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>


    </>
  );
};

export default Header;
