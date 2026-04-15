/**
 * Shared fetch for all API endpoints (not just /auth)
 * Always includes credentials and CSRF token for state-changing requests
 */
export function getCSRFToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const csrfToken = isStateChanging ? getCSRFToken() : undefined;
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.headers || {}),
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
  });
}
// API utilities for authentication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio?: string;
  date_joined?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  errors?: Record<string, string[]>;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user?: User;
}

/**
 * Helper functions for session, localStorage, and cookies
 */
function setLoggedInState(isLoggedIn: boolean): void {
  if (typeof window === 'undefined') return;
  // Session storage - cleared when browser tab closes
  sessionStorage.setItem('loggedIn', isLoggedIn ? 'true' : 'false');
  // Local storage - persists across browser sessions
  localStorage.setItem('loggedIn', isLoggedIn ? 'true' : 'false');
  // Cookie for server-side access (optional, for backup)
  document.cookie = `loggedIn=${isLoggedIn ? 'true' : 'false'}; path=/; max-age=${isLoggedIn ? 604800 : 0}`;
}

function clearLoggedInState(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('loggedIn');
  localStorage.removeItem('loggedIn');
  document.cookie = 'loggedIn=; path=/; max-age=0';
}

/**
 * Fetch wrapper that handles credentials (session cookies)
 */

// First, fetch the CSRF token endpoint to ensure we have a valid token
async function ensureCsrfToken(): Promise<void> {
  if (typeof window === 'undefined') return;
  // Check if we already have a CSRF token
  const existingToken = getCSRFToken();
  if (existingToken) return;
  
  // Fetch a fresh CSRF token from the backend
  try {
    await fetch(`${API_BASE_URL}/auth/csrf/`, {
      credentials: 'include',
    });
  } catch (error) {
    console.warn('Failed to fetch CSRF token:', error);
  }
}

async function authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  // Auth endpoints are at /auth/... not /api/...
  const url = `${API_BASE_URL}/auth${endpoint}`;

  // For state-changing requests, ensure we have a CSRF token first
  const method = (options.method || 'GET').toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  if (isStateChanging) {
    await ensureCsrfToken();
  }
  
  const csrfToken = isStateChanging ? getCSRFToken() : undefined;

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
      ...options.headers,
    },
  });
}

/**
 * Register a new user
 */
export async function register(
  username: string,
  email: string,
  password1: string,
  password2: string
): Promise<AuthResponse> {
  try {
    const response = await authFetch('/register/', {
      method: 'POST',
      body: JSON.stringify({ username, email, password1, password2 }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, errors: errorData.errors || { form: ['Registration failed'] } };
    }
    const result = await response.json();
    // Set loggedIn flag on successful registration
    if (result.success) {
      setLoggedInState(true);
    }
    return result;
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, errors: { form: ['Server unavailable. Please try again.'] } };
  }
}

/**
 * Login user
 */
export async function login(username: string, password: string): Promise<AuthResponse> {
  try {
    const response = await authFetch('/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, errors: errorData.errors || { form: ['Login failed'] } };
    }
    const result = await response.json();
    // Set loggedIn flag on successful login
    if (result.success) {
      setLoggedInState(true);
    }
    return result;
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, errors: { form: ['Server unavailable. Please try again.'] } };
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<AuthResponse> {
  try {
    const response = await authFetch('/logout/', {
      method: 'POST',
    });
    // Clear loggedIn flag on logout
    clearLoggedInState();
    return response.json();
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear state even if backend call fails
    clearLoggedInState();
    return { success: false, message: 'Logout failed' };
  }
}

/**
 * Check authentication status
 */
export async function checkAuth(): Promise<AuthStatusResponse> {
  try {
    const response = await authFetch('/check/');
    if (!response.ok) {
      return { authenticated: false };
    }
    return response.json();
  } catch (error) {
    // Silently fail - backend might be unavailable or user not authenticated
    return { authenticated: false };
  }
}

/**
 * Get user profile
 */
export async function getProfile(): Promise<{ user: User }> {
  const response = await authFetch('/profile/');
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  return response.json();
}

/**
 * Update user profile
 */
export async function updateProfile(
  data: { first_name?: string; last_name?: string; email?: string; bio?: string }
): Promise<AuthResponse> {
  try {
    const response = await authFetch('/profile/update/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, errors: errorData.errors || { form: ['Update failed'] } };
    }
    return response.json();
  } catch (error) {
    console.error('Profile update error:', error);
    return { success: false, errors: { form: ['Server unavailable. Please try again.'] } };
  }
}
