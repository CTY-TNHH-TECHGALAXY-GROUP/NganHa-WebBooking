import { serializeJsonLd } from '@/lib/seo/jsonLd';

export default function JsonLd({ value }: { value: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }} />;
}
