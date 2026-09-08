import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type AuthStep = "phone" | "otp" | "name";

interface AuthStoreState {
  step: AuthStep;
  phone: string;
  /** Epoch ms after which a new OTP may be requested. null = no cooldown. */
  resendAvailableAt: number | null;
  setStep: (step: AuthStep) => void;
  setPhone: (phone: string) => void;
  startResendCooldown: (seconds: number) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      step: "phone",
      phone: "",
      resendAvailableAt: null,
      setStep: (step) => set({ step }),
      setPhone: (phone) => set({ phone }),
      startResendCooldown: (seconds) =>
        set({ resendAvailableAt: Date.now() + seconds * 1000 }),
      reset: () => set({ step: "phone", phone: "", resendAvailableAt: null }),
    }),
    {
      name: "kaicho-login",
      storage: createJSONStorage(() => localStorage),
      // Persist only what the resend countdown needs to survive a tab close:
      // the deadline itself, plus the phone/step so it can reappear on the
      // "Verify OTP" screen rather than an empty phone form.
      partialize: (s) => ({
        step: s.step,
        phone: s.phone,
        resendAvailableAt: s.resendAvailableAt,
      }),
      // Same skipHydration pattern as the cart store — Providers calls
      // rehydrate() post-mount so the first client render matches the SSR
      // HTML (see app/providers.tsx).
      skipHydration: true,
      // A cooldown that has already elapsed (or was never set) is meaningless:
      // drop the persisted step/phone so a returning user starts fresh at the
      // phone form instead of being stranded on a stale OTP screen. Only a
      // still-running cooldown restores the OTP step.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AuthStoreState>;
        const cooldownActive =
          typeof p.resendAvailableAt === "number" && p.resendAvailableAt > Date.now();
        if (!cooldownActive) return current;
        return {
          ...current,
          step: p.step ?? current.step,
          phone: p.phone ?? current.phone,
          resendAvailableAt: p.resendAvailableAt ?? null,
        };
      },
    }
  )
);
