import { createClient } from '@supabase/supabase-js';
import { logErrorLevel, logWarn, logInfo } from './utils/logger';
import { getEnvironmentConfig, getServerEnvironmentConfig } from './utils/env';
import { logError, createErrorResponse } from './utils/errors';
import { isValidToken } from './utils/security';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseUrl.startsWith('http')) {
  logErrorLevel('supabase', 'CRITICAL: NEXT_PUBLIC_SUPABASE_URL missing or invalid');
}

if (!supabaseAnonKey) {
  logWarn('supabase', 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing; some features may not work in browser');
// Validate environment at load time
if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL is missing or invalid');
}

if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
  console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid');
}

export const supabase = createClient(
  supabaseUrl || 'https://missing-supabase-url.co',
  supabaseAnonKey || 'missing-key'
);

/**
 * Gets authenticated client for browser-side requests
 * Validates stored token before using it
 */
export const getSupaClient = () => {
  if (typeof window === 'undefined') return supabase;

  const token = localStorage.getItem('gm_session_token');
  
  if (!token || !isValidToken(token)) {
    return supabase;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
};

/**
 * Gets service role client for server-only operations
 * Must only be called from server-side code
 */
export const getServiceRoleClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Service role client cannot be used from client-side code');
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceKey || serviceKey === 'PASTE_SERVICE_ROLE_KEY_HERE') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

/**
 * Uploads file to media/avatars bucket via secure API proxy
 * Validates file before upload
 */
export async function uploadFile(
  bucket: 'media' | 'avatars',
  file: File
): Promise<string | null> {
  try {
    // Validate bucket name
    if (!['media', 'avatars'].includes(bucket)) {
      throw new Error('Invalid bucket name');
    }

    // Validate file
    if (!file || file.size === 0) {
      throw new Error('File is required');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File exceeds maximum size of 5MB');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Upload failed');
    }

    const { url } = await response.json();
    
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid upload response');
    }

    return url;
  } catch (error: any) {
    logErrorLevel('supabase.uploadFile', `Upload error to ${bucket}`, undefined, error instanceof Error ? error : undefined);
    logError(`File upload to ${bucket}`, error);
    return null;
  }
}
