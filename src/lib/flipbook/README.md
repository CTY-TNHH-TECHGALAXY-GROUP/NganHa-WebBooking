# Flipbook Library

Internal reusable layer for iframe-based 3D flipbook experiences.

The static flipbook runtime still lives in `public/flipmenu`. This library packages the reusable React side:

- `FlipbookFrame`: renders the inline/fullscreen iframe shell.
- `useFlipbookBridge`: listens to `window.postMessage` events from the flipbook and maps them to callbacks.
- `cartEffects`: reusable DOM effects for cart toast and flyer animation.
- `messages` and `types`: shared message contracts and guards.

## Basic Usage

```tsx
'use client';

import { useRef } from 'react';
import {
  FlipbookFrame,
  useFlipbookBridge,
  type FlipbookServicePayload,
} from '@/lib/flipbook';

export function MyBook() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { isFullscreen } = useFlipbookBridge<FlipbookServicePayload>({
    containerRef,
    iframeRef,
    headerHeight: 80,
    onAddService: ({ service }) => {
      // Add service to your app cart.
    },
    onBookNow: ({ service }) => {
      // Optionally add the service, then route to checkout.
    },
    onPlaceOrder: () => {
      // Route to checkout.
    },
  });

  return (
    <FlipbookFrame
      src="/flipmenu/index.html"
      title="Reusable 3D Flipbook"
      isFullscreen={isFullscreen}
      containerRef={containerRef}
      iframeRef={iframeRef}
      headerHeight={80}
    />
  );
}
```

## Message Contract

The iframe can post these messages to the parent:

- `flipmenu:galaxy-entered`
- `flipmenu:book-returned`
- `flipmenu:menu-back`
- `flipmenu:add-service-to-cart`
- `flipmenu:remove-service-from-cart`
- `flipmenu:book-now`
- `flipmenu:place-order`

Service messages may include:

```ts
{
  type: 'flipmenu:add-service-to-cart',
  service: { id: 'body-60', names: { vi: 'Massage Body 60' } },
  sourceRect: { left: 10, top: 20, width: 44, height: 44 },
  selectedCount: 1
}
```

Keep business logic outside the library. Cart storage, checkout URLs, language copy, and analytics should stay in the app wrapper, such as `src/components/ServiceBook/ServiceBook.tsx`.
