import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/services/product.service";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/types/product";

type LandingProduct = Product & {
  image?: string | null;
  active?: boolean;
  category?: { name?: string } | null;
  createdAt?: string | null;
};

function toTime(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function getProductImage(product: LandingProduct) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) {
      return String(first.url || "");
    }
  }

  return product.image || "";
}

function ProductSummaryCard({
  product,
  variant,
}: {
  product: LandingProduct;
  variant: "offer" | "preorder";
}) {
  const imageUrl = getProductImage(product);
  const isPreorder = variant === "preorder";

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-40 w-full bg-muted/50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-400">
            Sin imagen
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
            isPreorder ? "bg-purple text-white" : "bg-emerald-600 text-white"
          }`}
        >
          {isPreorder ? "Preventa" : "Oferta"}
        </span>
      </div>

      <div className="space-y-2 p-4">
        <p className="truncate text-base font-bold text-oxford">{product.name}</p>
        <p className="text-xl font-black text-oxford">{formatMoney(product.price)}</p>

        {isPreorder ? (
          <p className="text-xs font-medium text-purple">
            {product.estimatedArrivalDate
              ? `Llegada estimada: ${new Date(product.estimatedArrivalDate).toLocaleDateString()}`
              : "Llegada estimada por confirmar"}
          </p>
        ) : (
          <p className="text-xs font-medium text-emerald-700">
            Disponible ahora: {Math.max(0, Number(product.stock || 0))} en stock
          </p>
        )}
      </div>
    </Link>
  );
}

export default async function HomePage() {
  let products: LandingProduct[] = [];
  try {
    products = (await getProducts()) as LandingProduct[];
  } catch (error) {
    console.error("HOME_PRODUCTS_ERROR:", error);
  }

  const hasAnyActiveTrue = products.some((p) => p.active === true);
  const storefrontProducts = hasAnyActiveTrue ? products.filter((p) => p.active === true) : products;
  const offers = storefrontProducts
    .filter((p) => !p.isPreorder && Number(p.stock || 0) > 0)
    .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    .slice(0, 6);
  const preorders = storefrontProducts
    .filter((p) => p.isPreorder)
    .sort((a, b) => toTime(a.estimatedArrivalDate) - toTime(b.estimatedArrivalDate))
    .slice(0, 6);
  const latest = [...storefrontProducts].sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt)).slice(0, 4);

  return (
    <div className="space-y-10 pb-4">
      <section className="relative overflow-hidden rounded-3xl border border-navy/10 bg-gradient-to-br from-navy via-oxford to-purple px-6 py-10 text-white sm:px-10">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-emerald-300/20 blur-2xl" />

        <div className="relative space-y-5">
          <span className="inline-flex rounded-full bg-white/15 px-4 py-1 text-xs font-bold uppercase tracking-widest">
            Novedades NexCommerce
          </span>
          <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
            Explora ofertas activas y productos en preventa desde una sola vista.
          </h1>
          <p className="max-w-2xl text-sm font-medium text-white/85 sm:text-base">
            Esta portada te muestra lo nuevo del catálogo para que tu equipo encuentre oportunidades de compra más rápido.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/catalog"
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-navy transition-all hover:bg-almond"
            >
              Ver catálogo completo
            </Link>
            <Link
              href="/orders"
              className="rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-white/10"
            >
              Revisar mis pedidos
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Activos</p>
          <p className="mt-2 text-3xl font-black text-oxford">{storefrontProducts.length}</p>
          <p className="mt-1 text-sm text-gray-500">Productos visibles para tus clientes.</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">En oferta</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">{offers.length}</p>
          <p className="mt-1 text-sm text-emerald-800">Disponibles para compra inmediata.</p>
        </div>
        <div className="rounded-2xl border border-purple/20 bg-purple/5 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-purple">Preventa</p>
          <p className="mt-2 text-3xl font-black text-purple">{preorders.length}</p>
          <p className="mt-1 text-sm text-purple/80">Reservas abiertas con llegada estimada.</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Novedades</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{latest.length}</p>
          <p className="mt-1 text-sm text-blue-800">Últimos productos publicados.</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-oxford">Ofertas disponibles</h2>
            <p className="text-sm text-gray-500">Productos activos con entrega normal y stock inmediato.</p>
          </div>
          <Link href="/catalog" className="text-sm font-bold text-purple hover:underline">
            Ver más
          </Link>
        </div>

        {offers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm font-medium text-gray-500">
            No hay productos en oferta por ahora.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((product) => (
              <ProductSummaryCard key={product.id} product={product} variant="offer" />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-oxford">Preventa abierta</h2>
            <p className="text-sm text-gray-500">Reserva antes de llegada y asegura inventario.</p>
          </div>
          <Link href="/catalog" className="text-sm font-bold text-purple hover:underline">
            Ver más
          </Link>
        </div>

        {preorders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm font-medium text-gray-500">
            No hay productos en preventa por ahora.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {preorders.map((product) => (
              <ProductSummaryCard key={product.id} product={product} variant="preorder" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
