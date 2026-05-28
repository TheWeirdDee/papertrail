/**
 * Input Validation Utilities
 * Provides safe validation and sanitization for user inputs
 */

/**
 * Validates Stacks address format
 * @param address - The address to validate
 * @returns True if address is valid Stacks format
 */
export const isValidStacksAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  
  // Stacks addresses start with SP (mainnet), ST (testnet), or SM (mainnet multisig)
  const stacksAddressRegex = /^(SP|ST|SM)[0-9A-Z]{30,32}$/;
  return stacksAddressRegex.test(address.toUpperCase());
};

/**
 * Validates contract name format
 * @param name - The contract name to validate
 * @returns True if contract name is valid
 */
export const isValidContractName = (name: string): boolean => {
  if (!typeof name === 'string' || name.length === 0) return false;
  if (name.length > 128) return false;
  
  // Contract names can contain lowercase letters, numbers, and hyphens
  const contractNameRegex = /^[a-z0-9\-]+$/;
  return contractNameRegex.test(name);
};

/**
 * Validates URL format
 * @param url - The URL to validate
 * @returns True if URL is valid
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitizes string input to prevent XSS
 * @param input - The input to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim();
};

/**
 * Validates numeric amount within safe limits
 * @param amount - The amount to validate
 * @param min - Minimum allowed (default: 0)
 * @param max - Maximum allowed (default: Number.MAX_SAFE_INTEGER)
 * @returns True if amount is valid
 */
export const isValidAmount = (
  amount: any,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): boolean => {
  const num = Number(amount);
  return !isNaN(num) && num >= min && num <= max && Number.isInteger(num);
};

/**
 * Validates email format
 * @param email - Email to validate
 * @returns True if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

/**
 * Validates username format
 * @param username - Username to validate
 * @returns True if username is valid
 */
export const isValidUsername = (username: string): boolean => {
  if (!username || typeof username !== 'string') return false;
  if (username.length < 3 || username.length > 32) return false;
  
  // Allow alphanumeric, underscores, hyphens
  const usernameRegex = /^[a-zA-Z0-9_\-]+$/;
  return usernameRegex.test(username);
};

/**
 * Validates transaction ID format
 * @param txId - Transaction ID to validate
 * @returns True if valid tx format
 */
export const isValidTransactionId = (txId: string): boolean => {
  if (!txId || typeof txId !== 'string') return false;
  
  // Stacks tx IDs are 64-character hex strings or start with 0x
  const txIdRegex = /^(0x)?[a-f0-9]{64}$/i;
  return txIdRegex.test(txId);
};
