import { Suspense } from "react";
import CategoriesClient from "../../components/admin/CategoriesClient";

export default function AdminCategoriesPage() {
  return (
    <Suspense>
      <CategoriesClient />
    </Suspense>
  );
}
