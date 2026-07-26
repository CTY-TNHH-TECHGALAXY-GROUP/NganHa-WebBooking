'use client';

import type { RefObject } from 'react';

export type FlipbookSourceRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type FlipbookServicePayload = {
  id: string;
  names?: Record<string, string | undefined>;
  descriptions?: Record<string, string | undefined>;
  priceVND?: number;
  [key: string]: unknown;
};

export type FlipbookMessageType =
  | 'flipmenu:galaxy-entered'
  | 'flipmenu:book-returned'
  | 'flipmenu:menu-back'
  | 'flipmenu:add-service-to-cart'
  | 'flipmenu:remove-service-from-cart'
  | 'flipmenu:book-now'
  | 'flipmenu:place-order'
  | 'flipmenu:drawer-opened'
  | 'flipmenu:drawer-closed';

export type FlipbookMessage<TService = FlipbookServicePayload> = {
  type: FlipbookMessageType;
  service?: TService;
  serviceId?: string;
  sourceRect?: FlipbookSourceRect;
  selectedCount?: number;
};

export type FlipbookServiceGuard<TService> = (value: unknown) => value is TService;

export type FlipbookServiceEvent<TService> = {
  service: TService;
  sourceRect?: FlipbookSourceRect;
  selectedCount?: number;
};

export type FlipbookRemoveEvent = {
  serviceId: string;
  selectedCount?: number;
};

export type FlipbookBookNowEvent<TService> = {
  service?: TService;
  sourceRect?: FlipbookSourceRect;
};

export type UseFlipbookBridgeOptions<TService = FlipbookServicePayload> = {
  containerRef?: RefObject<HTMLDivElement | null>;
  iframeRef?: RefObject<HTMLIFrameElement | null>;
  headerHeight?: number;
  settleDelaysMs?: number[];
  isServicePayload?: FlipbookServiceGuard<TService>;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onMenuBack?: () => void;
  onAddService?: (event: FlipbookServiceEvent<TService>) => void;
  onRemoveService?: (event: FlipbookRemoveEvent) => void;
  onBookNow?: (event: FlipbookBookNowEvent<TService>) => void;
  onPlaceOrder?: () => void;
};

export type FlipbookFrameClassNames = {
  containerBase?: string;
  containerInline?: string;
  containerFullscreen?: string;
  iframeBase?: string;
  iframeInline?: string;
  iframeFullscreen?: string;
};

export type FlipbookFrameProps = {
  src: string;
  title: string;
  isFullscreen: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  headerHeight?: number;
  classNames?: FlipbookFrameClassNames;
};
