import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApolloError, useApolloClient, useMutation, useQuery } from '@apollo/client';
import { ME } from '../api/queries';
import { LOGIN, LOGOUT, REFRESH, REGISTER } from '../api/mutations';

export type Role = 'ADMIN' | 'USER';
export interface User { id: string; email: string; name?: string | null; role: Role; }

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { email: string; password: string; name: string | undefined; handle: string }) => Promise<void>;
  logout: () => Promise<void>;
  refetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapError(err: ApolloError): string {
  const code = err.graphQLErrors[0]?.extensions?.code as string | undefined;
  switch (code) {
    case 'UNAUTHENTICATED':
      return 'You are not authenticated.';
    case 'FORBIDDEN':
      return 'You do not have permission to perform this action.';
    case 'CONFLICT':
      return 'Email is already taken.';
    case 'BAD_USER_INPUT':
      return 'Invalid input. Please check the fields.';
    default:
      return err.message || 'An unexpected error occurred.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const client = useApolloClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { refetch } = useQuery<{ me: User }>(ME, {
    skip: true,
  });

  const [mutateRegister] = useMutation(REGISTER);
  const [mutateLogin] = useMutation(LOGIN);
  const [mutateRefresh] = useMutation(REFRESH);
  const [mutateLogout] = useMutation(LOGOUT);

  const loadMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.query<{ me: User }>({ query: ME, fetchPolicy: 'network-only' });
      setUser(res.data.me);
    } catch (e: any) {
      const apolloErr: ApolloError | undefined = e;
      const code = apolloErr?.graphQLErrors?.[0]?.extensions?.code as string | undefined;
      if (code === 'UNAUTHENTICATED') {
        try {
          const refreshed = await mutateRefresh();
          if (refreshed.data?.refresh?.user) {
            const res2 = await client.query<{ me: User }>({ query: ME, fetchPolicy: 'network-only' });
            setUser(res2.data.me);
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setError(mapError(apolloErr!));
      }
    } finally {
      setLoading(false);
    }
  }, [client, mutateRefresh]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  // login: ожидает input { email, password }
  const login = useCallback(async (input: { email: string; password: string }) => {
    setError(null);
    const res = await mutateLogin({ variables: { input } });
    if (res.data?.login?.user) {
      setUser(res.data.login.user);
    }
  }, [mutateLogin]);

// register: ДОБАВИЛИ handle и берём user из res.data.register (BFF возвращает сам объект User)
  const register = useCallback(async (input: { email: string; password: string; name?: string; handle: string }) => {
    setError(null);
    const res = await mutateRegister({ variables: { input } });
    if (res.data?.register) {
      setUser(res.data.register);
    }
  }, [mutateRegister]);



  const logout = useCallback(async () => {
    setError(null);
    try {
      await mutateLogout();
    } finally {
      setUser(null);
      await client.clearStore();
    }
  }, [mutateLogout, client]);

  const refetchMe = useCallback(async () => {
    await loadMe();
  }, [loadMe]);

  const value = useMemo<AuthContextType>(() => ({ user, loading, error, login, register, logout, refetchMe }), [user, loading, error, login, register, logout, refetchMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
