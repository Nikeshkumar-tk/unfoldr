import { z } from "zod";

export const resetRequestSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export type ResetRequestValues = z.infer<typeof resetRequestSchema>;

export const resetConfirmSchema = z
  .object({
    code: z
      .string()
      .min(1, "Enter the code from your email")
      .regex(/^\d+$/, "Code should be digits only"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmNewPassword: z.string().min(8, "At least 8 characters"),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Passwords don't match",
  });

export type ResetConfirmValues = z.infer<typeof resetConfirmSchema>;
