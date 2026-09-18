import type { ReactNode } from 'react';
import type { ContentDocument, SupportedLocale } from '@/types/content';
import { parseContentDocument } from '@/lib/content/parseContentDocument';
import { resolveSupportedLocale } from '@/lib/content/resolveLocalizedValue';
import type { MediaResolver } from '@/lib/content/media';
import { blockRegistry } from './registry';

export interface ContentRendererProps {
  document: ContentDocument | unknown;
  locale: SupportedLocale | string;
  resolveMedia?: MediaResolver;
}

export async function ContentRenderer({ document: rawDocument, locale: rawLocale, resolveMedia }: ContentRendererProps) {
  const parsed = parseContentDocument(rawDocument);
  if (parsed.status !== 'valid') {
    if (parsed.status === 'unsupported') {
      console.warn('[content] unsupported schema version', parsed.unsupportedSchemaVersion);
    } else {
      console.warn('[content] malformed document', parsed.error);
    }
    return null;
  }

  if (parsed.skippedBlockIds.length > 0) {
    console.warn('[content] skipped malformed or unknown blocks', parsed.skippedBlockIds);
  }

  const locale = resolveSupportedLocale(rawLocale);
  const rendered: Array<{ id: string; output: ReactNode }> = [];
  for (const block of parsed.document.blocks) {
    if (block.settings?.visibility?.[locale] === false) continue;
    const renderer = blockRegistry[block.type];
    if (!renderer) {
      console.warn('[content] unknown block type', block.type);
      continue;
    }
    try {
      const output = await renderer({ block, context: { locale, resolveMedia } });
      if (output) rendered.push({ id: block.id, output });
    } catch (error) {
      console.error('[content] block render failed', { blockId: block.id, type: block.type, error });
    }
  }

  return <>{rendered.map(({ id, output }) => <div key={id}>{output}</div>)}</>;
}

export default ContentRenderer;
