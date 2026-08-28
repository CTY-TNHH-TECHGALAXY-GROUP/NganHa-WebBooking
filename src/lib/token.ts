/**
 * Token utility for URL security
 * Generates random access tokens for bookings — prevents URL enumeration
 */

/**
 * Generate a random access token (32-char hex string)
 * Used as URL identifier instead of predictable booking IDs
 */
export const generateAccessToken = (): string => {
  // Use crypto.randomUUID() and strip dashes for clean URL
  return crypto.randomUUID().replace(/-/g, '');
};
