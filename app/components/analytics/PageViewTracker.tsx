"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/events";

// Fires a page_view on every client-side route change (App Router doesn't
// reload the page, so GTM's own container load only ever sees the first
// one). Deliberately reads only the pathname, not the query string —
// consuming useSearchParams here would force every route in the tree out of
// static rendering (the ISR product/category pages would lose their cache)
// for a marginal analytics gain.
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent("page_view", { page_path: pathname, page_title: document.title });
  }, [pathname]);

  return null;
}
