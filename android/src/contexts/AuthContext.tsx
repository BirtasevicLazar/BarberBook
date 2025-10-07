import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from '../api/client';

const STORAGE_TOKEN_KEY = 'auth_token';
const STORAGE_TOKEN_TYPE_KEY = 'auth_token_type';

interface LoginResponse {
  access_token: string;
  token_type?: string;
}

interface AuthState {
  token: string | null;
  tokenType: string;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  credentials: { token: string; tokenType: string } | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialState: AuthState = {
  token: null,
  tokenType: 'Bearer',
  isLoading: true,
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.multiGet([STORAGE_TOKEN_KEY, STORAGE_TOKEN_TYPE_KEY])
      .then(entries => {
        if (!isMounted) return;
        const storedToken = entries.find(([key]) => key === STORAGE_TOKEN_KEY)?.[1] ?? null;
        const storedType = entries.find(([key]) => key === STORAGE_TOKEN_TYPE_KEY)?.[1] ?? undefined;
        setState({
          token: storedToken,
          tokenType: storedType || 'Bearer',
          isLoading: false,
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setState(prev => ({ ...prev, isLoading: false }));
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const res = await request<LoginResponse>('/auth/barber/login', {
      method: 'POST',
      body: {
        email: trimmedEmail,
        password,
      },
    });

    const token = res.access_token;
    const tokenType = res.token_type ?? 'Bearer';

    await AsyncStorage.multiSet([
      [STORAGE_TOKEN_KEY, token],
      [STORAGE_TOKEN_TYPE_KEY, tokenType],
    ]);

    setState({ token, tokenType, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([STORAGE_TOKEN_KEY, STORAGE_TOKEN_TYPE_KEY]);
    setState({ token: null, tokenType: 'Bearer', isLoading: false });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      credentials: state.token ? { token: state.token, tokenType: state.tokenType } : null,
    }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
