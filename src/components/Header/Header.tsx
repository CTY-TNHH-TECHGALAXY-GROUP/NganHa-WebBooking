// Header.tsx - Sticky Navigation with transparent-to-solid effect
'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MapPin, ChevronUp, ChevronDown, ShoppingCart } from 'lucide-react';
import type { CartItem } from '@/components/Menu/types';
import { formatCurrency } from '@/components/Menu/utils';
import { readBookingCart, removeBookingCartItemByCartId } from '@/lib/bookingCartStorage';
import { useHeaderLogic, LANGUAGES } from './Header.logic';

// 🔧 UI CONFIGURATION
const HEADER_TRANSITION_DURATION = 0.3;
const MOBILE_MENU_DURATION = 0.25;

type NavChildItem = {
  id?: string;
  label: string;
  href: string;
  target?: string;
  isComingSoon?: boolean;
};

type NavItem = {
  id?: string;
  label: string;
  href?: string;
  target?: string;
  isUnclickable?: boolean;
  isComingSoon?: boolean;
  children?: NavChildItem[];
};

// Navigation items matching Canva design
const NAV_ITEMS: NavItem[] = [
  {
    id: 'area',
    label: 'Spaces',
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
    isUnclickable: true,
    children: [
      { id: 'best_seller', label: 'Best-seller', href: '/#best-seller' },
      { id: 'service_menu', label: 'Menu', href: '/#services' },
      { id: 'service_area', label: 'Area', href: '/?heroVideo=1#hero' },
      { id: 'local_tour', label: 'Local tour', href: '/#local-tour' },
    ],
  },
  {
    id: 'spa_home',
    label: 'Home Spa',
    isUnclickable: true,
    children: [
      { id: 'home_therapy', label: 'Home Therapy', href: '/#home-therapy', isComingSoon: true },
      { id: 'home_care', label: 'Home Care', href: '/#home-care', isComingSoon: true },
    ],
  },
  { id: 'history', label: 'History', href: '/history' },
  { id: 'blogs', label: 'Blogs', href: '/blog.html', target: '_blank' },
  {
    id: 'academy',
    label: 'Academy',
    isUnclickable: true,
    children: [
      { id: 'academy_admissions', label: 'Recruitment/Admission', href: '/academy/admissions' },
      { id: 'academy_training', label: 'Training / Online', href: '/academy/training' },
      { id: 'academy_certification', label: 'Certification', href: '/academy/certification' },
    ],
  },
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
  placeOrder: { vi: 'Đặt lịch', en: 'Place order', cn: '提交订单', jp: '予約へ進む', kr: '예약하기' },
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
    { name: 'Oria Spa' },
    { name: 'Oria Farm', sub: 'Store' },
    { name: 'Oria Farm', sub: 'Retreat' }
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
            <div className="header-top-left">
              <button
                className="header-mobile-toggle !flex text-white"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={28} className="text-white" /> : <Menu size={28} className="text-white" />}
              </button>
            </div>

            {/* Desktop Navigation removed as per request, using Mobile Menu Drawer instead */}

            {/* Right Section: Languages, Login, Cart */}
            <div className="header-right">
              {/* Book Button */}
              <a 
                href={`/${currentLang.code}/new-user/standard/checkout`}
                className="text-white hover:text-white/80 active:opacity-50 font-bold text-sm uppercase tracking-wider mr-4 lg:mr-6 transition-all duration-300"
              >
                Book
              </a>

              {/* Cart Button */}
              <button 
                type="button"
                className="relative text-white hover:text-[#D4AF37] mr-4 lg:mr-6 transition-colors duration-300 flex items-center"
                onClick={handleCartClick}
                aria-label={`Cart, ${cartCount} services selected`}
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-black text-[10px] font-bold rounded-full flex items-center justify-center">
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
                  <ChevronDown size={14} className={`lang-chevron text-white ${isLangDropdownOpen ? 'rotate' : ''}`} />
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

              <a href="https://maps.app.goo.gl/8XBkjsJicXqdNsZk7" target="_blank" rel="noopener noreferrer" className="header-icon-btn text-white" aria-label="Location">
                <MapPin size={20} className="text-white" />
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
                      {NAV_ITEMS.filter((_, i) => i % 2 === 0).map((item) => {
                        const label = item.id ? t('header_menu', item.id) || item.label : item.label;
                        return (
                          <div key={item.id || item.href} className="nav-category-group">
                            <h3 className="nav-category-title">
                              {item.href && !item.children ? (
                                <a href={item.href} target={item.target || undefined} onClick={toggleMobileMenu} className="hover:text-white transition-colors">{label}</a>
                              ) : label}
                            </h3>
                            {item.children && (
                              <div className="nav-category-children">
                                {item.children.map((child) => (
                                  <a
                                    key={child.href}
                                    href={child.href}
                                    target={child.target || undefined}
                                    className="nav-child-link"
                                    onClick={toggleMobileMenu}
                                  >
                                    {child.id ? t('header_menu', child.id) || child.label : child.label}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column (Odd Indexes) */}
                    <div className="nav-links-col">
                      {NAV_ITEMS.filter((_, i) => i % 2 === 1).map((item) => {
                        const label = item.id ? t('header_menu', item.id) || item.label : item.label;
                        return (
                          <div key={item.id || item.href} className="nav-category-group">
                            <h3 className="nav-category-title">
                              {item.href && !item.children ? (
                                <a href={item.href} target={item.target || undefined} onClick={toggleMobileMenu} className="hover:text-white transition-colors">{label}</a>
                              ) : label}
                            </h3>
                            {item.children && (
                              <div className="nav-category-children">
                                {item.children.map((child) => (
                                  <a
                                    key={child.href}
                                    href={child.href}
                                    target={child.target || undefined}
                                    className="nav-child-link"
                                    onClick={toggleMobileMenu}
                                  >
                                    {child.id ? t('header_menu', child.id) || child.label : child.label}
                                  </a>
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
                <div className="nav-panel-right">
                  <div className="nav-panel-card">
                    <div className="nav-card-header">
                      <img src="/images/logo/logo-oriaspa.png" alt="Oria Spa Logo" className="nav-card-logo" />
                      <h3 className="nav-card-title">TechGalaxy Group</h3>
                      <div className="nav-card-divider"></div>
                    </div>
                    
                    <div className="nav-card-brands">
                      {/* First Brand - Clear */}
                      <div className="nav-brand-item">
                        <p className="nav-brand-subtitle">Our Brands</p>
                        <h4 className="nav-brand-name">
                          {BRANDS[activeBrandIndex].name}
                          {BRANDS[activeBrandIndex].sub && <><br/>{BRANDS[activeBrandIndex].sub}</>}
                        </h4>
                      </div>

                      {/* Second Brand - Dim/Blurred Bottom */}
                      <div className="nav-brand-item relative">
                        <p className="nav-brand-subtitle">Our Brands</p>
                        <h4 className="nav-brand-name">
                          {BRANDS[(activeBrandIndex + 1) % BRANDS.length].name}
                          {BRANDS[(activeBrandIndex + 1) % BRANDS.length].sub && <><br/>{BRANDS[(activeBrandIndex + 1) % BRANDS.length].sub}</>}
                        </h4>
                        
                        {/* Dim & Blur Overlay */}
                        <div className="nav-brand-blur-overlay"></div>
                      </div>

                      {/* Carousel Arrows */}
                      <div className="flex items-center justify-center gap-6 mt-2">
                        <button onClick={prevBrand} className="text-white hover:text-[#D4AF37] transition-colors p-2" aria-label="Previous Brand">
                          <ChevronUp size={28} strokeWidth={1} />
                        </button>
                        <button onClick={nextBrand} className="text-white hover:text-[#D4AF37] transition-colors p-2" aria-label="Next Brand">
                          <ChevronDown size={28} strokeWidth={1} />
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
              className="nav-cart-backdrop"
              aria-label="Close cart"
              onClick={() => setIsCartOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="nav-cart-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={cartText('title', currentLang.code)}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <header className="nav-cart-drawer__header font-sans uppercase tracking-widest text-sm font-bold">
                <h2>{cartText('title', currentLang.code)}</h2>
                <button type="button" className="nav-cart-drawer__close" onClick={() => setIsCartOpen(false)} aria-label="Close cart">
                  <X size={30} />
                </button>
              </header>

              <div className="nav-cart-drawer__body">
                {cartSnapshot.length ? (
                  cartSnapshot.map((item) => (
                    <article className="nav-cart-drawer__item" key={item.cartId}>
                      {item.img ? (
                        <img src={item.img} alt={itemName(item, currentLang.code)} />
                      ) : (
                        <span className="nav-cart-drawer__thumb" aria-hidden="true" />
                      )}
                      <div className="font-sans">
                        <strong className="text-sm tracking-wide">{itemName(item, currentLang.code)}</strong>
                        <p className="text-xs text-gray-400 mt-1">{item.timeValue} mins · {formatCurrency(item.priceVND)} đ · SL {item.qty}</p>
                      </div>
                      <button
                        type="button"
                        className="nav-cart-drawer__remove"
                        onClick={() => handleRemoveCartItem(item.cartId)}
                        aria-label={`Remove ${itemName(item, currentLang.code)} from cart`}
                      >
                        <X size={14} />
                      </button>
                    </article>
                  ))
                ) : (
                  <p className="nav-cart-drawer__empty font-sans uppercase tracking-widest text-sm text-center">{cartText('empty', currentLang.code)}</p>
                )}
              </div>

              <footer className="nav-cart-drawer__footer font-sans uppercase tracking-widest text-sm">
                <div className="nav-cart-drawer__subtotal flex justify-between items-center mb-4">
                  <span>{cartText('subtotal', currentLang.code)}</span>
                  <strong className="text-lg">{formatCurrency(cartSubtotal)} đ</strong>
                </div>
                {cartSnapshot.length > 0 && (
                  <button type="button" className="nav-cart-drawer__place w-full bg-[#D4AF37] text-black py-3 rounded-md font-bold transition-colors hover:bg-white" onClick={handlePlaceOrder}>
                    {cartText('placeOrder', currentLang.code)}
                  </button>
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
