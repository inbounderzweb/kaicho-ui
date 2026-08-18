import ProfilePageClient from "../components/profile/ProfilePageClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "My Account",
  description: "View your Kaicho orders, addresses, saved items and account details.",
  path: "/profile",
  noIndex: true,
});

export default function ProfilePage() {
  return <ProfilePageClient />;
}
