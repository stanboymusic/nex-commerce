import { create } from "zustand";
import { persist } from "zustand/middleware";

type ViewMode = "grid" | "list";

interface CatalogState {
  view: ViewMode;
  setView: (view: ViewMode) => void;
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set) => ({
      view: "grid",
      setView: (view) => set({ view }),
    }),
    {
      name: "catalog-storage",
    }
  )
);
