import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '../services/api';

export interface TenantInfo {
  id: string;
  name: string;
  role: string;
  products: { id: string; name: string; type: string }[];
}

interface AuthState {
  token: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    isSuperAdmin: boolean;
    tenants: TenantInfo[];
  } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, tenantName: string) => Promise<void>;
  logout: () => void;
  setUser: (user: any) => void;
  setTenant: (tenantId: string) => void;
  setProduct: (productId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      loading: false,
      login: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const res = await auth.login({ email, password });
          set({ token: res.data.token, user: res.data.user, loading: false });
        } catch (err: any) {
          set({ loading: false });
          throw new Error(err.response?.data?.error?.message || 'Error al iniciar sesión');
        }
      },
      register: async (name: string, email: string, password: string, tenantName: string) => {
        set({ loading: true });
        try {
          const res = await auth.register({ name, email, password, tenantName });
          set({ token: res.data.token, user: res.data.user, loading: false });
        } catch (err: any) {
          set({ loading: false });
          throw new Error(err.response?.data?.error?.message || 'Error al registrarse');
        }
      },
      logout: () => set({ token: null, user: null }),
      setUser: (user: any) => set({ user }),
      setTenant: (tenantId: string) => sessionStorage.setItem('currentTenantId', tenantId),
      setProduct: (productId: string) => sessionStorage.setItem('currentProductId', productId),
    }),
    { name: 'auth-storage', partialize: (state: any) => ({ token: state.token, user: state.user }) },
  ),
);

// Helpers
export const getCurrentTenant = (): TenantInfo | null => {
  const stored = localStorage.getItem('auth-storage');
  if (!stored) return null;
  try {
    const { state } = JSON.parse(stored);
    const tenantId = sessionStorage.getItem('currentTenantId');
    return state.user?.tenants?.find((t: TenantInfo) => t.id === tenantId) || state.user?.tenants?.[0] || null;
  } catch {
    return null;
  }
};

export const getCurrentProduct = () => {
  const tenant = getCurrentTenant();
  const productId = sessionStorage.getItem('currentProductId');
  return tenant?.products?.find((p) => p.id === productId) || tenant?.products?.[0] || null;
};
