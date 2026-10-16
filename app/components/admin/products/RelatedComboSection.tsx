"use client";

import { useState } from "react";
import { useProductList } from "@/lib/hooks/admin/useProductList";
import { useRelatedCombo, useUpdateRelatedCombo } from "@/lib/hooks/admin/useRelatedCombo";
import { RELATED_COMBO_MODES, MAX_PINNED_COMBOS, type RelatedComboMode, type AdminRelatedCombo } from "@/lib/api/adminRelatedCombo";
import { ApiError } from "@/lib/api/ApiError";

const MODE_LABELS: Record<RelatedComboMode, string> = {
  AUTO: "Auto — find a combo that lists this product as a component",
  MANUAL: "Manual — pin specific bundles (up to 4)",
  NONE: "None — never suggest a bundle for this product",
};

// Offers a bundle/combo to the customer instead of (or before) a plain
// purchase — "continue with this plan or switch to a better one," the same
// pattern a recharge app uses. AUTO reuses the Inventory Tracking
// relationship already configured above (no second link to maintain);
// MANUAL validates the selected bundle through the same component relationship.
// The search-and-select pattern matches
// InventoryComponentPicker.tsx uses, just single-select.
export default function RelatedComboSection({ productId }: { productId: string }) {
  const { data, error } = useRelatedCombo(productId);
  if (error) return <p role="alert" className="text-sm text-red-600">Could not load related combo settings.</p>;
  if (!data) return <p className="text-sm text-black/50">Loading related combo settings…</p>;
  return <RelatedComboForm key={productId} productId={productId} initial={data} />;
}

function RelatedComboForm({ productId, initial }: { productId: string; initial: AdminRelatedCombo }) {
  const updateRelatedCombo = useUpdateRelatedCombo(productId);

  const [mode, setMode] = useState<RelatedComboMode>(initial.mode);
  const [pinned, setPinned] = useState<{ id: string; name: string; issue?: string }[]>(
    initial.combos.map((c) => ({ id: c.comboProductId, name: c.comboProductName ?? c.comboProductId, issue: c.issue }))
  );
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const { data: searchResults } = useProductList({ search: search || undefined, pageSize: 8, status: "ACTIVE" });
  const results = (searchResults?.items ?? []).filter((p) => p.productId !== productId && !pinned.some((c) => c.id === p.productId));

  function handleSave() {
    setError(null);
    if (mode === "MANUAL" && !pinned.length) {
      setError("Select at least one bundle to pin, or choose Auto instead.");
      return;
    }
    updateRelatedCombo.mutate(
      { mode, comboProductIds: mode === "MANUAL" ? pinned.map((c) => c.id) : [] },
      {
        onSuccess: (res) => {
          // Re-sync from the server so each row shows its current availability note.
          setPinned(res.relatedCombo.combos.map((c) => ({ id: c.comboProductId, name: c.comboProductName ?? c.comboProductId, issue: c.issue })));
          setDirty(false);
        },
        onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't save related combo."),
      }
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">
        Related Combo / Bundle Suggestion
      </h2>
      <p className="text-xs text-black/50 dark:text-white/50">
        When a customer adds this product to cart, offer a bundle instead — &quot;continue with this product or switch
        to this bundle.&quot; The selected bundle must include this product in its inventory components.
      </p>

      <div className="space-y-2">
        {RELATED_COMBO_MODES.map((m) => (
          <label key={m} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="related-combo-mode"
              checked={mode === m}
              onChange={() => {
                setMode(m);
                setDirty(true);
              }}
            />
            {MODE_LABELS[m]}
          </label>
        ))}
      </div>

      {mode === "MANUAL" && (
        <div className="space-y-2">
          {pinned.map((c) => (
            <div key={c.id} className="rounded-xl border border-admin-border bg-admin-surface p-2.5 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{c.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPinned((list) => list.filter((x) => x.id !== c.id));
                    setDirty(true);
                  }}
                  className="text-xs font-semibold text-red-600 dark:text-red-400"
                >
                  Remove
                </button>
              </div>
              {!dirty && c.issue && <p role="status" className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">{c.issue}</p>}
            </div>
          ))}
          {pinned.length < MAX_PINNED_COMBOS ? (
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={pinned.length ? "Search to pin another bundle..." : "Search products to pin as the suggested bundle..."}
              className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
            />
            {search && results.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-admin-border bg-admin-card shadow-lg dark:border-admin-border-dark dark:bg-admin-card-dark">
                {results.map((p) => (
                  <li key={p.productId}>
                    <button
                      type="button"
                      onClick={() => {
                        setPinned((list) => [...list, { id: p.productId, name: p.name }]);
                        setSearch("");
                        setDirty(true);
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-admin-surface dark:hover:bg-admin-surface-dark"
                    >
                      <span className="truncate">{p.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          ) : (
            <p className="text-xs text-black/50 dark:text-white/50">Maximum of {MAX_PINNED_COMBOS} bundles pinned — remove one to add another.</p>
          )}
        </div>
      )}

      {mode === "MANUAL" && !dirty && !pinned.length && initial.pinnedIssue && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          {initial.pinnedIssue}
        </p>
      )}

      {error && <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}

      {dirty && (
        <button
          type="button"
          disabled={updateRelatedCombo.isPending}
          onClick={handleSave}
          className="rounded-full bg-admin-primary px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {updateRelatedCombo.isPending ? "Saving…" : "Save related combo"}
        </button>
      )}
    </section>
  );
}
