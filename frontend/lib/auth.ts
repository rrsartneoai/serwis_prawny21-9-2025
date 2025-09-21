import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI, type User as APIUser, type AuthResponse } from "@/lib/api/auth";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface User {
  id: number;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role: "client" | "operator" | "admin";
  auth_provider: "email" | "phone" | "google" | "facebook";
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  token?: string;
}

export interface AuthResult {
  user: User | null;
  error: string | null;
  requiresVerification?: boolean;
  verificationSentTo?: string;
}

interface AuthStore {
  /* state */
  user: User | null;
  isAuthenticated: boolean;
  pendingVerification: boolean;
  /* local helpers */
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  /* FastAPI backend helpers */
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string, firstName?: string, lastName?: string) => Promise<AuthResult>;
  signInWithPhone: (phone: string) => Promise<AuthResult>;
  signInWithEmailCode: (email: string) => Promise<AuthResult>;
  verifyCode: (userId: number, code: string, codeType: 'sms' | 'email') => Promise<AuthResult>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  handleGoogleCallback: (code: string) => Promise<AuthResult>;
  signOut: () => Promise<{ error: string | null }>;
  fetchUserSession: () => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/* Zustand store                                                              */
/* -------------------------------------------------------------------------- */

const convertAPIUserToUser = (apiUser: APIUser, token: string): User => ({
  ...apiUser,
  name: apiUser.first_name && apiUser.last_name 
    ? `${apiUser.first_name} ${apiUser.last_name}`
    : apiUser.first_name || apiUser.last_name || apiUser.email.split('@')[0],
  token
});

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      pendingVerification: false,

      /* ---------- local state helpers ---------- */
      login: (user) => set({ user, isAuthenticated: true, pendingVerification: false }),
      logout: () => set({ user: null, isAuthenticated: false, pendingVerification: false }),
      updateUser: (updates) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...updates } });
      },

      /* ---------- FastAPI backend helpers ---------- */
      signInWithEmail: async (email, password) => {
        try {
          const result = await authAPI.login(email, password);
          if (result.data) {
            const user = convertAPIUserToUser(result.data.user, result.data.access_token);
            authAPI.setToken(result.data.access_token);
            
            if (result.data.requires_verification) {
              set({ pendingVerification: true, user });
              return { 
                user, 
                error: null, 
                requiresVerification: true,
                verificationSentTo: result.data.verification_sent_to 
              };
            } else {
              set({ user, isAuthenticated: true, pendingVerification: false });
              return { user, error: null };
            }
          }
          return { user: null, error: result.error };
        } catch (err) {
          return { user: null, error: (err as Error).message };
        }
      },

      signUpWithEmail: async (email, password, firstName, lastName) => {
        try {
          const result = await authAPI.register(email, password, firstName, lastName);
          if (result.data) {
            const user = convertAPIUserToUser(result.data.user, result.data.access_token);
            authAPI.setToken(result.data.access_token);
            
            if (result.data.requires_verification) {
              set({ pendingVerification: true, user });
              return { 
                user, 
                error: null, 
                requiresVerification: true,
                verificationSentTo: result.data.verification_sent_to 
              };
            } else {
              set({ user, isAuthenticated: true, pendingVerification: false });
              return { user, error: null };
            }
          }
          return { user: null, error: result.error };
        } catch (err) {
          return { user: null, error: (err as Error).message };
        }
      },

      signInWithPhone: async (phone) => {
        try {
          const result = await authAPI.startPhoneLogin(phone);
          if (result.data) {
            const user = convertAPIUserToUser(result.data.user, result.data.access_token);
            authAPI.setToken(result.data.access_token);
            set({ pendingVerification: true, user });
            return { 
              user, 
              error: null, 
              requiresVerification: true,
              verificationSentTo: result.data.verification_sent_to 
            };
          }
          return { user: null, error: result.error };
        } catch (err) {
          return { user: null, error: (err as Error).message };
        }
      },

      signInWithEmailCode: async (email) => {
        try {
          const result = await authAPI.startEmailLogin(email);
          if (result.data) {
            const user = convertAPIUserToUser(result.data.user, result.data.access_token);
            authAPI.setToken(result.data.access_token);
            set({ pendingVerification: true, user });
            return { 
              user, 
              error: null, 
              requiresVerification: true,
              verificationSentTo: result.data.verification_sent_to 
            };
          }
          return { user: null, error: result.error };
        } catch (err) {
          return { user: null, error: (err as Error).message };
        }
      },

      verifyCode: async (userId, code, codeType) => {
        try {
          const result = await authAPI.verifyCode(userId, code, codeType);
          if (result.data && result.data.success) {
            if (result.data.access_token) {
              authAPI.setToken(result.data.access_token);
            }
            const currentUser = get().user;
            if (currentUser) {
              const updatedUser = { ...currentUser, is_verified: true };
              set({ user: updatedUser, isAuthenticated: true, pendingVerification: false });
              return { user: updatedUser, error: null };
            }
          }
          return { user: null, error: result.data?.message || result.error };
        } catch (err) {
          return { user: null, error: (err as Error).message };
        }
      },

      signInWithGoogle: async () => {
        try {
          const result = await authAPI.getGoogleAuthUrl();
          if (result.data) {
            window.location.href = result.data.auth_url;
            return { error: null };
          }
          return { error: result.error };
        } catch (err) {
          return { error: (err as Error).message };
        }
      },

      handleGoogleCallback: async (code) => {
        try {
          const result = await authAPI.handleGoogleCallback(code);
          if (result.data) {
            const user = convertAPIUserToUser(result.data.user, result.data.access_token);
            authAPI.setToken(result.data.access_token);
            set({ user, isAuthenticated: true, pendingVerification: false });
            return { user, error: null };
          }
          return { user: null, error: result.error };
        } catch (err) {
          return { user: null, error: (err as Error).message };
        }
      },

      signOut: async () => {
        authAPI.clearToken();
        set({ user: null, isAuthenticated: false, pendingVerification: false });
        return { error: null };
      },

      fetchUserSession: async () => {
        const storedUser = get().user;
        if (storedUser?.token) {
          authAPI.setToken(storedUser.token);
          const result = await authAPI.getCurrentUser();
          if (result.data) {
            const user = convertAPIUserToUser(result.data, storedUser.token);
            set({ user, isAuthenticated: true, pendingVerification: false });
          } else {
            set({ user: null, isAuthenticated: false, pendingVerification: false });
          }
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated, pendingVerification: s.pendingVerification }),
      onRehydrateStorage: () => (s) => s?.fetchUserSession(),
    },
  ),
);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Dev-only helper preserved for legacy imports and tests.
 * Provides an in-memory “login” that doesn’t hit Supabase at all.
 */
export const mockLogin = (
  email: string,
  role: User["role"] = "client",
): User => {
  const user: User = {
    id: Math.floor(Math.random() * 10000),
    email,
    name: email.split("@")[0],
    role,
    createdAt: new Date(),
    is_active: true,
  };
  useAuth.getState().login(user);
  return user;
};

/**
 * Dev-only helper preserved for legacy imports and tests.
 * Clears any mock session created with `mockLogin`.
 */
export const mockLogout = (): void => {
  useAuth.getState().logout();
};
