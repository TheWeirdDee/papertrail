/**
 * Environment Configuration & Validation
 * Ensures all required environment variables are properly set at runtime
 */

interface EnvironmentConfig {
  isProduction: boolean;
  isMainnet: boolean;
  appUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  stacksNetwork: 'mainnet' | 'testnet' | 'devnet';
  apiTimeout: number;
  maxRetries: number;
  corsProxyUrl: string;
}

/**
 * Validates and retrieves environment configuration
 * @returns Environment configuration object
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const config: EnvironmentConfig = {
    isProduction: process.env.NODE_ENV === 'production',
    isMainnet: process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    stacksNetwork: (process.env.NEXT_PUBLIC_STACKS_NETWORK as any) || 'testnet',
    apiTimeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.NEXT_PUBLIC_MAX_RETRIES || '3'),
    corsProxyUrl: process.env.NEXT_PUBLIC_CORS_PROXY_URL || '/api/cors-proxy',
  };
  
  validateEnvironmentConfig(config);
  return config;
};

/**
 * Validates environment configuration
 * @param config - Configuration to validate
 * @throws Error if validation fails
 */
const validateEnvironmentConfig = (config: EnvironmentConfig): void => {
  const errors: string[] = [];
  
  // Validate Supabase configuration
  if (!config.supabaseUrl || config.supabaseUrl.includes('placeholder')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is missing or invalid');
  }
  
  if (!config.supabaseAnonKey || config.supabaseAnonKey.includes('placeholder')) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid');
  }
  
  // Validate App URL
  if (!config.appUrl) {
    errors.push('NEXT_PUBLIC_APP_URL is missing');
  }
  
  // Validate Stacks network
  if (!['mainnet', 'testnet', 'devnet'].includes(config.stacksNetwork)) {
    errors.push(`Invalid NEXT_PUBLIC_STACKS_NETWORK: ${config.stacksNetwork}`);
  }
  
  // Validate numeric configurations
  if (config.apiTimeout < 5000 || config.apiTimeout > 120000) {
    errors.push(`API_TIMEOUT should be between 5000 and 120000ms`);
  }
  
  if (config.maxRetries < 1 || config.maxRetries > 10) {
    errors.push(`MAX_RETRIES should be between 1 and 10`);
  }
  
  if (errors.length > 0) {
    console.error('Environment Configuration Errors:', errors);
    if (config.isProduction) {
      throw new Error(`Critical environment errors: ${errors.join('; ')}`);
    }
  }
};

/**
 * Gets server-side only environment variables
 * Must only be called from server-side code (API routes, server components)
 * @returns Server-only configuration
 */
export const getServerEnvironmentConfig = () => {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnvironmentConfig cannot be called from client-side code');
  }
  
  const errors: string[] = [];
  
  // Validate critical server environment variables
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceRoleKey || supabaseServiceRoleKey === 'PASTE_SERVICE_ROLE_KEY_HERE') {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is missing or not configured');
  }
  
  if (errors.length > 0) {
    console.error('Server Environment Errors:', errors);
    throw new Error(`Critical server environment errors: ${errors.join('; ')}`);
  }
  
  return {
    supabaseServiceRoleKey: supabaseServiceRoleKey!,
  };
};

/**
 * Checks if a specific environment is valid
 * @param env - Environment name to check
 * @returns True if environment is valid
 */
export const isValidEnvironment = (env: string): boolean => {
  return ['production', 'development', 'test'].includes(env);
};

/**
 * Gets API endpoint based on network configuration
 * @returns API base URL
 */
export const getApiEndpoint = (): string => {
  const config = getEnvironmentConfig();
  
  if (config.isMainnet) {
    return 'https://api.mainnet.hiro.so';
  }
  
  return 'https://api.testnet.hiro.so';
};

/**
 * Gets explorer URL based on network configuration
 * @returns Explorer base URL
 */
export const getExplorerUrl = (): string => {
  const config = getEnvironmentConfig();
  
  if (config.isMainnet) {
    return 'https://explorer.hiro.so';
  }
  
  return 'https://testnet.hiro.so';
};
