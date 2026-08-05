'use client';

import type { FlipbookFrameClassNames, FlipbookFrameProps } from './types';

const DEFAULT_CLASS_NAMES: Required<FlipbookFrameClassNames> = {
  containerBase: 'w-full flex items-center justify-center',
  containerInline: 'min-h-[700px] py-8 relative',
  containerFullscreen: 'fixed left-0 right-0 bottom-0 z-[40] bg-[#0A0A0A] p-0',
  iframeBase: 'w-full border-none overflow-hidden shadow-2xl',
  iframeInline: 'max-w-[1200px] h-[700px] lg:h-[850px] rounded-2xl',
  iframeFullscreen: 'h-full max-w-full rounded-none',
};

const mergeClassNames = (classNames?: FlipbookFrameClassNames) => ({
  ...DEFAULT_CLASS_NAMES,
  ...classNames,
});

export const FlipbookFrame = ({
  src,
  title,
  isFullscreen,
  containerRef,
  iframeRef,
  headerHeight = 80,
  classNames,
}: FlipbookFrameProps) => {
  const classes = mergeClassNames(classNames);

  return (
    <div
      ref={containerRef}
      className={`${classes.containerBase} ${isFullscreen ? classes.containerFullscreen : classes.containerInline}`}
      style={isFullscreen ? { top: `${headerHeight}px` } : undefined}
    >
      <iframe
        ref={iframeRef}
        src={src}
        className={`${classes.iframeBase} ${isFullscreen ? classes.iframeFullscreen : classes.iframeInline}`}
        title={title}
        allowFullScreen
      />
    </div>
  );
};
