import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminState {
  admin: any | null;
  token: string | null;
  setAdmin: (admin: any, token: string) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      setAdmin: (admin, token) => set({ admin, token }),
      logout: () => set({ admin: null, token: null }),
    }),
    {
      name: 'nex-admin-storage',
    }
  )
);
