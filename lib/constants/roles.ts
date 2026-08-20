// Mirrors kaicho-be/src/common/constants/roles.ts. Kept manually in sync —
// the two apps are separate repos/languages, so a shared package isn't
// worth the added coupling for a two-entry list. Adding a role means
// updating both files.
export const ROLES = ["user", "admin"] as const;

export type UserRole = (typeof ROLES)[number];
