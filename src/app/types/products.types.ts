import { PRODUCT_TYPES } from '../../../backend/src/products/models/products.types';

export type Product = {
  id: number;
  userId: string;
  name: string;
  brand: string;
  description?: string;
  category: string;
  price?: number;
  quantity: number;
  quantityUnit?: string;
  applicationRate?: string;
  applicationMethod?: string;
  coverage?: number;
  coverageUnit?: string;
  guaranteedAnalysis?: string;
  containerType?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
};

export type GetProductsResponse = Array<Product & { isHidden: boolean }>;

export type ProductFormData = {
  name: string;
  brand: string;
  description: string;
  coverageAmount: number | null;
  coverageUnit: string;
  applicationRate: number | null;
  applicationMethod: string;
  guaranteedAnalysis: string;
  category: string;
  quantityUnit: string;
  containerType: string;
  image: File | null;
  systemProduct: boolean;
};

export type ProductCategories = Capitalize<
  (typeof PRODUCT_TYPES)[keyof typeof PRODUCT_TYPES]
>;
