import LoginPageClient from "../components/login/LoginPageClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Login",
  description: "Log in to your Kaicho account with your mobile number or Google.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return <LoginPageClient />;
}
