import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProduct } from "../../api/product";
import { ApiError } from "../../api/ApiError";

export interface BulkDeleteResult {
  succeeded: string[];
  /** Which ids failed, and why — a product with dependent orders may still fail if the archive fallback itself errors. */
  failed: { id: string; message: string }[];
}

// No dedicated bulk-delete endpoint — each id goes through the same
// single-product DELETE /admin/products/:id the row-level delete action
// already uses (archive-instead-of-hard-delete for products with order
// history stays exactly as it is today, per product). Settled rather than
// all-or-nothing: one failure (e.g. a product deleted by someone else a
// moment ago) shouldn't block deleting the rest of the selection.
export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]): Promise<BulkDeleteResult> => {
      const results = await Promise.allSettled(ids.map((id) => deleteProduct(id)));
      const succeeded: string[] = [];
      const failed: { id: string; message: string }[] = [];
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          succeeded.push(ids[i]);
        } else {
          const reason = result.reason;
          failed.push({ id: ids[i], message: reason instanceof ApiError ? reason.message : "Couldn't delete this product." });
        }
      });
      return { succeeded, failed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products", "list"] });
    },
  });
}
