import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "@/lib/api/auth";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface User {
  id: number;
  email: string;
  phone?: string;
  name?: string;
  role: "client" | "operator" | "admin";
  createdAt?: Date;
  avatar?: string;
  token?: string;
  is_active: boolean;
}

interface AuthStore {
  /* state */
  user: User | null;
  isAuthenticated: boolean;
  /* local helpers */
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  /* FastAPI backend helpers */
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ user: User | null; error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ user: User | null; error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  fetchUserSession: () => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/* Zustand store                                                              */
/* -------------------------------------------------------------------------- */

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      /* ---------- local state helpers ---------- */
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (updates) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...updates } });
      },

      /* ---------- FastAPI backend helpers ---------- */
      signInWithEmail: async (email, password) => {
        try {
          const result = await authAPI.login(email, password);
          if (result.user) {
            authAPI.setToken(result.user.token);
            const userWithDefaults = {
              ...result.user,
              name: result.user.name || result.user.email.split('@')[0],
              role: "client" as const,
              createdAt: new Date(),
            };
            set({ user: userWithDefaults, isAuthenticated: true });
          }
          return result;
        } catch (err) {
          return { user: null, error: (err as Error).message };
        }
      },

      signUpWithEmail: async (email, password, name) => {
        try {
          const result = await authAPI.register(email, password);
          if (result.user) {
            // After registration, automatically log in
            const loginResult = await authAPI.login(email, password);
            if (loginResult.user) {
              authAPI.setToken(loginResult.user.token);
              const userWithDefaults = {
                ...loginResult.user,
                name: name || loginResult.user.email.split('@')[0],
                role: "client" as const,
                createdAt: new Date(),
              };
              set({ user: userWithDefaults, isAuthenticated: true });
              return { user: userWithDefaults, error: null };
            }
          }
          return result;
        } catch (err) {
          return { user: null, error: (err as Error).message };
        }
      },

      signOut: async () => {
        authAPI.clearToken();
        set({ user: null, isAuthenticated: false });
        return { error: null };
      },

      fetchUserSession: async () => {
        const storedUser = get().user;
        if (storedUser?.token) {
          authAPI.setToken(storedUser.token);
          const result = await authAPI.getCurrentUser();
          if (result.user) {
            const userWithDefaults = {
              ...result.user,
              name: result.user.name || result.user.email.split('@')[0],
              role: storedUser.role || "client" as const,
              createdAt: storedUser.createdAt || new Date(),
            };
            set({ user: userWithDefaults, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
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
