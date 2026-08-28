// groupServices.ts - Group services with same name/category into one entry with duration variants
import { Service, getServiceName, getServiceDescription, Locale } from '@/types';

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

export interface DurationVariant {
  id: string;
  duration: number; // minutes
  priceVND: number;
  priceUSD: number;
  code: string;
}

export interface GroupedService {
  groupKey: string; // e.g. "body_aroma-oil"
  category: string;
  nameEN: string;
  nameVN: string;
  nameCN: string;
  nameJP: string;
  nameKR: string;
  description: Record<string, string> | null;
  hint: Record<string, string> | null;
  image: string; // local generated image path
  isBestChoice: boolean;
  isBestSeller: boolean;
  tags: string[] | null;
  variants: DurationVariant[];
}

// ═══════════════════════════════════════
// Grouping Logic
// ═══════════════════════════════════════

/**
 * Normalize a service name for grouping key generation.
 * Removes extra spaces, lowercases, and creates a slug.
 */
const slugify = (str: string): string =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

/**
 * Group services that share the same category + nameEN into one GroupedService.
 * Each group contains multiple DurationVariants sorted by duration ascending.
 */
export const groupServices = (services: Service[]): GroupedService[] => {
  const groups = new Map<string, GroupedService>();

  for (const service of services) {
    if (!service.isActive) continue;

    const category = (service.category || 'other').toLowerCase().trim();
    const nameEN = (service.nameEN || service.code || '').trim();
    const groupKey = `${category}_${slugify(nameEN)}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        groupKey,
        category,
        nameEN: service.nameEN || service.code,
        nameVN: service.nameVN || nameEN,
        nameCN: service.nameCN || nameEN,
        nameJP: service.nameJP || nameEN,
        nameKR: service.nameKR || nameEN,
        description: service.description,
        hint: service.hint,
        image: '', // will be set from serviceImages mapping
        isBestChoice: service.isBestChoice,
        isBestSeller: service.isBestSeller,
        tags: service.tags,
        variants: [],
      });
    }

    const group = groups.get(groupKey)!;

    // Add this service as a duration variant
    group.variants.push({
      id: service.id,
      duration: service.duration,
      priceVND: service.priceVND,
      priceUSD: service.priceUSD,
      code: service.code,
    });

    // If any variant is bestChoice/bestSeller, mark the group
    if (service.isBestChoice) group.isBestChoice = true;
    if (service.isBestSeller) group.isBestSeller = true;
  }

  // Sort variants by duration ascending within each group
  for (const group of groups.values()) {
    group.variants.sort((a, b) => a.duration - b.duration);
  }

  // Return as array, sorted by category then name
  return Array.from(groups.values()).sort((a, b) => {
    const catCompare = a.category.localeCompare(b.category);
    if (catCompare !== 0) return catCompare;
    return a.nameEN.localeCompare(b.nameEN);
  });
};

/**
 * Get display name of a grouped service based on locale
 */
export const getGroupedServiceName = (group: GroupedService, locale: Locale = 'vi'): string => {
  const nameMap: Record<Locale, string> = {
    vi: group.nameVN,
    en: group.nameEN,
    cn: group.nameCN,
    jp: group.nameJP,
    kr: group.nameKR,
  };
  return nameMap[locale] || group.nameEN || group.nameVN;
};

/**
 * Get description of a grouped service based on locale
 */
export const getGroupedServiceDescription = (group: GroupedService, locale: Locale = 'en'): string => {
  if (!group.description) return '';
  return group.description[locale] || group.description['en'] || '';
};
