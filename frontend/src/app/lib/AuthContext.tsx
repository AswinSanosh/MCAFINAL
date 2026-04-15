"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User, login as loginApi, register as registerApi, logout as logoutApi, checkAuth } from "./auth";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; errors?: Record<string, string[]> }>;
  register: (username: string, email: string, password1: string, password2: string) => Promise<{ success: boolean; errors?: Record<string, string[]> }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for session, localStorage, and cookies
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

function hasSessionCookie(): boolean {
  return getCookie('sessionid') !== undefined;
}

function setLoggedInState(isLoggedIn: boolean): void {
  if (typeof window === 'undefined') return;
  // Session storage - cleared when browser tab closes
  sessionStorage.setItem('loggedIn', isLoggedIn ? 'true' : 'false');
  // Local storage - persists across browser sessions
  localStorage.setItem('loggedIn', isLoggedIn ? 'true' : 'false');
  // Cookie for server-side access (optional, for backup)
  document.cookie = `loggedIn=${isLoggedIn ? 'true' : 'false'}; path=/; max-age=${isLoggedIn ? 604800 : 0}`;
}

function getLoggedInState(): boolean {
  if (typeof window === 'undefined') return false;
  // Check sessionStorage first
  const sessionState = sessionStorage.getItem('loggedIn');
  if (sessionState === 'true') return true;
  // Fall back to localStorage
  const localState = localStorage.getItem('loggedIn');
  return localState === 'true';
}

function clearLoggedInState(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('loggedIn');
  localStorage.removeItem('loggedIn');
  document.cookie = 'loggedIn=; path=/; max-age=0';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // SSR-safe: start with null, restore from localStorage in useEffect
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user from localStorage on mount if loggedIn flag is set
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLoggedIn = getLoggedInState();
      if (!isLoggedIn) {
        // Not logged in according to our flags, clear everything
        setUser(null);
        localStorage.removeItem('automl_user');
        clearLoggedInState();
        setIsLoading(false);
        return;
      }
      // Logged in flag is set, restore user data
      try {
        const stored = localStorage.getItem('automl_user');
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        setUser(null);
        clearLoggedInState();
      }
    }
    setIsLoading(false);
  }, []);

  // Check auth status with backend to validate session
  const refreshAuth = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    try {
      const status = await checkAuth();
      if (status.authenticated && status.user) {
        setUser(status.user);
        localStorage.setItem('automl_user', JSON.stringify(status.user));
        setLoggedInState(true);
      } else {
        // Backend says not authenticated, clear everything
        setUser(null);
        localStorage.removeItem('automl_user');
        clearLoggedInState();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Backend unavailable - keep user logged in based on localStorage flag
      // This allows offline/partial availability scenarios
      const isLoggedIn = getLoggedInState();
      if (isLoggedIn) {
        const stored = localStorage.getItem('automl_user');
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch (e) {
            setUser(null);
            clearLoggedInState();
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem('automl_user');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only check auth if backend is available
    refreshAuth().catch(() => {
      console.warn("Backend unavailable, user will need to login");
      setIsLoading(false);
    });
  }, [refreshAuth]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginApi(username, password);
    if (result.success && result.user) {
      setUser(result.user);
      localStorage.setItem('automl_user', JSON.stringify(result.user));
      setLoggedInState(true);
    }
    return result;
  }, []);

  const register = useCallback(async (username: string, email: string, password1: string, password2: string) => {
    const result = await registerApi(username, email, password1, password2);
    if (result.success && result.user) {
      setUser(result.user);
      localStorage.setItem('automl_user', JSON.stringify(result.user));
      setLoggedInState(true);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
    localStorage.removeItem('automl_user');
    clearLoggedInState();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
