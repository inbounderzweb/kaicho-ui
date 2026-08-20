import { Suspense } from "react";
import ProductsClient from "../../components/admin/ProductsClient";

export default function AdminProductsPage() {
  return (
    <Suspense>
      <ProductsClient />
    </Suspense>
  );
}
