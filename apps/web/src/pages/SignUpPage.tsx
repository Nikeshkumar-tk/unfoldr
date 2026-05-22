import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { signUp } from "aws-amplify/auth";
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
import { signUpSchema, type SignUpValues } from "../schemas/signUp";

export function SignUpPage() {
  const navigate = useNavigate();
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });
  const { register, handleSubmit, formState } = form;

  const mutation = useMutation({
    mutationFn: (values: SignUpValues) =>
      signUp({
        username: values.email,
        password: values.password,
        options: { userAttributes: { email: values.email } },
      }),
    onSuccess: (result, values) => {
      if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        navigate(`/verify-email?email=${encodeURIComponent(values.email)}`, {
          replace: true,
        });
        return;
      }
      if (result.isSignUpComplete) {
        navigate(
          `/signin?signedUp=1&email=${encodeURIComponent(values.email)}`,
          { replace: true },
        );
        return;
      }
      form.setError("root", {
        message: `Unexpected sign-up step: ${result.nextStep.signUpStep}. Please contact support.`,
      });
    },
    onError: (err) => {
      form.setError("root", { message: friendlyAuthError(err) });
    },
  });

  const rootError = formState.errors.root?.message;

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Start by setting your email and a password. We&apos;ll send you a
            verification code.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!formState.errors.password}
                {...register("password")}
              />
              {formState.errors.password ? (
                <p className="text-xs text-destructive" role="alert">
                  {formState.errors.password.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  At least 8 characters, including upper, lower, and a digit.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!formState.errors.confirmPassword}
                {...register("confirmPassword")}
              />
              {formState.errors.confirmPassword && (
                <p className="text-xs text-destructive" role="alert">
                  {formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" fullWidth loading={mutation.isPending}>
              {mutation.isPending ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="font-medium text-foreground hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
