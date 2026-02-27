import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  avatarUrl: string;
}

export interface Org {
  id: string;
  name: string;
  plan: 'starter' | 'pro' | 'enterprise';
}

interface AuthState {
  user: User | null;
  org: Org | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  isAuthenticated: boolean;
  orgs: Org[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => boolean;
  switchOrg: (orgId: string) => void;
}

const MOCK_ORGS: Org[] = [
  { id: 'org-1', name: 'MUVUE Entertainment', plan: 'enterprise' },
  { id: 'org-2', name: 'AfroWave Productions', plan: 'pro' },
];

const generateToken = () =>
  Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

const TOKEN_LIFETIME = 15 * 60 * 1000; // 15 minutes

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      org: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
      orgs: MOCK_ORGS,

      login: async (email: string, _password: string) => {
        // Simulate network delay
        await new Promise((r) => setTimeout(r, 800));

        const user: User = {
          id: 'user-1',
          name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          email,
          role: 'admin',
          avatarUrl: '',
        };

        set({
          user,
          org: MOCK_ORGS[0],
          accessToken: generateToken(),
          refreshToken: generateToken(),
          tokenExpiresAt: Date.now() + TOKEN_LIFETIME,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          org: null,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          isAuthenticated: false,
        });
      },

      refreshTokens: () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        set({
          accessToken: generateToken(),
          tokenExpiresAt: Date.now() + TOKEN_LIFETIME,
        });
        return true;
      },

      switchOrg: (orgId: string) => {
        const org = MOCK_ORGS.find((o) => o.id === orgId);
        if (org) set({ org });
      },
    }),
    { name: 'muvue-auth' }
  )
);
