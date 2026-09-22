/**
 * Wadaage Mobility API & Server Configuration
 * Handles dynamic API routing for Web Browser, Hostinger VPS, Cloud Run, and Capacitor Mobile APKs
 */

// Key for storing custom remote server URL in localStorage (e.g. https://your-domain.com or https://vps-ip:3000)
const SERVER_URL_STORAGE_KEY = 'wadaage_remote_server_url';

// Default fallback server URL for APKs if no custom Hostinger URL is configured
const DEFAULT_REMOTE_URL = 'https://www.wadaage.com';

/**
 * Returns true if the app is running inside a Capacitor native mobile container (Android/iOS APK)
 */
export function isNativeMobileApp(): boolean {
  if (typeof window === 'undefined') return false;
  const isCapacitor = (window as any).Capacitor !== undefined;
  const isLocalOrigin =
    window.location.origin.includes('localhost') ||
    window.location.origin.includes('capacitor://') ||
    window.location.protocol === 'file:';
  return isCapacitor || (isLocalOrigin && !window.location.port.includes('3000'));
}

/**
 * Gets the configured Backend Server Base URL
 */
export function getServerBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  // 1. Check if user configured a custom Hostinger server domain in Admin / App Settings
  try {
    const savedUrl = localStorage.getItem(SERVER_URL_STORAGE_KEY);
    if (savedUrl && savedUrl.trim().length > 0) {
      return savedUrl.trim().replace(/\/+$/, '');
    }
  } catch (_e) {}

  // 2. Check environment variable (configured during build)
  const envApiUrl = (import.meta as any).env?.VITE_API_URL;
  if (envApiUrl && typeof envApiUrl === 'string') {
    return envApiUrl.replace(/\/+$/, '');
  }

  // 3. If running inside Capacitor APK on mobile, use default remote server endpoint
  if (isNativeMobileApp()) {
    return DEFAULT_REMOTE_URL;
  }

  // 4. In standard web browser on Hostinger or Cloud Run, relative paths or window.location.origin
  return '';
}

/**
 * Sets a custom remote Hostinger / VPS server URL
 */
export function setServerBaseUrl(url: string): void {
  if (typeof localStorage === 'undefined') return;
  const cleanUrl = url.trim().replace(/\/+$/, '');
  if (cleanUrl) {
    localStorage.setItem(SERVER_URL_STORAGE_KEY, cleanUrl);
  } else {
    localStorage.removeItem(SERVER_URL_STORAGE_KEY);
  }
}

/**
 * Resolves a full API URL given a path (e.g. '/api/rides/sync' -> 'https://wadaage.com/api/rides/sync')
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = getServerBaseUrl();
  return baseUrl ? `${baseUrl}${cleanEndpoint}` : cleanEndpoint;
}

/**
 * Enhanced fetch wrapper that automatically routes to the proper Hostinger/Cloud backend
 */
export async function apiFetch(endpoint: string, init?: RequestInit): Promise<Response> {
  const url = getApiUrl(endpoint);
  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}
