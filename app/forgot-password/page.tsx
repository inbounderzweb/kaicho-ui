import ForgotPasswordClient from "../components/forgot-password/ForgotPasswordClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Forgot password",
  description: "Request a link to reset your Kaicho account password.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
