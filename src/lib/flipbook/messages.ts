'use client';

import type {
  FlipbookMessage,
  FlipbookMessageType,
  FlipbookServicePayload,
  FlipbookSourceRect,
} from './types';

const FLIPBOOK_MESSAGE_TYPES: ReadonlySet<string> = new Set<FlipbookMessageType>([
  'flipmenu:galaxy-entered',
  'flipmenu:book-returned',
  'flipmenu:menu-back',
  'flipmenu:add-service-to-cart',
  'flipmenu:remove-service-from-cart',
  'flipmenu:book-now',
  'flipmenu:place-order',
  'flipmenu:drawer-opened',
  'flipmenu:drawer-closed',
]);

export const isFlipbookMessage = (value: unknown): value is FlipbookMessage => {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<FlipbookMessage>;
  return typeof message.type === 'string' && FLIPBOOK_MESSAGE_TYPES.has(message.type);
};

export const isFlipbookSourceRect = (value: unknown): value is FlipbookSourceRect => {
  if (!value || typeof value !== 'object') return false;
  const rect = value as Partial<FlipbookSourceRect>;
  return (
    typeof rect.left === 'number' &&
    typeof rect.top === 'number' &&
    typeof rect.width === 'number' &&
    typeof rect.height === 'number'
  );
};

export const isFlipbookServicePayload = (value: unknown): value is FlipbookServicePayload => {
  if (!value || typeof value !== 'object') return false;
  const service = value as Partial<FlipbookServicePayload>;
  return typeof service.id === 'string' && Boolean(service.id);
};
