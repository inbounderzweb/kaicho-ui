import Script from "next/script";
import { GTM_ID } from "@/lib/analytics/gtm";
import { hasAnalyticsConsent } from "@/lib/analytics/consent";

/**
 * Loads the GTM container. Renders nothing (no script, no iframe) when
 * NEXT_PUBLIC_GTM_ID isn't set or consent isn't granted, so the app works
 * identically in environments without a configured container — e.g. local
 * dev, where this is expected to render nothing.
 */
export default function GoogleTagManager() {
  if (!GTM_ID || !hasAnalyticsConsent()) return null;

  return (
    <>
      <Script id="gtm-init" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
