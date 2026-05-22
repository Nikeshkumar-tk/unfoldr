import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword, confirmResetPassword } from "aws-amplify/auth";
import { AuthLayout } from "../components/AuthLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { friendlyAuthError } from "../lib/auth-errors";
import {
  resetRequestSchema,
  resetConfirmSchema,
  type ResetRequestValues,
  type ResetConfirmValues,
} from "../schemas/resetPassword";

type Phase = "request" | "confirm";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const [phase, setPhase] = useState<Phase>("request");
  // Email is captured in phase 1 and reused in phase 2's API call — keep it
  // in state across phases (separate from form values).
  const [email, setEmail] = useState(initialEmail);

  const requestForm = useForm<ResetRequestValues>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: initialEmail },
  });

  const confirmForm = useForm<ResetConfirmValues>({
    resolver: zodResolver(resetConfirmSchema),
    defaultValues: { code: "", newPassword: "", confirmNewPassword: "" },
  });

  const requestMutation = useMutation({
    mutationFn: (values: ResetRequestValues) =>
      resetPassword({ username: values.email }),
    onSuccess: (_result, values) => {
      setEmail(values.email);
      setPhase("confirm");
    },
    onError: (err) => {
      requestForm.setError("root", { message: friendlyAuthError(err) });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (values: ResetConfirmValues) =>
      confirmResetPassword({
        username: email,
        confirmationCode: values.code,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      navigate(`/signin?reset=1&email=${encodeURIComponent(email)}`, {
        replace: true,
      });
    },
    onError: (err) => {
      confirmForm.setError("root", { message: friendlyAuthError(err) });
    },
  });

  if (phase === "confirm") {
    const { register, handleSubmit, formState } = confirmForm;
    const rootError = formState.errors.root?.message;
    return (
      <AuthLayout>
        <Card>
          <CardHeader>
            <CardTitle>Enter your code</CardTitle>
            <CardDescription>
              We sent a code to {email}. Enter it below along with a new
              password.
            </CardDescription>
          </CardHeader>
          <form
            onSubmit={handleSubmit((values) => confirmMutation.mutate(values))}
            noValidate
          >
            <CardContent className="space-y-4">
              {rootError && (
                <Alert variant="destructive">
                  <AlertDescription>{rootError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  aria-invalid={!!formState.errors.code}
                  {...register("code")}
                />
                {formState.errors.code && (
                  <p className="text-xs text-destructive" role="alert">
                    {formState.errors.code.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!formState.errors.newPassword}
                  {...register("newPassword")}
                />
                {formState.errors.newPassword && (
                  <p className="text-xs text-destructive" role="alert">
                    {formState.errors.newPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">
                  Confirm new password
                </Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!formState.errors.confirmNewPassword}
                  {...register("confirmNewPassword")}
                />
                {formState.errors.confirmNewPassword && (
                  <p className="text-xs text-destructive" role="alert">
                    {formState.errors.confirmNewPassword.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                fullWidth
                loading={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? "Updating…" : "Reset password"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Remembered it?{" "}
                <Link
                  to="/signin"
                  className="font-medium text-foreground hover:underline"
                >
                  Back to sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </AuthLayout>
    );
  }

  const { register, handleSubmit, formState } = requestForm;
  const rootError = formState.errors.root?.message;
  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            We&apos;ll email you a code to reset your password.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={handleSubmit((values) => requestMutation.mutate(values))}
          noValidate
        >
          <CardContent className="space-y-4">
            {rootError && (
              <Alert variant="destructive">
                <AlertDescription>{rootError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!formState.errors.email}
                {...register("email")}
              />
              {formState.errors.email && (
                <p className="text-xs text-destructive" role="alert">
                  {formState.errors.email.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              fullWidth
              loading={requestMutation.isPending}
            >
              {requestMutation.isPending ? "Sending…" : "Send reset code"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Remembered it?{" "}
              <Link
                to="/signin"
                className="font-medium text-foreground hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
