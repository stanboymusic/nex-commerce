"use client";

import { Product } from "@/types/product";
import { useCatalogStore } from "@/store/catalog.store";
import GridView from "./views/GridView";
import ListView from "./views/ListView";
import { LayoutGrid, List } from "lucide-react";
import { useEffect, useState } from "react";

export default function CatalogClient({ products }: { products: Product[] }) {
  const { view, setView } = useCatalogStore();
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch for persisted store
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-oxford">Nuestro Catálogo</h1>
          <p className="text-gray-500 mt-1">Descubre productos exclusivos y preventas</p>
        </div>

        <div className="flex items-center gap-4 bg-muted p-1 rounded-xl border border-gray-100">
          <button 
            onClick={() => setView("grid")}
            aria-label="Ver en cuadrícula"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              view === "grid" 
                ? "bg-white text-oxford shadow-sm" 
                : "text-gray-500 hover:text-oxford"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Cuadrícula</span>
          </button>
          <button 
            onClick={() => setView("list")}
            aria-label="Ver en lista"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              view === "list" 
                ? "bg-white text-oxford shadow-sm" 
                : "text-gray-500 hover:text-oxford"
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Lista</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-1 min-h-[400px]">
        {view === "grid" ? (
          <GridView products={products} />
        ) : (
          <ListView products={products} />
        )}
      </div>
    </div>
  );
}
