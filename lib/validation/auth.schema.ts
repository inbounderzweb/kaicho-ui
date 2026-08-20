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
