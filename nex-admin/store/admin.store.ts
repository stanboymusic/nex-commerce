import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminState {
  admin: any | null;
  setAdmin: (admin: any) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      admin: null,
      setAdmin: (admin) => set({ admin }),
      logout: () => set({ admin: null }),
    }),
    {
      name: 'nex-admin-storage',
    }
  )
);
