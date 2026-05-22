import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
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
import { ApiError } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { useUpdateProfileMutation } from "../queries/profile";
import {
  completeProfileSchema,
  type CompleteProfileValues,
} from "../schemas/profile";

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const form = useForm<CompleteProfileValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { name: profile?.name ?? "" },
  });
  const { register, handleSubmit, formState } = form;

  // Already complete? Skip the form.
  useEffect(() => {
    if (profile?.profileCompleted) {
      navigate("/organizations", { replace: true });
    }
  }, [profile?.profileCompleted, navigate]);

  const mutation = useUpdateProfileMutation();

  async function onSubmit(values: CompleteProfileValues) {
    try {
      await mutation.mutateAsync(values);
      navigate("/organizations", { replace: true });
    } catch (err) {
      form.setError("root", {
        message:
          err instanceof ApiError
            ? err.message
            : "Couldn't save your profile. Please try again.",
      });
    }
  }

  const rootError = formState.errors.root?.message;

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Tell us your name</CardTitle>
          <CardDescription>
            This shows up in your organizations and to your teammates.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {rootError && (
              <Alert variant="destructive">
                <AlertDescription>{rootError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Ada Lovelace"
                aria-invalid={!!formState.errors.name}
                {...register("name")}
              />
              {formState.errors.name && (
                <p className="text-xs text-destructive" role="alert">
                  {formState.errors.name.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              fullWidth
              loading={mutation.isPending}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving…" : "Continue"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
