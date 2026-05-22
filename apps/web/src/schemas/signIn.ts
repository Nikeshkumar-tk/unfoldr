import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type SignInValues = z.infer<typeof signInSchema>;

export const newPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmNewPassword: z.string().min(8, "At least 8 characters"),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Passwords don't match",
  });

export type NewPasswordValues = z.infer<typeof newPasswordSchema>;
