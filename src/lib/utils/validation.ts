export const isValidStacksAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  // SP/ST/SM prefix + c32-encoded body (38–46 chars total)
  const stacksAddressRegex = /^(SP|ST|SM)[0-9A-Z]{30,44}$/;
  return stacksAddressRegex.test(address.toUpperCase());
};

export const isValidContractName = (name: string): boolean => {
  if (typeof name !== 'string' || name.length === 0 || name.length > 128) return false;
  return /^[a-z0-9\-]+$/.test(name);
};

export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '').replace(/javascript:/gi, '').trim();
};

export const isValidAmount = (
  amount: any,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): boolean => {
  const num = Number(amount);
  return !isNaN(num) && num >= min && num <= max && Number.isInteger(num);
};

export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

export const isValidUsername = (username: string): boolean => {
  if (!username || typeof username !== 'string') return false;
  if (username.length < 3 || username.length > 32) return false;
  return /^[a-zA-Z0-9_\-]+$/.test(username);
};

export const isValidTransactionId = (txId: string): boolean => {
  if (!txId || typeof txId !== 'string') return false;
  // Stacks tx IDs are 64-char hex strings, optionally prefixed with 0x
  return /^(0x)?[a-f0-9]{64}$/i.test(txId);
};
