export interface ProductImage {
  id: string;
  url: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  isPreorder: boolean;
  arrivalDate: string | null;
  estimatedDeliveryDate: string | null;
  categoryId: string;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}
