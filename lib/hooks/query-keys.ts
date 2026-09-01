import type { AdminOrdersQueryParams, UsersQueryParams } from "../api/admin";
import type { MediaQueryParams } from "../api/media";
import type { CategoryQueryParams } from "../api/category";
import type { BrandQueryParams } from "../api/brand";
import type { ProductQueryParams } from "../api/product";
import type { PublicProductListParams } from "../api/publicProducts";
import type { CategoryProductsParams } from "../api/publicCategories";
import type { AdminBlogQueryParams } from "../api/blog";
import type { PublicBlogListParams } from "../api/blogPublic";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export const adminKeys = {
  dashboard: ["admin", "dashboard"] as const,
  userStats: ["admin", "users", "stats"] as const,
  users: (params: UsersQueryParams) => ["admin", "users", "list", params] as const,
  userDetail: (id: string) => ["admin", "users", "detail", id] as const,
  orders: (params: AdminOrdersQueryParams) => ["admin", "orders", "list", params] as const,
  orderDetail: (id: string) => ["admin", "orders", "detail", id] as const,
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

export const collectionKeys = {
  list: ["admin", "collections", "list"] as const,
  detail: (id: string) => ["admin", "collections", "detail", id] as const,
  homepage: ["public", "collections", "active"] as const,
};

export const blogKeys = {
  list: (params: AdminBlogQueryParams) => ["admin", "blogs", "list", params] as const,
  detail: (id: string) => ["admin", "blogs", "detail", id] as const,
};

export const blogCategoryKeys = {
  list: (params: { search?: string; status?: string }) => ["admin", "blog-categories", "list", params] as const,
  options: ["admin", "blog-categories", "options"] as const,
  detail: (id: string) => ["admin", "blog-categories", "detail", id] as const,
};

export const blogTagKeys = {
  list: (search: string) => ["admin", "blog-tags", "list", search] as const,
};

// Public/customer-facing blog — NOT under the "admin" prefix, cached
// separately (an admin edit invalidating ["admin","blogs",…] never touches
// these), same convention as publicProductKeys.
export const publicBlogKeys = {
  list: (params: PublicBlogListParams) => ["public", "blogs", "list", params] as const,
  detail: (slug: string) => ["public", "blogs", "detail", slug] as const,
  related: (slug: string, limit: number) => ["public", "blogs", "related", slug, limit] as const,
  categories: ["public", "blogs", "categories"] as const,
};

export const wishlistKeys = {
  all: ["wishlist"] as const,
};

// Customer-facing commerce namespaces — same non-"admin"-prefixed
// convention as wishlistKeys/publicProductKeys above. An admin mutating an
// order invalidates ["admin", "orders", ...]; these are a separate cache.
export const orderKeys = {
  all: ["orders"] as const,
  /** Prefix for invalidating every page of the list without also
   *  invalidating a detail entry that was just written fresh. */
  lists: ["orders", "list"] as const,
  list: (page: number, pageSize: number) => ["orders", "list", page, pageSize] as const,
  detail: (orderNumber: string) => ["orders", "detail", orderNumber] as const,
};

export const addressKeys = {
  all: ["addresses"] as const,
};

// Checkout preview is a mutation (it must reflect the live cart on every
// visit, not a cached snapshot), so it has no query key of its own — this
// namespace exists only so anything cached alongside it later has a home,
// and to keep the domain naming consistent with the other two.
export const checkoutKeys = {
  all: ["checkout"] as const,
  preview: ["checkout", "preview"] as const,
};
