// Header.tsx - Sticky Navigation with transparent-to-solid effect
'use client';

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

// Navigation items matching Canva design
const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: 'area',
    label: 'Spaces',
    col: 'left',
    isUnclickable: true,
    children: [
      { id: 'area_lobby', label: 'Welcome area', href: '/#lobby' },
      { id: 'area_l1', label: 'First Floor', href: '/#l1' },
      { id: 'area_l2', label: 'Second Floor', href: '/#l2' },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    col: 'right',
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
    col: 'left',
    isUnclickable: true,
    children: [
      { id: 'academy_admissions', label: 'Recruitment/Admission', href: '/academy/admissions' },
      { id: 'academy_training', label: 'Training / Online', href: '/academy/training' },
      { id: 'academy_certification', label: 'Certification', href: '/academy/certification' },
    ],
  },
  { id: 'local_tour', label: 'Local tour', href: '/local-tour', col: 'right' },
  { id: 'history', label: 'History', href: '/#history', col: 'right' },
  { id: 'privileges', label: 'Your privileges', href: '/privileges', col: 'left' },
  { id: 'blogs', label: 'Blogs', href: '/blogs', col: 'right' },
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
};

const cartText = (key: keyof typeof CART_COPY, lang: string) =>
  (CART_COPY[key] as Record<string, string>)[lang] || CART_COPY[key].en;

const itemName = (item: CartItem, lang: string) =>
  item.names?.[lang] || item.names?.en || item.names?.vi || item.id;

const countCartItems = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.qty, 0);

const Header = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartSnapshot, setCartSnapshot] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [activeBrandIndex, setActiveBrandIndex] = useState(0);

  const BRANDS = useMemo(() => [
    { name: 'Oria Spa', location: 'Ho Chi Minh', href: '/' },
    { name: 'Oria Home', location: 'Ho Chi Minh', href: '/oriahome' },
    { name: 'Oria Farm', sub: 'Store', location: 'Ho Chi Minh', href: '/oriafarm-store' },
    { name: 'Oria Farm', sub: 'Retreat', location: 'Dong Nai', href: '/oriafarm-retreat' }
  ], []);

  const nextBrand = () => {
    setActiveBrandIndex((prev) => (prev + 1) % BRANDS.length);
  };
  
  const prevBrand = () => {
    setActiveBrandIndex((prev) => (prev - 1 + BRANDS.length) % BRANDS.length);
  };



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

  const NAV_ITEMS = useMemo(() => {
    return [
      {
        id: 'spaces',
        label: getLocalizedText(hpNav?.spaces, lang, 'Spaces'),
        href: '/space',
        children: [
          { id: 'area_lobby', label: getLocalizedText(hpNav?.welcomeArea, lang, 'Welcome area'), href: '/space#welcome' },
          { id: 'area_l1', label: getLocalizedText(hpNav?.firstFloor, lang, 'First Floor'), href: '/space#floor1' },
          { id: 'area_l2', label: getLocalizedText(hpNav?.secondFloor, lang, 'Second Floor'), href: '/space#floor2' }
        ]
      },
      {
        id: 'services',
        label: getLocalizedText(hpNav?.services, lang, 'Services'),
        col: 'right',
        isUnclickable: true,
        children: [
          { id: 'design_journey', label: getLocalizedText(hpNav?.designJourney, lang, 'Design Your Journey'), href: '/design-your-journey', badge: '50%' },
          { id: 'pure_relaxation', label: getLocalizedText(hpNav?.pureRelaxation, lang, 'Pure relaxation'), href: '/pure-relaxation', badge: '30%' },
          { id: 'therapy', label: getLocalizedText(hpNav?.therapy, lang, 'Therapy'), href: '/therapy', badge: '20%' },
        ],
      },
      {
        id: 'academy',
        label: getLocalizedText(hpNav?.academy, lang, 'Academy'),
        col: 'left',
        isUnclickable: true,
        children: [
          { id: 'academy_admissions', label: getLocalizedText(hpNav?.admissions, lang, 'Recruitment/Admission'), href: '/academy/admissions' },
          { id: 'academy_training', label: getLocalizedText(hpNav?.training, lang, 'Training / Online'), href: '/academy/training' },
          { id: 'academy_certification', label: getLocalizedText(hpNav?.certification, lang, 'Certification'), href: '/academy/certification' },
        ],
      },
      { id: 'local_tour', label: getLocalizedText(hpNav?.localTour, lang, 'Local tour'), href: '/local-tour', col: 'right' },
      { id: 'history', label: getLocalizedText(hpNav?.history, lang, 'History'), href: '/#history', col: 'right' },
      { id: 'privileges', label: getLocalizedText(hpNav?.privileges, lang, 'Your privileges'), href: '/privileges', col: 'left' },
      { id: 'blogs', label: getLocalizedText(hpNav?.blogs, lang, 'Blogs'), href: '/blogs', col: 'right' },
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

  const pathname = usePathname();
  const isHomepage = pathname === '/' || pathname === '/vi' || pathname === '/en';
  const showLogo = !isHomepage || isScrolled;

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
            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 z-0 ${showLogo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <a href="/" className="block mt-2 md:mt-3">
                <SmartLogo theme="dark" className="h-14 md:h-[68px] w-auto object-contain cursor-pointer scale-100 md:scale-125" />
              </a>
            </div>

            {/* Desktop Navigation removed as per request, using Mobile Menu Drawer instead */}

            {/* Right Section: Languages, Login, Cart */}
            <div className="header-right relative z-10">
              {/* Book Button */}
              <Link 
                href={`/${currentLang.code}/new-user/standard/checkout`}
                className="hidden sm:block text-[#f7ebc7] hover:text-[#f7ebc7]/80 active:opacity-50 font-bold text-sm uppercase tracking-wider mr-4 lg:mr-6 transition-all duration-300"
              >
                Book
              </Link>

              {/* Cart Button */}
              <button 
                type="button"
                className="relative text-[#f7ebc7] hover:text-[#D4AF37] mr-4 lg:mr-6 transition-colors duration-300 flex items-center"
                onClick={handleCartClick}
                aria-label={`Cart, ${cartCount} services selected`}
              >
                <div 
                  className="w-7 h-7 bg-[#f7ebc7]" 
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
                  <span className="absolute -top-1 -right-2 w-5 h-5 bg-[#e1272d] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md">
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

              <a href="https://maps.app.goo.gl/8XBkjsJicXqdNsZk7" target="_blank" rel="noopener noreferrer" className="header-icon-btn text-[#f7ebc7]" aria-label="Location">
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MOBILE_MENU_DURATION }}
            >
              <div className="nav-fullscreen-inner">
                {/* Close Button (Top Left) */}
                <button 
                  className="nav-fullscreen-close" 
                  onClick={toggleMobileMenu}
                  aria-label="Close menu"
                >
                  <X size={40} strokeWidth={1.5} />
                </button>

                {/* Left Panel: Navigation Links */}
                <div className="nav-panel-left">
                  <div className="nav-links-grid">
                    {/* Left Column (Even Indexes) */}
                    <div className="nav-links-col">
                      {NAV_ITEMS.filter((item, i) => item.col === 'left' || (!item.col && i % 2 === 0)).map((item) => {
                        const label = item.id ? t('header_menu', item.id) || item.label : item.label;
                        return (
                          <div key={item.id || item.href} className="nav-category-group">
                            <h3 className="nav-category-title">
                              {item.href ? (
                                <Link href={item.href} target={item.target || undefined} onClick={toggleMobileMenu} className="hover:text-[#f7ebc7] transition-colors">{label}</Link>
                              ) : label}
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
                      })}
                    </div>

                    {/* Right Column (Odd Indexes) */}
                    <div className="nav-links-col">
                      {NAV_ITEMS.filter((item, i) => item.col === 'right' || (!item.col && i % 2 === 1)).map((item) => {
                        const label = item.id ? t('header_menu', item.id) || item.label : item.label;
                        return (
                          <div key={item.id || item.href} className="nav-category-group">
                            <h3 className="nav-category-title">
                              {item.href ? (
                                <Link href={item.href} target={item.target || undefined} onClick={toggleMobileMenu} className="hover:text-[#f7ebc7] transition-colors">{label}</Link>
                              ) : label}
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
                      })}
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
                      <h3 className="nav-card-title">TechGalaxy Group</h3>
                      <div className="nav-card-divider"></div>
                    </div>
                    
                    <div className="nav-card-brands flex flex-col gap-5">
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
                            <p className="text-[#f7ebc7]/60 text-xs tracking-[0.15em] uppercase mt-2 font-light">{brand.location}</p>
                          </Link>
                        );
                      })}

                      {/* Side-by-side Arrows */}
                      <div className="flex justify-center gap-6 mt-4">
                        <button onClick={prevBrand} className="text-[#f7ebc7] hover:text-[#D4AF37] active:text-[#b89529] active:scale-95 transition-all" aria-label="Previous Brand">
                          <ChevronUp size={28} strokeWidth={1.5} />
                        </button>
                        <button onClick={nextBrand} className="text-[#f7ebc7] hover:text-[#D4AF37] active:text-[#b89529] active:scale-95 transition-all" aria-label="Next Brand">
                          <ChevronDown size={28} strokeWidth={1.5} />
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
              className="nav-cart-backdrop fixed inset-0 bg-[#3a3528]/80 backdrop-blur-sm z-[10000]"
              aria-label="Close cart"
              onClick={() => setIsCartOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="nav-cart-drawer fixed top-0 right-0 bg-[#F4F1EB] z-[10001] flex flex-col px-6"
              style={{ width: '100%', maxWidth: '340px', maxHeight: '100vh', boxShadow: '-6px 0 24px rgba(0,0,0,0.16)' }}
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
                            <p className="font-sans text-[11px] text-gray-500 mt-2 uppercase tracking-wider">{item.timeValue} {cartText('mins', currentLang.code)} · {cartText('vipRoom', currentLang.code)} 2</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <input 
                            type="text" 
                            placeholder={currentLang.code === 'vi' ? 'Ghi chú cho dịch vụ này...' : 'Add a note...'} 
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
                              aria-label={`Remove ${itemName(item, currentLang.code)} from cart`}
                            >
                              XÓA
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
