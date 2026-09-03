import { apiFetch, type PublicReadOptions } from "./client";

export interface PublicBrandLogo {
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
}

export interface PublicBrand {
  brandId: string;
  name: string;
  slug: string;
  description: string | null;
  logo: PublicBrandLogo | null;
}

export function fetchPublicBrands(opts?: PublicReadOptions): Promise<{ brands: PublicBrand[] }> {
  return apiFetch<{ brands: PublicBrand[] }>("/brands", { method: "GET", ...opts });
}
