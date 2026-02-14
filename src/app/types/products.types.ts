import { PRODUCT_TYPES } from '../../../backend/src/modules/products/models/products.types';

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
  labelUrl?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
};

export type ProductWithVisibility = Product & { isHidden: boolean };

export type GetProductsResponse = Array<ProductWithVisibility>;

export type ProductFormData = {
  name: string;
  brand: string;
  description: string;
  coverage: number | null;
  coverageUnit: string;
  applicationRate: number | null;
  applicationMethod: string;
  guaranteedAnalysis: string;
  category: string;
  quantityUnit: string;
  containerType: string;
  labelUrl?: string;
  image: File | null;
  systemProduct: boolean;
};

type RawProductTypes = (typeof PRODUCT_TYPES)[keyof typeof PRODUCT_TYPES];

type CapitalizedProductTypes = Capitalize<RawProductTypes>;

export type ProductCategories = Exclude<CapitalizedProductTypes, 'Pgr'> | 'PGR';

export type ProductCategoryValues = RawProductTypes;
