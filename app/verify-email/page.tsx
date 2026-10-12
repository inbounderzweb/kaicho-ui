import { Suspense } from "react";
import VerifyEmailClient from "../components/verify-email/VerifyEmailClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Verify your email",
  description: "Verify your email address to activate your Kaicho account.",
  path: "/verify-email",
  noIndex: true,
});

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailClient />
    </Suspense>
  );
}
