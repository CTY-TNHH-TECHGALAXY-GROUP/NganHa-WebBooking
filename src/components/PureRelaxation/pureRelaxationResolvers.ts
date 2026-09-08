import type { Service } from '@/components/Menu/types';
import type {
  PureRelaxationDuration,
  PureRelaxationSection,
  PureRelaxationService,
  PureRelaxationVariant,
} from './pureRelaxationData';

export const PURE_RELAXATION_LOCALES = ['vi', 'en', 'cn', 'jp', 'kr'] as const;
export type PureRelaxationLocale = (typeof PURE_RELAXATION_LOCALES)[number];

type CatalogService = Pick<Service, 'id' | 'names' | 'descriptions' | 'priceVND' | 'priceUSD' | 'timeValue' | 'ACTIVE'>;

/** A saved empty string is intentional and must not silently revive a default. */
export const getLocalized = (value: Record<string, string | undefined> | undefined, locale: string, fallback: string) => {
  if (value && Object.prototype.hasOwnProperty.call(value, locale) && value[locale] !== undefined) {
    return value[locale] as string;
  }
  if (value && Object.prototype.hasOwnProperty.call(value, 'en') && value.en !== undefined) {
    return value.en;
  }
  return fallback;
};

const getCatalogId = (duration: PureRelaxationDuration) => duration.id;

const resolveDuration = (duration: PureRelaxationDuration, catalog: Map<string, CatalogService>, loaded: boolean) => {
  const catalogService = duration.id ? catalog.get(duration.id) : undefined;
  if (loaded && !catalogService) return null;
  if (!catalogService) return duration;

  const minutes = Number(catalogService.timeValue) || 0;
  return {
    ...duration,
    label: minutes > 0 ? `${minutes}'` : duration.label,
    price: Number(catalogService.priceVND) || 0,
    priceUSD: Number(catalogService.priceUSD) || 0,
  };
};

const getFirstCatalogService = (durations: PureRelaxationDuration[], catalog: Map<string, CatalogService>) => {
  const id = durations.map(getCatalogId).find(Boolean);
  return id ? catalog.get(id) : undefined;
};

const resolveService = <T extends PureRelaxationService>(
  service: T,
  catalog: Map<string, CatalogService>,
  locale: PureRelaxationLocale,
  loaded: boolean,
): T | null => {
  if (Array.isArray(service.variants)) {
    const variants = service.variants
      .map((variant: PureRelaxationVariant) => {
        const durations = variant.durations
          .map((duration) => resolveDuration(duration, catalog, loaded))
          .filter((duration): duration is PureRelaxationDuration => Boolean(duration));
        const catalogService = getFirstCatalogService(durations, catalog);

        return {
          ...variant,
          contentKey: variant.contentKey || variant.name,
          name: getLocalized(catalogService?.names, locale, variant.name),
          subtitle: getLocalized(catalogService?.descriptions, locale, variant.subtitle),
          durations,
        };
      })
      .filter((variant) => variant.durations.length > 0);

    return variants.length > 0 ? ({ ...service, variants } as T) : null;
  }

  const durations = (service.durations || [])
    .map((duration) => resolveDuration(duration, catalog, loaded))
    .filter((duration): duration is PureRelaxationDuration => Boolean(duration));
  if (durations.length === 0) return null;

  const catalogService = getFirstCatalogService(durations, catalog);
  return {
    ...service,
    contentKey: service.contentKey || service.name,
    name: getLocalized(catalogService?.names, locale, service.name),
    description: getLocalized(catalogService?.descriptions, locale, service.description),
    durations,
  } as T;
};

/** Apply active DB catalog values while preserving stable CMS keys from the authored catalog. */
export const applyPureRelaxationCatalog = (
  sections: PureRelaxationSection[],
  services: CatalogService[],
  locale: PureRelaxationLocale,
  loaded: boolean,
) => {
  const catalog = new Map(services.map((service) => [service.id, service]));

  return sections.map((section) => ({
    ...section,
    services: section.services
      .map((service) => resolveService(service, catalog, locale, loaded))
      .filter((service): service is PureRelaxationService => Boolean(service)),
  }));
};

/** Adapt legacy admin fields to the fields rendered by the narrative templates. */
export const mergePureRelaxationNarrative = (base: Record<string, any>, override: Record<string, any> = {}) => {
  const merged = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (merged[key] === undefined) merged[key] = value;
  }

  // Overrides are the only values allowed to replace authored text. This keeps
  // an intentionally empty CMS field empty while still filling missing fields.
  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined) merged[key] = value;
  }
  const rowTexts = [override.body1, override.body2, override.body3];

  if (Array.isArray(base.rows) && rowTexts.some((text) => text !== undefined)) {
    merged.rows = base.rows.map((row: Record<string, any>, index: number) => ({
      ...row,
      text: rowTexts[index] !== undefined ? rowTexts[index] : row.text,
    }));
  }

  if (override.quote !== undefined) merged.pullQuote = override.quote;
  if (override.pullQuote !== undefined) merged.pullQuote = override.pullQuote;
  if (override.pullSign !== undefined) merged.pullSign = override.pullSign;
  if (override.finalBig !== undefined) merged.finalBig = override.finalBig;
  if (override.finalSmall !== undefined) merged.finalSmall = override.finalSmall;

  if (typeof merged.paragraphs === 'string') {
    merged.paragraphs = merged.paragraphs.split('\n').filter(Boolean);
  }

  if (Array.isArray(override.rowTitles) && Array.isArray(merged.rows)) {
    merged.rows = merged.rows.map((row: Record<string, any>, index: number) => ({
      ...row,
      title: override.rowTitles[index] !== undefined ? override.rowTitles[index] : row.title,
    }));
  }

  if (Array.isArray(override.rows)) {
    merged.rows = override.rows;
  }

  return merged;
};
