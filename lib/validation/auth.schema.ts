import { z } from "zod";

export const phoneFormSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"),
});

export type PhoneFormValues = z.infer<typeof phoneFormSchema>;

export const otpFormSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Please enter the 4-digit OTP"),
});

export type OtpFormValues = z.infer<typeof otpFormSchema>;

export const nameFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name")
    .max(80, "Name is too long"),
});

export type NameFormValues = z.infer<typeof nameFormSchema>;

// --- Email/password auth ----------------------------------------------------
// Mirrors the backend rules (auth.validation.ts) so the user gets the error
// inline instead of a round-trip. The backend remains the real gate.

const emailField = z
  .string()
  .trim()
  .min(1, "Please enter your email")
  .email("Please enter a valid email address");

const newPasswordField = z
  .string()
  .min(1, "Please enter a password")
  .min(8, "Password must be at least 8 characters")
  .refine((v) => new TextEncoder().encode(v).length <= 72, "Password is too long (max 72 bytes)")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Password must include a letter and a number");

export const registerFormSchema = z
  .object({
    name: z.string().trim().min(1, "Please enter your name").max(80, "Name is too long"),
    email: emailField,
    password: newPasswordField,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Please enter your password"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const resendFormSchema = z.object({ email: emailField });

export type ResendFormValues = z.infer<typeof resendFormSchema>;

export const forgotPasswordFormSchema = z.object({ email: emailField });

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    password: newPasswordField,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
