"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicProducts } from "@/lib/api/publicProducts";
import { IconClose, IconSearch } from "../ui/icons";

export default function ProductSearch({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const term = query.trim();
  const { data, isFetching, isError } = useQuery({
    queryKey: ["product-search-suggestions", debouncedQuery],
    queryFn: () => fetchPublicProducts({ search: debouncedQuery, pageSize: 5 }),
    enabled: debouncedQuery.length > 0 && term === debouncedQuery,
    staleTime: 60_000,
    retry: 1,
  });
  const loading = term.length > 0 && (term !== debouncedQuery || isFetching);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(term), 300);
    return () => window.clearTimeout(timer);
  }, [term]);

  const resultsHref = term ? `/products?${new URLSearchParams({ search: term })}` : "/products";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="product-search-title"
      onCancel={onClose}
      onKeyDown={event => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-border bg-white p-0 text-ink shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="product-search-title" className="font-display text-xl font-semibold">Search products</h2>
          <button type="button" onClick={onClose} aria-label="Close search" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-brand-soft focus-visible:outline-brand"><IconClose className="h-5 w-5" /></button>
        </div>
        <form role="search" onSubmit={event => {
          event.preventDefault();
          router.push(resultsHref);
          onClose();
        }} className="flex gap-2">
          <label htmlFor="product-search-input" className="sr-only">Search products</label>
          <input ref={inputRef} id="product-search-input" type="search" autoComplete="off" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try oats, millet or porridge" className="h-12 min-w-0 flex-1 rounded-xl border border-border px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          <button type="submit" aria-label="Show search results" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"><IconSearch className="h-5 w-5" /></button>
        </form>
        <div className="mt-5" aria-live="polite" aria-busy={loading}>
          {!term ? <p className="text-sm leading-6 text-ink-muted">Search our range by product name or ingredient.</p> : loading ? <p className="py-4 text-sm text-ink-muted">Finding products…</p> : isError ? <p className="py-4 text-sm text-ink-muted">Suggestions are unavailable right now. You can still view search results below.</p> : data?.items.length ? (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Suggested products</p>
              <ul className="space-y-1">
                {data.items.map(product => (
                  <li key={product.productId}>
                    <Link href={`/products/${encodeURIComponent(product.slug)}`} onClick={onClose} className="flex items-center gap-3 rounded-xl p-2 hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand">
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-cream">
                        {product.image ? <Image src={product.image.thumbnailUrl || product.image.url} alt="" fill sizes="56px" className="object-contain" /> : <IconSearch className="m-4 h-6 w-6 text-brand" />}
                      </span>
                      <span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold">{product.name}</span><span className="mt-1 block text-sm text-brand-dark">{product.pricing.sellingPrice.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="py-4 text-sm leading-6 text-ink-muted">No matching products. Try a different name or ingredient.</p>}
        </div>
        <Link href={resultsHref} onClick={onClose} className="mt-5 block rounded-xl bg-brand-soft px-4 py-3 text-center text-sm font-semibold text-brand-dark hover:bg-brand/15">{term ? `View all results for “${term}”` : "Browse all products"}</Link>
      </div>
    </dialog>
  );
}
