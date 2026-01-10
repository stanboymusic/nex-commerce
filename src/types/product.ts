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
  stock: number;
  isPreorder: boolean;
  arrivalDate?: string;
  estimatedDeliveryDate?: string;
  images?: any[]; // Flexible para soportar string[] o {url: string}[]
  categoryId?: string;
  createdAt?: string;
  updatedAt?: string;
}
