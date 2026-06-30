import { logErrorLevel } from './logger';

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

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const config: EnvironmentConfig = {
    isProduction: process.env.NODE_ENV === 'production',
    isMainnet: process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    stacksNetwork: (process.env.NEXT_PUBLIC_STACKS_NETWORK as EnvironmentConfig['stacksNetwork']) || 'testnet',
    apiTimeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.NEXT_PUBLIC_MAX_RETRIES || '3'),
    corsProxyUrl: process.env.NEXT_PUBLIC_CORS_PROXY_URL || '/api/cors-proxy',
  };

  validateEnvironmentConfig(config);
  return config;
};

const validateEnvironmentConfig = (config: EnvironmentConfig): void => {
  const errors: string[] = [];

  if (!config.supabaseUrl || config.supabaseUrl.includes('placeholder')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is missing or invalid');
  }

  if (!config.supabaseAnonKey || config.supabaseAnonKey.includes('placeholder')) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid');
  }

  if (!config.appUrl) {
    errors.push('NEXT_PUBLIC_APP_URL is missing');
  }

  if (!['mainnet', 'testnet', 'devnet'].includes(config.stacksNetwork)) {
    errors.push(`Invalid NEXT_PUBLIC_STACKS_NETWORK: ${config.stacksNetwork}`);
  }

  if (config.apiTimeout < 5000 || config.apiTimeout > 120000) {
    errors.push(`API_TIMEOUT should be between 5000 and 120000ms`);
  }

  if (config.maxRetries < 1 || config.maxRetries > 10) {
    errors.push(`MAX_RETRIES should be between 1 and 10`);
  }

  if (errors.length > 0) {
    logErrorLevel('env.validateEnvironmentConfig', 'Environment configuration errors', { errors });
    if (config.isProduction) {
      throw new Error(`Critical environment errors: ${errors.join('; ')}`);
    }
  }
};

export const getServerEnvironmentConfig = () => {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnvironmentConfig cannot be called from client-side code');
  }

  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceRoleKey || supabaseServiceRoleKey === 'PASTE_SERVICE_ROLE_KEY_HERE') {
    const msg = 'SUPABASE_SERVICE_ROLE_KEY is missing or not configured';
    logErrorLevel('env.getServerEnvironmentConfig', msg);
    throw new Error(`Critical server environment error: ${msg}`);
  }

  return { supabaseServiceRoleKey };
};

export const isValidEnvironment = (env: string): boolean => {
  return ['production', 'development', 'test'].includes(env);
};

export const getApiEndpoint = (): string => {
  const config = getEnvironmentConfig();
  return config.isMainnet
    ? 'https://api.mainnet.hiro.so'
    : 'https://api.testnet.hiro.so';
};

export const getExplorerUrl = (): string => {
  const config = getEnvironmentConfig();
  return config.isMainnet
    ? 'https://explorer.hiro.so'
    : 'https://testnet.hiro.so';
};
