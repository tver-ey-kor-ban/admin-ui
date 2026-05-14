import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '../core/api/apiClient';
import { API } from '../core/api/apiConstants';
import type { UserProfile, UserRolesResponse, MyShop, LoginResponse } from '../core/types';

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  roles: string[];
  isSuperuser: boolean;
  shopId: number | null;
  shops: MyShop[];
  isAdmin: boolean;
  isOwner: boolean;
  isMechanic: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setActiveShop: (id: number) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [shops, setShops] = useState<MyShop[]>([]);
  const [shopId, setShopId] = useState<number | null>(() => {
    const s = localStorage.getItem('auth_shop_id');
    return s ? parseInt(s) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = isSuperuser;
  // Ownership/mechanic status is determined by UserShop records, not the user's roles[] JWT claim.
  const isOwner = shops.some(s => s.role === 'owner' && s.is_active);
  const isMechanic = shops.some(s => s.role === 'mechanic' && s.is_active);

  // Clear all auth state (called on logout or 401 event)
  const clearAuth = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_shop_id');
    setToken(null);
    setUser(null);
    setRoles([]);
    setIsSuperuser(false);
    setShops([]);
    setShopId(null);
  }, []);

  // Listen for 401 signals from the Axios interceptor
  useEffect(() => {
    const handler = () => clearAuth();
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [clearAuth]);

  const loadSession = useCallback(async () => {
    const [profileRes, rolesRes] = await Promise.all([
      apiClient.get<UserProfile>(API.AUTH.ME),
      apiClient.get<UserRolesResponse>(API.AUTH.ROLES),
    ]);
    setUser(profileRes.data);
    const userRoles = rolesRes.data.roles ?? [];
    const superuser = rolesRes.data.is_superuser ?? false;
    setRoles(userRoles);
    setIsSuperuser(superuser);

    // Always fetch shop memberships — owner/mechanic status is in UserShop records, not in roles[].
    try {
      const shopsRes = await apiClient.get<MyShop[]>(API.SHOPS.MY_SHOPS);
      const shopList = Array.isArray(shopsRes.data) ? shopsRes.data : [];
      setShops(shopList);
      const saved = localStorage.getItem('auth_shop_id');
      if (!saved && shopList.length > 0) {
        setShopId(shopList[0].shop_id);
        localStorage.setItem('auth_shop_id', String(shopList[0].shop_id));
      }
    } catch {
      // Non-fatal: user may not be a shop member
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    const tok = localStorage.getItem('auth_token');
    if (!tok) {
      setIsLoading(false);
      return;
    }
    loadSession()
      .catch(() => {
        // If /auth/me or /auth/me/roles fails, clear the session
        clearAuth();
      })
      .finally(() => setIsLoading(false));
  }, [loadSession, clearAuth]);

  const login = async (username: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    params.append('grant_type', 'password');

    const res = await apiClient.post<LoginResponse>(API.AUTH.LOGIN, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const tok = res.data.access_token;
    localStorage.setItem('auth_token', tok);
    if (res.data.refresh_token) {
      localStorage.setItem('auth_refresh_token', res.data.refresh_token);
    }
    setToken(tok);
    await loadSession();
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('auth_refresh_token');
    if (refreshToken) {
      apiClient.post(API.AUTH.LOGOUT, { refresh_token: refreshToken }).catch(() => {});
    }
    clearAuth();
  };

  const setActiveShop = (id: number) => {
    setShopId(id);
    localStorage.setItem('auth_shop_id', String(id));
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        roles,
        isSuperuser,
        shopId,
        shops,
        isAdmin,
        isOwner,
        isMechanic,
        isLoading,
        login,
        logout,
        setActiveShop,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
