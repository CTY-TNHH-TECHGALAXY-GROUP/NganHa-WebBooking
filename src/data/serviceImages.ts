// serviceImages.ts - Mapping from group key to imgBB-hosted image URL
// Images uploaded to imgBB for CDN delivery

// ═══════════════════════════════════════
// Service Image Mapping
// ═══════════════════════════════════════

/**
 * Maps a service group key (category_slug-name) to an imgBB-hosted image URL.
 * Falls back to a default image if no mapping is found.
 */

const DEFAULT_SERVICE_IMAGE = 'https://i.ibb.co/FbNjKwKZ/aroma-oil.jpg';

export const SERVICE_IMAGES: Record<string, string> = {
  // Body category
  'body_aroma-oil': 'https://i.ibb.co/FbNjKwKZ/aroma-oil.jpg',
  'body_coconut-oil': 'https://i.ibb.co/QvtnjcDQ/coconut-oil.jpg',
  'body_shiatsu': 'https://i.ibb.co/Q3yRwkZ2/shiatsu.jpg',
  'body_hotstone': 'https://i.ibb.co/mCXLjYB0/hotstone.jpg',
  'body_thai': 'https://i.ibb.co/b5s9VJjf/thai.jpg',
  'body_four-hand': 'https://i.ibb.co/DfSh9qrN/four-hand.jpg',

  // Foot category
  'foot_professional-foot-massage': 'https://i.ibb.co/M59V3YQF/foot-massage.jpg',
  'foot_foot-massage': 'https://i.ibb.co/M59V3YQF/foot-massage.jpg',

  // Hair Wash category
  'hair wash_hair-wash': 'https://i.ibb.co/N6WKRKZ2/hair-wash.jpg',
  'hair-wash_hair-wash': 'https://i.ibb.co/N6WKRKZ2/hair-wash.jpg',

  // Facial category
  'facial_facial': 'https://i.ibb.co/sdNmRhc5/facial.jpg',

  // Ear Clean category
  'ear clean_ear-clean': 'https://i.ibb.co/ZRfrGzhx/ear-clean.jpg',
  'ear-clean_ear-clean': 'https://i.ibb.co/ZRfrGzhx/ear-clean.jpg',
};

/**
 * Get image path for a grouped service.
 * Tries exact match, then partial match by category, then default.
 */
export const getServiceImage = (groupKey: string): string => {
  // Try exact match
  if (SERVICE_IMAGES[groupKey]) {
    return SERVICE_IMAGES[groupKey];
  }

  // Try partial match (check if any key contains part of the groupKey)
  const lowerKey = groupKey.toLowerCase();
  for (const [key, path] of Object.entries(SERVICE_IMAGES)) {
    if (lowerKey.includes(key.split('_')[1]) || key.includes(lowerKey.split('_')[1])) {
      return path;
    }
  }

  // Try category-based match
  const category = lowerKey.split('_')[0];
  const categoryImages: Record<string, string> = {
    body: 'https://i.ibb.co/FbNjKwKZ/aroma-oil.jpg',
    foot: 'https://i.ibb.co/M59V3YQF/foot-massage.jpg',
    'hair wash': 'https://i.ibb.co/N6WKRKZ2/hair-wash.jpg',
    'hair-wash': 'https://i.ibb.co/N6WKRKZ2/hair-wash.jpg',
    facial: 'https://i.ibb.co/sdNmRhc5/facial.jpg',
    'ear clean': 'https://i.ibb.co/ZRfrGzhx/ear-clean.jpg',
    'ear-clean': 'https://i.ibb.co/ZRfrGzhx/ear-clean.jpg',
    combo: 'https://i.ibb.co/FbNjKwKZ/aroma-oil.jpg',
  };

  return categoryImages[category] || DEFAULT_SERVICE_IMAGE;
};
