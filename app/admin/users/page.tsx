import { Suspense } from "react";
import UsersClient from "../../components/admin/UsersClient";

export default function AdminUsersPage() {
  return (
    <Suspense>
      <UsersClient />
    </Suspense>
  );
}
