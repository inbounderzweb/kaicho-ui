import RegisterPageClient from "../components/register/RegisterPageClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Create account",
  description: "Create your Kaicho account with your email, or continue with Google.",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  return <RegisterPageClient />;
}
