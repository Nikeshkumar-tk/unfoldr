import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { signIn, confirmSignIn } from "aws-amplify/auth";
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
import { useAuth } from "../auth/useAuth";
import { friendlyAuthError } from "../lib/auth-errors";
import {
  signInSchema,
  newPasswordSchema,
  type SignInValues,
  type NewPasswordValues,
} from "../schemas/signIn";

type Phase = "credentials" | "newPassword";

export function SignInPage() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [phase, setPhase] = useState<Phase>("credentials");

  const credentialsForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const newPasswordForm = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
  });

  const signInMutation = useMutation({
    mutationFn: (values: SignInValues) =>
      signIn({ username: values.email, password: values.password }),
    onSuccess: async (result, values) => {
      if (result.isSignedIn) {
        await refreshSession();
        navigate("/", { replace: true });
        return;
      }
      switch (result.nextStep.signInStep) {
        case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED":
          setPhase("newPassword");
          return;
        case "CONFIRM_SIGN_UP":
          navigate(`/verify-email?email=${encodeURIComponent(values.email)}`, {
            replace: true,
          });
          return;
        case "RESET_PASSWORD":
          navigate(`/reset-password?email=${encodeURIComponent(values.email)}`, {
            replace: true,
          });
          return;
        default:
          credentialsForm.setError("root", {
            message: `This sign-in step isn't supported yet: ${result.nextStep.signInStep}`,
          });
      }
    },
    onError: (err) => {
      credentialsForm.setError("root", { message: friendlyAuthError(err) });
    },
  });

  const newPasswordMutation = useMutation({
    mutationFn: (values: NewPasswordValues) =>
      confirmSignIn({ challengeResponse: values.newPassword }),
    onSuccess: async (result) => {
      if (result.isSignedIn) {
        await refreshSession();
        navigate("/", { replace: true });
      } else {
        newPasswordForm.setError("root", {
          message: `Additional step required: ${result.nextStep.signInStep}. Please contact your administrator.`,
        });
      }
    },
    onError: (err) => {
      newPasswordForm.setError("root", { message: friendlyAuthError(err) });
    },
  });

  if (phase === "newPassword") {
    const { register, handleSubmit, formState } = newPasswordForm;
    const rootError = formState.errors.root?.message;
    return (
      <AuthLayout>
        <Card>
          <CardHeader>
            <CardTitle>Set a new password</CardTitle>
            <CardDescription>
              Your account requires a new password before you can continue.
            </CardDescription>
          </CardHeader>
          <form
            onSubmit={handleSubmit((values) =>
              newPasswordMutation.mutate(values),
            )}
            noValidate
          >
            <CardContent className="space-y-4">
              {rootError && (
                <Alert variant="destructive">
                  <AlertDescription>{rootError}</AlertDescription>
                </Alert>
              )}
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
                loading={newPasswordMutation.isPending}
              >
                {newPasswordMutation.isPending
                  ? "Updating…"
                  : "Set password and continue"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </AuthLayout>
    );
  }

  const { register, handleSubmit, formState } = credentialsForm;
  const rootError = formState.errors.root?.message;
  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Welcome back. Enter your email and password to continue.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={handleSubmit((values) => signInMutation.mutate(values))}
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/reset-password"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!formState.errors.password}
                {...register("password")}
              />
              {formState.errors.password && (
                <p className="text-xs text-destructive" role="alert">
                  {formState.errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              fullWidth
              loading={signInMutation.isPending}
            >
              {signInMutation.isPending ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-foreground hover:underline"
              >
                Create one
              </Link>
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Need to verify your email?{" "}
              <Link
                to="/verify-email"
                className="font-medium text-foreground hover:underline"
              >
                Enter your code
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
