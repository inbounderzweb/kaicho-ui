import { create } from "zustand";

type AuthStep = "phone" | "otp" | "name";

interface AuthStoreState {
  step: AuthStep;
  phone: string;
  resendAvailableAt: number | null;
  setStep: (step: AuthStep) => void;
  setPhone: (phone: string) => void;
  startResendCooldown: (seconds: number) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  step: "phone",
  phone: "",
  resendAvailableAt: null,
  setStep: (step) => set({ step }),
  setPhone: (phone) => set({ phone }),
  startResendCooldown: (seconds) =>
    set({ resendAvailableAt: Date.now() + seconds * 1000 }),
  reset: () => set({ step: "phone", phone: "", resendAvailableAt: null }),
}));
