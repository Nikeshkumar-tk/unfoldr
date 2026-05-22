import { z } from "zod";

// Mirrors the Cognito password policy in apps/infra/src/modules/cognito.ts:
// min 8, requires lowercase, uppercase, and a digit.
const passwordPolicy = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a digit");

export const signUpSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: passwordPolicy,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export type SignUpValues = z.infer<typeof signUpSchema>;
