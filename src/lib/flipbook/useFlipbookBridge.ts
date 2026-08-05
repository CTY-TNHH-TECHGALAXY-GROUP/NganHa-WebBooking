'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isFlipbookMessage, isFlipbookServicePayload, isFlipbookSourceRect } from './messages';
import type { FlipbookServiceGuard, FlipbookServicePayload, UseFlipbookBridgeOptions } from './types';

const DEFAULT_HEADER_HEIGHT_PX = 80;
const DEFAULT_SETTLE_DELAYS_MS = [120, 760, 1400, 2200];

export const useFlipbookBridge = <TService = FlipbookServicePayload>(
  options: UseFlipbookBridgeOptions<TService> = {}
) => {
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const internalIframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = options.containerRef || internalContainerRef;
  const iframeRef = options.iframeRef || internalIframeRef;
  const [isFullscreen, setIsFullscreen] = useState(false);

  const headerHeight = options.headerHeight ?? DEFAULT_HEADER_HEIGHT_PX;
  const settleDelays = options.settleDelaysMs || DEFAULT_SETTLE_DELAYS_MS;
  const serviceGuard = (options.isServicePayload || isFlipbookServicePayload) as FlipbookServiceGuard<TService>;

  const settleBookViewport = useCallback(() => {
    const align = () => {
      const target = iframeRef.current || containerRef.current;
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const visibleRoom = Math.max(240, viewportHeight - headerHeight);
      const desiredTop = rect.height > visibleRoom
        ? headerHeight + 12
        : headerHeight + Math.max(12, (visibleRoom - rect.height) / 2);
      const targetScrollY = Math.max(0, window.scrollY + rect.top - desiredTop);

      window.scrollTo({ top: targetScrollY, behavior: 'auto' });
    };

    requestAnimationFrame(() => requestAnimationFrame(align));
    settleDelays.forEach((delay) => {
      window.setTimeout(align, delay);
    });
  }, [containerRef, headerHeight, iframeRef, settleDelays]);

  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    options.onFullscreenChange?.(true);
  }, [options]);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    options.onFullscreenChange?.(false);
    settleBookViewport();
  }, [options, settleBookViewport]);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (!isFlipbookMessage(event.data)) return;

    const message = event.data;
    const sourceRect = isFlipbookSourceRect(message.sourceRect) ? message.sourceRect : undefined;

    if (message.type === 'flipmenu:galaxy-entered') {
      enterFullscreen();
      return;
    }

    if (message.type === 'flipmenu:book-returned') {
      closeFullscreen();
      return;
    }

    if (message.type === 'flipmenu:menu-back') {
      options.onMenuBack?.();
      return;
    }

    // Duration Drawer z-index control: raise iframe container above header/floating buttons
    if (message.type === 'flipmenu:drawer-opened') {
      const el = containerRef.current;
      if (el) el.style.zIndex = '99999';
      return;
    }
    if (message.type === 'flipmenu:drawer-closed') {
      const el = containerRef.current;
      if (el) el.style.zIndex = '';
      return;
    }

    if (message.type === 'flipmenu:add-service-to-cart') {
      if (serviceGuard(message.service)) {
        options.onAddService?.({
          service: message.service,
          sourceRect,
          selectedCount: message.selectedCount,
        });
      }
      return;
    }

    if (message.type === 'flipmenu:remove-service-from-cart') {
      if (typeof message.serviceId === 'string') {
        options.onRemoveService?.({
          serviceId: message.serviceId,
          selectedCount: message.selectedCount,
        });
      }
      return;
    }

    if (message.type === 'flipmenu:book-now') {
      options.onBookNow?.({
        service: serviceGuard(message.service) ? message.service : undefined,
        sourceRect,
      });
      return;
    }

    if (message.type === 'flipmenu:place-order') {
      options.onPlaceOrder?.();
    }
  }, [closeFullscreen, containerRef, enterFullscreen, options, serviceGuard]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return {
    containerRef,
    iframeRef,
    isFullscreen,
    enterFullscreen,
    closeFullscreen,
    settleBookViewport,
  };
};
