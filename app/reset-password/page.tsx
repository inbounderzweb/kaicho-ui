import { Suspense } from "react";
import ResetPasswordClient from "../components/reset-password/ResetPasswordClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Reset password",
  description: "Choose a new password for your Kaicho account.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordClient />
    </Suspense>
  );
}
