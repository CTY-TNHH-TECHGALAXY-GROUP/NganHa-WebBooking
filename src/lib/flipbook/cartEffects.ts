'use client';

import type { FlipbookSourceRect } from './types';

type ShowFlipbookToastOptions = {
  title: string;
  subtitle?: string;
  className?: string;
  visibleClassName?: string;
  durationMs?: number;
  exitDurationMs?: number;
};

type AnimateFlipbookFlyerOptions = {
  iframe?: HTMLIFrameElement | null;
  sourceRect?: FlipbookSourceRect;
  targetSelector: string;
  className?: string;
  durationMs?: number;
  easing?: string;
  fallbackFrom?: { x: number; y: number };
  contentHtml?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const showFlipbookToast = ({
  title,
  subtitle,
  className = 'service-cart-toast',
  visibleClassName = 'visible',
  durationMs = 2200,
  exitDurationMs = 260,
}: ShowFlipbookToastOptions) => {
  document.querySelectorAll(`.${className}`).forEach((node) => node.remove());

  const toast = document.createElement('div');
  toast.className = className;
  toast.innerHTML = `<strong>${escapeHtml(title)}</strong>${subtitle ? `<span>${escapeHtml(subtitle)}</span>` : ''}`;
  document.body.appendChild(toast);

  window.setTimeout(() => toast.classList.add(visibleClassName), 20);
  window.setTimeout(() => {
    toast.classList.remove(visibleClassName);
    window.setTimeout(() => toast.remove(), exitDurationMs);
  }, durationMs);
};

export const animateFlipbookFlyerToTarget = ({
  iframe,
  sourceRect,
  targetSelector,
  className = 'service-cart-flyer',
  durationMs = 980,
  easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
  fallbackFrom = { x: window.innerWidth - 120, y: window.innerHeight - 120 },
  contentHtml = '<span aria-hidden="true"></span>',
}: AnimateFlipbookFlyerOptions) => {
  const cartTarget = document.querySelector<HTMLElement>(targetSelector);
  if (!cartTarget) return;

  const iframeRect = iframe?.getBoundingClientRect();
  const targetRect = cartTarget.getBoundingClientRect();
  const fromX = iframeRect && sourceRect
    ? iframeRect.left + sourceRect.left + sourceRect.width / 2
    : fallbackFrom.x;
  const fromY = iframeRect && sourceRect
    ? iframeRect.top + sourceRect.top + sourceRect.height / 2
    : fallbackFrom.y;
  const toX = targetRect.left + targetRect.width / 2;
  const toY = targetRect.top + targetRect.height / 2;

  const flyer = document.createElement('div');
  flyer.className = className;
  flyer.innerHTML = contentHtml;
  document.body.appendChild(flyer);

  flyer.animate(
    [
      { transform: `translate3d(${fromX}px, ${fromY}px, 0) scale(0.92)`, opacity: 0 },
      { transform: `translate3d(${fromX - 18}px, ${fromY - 42}px, 0) scale(1.08)`, opacity: 1, offset: 0.22 },
      { transform: `translate3d(${toX}px, ${toY}px, 0) scale(0.34)`, opacity: 0.2 },
    ],
    { duration: durationMs, easing }
  ).onfinish = () => flyer.remove();
};
