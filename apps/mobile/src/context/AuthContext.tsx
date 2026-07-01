import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { USE_MOCK_AUTH } from '@/config';
import {
  apiCheckPhone,
  apiGetSession,
  apiLogout,
  apiSendOtp,
  apiSubmitIntake,
  apiVerifyOtp,
} from '@/lib/api';
import type { IntakeFormData } from '@/lib/intake';
import { normalizePhone } from '@/lib/phone';
import { findAccountByPhone, MOCK_OTP } from '@/mock/data';
import type { SessionUser } from '@/types';

const TOKEN_KEY = 'pts_session_token';
const USER_KEY = 'pts_session_user';

function withProgramClock(user: SessionUser): SessionUser {
  if (user.role !== 'client' || !user.planApproved || user.programStartedAt) return user;
  return { ...user, programStartedAt: new Date().toISOString() };
}

function mapApiUser(user: SessionUser): SessionUser {
  return withProgramClock({
    ...user,
    displayName: user.displayName || 'User',
    phone: user.phone || '',
  });
}

const memoryStore = new Map<string, string>();

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memoryStore.get(key) ?? (typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStore.set(key, value);
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStore.delete(key);
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

type AuthContextValue = {
  user: SessionUser | null;
  token: string | null;
  loading: boolean;
  pendingPhone: string | null;
  setPendingPhone: (phone: string | null) => void;
  checkPhone: (phone: string) => Promise<{ exists: boolean }>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<SessionUser>;
  completeIntake: (data: IntakeFormData) => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  devSignInAs: (user: SessionUser) => Promise<void>;
  resetProgramClock: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(token: string, user: SessionUser) {
  await storageSet(TOKEN_KEY, token);
  await storageSet(USER_KEY, JSON.stringify(user));
}

async function clearSession() {
  await storageDelete(TOKEN_KEY);
  await storageDelete(USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await storageGet(TOKEN_KEY);
        const storedUser = await storageGet(USER_KEY);
        if (!storedToken) return;

        if (USE_MOCK_AUTH || storedToken.startsWith('mock-')) {
          if (storedUser) {
            const parsed = JSON.parse(storedUser) as SessionUser;
            setToken(storedToken);
            setUser(withProgramClock(parsed));
          }
          return;
        }

        const { user: fresh } = await apiGetSession(storedToken);
        const sessionUser = mapApiUser(fresh);
        setToken(storedToken);
        setUser(sessionUser);
        await persistSession(storedToken, sessionUser);
      } catch {
        await clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const checkPhone = useCallback(async (phone: string) => {
    const normalized = normalizePhone(phone);
    if (USE_MOCK_AUTH) {
      return { exists: Boolean(findAccountByPhone(normalized)) };
    }
    const result = await apiCheckPhone(normalized);
    return { exists: result.exists };
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    const normalized = normalizePhone(phone);
    if (USE_MOCK_AUTH) {
      await new Promise((r) => setTimeout(r, 400));
      return;
    }
    await apiSendOtp(normalized);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string): Promise<SessionUser> => {
    const normalized = normalizePhone(phone);

    if (USE_MOCK_AUTH) {
      const account = findAccountByPhone(normalized);
      if (!account) throw new Error('not-registered');
      if (code !== MOCK_OTP) throw new Error('invalid-otp');
      const sessionUser = withProgramClock({
        id: account.id,
        phone: account.phone,
        role: account.role,
        displayName: account.displayName,
        intakeComplete: account.intakeComplete,
        planApproved: account.planApproved,
        programStartedAt: account.programStartedAt,
      });
      const mockToken = `mock-${account.id}`;
      await persistSession(mockToken, sessionUser);
      setToken(mockToken);
      setUser(sessionUser);
      setPendingPhone(null);
      return sessionUser;
    }

    const { token: sessionToken, user: apiUser } = await apiVerifyOtp(normalized, code);
    const sessionUser = mapApiUser(apiUser);
    await persistSession(sessionToken, sessionUser);
    setToken(sessionToken);
    setUser(sessionUser);
    setPendingPhone(null);
    return sessionUser;
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token || USE_MOCK_AUTH || token.startsWith('mock-')) return;
    const { user: fresh } = await apiGetSession(token);
    const sessionUser = mapApiUser(fresh);
    setUser(sessionUser);
    await persistSession(token, sessionUser);
  }, [token]);

  const completeIntake = useCallback(
    async (payload: IntakeFormData) => {
      if (!user || !token) return;

      if (USE_MOCK_AUTH || token.startsWith('mock-')) {
        const updated = { ...user, intakeComplete: true };
        setUser(updated);
        await persistSession(token, updated);
        return;
      }

      await apiSubmitIntake(token, payload);
      await refreshUser();
    },
    [user, token, refreshUser],
  );

  const signOut = useCallback(async () => {
    if (token && !USE_MOCK_AUTH && !token.startsWith('mock-')) {
      try {
        await apiLogout(token);
      } catch {
        // ignore
      }
    }
    await clearSession();
    setUser(null);
    setToken(null);
    setPendingPhone(null);
  }, [token]);

  const devSignInAs = useCallback(async (next: SessionUser) => {
    const sessionUser = withProgramClock(next);
    const mockToken = `mock-${sessionUser.id}`;
    await persistSession(mockToken, sessionUser);
    setToken(mockToken);
    setUser(sessionUser);
  }, []);

  const resetProgramClock = useCallback(async () => {
    if (!user || user.role !== 'client' || !user.planApproved) return;
    const updated = { ...user, programStartedAt: new Date().toISOString() };
    setUser(updated);
    if (token) await persistSession(token, updated);
  }, [user, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      pendingPhone,
      setPendingPhone,
      checkPhone,
      sendOtp,
      verifyOtp,
      completeIntake,
      refreshUser,
      signOut,
      devSignInAs,
      resetProgramClock,
    }),
    [user, token, loading, pendingPhone, checkPhone, sendOtp, verifyOtp, completeIntake, refreshUser, signOut, devSignInAs, resetProgramClock],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
