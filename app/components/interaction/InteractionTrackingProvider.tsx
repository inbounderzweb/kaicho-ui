"use client";

import { useEffect } from "react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useTrackingConsent } from "@/lib/hooks/useTrackingConsent";
import { setTrackingEnabled } from "@/lib/interaction/tracker";

// Switches the tracker on only for a logged-in user who has opted in, and
// off (discarding anything queued) on logout or withdrawal. Renders nothing.
export default function InteractionTrackingProvider() {
  const { data: user } = useCurrentUser();
  const { data: consent } = useTrackingConsent();
  const active = Boolean(user) && consent?.granted === true;

  useEffect(() => {
    setTrackingEnabled(active);
    return () => setTrackingEnabled(false);
  }, [active]);

  return null;
}
