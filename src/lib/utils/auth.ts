/**
 * Authentication Utilities
 * Helper functions for auth token management and validation
 */

import { isValidToken } from './security';

const TOKEN_KEY = 'gm_session_token';
const ADDRESS_KEY = 'gm_user_address';

/**
 * Stores session token in localStorage
 */
export const storeToken = (token: string): void => {
  if (!isValidToken(token)) {
    console.warn('Invalid token format');
    return;
  }

  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store token:', error);
  }
};

/**
 * Retrieves session token from localStorage
 */
export const getStoredToken = (): string | null => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token && isValidToken(token) ? token : null;
  } catch (error) {
    console.error('Failed to retrieve token:', error);
    return null;
  }
};

/**
 * Removes session token from localStorage
 */
export const clearToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear token:', error);
  }
};

/**
 * Stores user address in localStorage
 */
export const storeAddress = (address: string): void => {
  if (!address || typeof address !== 'string') {
    return;
  }

  try {
    localStorage.setItem(ADDRESS_KEY, address);
  } catch (error) {
    console.error('Failed to store address:', error);
  }
};

/**
 * Retrieves user address from localStorage
 */
export const getStoredAddress = (): string | null => {
  try {
    return localStorage.getItem(ADDRESS_KEY);
  } catch (error) {
    console.error('Failed to retrieve address:', error);
    return null;
  }
};

/**
 * Removes user address from localStorage
 */
export const clearAddress = (): void => {
  try {
    localStorage.removeItem(ADDRESS_KEY);
  } catch (error) {
    console.error('Failed to clear address:', error);
  }
};

/**
 * Clears all auth data
 */
export const clearAuthData = (): void => {
  clearToken();
  clearAddress();
};

/**
 * Gets authorization header for API requests
 */
export const getAuthHeader = (): Record<string, string> => {
  const token = getStoredToken();
  
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
};

/**
 * Checks if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getStoredToken();
  const address = getStoredAddress();
  
  return !!(token && address);
};

/**
 * Decodes JWT token (client-side only, does not verify signature)
 * WARNING: This only decodes the token, signature verification should happen server-side
 */
export const decodeToken = (token: string): any | null => {
  try {
    if (!isValidToken(token)) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (second part)
    const decoded = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Checks if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    
    if (!decoded || !decoded.exp) {
      return true;
    }

    // exp is in seconds, current time in milliseconds
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp <= now;
  } catch (error) {
    return true;
  }
};

/**
 * Gets time until token expires (in seconds)
 */
export const getTokenExpirationTime = (token: string): number => {
  try {
    const decoded = decodeToken(token);
    
    if (!decoded || !decoded.exp) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    const secondsUntilExpiry = decoded.exp - now;
    
    return Math.max(0, secondsUntilExpiry);
  } catch (error) {
    return 0;
  }
};

/**
 * Gets user address from token without needing localStorage
 */
export const getAddressFromToken = (token: string): string | null => {
  try {
    const decoded = decodeToken(token);
    return decoded?.address || null;
  } catch (error) {
    return null;
  }
};
