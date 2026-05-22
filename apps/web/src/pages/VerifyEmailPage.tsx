import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
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
  verifyEmailSchema,
  type VerifyEmailValues,
} from "../schemas/verifyEmail";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const [info, setInfo] = useState<string | null>(null);

  const form = useForm<VerifyEmailValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email: initialEmail, code: "" },
  });
  const { register, handleSubmit, formState, watch } = form;
  const email = watch("email");

  const verifyMutation = useMutation({
    mutationFn: (values: VerifyEmailValues) =>
      confirmSignUp({
        username: values.email,
        confirmationCode: values.code,
      }),
    onSuccess: (result, values) => {
      if (result.isSignUpComplete) {
        navigate(
          `/signin?verified=1&email=${encodeURIComponent(values.email)}`,
          { replace: true },
        );
      } else {
        form.setError("root", {
          message: `Additional step required: ${result.nextStep.signUpStep}. Please contact your administrator.`,
        });
      }
    },
    onError: (err) => {
      form.setError("root", { message: friendlyAuthError(err) });
    },
  });

  const resendMutation = useMutation({
    mutationFn: (username: string) => resendSignUpCode({ username }),
    onSuccess: () => {
      setInfo("A new code is on the way. Check your inbox.");
    },
    onError: (err) => {
      form.setError("root", { message: friendlyAuthError(err) });
    },
  });

  function handleResend() {
    setInfo(null);
    form.clearErrors("root");
    if (!email) return;
    resendMutation.mutate(email);
  }

  const rootError = formState.errors.root?.message;

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            Enter the 6-digit code we sent to your inbox.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={handleSubmit((values) => {
            setInfo(null);
            verifyMutation.mutate(values);
          })}
          noValidate
        >
          <CardContent className="space-y-4">
            {rootError && (
              <Alert variant="destructive">
                <AlertDescription>{rootError}</AlertDescription>
              </Alert>
            )}
            {info && (
              <Alert variant="success">
                <AlertDescription>{info}</AlertDescription>
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
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              fullWidth
              loading={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? "Verifying…" : "Verify email"}
            </Button>
            <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
              <Link
                to="/signin"
                className="font-medium text-foreground hover:underline"
              >
                Back to sign in
              </Link>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendMutation.isPending || !email}
                className="font-medium text-foreground hover:underline disabled:opacity-50 disabled:hover:no-underline"
              >
                {resendMutation.isPending ? "Sending…" : "Resend code"}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
