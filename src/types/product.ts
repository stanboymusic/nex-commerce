export interface ProductImage {
  id: string;
  url: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string; // OBLIGATORIO
  description?: string;
  price: number;
  priceUSD?: number;
  stock: number;
  isPreorder: boolean;
  active?: boolean;
  estimatedArrivalDate?: string;
  estimatedDeliveryDate?: string;
  image?: string | null;
  gallery?: string[];
  category?: string | { id?: string; name?: string } | null;
  images?: Array<string | ProductImage>; // Flexible para soportar string[] o {url: string}[]
  categoryId?: string;
  createdAt?: string;
  updatedAt?: string;
}
