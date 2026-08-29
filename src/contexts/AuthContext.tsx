import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  type AuthUser,
  fetchCurrentUser,
  signIn as apiSignIn,
  signOut as apiSignOut,
  signUp as apiSignUp,
} from '../lib/api';

type Mode = 'loading' | 'signed-out' | 'guest' | 'signed-in';

interface AuthContextValue {
  mode: Mode;
  user: AuthUser | null;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  exitGuest: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mode, setMode] = useState<Mode>('loading');

  useEffect(() => {
    fetchCurrentUser()
      .then(({ user }) => {
        setUser(user);
        setMode('signed-in');
      })
      .catch(() => setMode('signed-out'));
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const { user } = await apiSignIn(username, password);
    setUser(user);
    setMode('signed-in');
  }, []);

  const signUp = useCallback(async (username: string, password: string) => {
    const { user } = await apiSignUp(username, password);
    setUser(user);
    setMode('signed-in');
  }, []);

  const signOut = useCallback(async () => {
    await apiSignOut();
    setUser(null);
    setMode('signed-out');
  }, []);

  const continueAsGuest = useCallback(() => {
    setUser(null);
    setMode('guest');
  }, []);

  const exitGuest = useCallback(() => {
    setMode('signed-out');
  }, []);

  return (
    <AuthContext.Provider value={{ mode, user, signIn, signUp, signOut, continueAsGuest, exitGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
