// BC Location and Postal Code Validation Utilities

// BC postal codes start with V (Vancouver Island) and T (Mainland)
const BC_POSTAL_CODE_PREFIXES = ['V', 'T'];

// Service area: Within 50km of Surrey, excluding islands
// Focus on Lower Mainland cities around Surrey
export const BC_CITIES = {
  'Surrey': { prefix: 'V', ranges: ['V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Y', 'V3Z', 'V4A', 'V4B', 'V4C'] },
  'Vancouver': { prefix: 'V', ranges: ['V5A', 'V5B', 'V5C', 'V5E', 'V5G', 'V5H', 'V5J', 'V5K', 'V5L', 'V5M', 'V5N', 'V5P', 'V5R', 'V5S', 'V5T', 'V5V', 'V5W', 'V5X', 'V5Y', 'V5Z', 'V6A', 'V6B', 'V6C', 'V6E', 'V6G', 'V6H', 'V6J', 'V6K', 'V6L', 'V6M', 'V6N', 'V6P', 'V6R', 'V6S', 'V6T', 'V6V', 'V6W', 'V6X', 'V6Y', 'V6Z', 'V7A', 'V7B', 'V7C', 'V7E', 'V7G', 'V7H', 'V7J', 'V7K', 'V7L', 'V7M', 'V7N', 'V7P', 'V7R', 'V7S', 'V7T', 'V7V', 'V7W', 'V7X', 'V7Y', 'V7Z'] },
  'Burnaby': { prefix: 'V', ranges: ['V3J', 'V3K', 'V3L', 'V3M', 'V3N', 'V3P', 'V3R', 'V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Y', 'V3Z', 'V5A', 'V5B', 'V5C', 'V5E', 'V5G', 'V5H', 'V5J', 'V5K', 'V5L', 'V5M', 'V5N', 'V5P', 'V5R', 'V5S', 'V5T', 'V5V', 'V5W', 'V5X', 'V5Y', 'V5Z'] },
  'Richmond': { prefix: 'V', ranges: ['V6V', 'V6W', 'V6X', 'V6Y', 'V6Z', 'V7A', 'V7B', 'V7C', 'V7E', 'V7G', 'V7H', 'V7J', 'V7K', 'V7L', 'V7M', 'V7N', 'V7P', 'V7R', 'V7S', 'V7T', 'V7V', 'V7W', 'V7X', 'V7Y', 'V7Z'] },
  'Coquitlam': { prefix: 'V', ranges: ['V3C', 'V3E', 'V3G', 'V3H', 'V3J', 'V3K', 'V3L', 'V3M', 'V3N', 'V3P', 'V3R', 'V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Y', 'V3Z'] },
  'New Westminster': { prefix: 'V', ranges: ['V3L', 'V3M', 'V3N', 'V3P', 'V3R', 'V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Y', 'V3Z'] },
  'Delta': { prefix: 'V', ranges: ['V4K', 'V4L', 'V4M', 'V4N', 'V4P', 'V4R', 'V4S', 'V4T', 'V4V', 'V4W', 'V4X', 'V4Y', 'V4Z'] },
  'Langley': { prefix: 'V', ranges: ['V1M', 'V1N', 'V1P', 'V1R', 'V1S', 'V1T', 'V1V', 'V1W', 'V1X', 'V1Y', 'V1Z', 'V2Y', 'V2Z'] },
  'Maple Ridge': { prefix: 'V', ranges: ['V2W', 'V2X', 'V2Y', 'V2Z'] },
  'Pitt Meadows': { prefix: 'V', ranges: ['V3Y', 'V3Z'] },
  'Port Coquitlam': { prefix: 'V', ranges: ['V3C', 'V3E', 'V3G', 'V3H', 'V3J', 'V3K', 'V3L', 'V3M', 'V3N', 'V3P', 'V3R', 'V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Y', 'V3Z'] },
  'Port Moody': { prefix: 'V', ranges: ['V3H', 'V3J', 'V3K', 'V3L', 'V3M', 'V3N', 'V3P', 'V3R', 'V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Y', 'V3Z'] },
  'White Rock': { prefix: 'V', ranges: ['V4A', 'V4B', 'V4C'] },
  'North Vancouver': { prefix: 'V', ranges: ['V7G', 'V7H', 'V7J', 'V7K', 'V7L', 'V7M', 'V7N', 'V7P', 'V7R', 'V7S', 'V7T', 'V7V', 'V7W', 'V7X', 'V7Y', 'V7Z'] },
  'West Vancouver': { prefix: 'V', ranges: ['V7S', 'V7T', 'V7V', 'V7W', 'V7X', 'V7Y', 'V7Z'] }
};

/**
 * Validates if a postal code is in the service area (within 50km of Surrey)
 * @param postalCode - The postal code to validate (e.g., "V6B 2Z9")
 * @returns boolean - True if the postal code is in the service area
 */
export function isBCPostalCode(postalCode: string): boolean {
  if (!postalCode) return false;
  
  // Clean the postal code (remove spaces, convert to uppercase)
  const cleanPostalCode = postalCode.replace(/\s/g, '').toUpperCase();
  
  // Check if it starts with BC prefixes
  const firstChar = cleanPostalCode.charAt(0);
  if (!BC_POSTAL_CODE_PREFIXES.includes(firstChar)) {
    return false;
  }
  
  // Basic format validation (A1A 1A1 format)
  const postalCodeRegex = /^[VT]\d[A-Z]\d[A-Z]\d$/;
  if (!postalCodeRegex.test(cleanPostalCode)) {
    return false;
  }
  
  // Check if it's in our service area (within 50km of Surrey)
  const prefix = cleanPostalCode.substring(0, 3);
  for (const cityData of Object.values(BC_CITIES)) {
    if (cityData.ranges.includes(prefix)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Gets the city name for a postal code in the service area
 * @param postalCode - The postal code to check
 * @returns string | null - The city name or null if not found
 */
export function getBCCityFromPostalCode(postalCode: string): string | null {
  if (!isBCPostalCode(postalCode)) return null;
  
  const cleanPostalCode = postalCode.replace(/\s/g, '').toUpperCase();
  const prefix = cleanPostalCode.substring(0, 3);
  
  for (const [city, data] of Object.entries(BC_CITIES)) {
    if (data.ranges.includes(prefix)) {
      return city;
    }
  }
  
  return null;
}

/**
 * Gets all available cities in the service area
 * @returns string[] - Array of city names
 */
export function getAvailableBCCities(): string[] {
  return Object.keys(BC_CITIES);
}

/**
 * Formats a postal code for display
 * @param postalCode - The postal code to format
 * @returns string - Formatted postal code (e.g., "V6B 2Z9")
 */
export function formatPostalCode(postalCode: string): string {
  if (!postalCode) return '';
  
  const cleanPostalCode = postalCode.replace(/\s/g, '').toUpperCase();
  
  if (cleanPostalCode.length === 6) {
    return `${cleanPostalCode.substring(0, 3)} ${cleanPostalCode.substring(3, 6)}`;
  }
  
  return cleanPostalCode;
}

/**
 * Validates and formats a postal code input
 * @param input - The user input
 * @returns string - Formatted postal code or partial input for typing
 */
export function validateAndFormatPostalCode(input: string): string {
  const cleanInput = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // If we have exactly 6 characters and it matches the format, format it
  const postalCodeRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
  if (cleanInput.length === 6 && postalCodeRegex.test(cleanInput)) {
    return formatPostalCode(cleanInput);
  }
  
  // For partial input, just return the cleaned input (up to 6 characters)
  return cleanInput.substring(0, 6);
} 