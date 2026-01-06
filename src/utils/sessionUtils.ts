/**
 * Session and authentication utilities
 */

/**
 * Check if CSRF token cookie exists
 */
export const hasCSRFToken = (): boolean => {
  return document.cookie.includes('XSRF-TOKEN');
};

/**
 * Check if Laravel session cookie exists
 */
export const hasSessionCookie = (): boolean => {
  return document.cookie.includes('laravel_session');
};

/**
 * Get cookie value by name
 */
export const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};

/**
 * Clear all authentication-related data
 */
export const clearAuthData = (): void => {
  // Clear localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('currentUser');
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Note: We can't directly delete httpOnly cookies from JavaScript
  // They will be cleared by the backend on logout
};

/**
 * Check if user appears to be authenticated (has session cookie)
 */
export const hasActiveSession = (): boolean => {
  return hasSessionCookie() && hasCSRFToken();
};

/**
 * Log session debug info (for development)
 */
export const logSessionDebug = (): void => {
  if (import.meta.env.DEV) {
    console.log('🔐 Session Debug Info:');
    console.log('  - Has CSRF Token:', hasCSRFToken());
    console.log('  - Has Session Cookie:', hasSessionCookie());
    console.log('  - CSRF Token:', getCookie('XSRF-TOKEN')?.substring(0, 20) + '...');
    console.log('  - All Cookies:', document.cookie);
  }
};
