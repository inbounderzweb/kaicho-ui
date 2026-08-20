import { z } from "zod";
import { ROLES } from "../constants/roles";

export const editUserSchema = z.object({
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  email: z.union([z.string().trim().email("Please enter a valid email"), z.literal("")]).optional(),
  role: z.enum(ROLES),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;
