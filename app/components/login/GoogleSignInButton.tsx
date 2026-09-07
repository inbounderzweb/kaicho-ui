"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GIS_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface CredentialResponse {
  credential?: string;
}

interface GoogleIdApi {
  initialize: (config: {
    client_id: string;
    callback: (res: CredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    itp_support?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "small" | "medium" | "large";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
    }
  ) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.id) resolve();
      else existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")));
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function GoogleSignInButton({
  onCredential,
  disabled = false,
  statusText,
}: {
  onCredential: (credential: string) => void;
  disabled?: boolean;
  /** Optional line rendered under the button (e.g. "Signing in…" or an error). */
  statusText?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonHostRef = useRef<HTMLDivElement>(null);
  // Keep the GIS callback pointing at the latest handler without re-initializing.
  const onCredentialRef = useRef(onCredential);
  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  const [failed, setFailed] = useState(false);

  const render = useCallback(() => {
    const host = buttonHostRef.current;
    const gid = window.google?.accounts?.id;
    if (!host || !gid || !CLIENT_ID) return;
    const width = Math.min(
      400,
      Math.max(200, Math.floor(wrapperRef.current?.clientWidth ?? 320))
    );
    host.innerHTML = "";
    gid.renderButton(host, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width,
    });
  }, []);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGisScript()
      .then(() => {
        if (cancelled) return;
        const gid = window.google?.accounts?.id;
        if (!gid) {
          setFailed(true);
          return;
        }
        gid.initialize({
          client_id: CLIENT_ID,
          ux_mode: "popup",
          itp_support: true,
          callback: (res) => {
            if (res.credential) onCredentialRef.current(res.credential);
          },
        });
        render();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [render]);

  // Re-render Google's button when the container width changes (responsive).
  useEffect(() => {
    if (!CLIENT_ID || typeof ResizeObserver === "undefined") return;
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => render());
    ro.observe(el);
    return () => ro.disconnect();
  }, [render]);

  // No client id configured, or the Google script is blocked/unavailable —
  // render nothing so the login screen just shows the phone/OTP flow.
  if (!CLIENT_ID || failed) return null;

  return (
    <div ref={wrapperRef} className="w-full">
      <div
        ref={buttonHostRef}
        className={
          disabled
            ? "pointer-events-none flex justify-center opacity-60"
            : "flex justify-center"
        }
      />
      {statusText && (
        <p className="mt-2 text-center text-[11px] font-semibold text-ink-muted">{statusText}</p>
      )}
    </div>
  );
}

export const GOOGLE_SIGN_IN_ENABLED = Boolean(CLIENT_ID);
