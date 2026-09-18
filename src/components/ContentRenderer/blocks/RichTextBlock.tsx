import type { ReactNode } from 'react';
import type { RichTextBlock as RichTextBlockType, RichTextMark, RichTextNode } from '@/types/content';
import { linkUrl } from '@/lib/content/schemas';
import { resolveLocalizedValue } from '@/lib/content/resolveLocalizedValue';
import { BlockFrame } from '../blockFrame';
import type { BlockRendererContext } from '../rendererTypes';

function applyMarks(content: ReactNode, marks: RichTextMark[] | undefined): ReactNode {
  return (marks || []).reduce<ReactNode>((current, mark) => {
    if (mark.type === 'bold') return <strong>{current}</strong>;
    if (mark.type === 'italic') return <em>{current}</em>;
    if (mark.type === 'underline') return <u>{current}</u>;
    if (mark.type === 'link' && mark.attrs?.href && linkUrl.safeParse(mark.attrs.href).success) {
      const target = mark.attrs.target;
      return <a href={mark.attrs.href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined}>{current}</a>;
    }
    return current;
  }, content);
}

function renderNode(node: RichTextNode, key: string): ReactNode {
  const children = node.content?.map((child, index) => renderNode(child, `${key}-${index}`));
  switch (node.type) {
    case 'text':
      return <span key={key}>{applyMarks(node.text || '', node.marks)}</span>;
    case 'hardBreak':
      return <br key={key} />;
    case 'paragraph':
      return <p key={key}>{children}</p>;
    case 'bulletList':
      return <ul key={key}>{children}</ul>;
    case 'orderedList':
      return <ol key={key}>{children}</ol>;
    case 'listItem':
      return <li key={key}>{children}</li>;
    default:
      return null;
  }
}

export function RichTextBlock({ block, context }: { block: RichTextBlockType; context: BlockRendererContext }) {
  const document = resolveLocalizedValue(block.props.content, context.locale).value;
  if (!document) return null;

  return <BlockFrame block={block}>{document.content.map((node, index) => renderNode(node, `${block.id}-${index}`))}</BlockFrame>;
}
