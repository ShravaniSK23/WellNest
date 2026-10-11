import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  UserProfile,
  UserRole,
  LoginPayload,
  RegisterPayload,
} from '../types/auth.types';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';
import { subscribeToSessionExpiry } from '../api/apiClient';

interface MfaPendingState {
  isPending: boolean;
  mfaPendingToken: string;
  userId: string;
  sessionId: string;
  role?: UserRole;
}

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaPending: MfaPendingState | null;
  sessionExpired: boolean;
  sessionExpiryReason: string | null;
  login: (credentials: LoginPayload) => Promise<{ mfaRequired?: boolean; success?: boolean }>;
  verifyMfa: (mfaCode: string) => Promise<void>;
  cancelMfa: () => void;
  register: (payload: RegisterPayload) => Promise<{ message: string; userId: string; role: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  dismissSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const TOKEN_KEY = 'wellnest_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mfaPending, setMfaPending] = useState<MfaPendingState | null>(null);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const [sessionExpiryReason, setSessionExpiryReason] = useState<string | null>(null);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setMfaPending(null);
  }, []);

  // Listen to 401 session expiry notifications from apiClient interceptor
  useEffect(() => {
    const unsubscribe = subscribeToSessionExpiry((reason) => {
      setSessionExpired(true);
      setSessionExpiryReason(reason || 'Session timed out due to 30 minutes of inactivity.');
      clearAuthData();
    });
    return unsubscribe;
  }, [clearAuthData]);

  // Load user profile on mount if token exists
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const { user: profile } = await userApi.getProfile();
        if (isMounted) {
          setUser(profile);
          setToken(storedToken);
        }
      } catch (err: any) {
        // If profile fetch fails with 401 or token invalid, clean up
        if (isMounted) {
          clearAuthData();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [clearAuthData]);

  const login = async (credentials: LoginPayload) => {
    const result = await authApi.login(credentials);

    if (result.mfaRequired && result.mfaPendingToken) {
      const payload = parseJwtPayload(result.mfaPendingToken);
      setMfaPending({
        isPending: true,
        mfaPendingToken: result.mfaPendingToken,
        userId: payload?.userId || '',
        sessionId: payload?.sessionId || '',
        role: payload?.role as UserRole,
      });
      return { mfaRequired: true };
    }

    const authToken = result.token || result.accessToken;
    if (authToken) {
      localStorage.setItem(TOKEN_KEY, authToken);
      setToken(authToken);

      try {
        const { user: profile } = await userApi.getProfile();
        setUser(profile);
      } catch {
        // Fallback to minimal user from login response if profile fetch fails
        if (result.user) {
          setUser(result.user as UserProfile);
        }
      }
      return { success: true };
    }

    throw new Error('Invalid login response: missing authentication token.');
  };

  const verifyMfa = async (mfaCode: string) => {
    if (!mfaPending) {
      throw new Error('No pending MFA session found.');
    }

    const result = await authApi.verifyMfa({
      userId: mfaPending.userId,
      sessionId: mfaPending.sessionId,
      mfaCode,
    });

    const authToken = result.token || result.accessToken;
    if (!authToken) {
      throw new Error('MFA verification succeeded but no token was returned.');
    }

    localStorage.setItem(TOKEN_KEY, authToken);
    setToken(authToken);
    setMfaPending(null);

    try {
      const { user: profile } = await userApi.getProfile();
      setUser(profile);
    } catch {
      if (result.user) {
        setUser(result.user as UserProfile);
      }
    }
  };

  const cancelMfa = () => {
    setMfaPending(null);
  };

  const register = async (payload: RegisterPayload) => {
    return await authApi.register(payload);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuthData();
    }
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    try {
      const { user: profile } = await userApi.getProfile();
      setUser(profile);
      return profile;
    } catch {
      return null;
    }
  };

  const dismissSessionExpired = () => {
    setSessionExpired(false);
    setSessionExpiryReason(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        mfaPending,
        sessionExpired,
        sessionExpiryReason,
        login,
        verifyMfa,
        cancelMfa,
        register,
        logout,
        refreshProfile,
        dismissSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
