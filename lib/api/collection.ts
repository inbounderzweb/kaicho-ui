import { apiFetch } from "./client";
import type { PublicProductListItem } from "./publicProducts";

export interface CollectionImage {
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
}

export interface CollectionProductRef {
  productId: string;
  sortOrder: number;
}

export interface AdminCollection {
  collectionId: string;
  name: string;
  slug: string;
  description: string | null;
  image: CollectionImage | null;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  products?: PublicProductListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionFormInput {
  name: string;
  slug?: string;
  description?: string;
  imageMediaId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  products?: CollectionProductRef[];
}

export function fetchCollections(): Promise<{ collections: AdminCollection[] }> {
  return apiFetch<{ collections: AdminCollection[] }>("/admin/collections", { method: "GET" });
}

export function fetchCollectionDetail(id: string): Promise<{ collection: AdminCollection }> {
  return apiFetch<{ collection: AdminCollection }>(`/admin/collections/${encodeURIComponent(id)}`, { method: "GET" });
}

export function createCollection(input: CollectionFormInput): Promise<{ collection: AdminCollection }> {
  return apiFetch<{ collection: AdminCollection }>("/admin/collections", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCollection(id: string, patch: Partial<CollectionFormInput>): Promise<{ collection: AdminCollection }> {
  return apiFetch<{ collection: AdminCollection }>(`/admin/collections/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function updateCollectionProducts(id: string, products: CollectionProductRef[]): Promise<{ collection: AdminCollection }> {
  return apiFetch<{ collection: AdminCollection }>(`/admin/collections/${encodeURIComponent(id)}/products`, {
    method: "PATCH",
    body: JSON.stringify({ products }),
  });
}

export function deleteCollection(id: string): Promise<void> {
  return apiFetch<void>(`/admin/collections/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function fetchHomepageCollections(): Promise<{ collections: AdminCollection[] }> {
  return apiFetch<{ collections: AdminCollection[] }>("/collections/active", { method: "GET" });
}
