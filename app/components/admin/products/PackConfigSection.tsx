"use client";

import { useState } from "react";
import {
  usePackConfig,
  usePackList,
  useUpdatePackConfig,
  useCreatePack,
  useUpdatePack,
  useDeletePack,
} from "@/lib/hooks/admin/usePacks";
import {
  PACK_RECOMMENDATION_STRATEGIES,
  type PackConfigParent,
  type PackRecommendationStrategy,
  type AdminPack,
  type PackFormInput,
} from "@/lib/api/adminPack";
import { ApiError } from "@/lib/api/ApiError";
import InventoryComponentPicker, { type ComponentRow } from "./InventoryComponentPicker";

const STRATEGY_LABELS: Record<PackRecommendationStrategy, string> = {
  CHEAPEST: "Cheapest Combination",
  LARGEST_FIRST: "Largest Pack First",
  SMALLEST_FIRST: "Smallest Pack First",
  ADMIN_PRIORITY: "Admin Priority",
  MANUAL_ONLY: "Manual Only",
};

const EMPTY_FORM: PackFormInput = { name: "", quantity: 1, price: 0, sku: "", isActive: true, isDefault: false };

function inputCls() {
  return "w-full rounded-lg border border-admin-border bg-admin-surface px-2.5 py-1.5 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark";
}

function PackRow({
  pack,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: {
  pack: AdminPack;
  onSave: (patch: Partial<PackFormInput>) => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PackFormInput>({
    name: pack.name,
    quantity: pack.quantity,
    price: pack.price,
    sku: pack.sku ?? "",
    isActive: pack.isActive,
    isDefault: pack.isDefault,
    sortOrder: pack.sortOrder,
    useComponentInventory: pack.useComponentInventory,
    inventoryComponents: pack.inventoryComponents,
  });
  // Names aren't part of AdminPack.inventoryComponents (just productId/quantity)
  // — resolved lazily as ComponentRow[] so already-configured components at
  // least show a stable identifier until the admin touches the picker (which
  // fills in real names for anything newly added).
  const [componentRows, setComponentRows] = useState<ComponentRow[]>(
    (pack.inventoryComponents ?? []).map((c) => ({ ...c }))
  );
  const [showAdvanced, setShowAdvanced] = useState((pack.inventoryComponents ?? []).length > 0);

  if (editing) {
    return (
      <>
      <tr className="border-b border-admin-border last:border-b-0 dark:border-admin-border-dark">
        <td className="p-2">
          <input className={`${inputCls()} min-w-35`} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </td>
        <td className="p-2">
          <input
            type="number"
            min={1}
            className={`${inputCls()} w-20`}
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
          />
        </td>
        <td className="p-2">
          <input
            type="number"
            min={0}
            step="0.01"
            className={`${inputCls()} w-24`}
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
          />
        </td>
        <td className="p-2">
          <input className={`${inputCls()} w-28`} value={form.sku ?? ""} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
        </td>
        {/* "Active" and "Default" share the Status column while editing —
            "Available" stays read-only in every mode (it's derived from
            base stock, never something an admin sets directly; see
            PackConfig.schema.ts). Editing them side by side here used to
            put the Default checkbox under the Available header, which
            didn't mean anything. */}
        <td className="p-2">
          <div className="flex flex-col items-center gap-1 whitespace-nowrap text-xs">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={form.isActive ?? true}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={form.isDefault ?? false}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              />
              Default
            </label>
          </div>
        </td>
        <td className="p-2 text-center text-sm tabular-nums text-black/40 dark:text-white/40">
          {typeof pack.availableStock === "number" ? pack.availableStock : "—"}
        </td>
        <td className="p-2 text-right">
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                onSave({
                  ...form,
                  useComponentInventory: showAdvanced,
                  inventoryComponents: showAdvanced
                    ? componentRows.map(({ productId, quantity }) => ({ productId, quantity }))
                    : [],
                });
                setEditing(false);
              }}
              className="rounded-full bg-admin-primary px-3 py-1 text-xs font-semibold text-black disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-admin-border px-3 py-1 text-xs font-semibold dark:border-admin-border-dark"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
      <tr className="border-b border-admin-border last:border-b-0 dark:border-admin-border-dark">
        <td colSpan={7} className="bg-admin-surface p-3 dark:bg-admin-surface-dark">
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input type="checkbox" checked={showAdvanced} onChange={(e) => setShowAdvanced(e.target.checked)} className="h-3.5 w-3.5 rounded" />
            Advanced: track inventory via component products
          </label>
          {showAdvanced && (
            <p className="mb-2 mt-1.5 text-[11px] text-black/50 dark:text-white/50">
              Buying this pack will deduct the components below instead of {form.quantity} unit(s) of its own parent product.
            </p>
          )}
          {showAdvanced && <InventoryComponentPicker value={componentRows} onChange={setComponentRows} />}
        </td>
      </tr>
      </>
    );
  }

  return (
    <tr className="border-b border-admin-border last:border-b-0 dark:border-admin-border-dark">
      <td className="p-2 text-sm font-semibold">
        {pack.name}
        {pack.isDefault && <span className="ml-1.5 rounded-full bg-admin-primary/20 px-1.5 py-0.5 text-[10px] font-bold">Default</span>}
        {pack.useComponentInventory && pack.inventoryComponents.length > 0 && (
          <span
            className="ml-1.5 rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-400"
            title={pack.inventoryComponents.map((c) => `${c.productId} × ${c.quantity}`).join(", ")}
          >
            {pack.inventoryComponents.length}-component combo
          </span>
        )}
      </td>
      <td className="p-2 text-sm tabular-nums">{pack.quantity}</td>
      <td className="p-2 text-sm tabular-nums">
        ₹{pack.price.toFixed(2)}
        {typeof pack.discountPercentage === "number" && pack.discountPercentage > 0 && (
          <span className="ml-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {pack.discountPercentage.toFixed(0)}% off
          </span>
        )}
      </td>
      <td className="p-2 text-sm text-black/60 dark:text-white/60">{pack.sku || "—"}</td>
      <td className="p-2 text-center">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
            pack.isActive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-black/10 text-black/50 dark:bg-white/10 dark:text-white/50"
          }`}
        >
          {pack.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="p-2 text-center text-sm tabular-nums text-black/60 dark:text-white/60">
        {typeof pack.availableStock === "number" ? pack.availableStock : "—"}
      </td>
      <td className="p-2 text-right">
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border border-admin-border px-3 py-1 text-xs font-semibold dark:border-admin-border-dark"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onDelete}
            className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-600 disabled:opacity-50 dark:text-red-400"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// Pack Configuration is a genuine sub-resource of the product (spec §17) —
// each row persists immediately through its own endpoint the moment it's
// saved, rather than being buffered into the outer product form's submit
// payload the way ProductGalleryPicker's images are. That matches how a
// Coupon's status transition is its own endpoint separate from the general
// update, and avoids a product save silently dropping pack edits (or vice
// versa) if one request succeeds and the other fails.
export default function PackConfigSection({
  parent = "products",
  parentId,
  categoryId,
}: {
  /** Which admin router owns this config — a category has no `mode`/inherit UI (it IS an inheritance source, see below). */
  parent?: PackConfigParent;
  parentId: string;
  /** The product's own category — only meaningful when parent === "products", to offer "Use Category Configuration". */
  categoryId?: string;
}) {
  const { data: config } = usePackConfig(parent, parentId);
  const { data: categoryConfig } = usePackConfig("categories", parent === "products" ? categoryId ?? null : null);
  const { data: packs = [] } = usePackList(parent, parentId);
  const updateConfig = useUpdatePackConfig(parent, parentId);
  const createMutation = useCreatePack(parent, parentId);
  const updateMutation = useUpdatePack(parent, parentId);
  const deleteMutation = useDeletePack(parent, parentId);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<PackFormInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const enabled = config?.enabled ?? false;
  const categoryHasPacks = parent === "products" && (categoryConfig?.enabled ?? false);

  function handleSubmitAdd() {
    setError(null);
    createMutation.mutate(addForm, {
      onSuccess: () => {
        setAddForm(EMPTY_FORM);
        setAddOpen(false);
      },
      onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't create the pack."),
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">
          Pack / Combo Configuration
        </h2>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => updateConfig.mutate({ enabled: e.target.checked })}
            className="h-4 w-4 rounded"
          />
          Enable Pack Configuration
        </label>
      </div>

      {enabled && (
        <>
          {categoryHasPacks && (
            <div className="flex items-center gap-4 rounded-xl border border-admin-border p-3 text-sm dark:border-admin-border-dark">
              <span className="font-semibold">Configuration source</span>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="pack-mode"
                  checked={(config?.mode ?? "CUSTOM") === "CUSTOM"}
                  onChange={() => updateConfig.mutate({ mode: "CUSTOM" })}
                />
                Custom Product Configuration
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="pack-mode"
                  checked={config?.mode === "INHERIT_CATEGORY"}
                  onChange={() => updateConfig.mutate({ mode: "INHERIT_CATEGORY" })}
                />
                Use Category Configuration
              </label>
            </div>
          )}

          {config?.mode === "INHERIT_CATEGORY" && categoryHasPacks ? (
            <p className="rounded-xl bg-admin-surface p-3 text-xs text-black/60 dark:bg-admin-surface-dark dark:text-white/60">
              This product uses its category&apos;s pack configuration. Edit packs on the category page.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={config?.mixedPacksAllowed ?? true}
                    onChange={(e) => updateConfig.mutate({ mixedPacksAllowed: e.target.checked })}
                    className="h-4 w-4 rounded"
                  />
                  Allow Mixed Packs
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                    Recommendation Strategy
                  </span>
                  {PACK_RECOMMENDATION_STRATEGIES.map((strategy) => (
                    <label key={strategy} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="radio"
                        name="pack-strategy"
                        checked={(config?.recommendationStrategy ?? "ADMIN_PRIORITY") === strategy}
                        onChange={() => updateConfig.mutate({ recommendationStrategy: strategy })}
                      />
                      {STRATEGY_LABELS[strategy]}
                    </label>
                  ))}
                </div>
              </div>

              {/* min-w on the table (not w-full alone) is what makes this
                  wrapper actually scroll horizontally on a narrow admin
                  panel instead of squeezing every input down to its
                  spinner arrows — w-full alone lets the browser shrink
                  columns arbitrarily since nothing sets a floor. */}
              <div className="overflow-x-auto rounded-xl border border-admin-border dark:border-admin-border-dark">
                <table className="w-full min-w-180 text-left">
                  <thead className="bg-admin-surface text-xs font-bold uppercase tracking-wider text-black/50 dark:bg-admin-surface-dark dark:text-white/50">
                    <tr>
                      <th className="p-2">Pack Name</th>
                      <th className="w-24 p-2">Quantity</th>
                      <th className="w-28 p-2">Price</th>
                      <th className="w-32 p-2">SKU</th>
                      <th className="w-24 p-2 text-center">Status</th>
                      <th className="w-24 p-2 text-center">Available</th>
                      <th className="w-40 p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {packs.map((pack) => (
                      <PackRow
                        key={pack.packId}
                        pack={pack}
                        isSaving={updateMutation.isPending}
                        isDeleting={deleteMutation.isPending && deletingId === pack.packId}
                        onSave={(patch) => updateMutation.mutate({ packId: pack.packId, patch })}
                        onDelete={() => {
                          setDeletingId(pack.packId);
                          deleteMutation.mutate(pack.packId);
                        }}
                      />
                    ))}
                    {packs.length === 0 && !addOpen && (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-sm text-black/50 dark:text-white/50">
                          No packs configured yet.
                        </td>
                      </tr>
                    )}
                    {addOpen && (
                      <tr className="border-t border-admin-border dark:border-admin-border-dark">
                        <td className="p-2">
                          <input
                            className={`${inputCls()} min-w-35`}
                            placeholder="Pack of 5"
                            value={addForm.name}
                            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={1}
                            className={`${inputCls()} w-20`}
                            value={addForm.quantity}
                            onChange={(e) => setAddForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className={`${inputCls()} w-24`}
                            value={addForm.price}
                            onChange={(e) => setAddForm((f) => ({ ...f, price: Number(e.target.value) }))}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className={`${inputCls()} w-28`}
                            placeholder="optional"
                            value={addForm.sku ?? ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, sku: e.target.value }))}
                          />
                        </td>
                        {/* Status/Available don't apply to a row that
                            doesn't exist yet (it's created Active by
                            default, see EMPTY_FORM) — a dash instead of
                            truly empty cells so the row doesn't look like
                            it's missing content. */}
                        <td className="p-2 text-center text-sm text-black/30 dark:text-white/30">—</td>
                        <td className="p-2 text-center text-sm text-black/30 dark:text-white/30">—</td>
                        <td className="p-2 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={createMutation.isPending || !addForm.name || addForm.quantity < 1}
                              onClick={handleSubmitAdd}
                              className="rounded-full bg-admin-primary px-3 py-1 text-xs font-semibold text-black disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAddOpen(false);
                                setAddForm(EMPTY_FORM);
                              }}
                              className="rounded-full border border-admin-border px-3 py-1 text-xs font-semibold dark:border-admin-border-dark"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {error && <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}

              {!addOpen && (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="rounded-full border border-admin-border px-4 py-2 text-sm font-semibold dark:border-admin-border-dark"
                >
                  + Add Pack
                </button>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
