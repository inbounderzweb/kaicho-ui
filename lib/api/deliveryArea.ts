// Mirror of kaicho-be/src/modules/settings/deliveryArea.ts — keep the two in sync.
// The server is the authority (checkout refuses orders outside the delivery
// areas); this copy only lets the storefront warn before the customer pays.
import { INDIAN_STATES, type IndianState } from "./indianStates";

const key = (value: string): string =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const BY_KEY = new Map<string, IndianState>(INDIAN_STATES.map((s) => [key(s), s]));

const ALIASES: Record<string, IndianState> = {
  orissa: "Odisha",
  pondicherry: "Puducherry",
  uttaranchal: "Uttarakhand",
  "nct of delhi": "Delhi",
  "new delhi": "Delhi",
  "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  "andaman and nicobar": "Andaman and Nicobar Islands",
  // Two-letter codes people type into a state box.
  an: "Andaman and Nicobar Islands", ap: "Andhra Pradesh", ar: "Arunachal Pradesh", as: "Assam", br: "Bihar",
  ch: "Chandigarh", cg: "Chhattisgarh", dn: "Dadra and Nagar Haveli and Daman and Diu", dd: "Dadra and Nagar Haveli and Daman and Diu",
  dl: "Delhi", ga: "Goa", gj: "Gujarat", hr: "Haryana", hp: "Himachal Pradesh", jk: "Jammu and Kashmir", jh: "Jharkhand",
  ka: "Karnataka", kl: "Kerala", la: "Ladakh", ld: "Lakshadweep", mp: "Madhya Pradesh", mh: "Maharashtra", mn: "Manipur",
  ml: "Meghalaya", mz: "Mizoram", nl: "Nagaland", od: "Odisha", or: "Odisha", py: "Puducherry", pb: "Punjab", rj: "Rajasthan",
  sk: "Sikkim", tn: "Tamil Nadu", ts: "Telangana", tg: "Telangana", tr: "Tripura", up: "Uttar Pradesh", uk: "Uttarakhand",
  ut: "Uttarakhand", wb: "West Bengal",
};

/** Maps free-text state input to the canonical state name, or null if unknown. */
export function resolveIndianState(input: string | null | undefined): IndianState | null {
  if (!input) return null;
  const k = key(input);
  return BY_KEY.get(k) ?? ALIASES[k] ?? null;
}

export interface DeliveryAreaPolicy {
  restrictDeliveryToStates: boolean;
  serviceableStates: readonly string[];
}

export function isStateDeliverable(state: string | null | undefined, policy: DeliveryAreaPolicy): boolean {
  if (!policy.restrictDeliveryToStates) return true;
  const resolved = resolveIndianState(state);
  return resolved !== null && policy.serviceableStates.includes(resolved);
}

export function notServedMessage(state: string | null | undefined, policy: DeliveryAreaPolicy): string {
  const served = policy.serviceableStates;
  const where = served.length > 0 && served.length <= 5 ? `only to ${served.join(", ")}` : "only to selected states";
  const here = state?.trim() ? ` Your delivery address is in ${state.trim()}.` : "";
  return `Sorry, we currently deliver ${where}.${here}`;
}
