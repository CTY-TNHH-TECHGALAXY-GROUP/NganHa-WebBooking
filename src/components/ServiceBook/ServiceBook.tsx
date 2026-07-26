'use client';

import { useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CartItem, Service } from '@/components/Menu/types';
import { appendBookingCartItem, removeOneBookingCartItem } from '@/lib/bookingCartStorage';
import {
  FlipbookFrame,
  animateFlipbookFlyerToTarget,
  showFlipbookToast,
  useFlipbookBridge,
  type FlipbookSourceRect,
} from '@/lib/flipbook';
import { useTranslation } from '@/components/TranslationProvider';

// 🔧 UI CONFIGURATION
const HEADER_HEIGHT_PX = 80;

const isServicePayload = (value: unknown): value is Service => {
  if (!value || typeof value !== 'object') return false;
  const service = value as Partial<Service>;
  return Boolean(service.id && service.names && service.descriptions && service.priceVND !== undefined);
};

const getServiceTitle = (service: Service) =>
  service.names?.vi || service.names?.en || service.id;

const ServiceBook = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const router = useRouter();
  const { t, currentLang: lang } = useTranslation();

  const CHECKOUT_URL = `/${lang}/new-user/standard/checkout`;
  const SELECT_MENU_URL = `/${lang}/new-user/select-menu`;

  const dispatchCartUpdate = useCallback((cart: CartItem[]) => {
    window.dispatchEvent(new CustomEvent('nganha:cart-updated', { detail: { count: cart.length } }));
  }, []);

  const showCartToast = useCallback((service: Service, count: number) => {
    const title = t('service_book', 'service_added') || (lang === 'vi' ? 'Đã thêm dịch vụ' : 'Service Added');
    const unit = t('service_book', 'items') || (lang === 'vi' ? 'dịch vụ' : 'items');
    showFlipbookToast({
      title,
      subtitle: `${getServiceTitle(service)} · ${count} ${unit}`,
    });
  }, [lang, t]);

  const animateFlowerToCart = useCallback((sourceRect?: FlipbookSourceRect) => {
    animateFlipbookFlyerToTarget({
      iframe: iframeRef.current,
      sourceRect,
      targetSelector: '[data-nav-cart-button]',
    });
  }, []);

  const addServiceToCart = useCallback((service: Service) => {
    const nextCart = appendBookingCartItem(service, 1);
    dispatchCartUpdate(nextCart);
    return nextCart;
  }, [dispatchCartUpdate]);

  const { isFullscreen } = useFlipbookBridge<Service>({
    containerRef,
    iframeRef,
    headerHeight: HEADER_HEIGHT_PX,
    isServicePayload,
    onMenuBack: () => router.push(SELECT_MENU_URL),
    onAddService: ({ service, sourceRect }) => {
      const nextCart = addServiceToCart(service);
      animateFlowerToCart(sourceRect);
      showCartToast(service, nextCart.reduce((sum, item) => sum + item.qty, 0));
    },
    onRemoveService: ({ serviceId }) => {
      const nextCart = removeOneBookingCartItem(serviceId);
      dispatchCartUpdate(nextCart);
    },
    onBookNow: ({ service }) => {
      if (service) addServiceToCart(service);
      router.push(CHECKOUT_URL);
    },
    onPlaceOrder: () => router.push(CHECKOUT_URL),
  });

  return (
    <FlipbookFrame
      src={`/flipmenu/index.html?lang=${lang}`}
      title="ORIARETREAT Spa 3D Menu"
      isFullscreen={isFullscreen}
      containerRef={containerRef}
      iframeRef={iframeRef}
      headerHeight={HEADER_HEIGHT_PX}
    />
  );
};

export default ServiceBook;
