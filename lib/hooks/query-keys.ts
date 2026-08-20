import type { UsersQueryParams } from "../api/admin";
import type { MediaQueryParams } from "../api/media";
import type { CategoryQueryParams } from "../api/category";
import type { BrandQueryParams } from "../api/brand";
import type { ProductQueryParams } from "../api/product";
import type { PublicProductListParams } from "../api/publicProducts";
import type { CategoryProductsParams } from "../api/publicCategories";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export const adminKeys = {
  dashboard: ["admin", "dashboard"] as const,
  userStats: ["admin", "users", "stats"] as const,
  users: (params: UsersQueryParams) => ["admin", "users", "list", params] as const,
  userDetail: (id: string) => ["admin", "users", "detail", id] as const,
  orders: (page: number, pageSize: number) => ["admin", "orders", page, pageSize] as const,
};

export const mediaKeys = {
  list: (params: MediaQueryParams) => ["admin", "media", "list", params] as const,
  detail: (id: string) => ["admin", "media", "detail", id] as const,
};

export const categoryKeys = {
  list: (params: CategoryQueryParams) => ["admin", "categories", "list", params] as const,
  options: ["admin", "categories", "options"] as const,
  detail: (id: string) => ["admin", "categories", "detail", id] as const,
};

export const brandKeys = {
  list: (params: BrandQueryParams) => ["admin", "brands", "list", params] as const,
  options: ["admin", "brands", "options"] as const,
  detail: (id: string) => ["admin", "brands", "detail", id] as const,
};

export const productKeys = {
  list: (params: ProductQueryParams) => ["admin", "products", "list", params] as const,
  detail: (id: string) => ["admin", "products", "detail", id] as const,
};

// Public/customer-facing catalog — deliberately NOT under the "admin"
// namespace prefix above (different endpoints, different DTOs, cached
// separately so an admin edit invalidating ["admin", "products", ...]
// never touches these).
export const publicProductKeys = {
  list: (params: PublicProductListParams) => ["public", "products", "list", params] as const,
  detail: (slug: string) => ["public", "products", "detail", slug] as const,
  related: (slug: string, limit: number) => ["public", "products", "related", slug, limit] as const,
};

export const publicCategoryKeys = {
  list: ["public", "categories", "list"] as const,
  detail: (slug: string) => ["public", "categories", "detail", slug] as const,
  products: (slug: string, params: CategoryProductsParams) =>
    ["public", "categories", "products", slug, params] as const,
};

export const publicBrandKeys = {
  list: ["public", "brands", "list"] as const,
};

export const wishlistKeys = {
  all: ["wishlist"] as const,
};
