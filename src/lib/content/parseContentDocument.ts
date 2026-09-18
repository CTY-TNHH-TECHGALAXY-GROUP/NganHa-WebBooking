import { contentBlockSchema } from './schemas/index.ts';
import type { ContentBlock, ContentDocument } from '../../types/content/content.ts';

export type ContentDocumentParseResult =
  | {
      status: 'valid';
      document: ContentDocument;
      skippedBlockIds: string[];
    }
  | {
      status: 'unsupported';
      document: null;
      unsupportedSchemaVersion: number | undefined;
      skippedBlockIds: string[];
    }
  | {
      status: 'invalid';
      document: null;
      skippedBlockIds: string[];
      error: string;
    };

export function parseContentDocument(raw: unknown): ContentDocumentParseResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { status: 'invalid', document: null, skippedBlockIds: [], error: 'Document must be an object' };
  }

  const candidate = raw as { schemaVersion?: unknown; blocks?: unknown };
  if (candidate.schemaVersion === undefined) {
    return { status: 'invalid', document: null, skippedBlockIds: [], error: 'Document schemaVersion is required' };
  }

  if (candidate.schemaVersion !== 1) {
    if (typeof candidate.schemaVersion !== 'number') {
      return { status: 'invalid', document: null, skippedBlockIds: [], error: 'Document schemaVersion must be a number' };
    }
    return {
      status: 'unsupported',
      document: null,
      unsupportedSchemaVersion: typeof candidate.schemaVersion === 'number' ? candidate.schemaVersion : undefined,
      skippedBlockIds: [],
    };
  }

  if (!Array.isArray(candidate.blocks)) {
    return { status: 'invalid', document: null, skippedBlockIds: [], error: 'Document blocks must be an array' };
  }
  if (candidate.blocks.length > 500) {
    return { status: 'invalid', document: null, skippedBlockIds: [], error: 'Document contains too many blocks' };
  }

  const blocks: ContentBlock[] = [];
  const skippedBlockIds: string[] = [];
  const seenIds = new Set<string>();

  for (const rawBlock of candidate.blocks) {
    const possibleId = rawBlock && typeof rawBlock === 'object' && 'id' in rawBlock
      ? String((rawBlock as { id?: unknown }).id)
      : undefined;
    const parsed = contentBlockSchema.safeParse(rawBlock);
    if (!parsed.success || seenIds.has(parsed.success ? parsed.data.id : possibleId || '')) {
      if (possibleId) skippedBlockIds.push(possibleId);
      continue;
    }
    seenIds.add(parsed.data.id);
    blocks.push(parsed.data as ContentBlock);
  }

  return { status: 'valid', document: { schemaVersion: 1, blocks }, skippedBlockIds };
}

export function safeParseContentDocument(raw: unknown): ContentDocument {
  const result = parseContentDocument(raw);
  return result.status === 'valid' ? result.document : { schemaVersion: 1, blocks: [] };
}
