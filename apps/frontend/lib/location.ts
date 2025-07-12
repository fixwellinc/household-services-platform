// BC Location and Postal Code Validation Utilities

// BC postal codes start with V (Vancouver Island) and T (Mainland)
const BC_POSTAL_CODE_PREFIXES = ['V', 'T'];

// Major BC cities and their postal code ranges
export const BC_CITIES = {
  'Vancouver': { prefix: 'V', ranges: ['V1A', 'V1B', 'V1C', 'V1E', 'V1G', 'V1H', 'V1J', 'V1K', 'V1L', 'V1M', 'V1N', 'V1P', 'V1R', 'V1S', 'V1T', 'V1V', 'V1W', 'V1X', 'V1Y', 'V1Z', 'V2A', 'V2B', 'V2C', 'V2E', 'V2G', 'V2H', 'V2J', 'V2K', 'V2L', 'V2M', 'V2N', 'V2P', 'V2R', 'V2S', 'V2T', 'V2V', 'V2W', 'V2X', 'V2Y', 'V2Z', 'V3A', 'V3B', 'V3C', 'V3E', 'V3G', 'V3H', 'V3J', 'V3K', 'V3L', 'V3M', 'V3N', 'V3P', 'V3R', 'V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Y', 'V3Z', 'V4A', 'V4B', 'V4C', 'V4E', 'V4G', 'V4H', 'V4J', 'V4K', 'V4L', 'V4M', 'V4N', 'V4P', 'V4R', 'V4S', 'V4T', 'V4V', 'V4W', 'V4X', 'V4Y', 'V4Z', 'V5A', 'V5B', 'V5C', 'V5E', 'V5G', 'V5H', 'V5J', 'V5K', 'V5L', 'V5M', 'V5N', 'V5P', 'V5R', 'V5S', 'V5T', 'V5V', 'V5W', 'V5X', 'V5Y', 'V5Z', 'V6A', 'V6B', 'V6C', 'V6E', 'V6G', 'V6H', 'V6J', 'V6K', 'V6L', 'V6M', 'V6N', 'V6P', 'V6R', 'V6S', 'V6T', 'V6V', 'V6W', 'V6X', 'V6Y', 'V6Z', 'V7A', 'V7B', 'V7C', 'V7E', 'V7G', 'V7H', 'V7J', 'V7K', 'V7L', 'V7M', 'V7N', 'V7P', 'V7R', 'V7S', 'V7T', 'V7V', 'V7W', 'V7X', 'V7Y', 'V7Z'] },
  'Victoria': { prefix: 'V', ranges: ['V8A', 'V8B', 'V8C', 'V8E', 'V8G', 'V8H', 'V8J', 'V8K', 'V8L', 'V8M', 'V8N', 'V8P', 'V8R', 'V8S', 'V8T', 'V8V', 'V8W', 'V8X', 'V8Y', 'V8Z', 'V9A', 'V9B', 'V9C', 'V9E', 'V9G', 'V9H', 'V9J', 'V9K', 'V9L', 'V9M', 'V9N', 'V9P', 'V9R', 'V9S', 'V9T', 'V9V', 'V9W', 'V9X', 'V9Y', 'V9Z'] },
  'Surrey': { prefix: 'V', ranges: ['V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Y', 'V3Z', 'V4A', 'V4B', 'V4C'] },
  'Burnaby': { prefix: 'V', ranges: ['V3J', 'V3K', 'V3L', 'V3M', 'V3N', 'V3P', 'V3R', 'V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Y', 'V3Z', 'V5A', 'V5B', 'V5C', 'V5E', 'V5G', 'V5H', 'V5J', 'V5K', 'V5L', 'V5M', 'V5N', 'V5P', 'V5R', 'V5S', 'V5T', 'V5V', 'V5W', 'V5X', 'V5Y', 'V5Z'] },
  'Richmond': { prefix: 'V', ranges: ['V6V', 'V6W', 'V6X', 'V6Y', 'V6Z', 'V7A', 'V7B', 'V7C', 'V7E', 'V7G', 'V7H', 'V7J', 'V7K', 'V7L', 'V7M', 'V7N', 'V7P', 'V7R', 'V7S', 'V7T', 'V7V', 'V7W', 'V7X', 'V7Y', 'V7Z'] },
  'Kelowna': { prefix: 'V', ranges: ['V1P', 'V1R', 'V1S', 'V1T', 'V1V', 'V1W', 'V1X', 'V1Y', 'V1Z'] },
  'Nanaimo': { prefix: 'V', ranges: ['V9R', 'V9S', 'V9T', 'V9V', 'V9W', 'V9X', 'V9Y', 'V9Z'] },
  'Kamloops': { prefix: 'V', ranges: ['V1S', 'V1T', 'V1V', 'V1W', 'V1X', 'V1Y', 'V1Z', 'V2B', 'V2C', 'V2E', 'V2G', 'V2H'] },
  'Abbotsford': { prefix: 'V', ranges: ['V2S', 'V2T', 'V2V', 'V2W', 'V2X', 'V2Y', 'V2Z'] },
  'Coquitlam': { prefix: 'V', ranges: ['V3C', 'V3E', 'V3G', 'V3H', 'V3J', 'V3K', 'V3L', 'V3M', 'V3N', 'V3P', 'V3R', 'V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Y', 'V3Z'] }
};

/**
 * Validates if a postal code is in British Columbia
 * @param postalCode - The postal code to validate (e.g., "V6B 2Z9")
 * @returns boolean - True if the postal code is in BC
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
  return postalCodeRegex.test(cleanPostalCode);
}

/**
 * Gets the city name for a BC postal code
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
 * Gets all available BC cities
 * @returns string[] - Array of BC city names
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
 * @returns string - Formatted postal code or empty string if invalid
 */
export function validateAndFormatPostalCode(input: string): string {
  const cleanInput = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  if (cleanInput.length > 6) {
    return formatPostalCode(cleanInput.substring(0, 6));
  }
  
  return cleanInput;
} 