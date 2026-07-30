// Header.tsx - Sticky Navigation with transparent-to-solid effect
'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, User, ChevronDown } from 'lucide-react';
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
      { id: 'area_lobby', label: 'Lobby', href: '/#lobby' },
      { id: 'area_l1', label: 'Level 1', href: '/#l1' },
      { id: 'area_l2', label: 'Level 2', href: '/#l2' },
    ],
  },
  {
    id: 'service',
    label: 'Service',
    isUnclickable: true,
    children: [
      { id: 'service_standard', label: 'Standard', href: '/#standard' },
      { id: 'service_vip', label: 'VIP', href: '/#vip' },
      { id: 'service_special', label: 'Special Treatment', href: '/#special' },
    ],
  },
  {
    id: 'spa_home',
    label: 'Home Spa',
    isUnclickable: true,
    children: [
      { id: 'home_therapy', label: 'Therapy', href: '/#therapy' },
      { id: 'home_care', label: 'Care', href: '/#care' },
    ],
  },
  { id: 'history', label: 'History', href: '/history' },
  { id: 'blogs', label: 'Blogs', href: '/blog.html', target: '_blank' },
  {
    id: 'academy',
    label: 'Academy',
    isUnclickable: true,
    children: [
      { id: 'academy_admissions', label: 'Admissions', href: '/academy/admissions' },
      { id: 'academy_training', label: 'Training / Online', href: '/academy/training' },
      { id: 'academy_certification', label: 'Certification', href: '/academy/certification' },
    ],
  },
  {
    id: 'oriafarm',
    label: 'OriaFarm',
    isUnclickable: true,
    children: [
      { id: 'oriafarm_store', label: 'Store', href: '/#shop' },
      { id: 'oriafarm_retreat', label: 'Retreat', href: '/#retreat' },
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
            {/* Logo & Mobile Toggle on the left */}
            <div className="header-top-left">
              <button
                className="header-mobile-toggle"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>

              <a href="/" className="header-logo">
                <span className="header-logo-icon">✦</span>
                <div className="header-logo-text">
                  <span className="header-logo-name">Oria Spa</span>
                  <span className="header-logo-sub">spa</span>
                </div>
              </a>
            </div>

            {/* Desktop Navigation Centered */}
            <nav className="header-nav-desktop">
              {NAV_ITEMS.map((item) => {
                const label = item.id ? t('header_menu', item.id) || item.label : item.label;

                return (
                <div key={item.id || item.href} className={`header-nav-item ${item.children ? 'has-subnav' : ''}`}>
                  {item.isUnclickable ? (
                    <button type="button" className="header-nav-link header-nav-link--button">
                      {label}
                      {item.children && <ChevronDown size={13} className="header-nav-chevron" />}
                    </button>
                  ) : (
                    <a
                      href={item.href}
                      target={item.target || undefined}
                      className={`header-nav-link ${item.isComingSoon ? 'dimmed' : ''}`}
                    >
                      {item.isComingSoon ? (
                        <span className="nav-item-coming-soon">
                          <span className="nav-text-primary">{label}</span>
                          <span className="nav-text-secondary">Coming Soon</span>
                        </span>
                      ) : (
                        <>
                          {label}
                          {item.children && <ChevronDown size={13} className="header-nav-chevron" />}
                        </>
                      )}
                    </a>
                  )}
                  {item.children && (
                    <div className="header-subnav" aria-label={`${label} submenu`}>
                      {item.children.map((child) => {
                        const childLabel = child.id ? t('header_menu', child.id) || child.label : child.label;

                        return (
                          <a
                            key={child.href}
                            href={child.href}
                            className={`header-subnav__link ${child.isComingSoon ? 'is-coming-soon' : ''}`}
                            aria-disabled={child.isComingSoon ? 'true' : undefined}
                          >
                            {childLabel}
                            {child.isComingSoon && <span>Coming Soon</span>}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              )})}
            </nav>

            {/* Right Section: Languages, Login, Cart */}
            <div className="header-right">
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
                  <ChevronDown size={14} className={`lang-chevron ${isLangDropdownOpen ? 'rotate' : ''}`} />
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

              {/* Login & Cart */}
              <a href="#login" className="header-icon-btn" aria-label="Log in">
                <User size={20} />
              </a>
              <button type="button" className="header-icon-btn header-cart-btn" data-nav-cart-button aria-label={`Cart, ${cartCount} services selected`} onClick={handleCartClick}>
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className="header-cart-badge">{cartCount}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              className="header-mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: MOBILE_MENU_DURATION }}
            >
              {NAV_ITEMS.map((item) => {
                const label = item.id ? t('header_menu', item.id) || item.label : item.label;

                return (
                <div key={item.id || item.href} className="mobile-nav-link-wrapper">
                  {item.isUnclickable ? (
                    <button type="button" className="mobile-nav-link mobile-nav-link--button">
                      {label}
                    </button>
                  ) : (
                    <a
                      href={item.href}
                      target={item.target || undefined}
                      className={`mobile-nav-link ${item.isComingSoon ? 'dimmed' : ''}`}
                      onClick={toggleMobileMenu}
                    >
                      {label}
                    </a>
                  )}
                  {item.isComingSoon && (
                    <span className="coming-soon-badge">Coming Soon</span>
                  )}
                  {item.children && (
                    <div className="mobile-subnav">
                      {item.children.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          className={`mobile-subnav__link ${child.isComingSoon ? 'is-coming-soon' : ''}`}
                          onClick={toggleMobileMenu}
                        >
                          {child.id ? t('header_menu', child.id) || child.label : child.label}
                          {child.isComingSoon && <span>Coming Soon</span>}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )})}
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
              <header className="nav-cart-drawer__header">
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
                      <div>
                        <strong>{itemName(item, currentLang.code)}</strong>
                        <p>{item.timeValue} mins · {formatCurrency(item.priceVND)} đ · SL {item.qty}</p>
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
                  <p className="nav-cart-drawer__empty">{cartText('empty', currentLang.code)}</p>
                )}
              </div>

              <footer className="nav-cart-drawer__footer">
                <div className="nav-cart-drawer__subtotal">
                  <span>{cartText('subtotal', currentLang.code)}</span>
                  <strong>{formatCurrency(cartSubtotal)} đ</strong>
                </div>
                {cartSnapshot.length > 0 && (
                  <button type="button" className="nav-cart-drawer__place" onClick={handlePlaceOrder}>
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
