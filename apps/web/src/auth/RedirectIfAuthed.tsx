import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "./authStore";
import { Spinner } from "../components/ui/spinner";

/**
 * Inverse of RequireAuth — used on `/signin`, `/signup`, `/reset-password`,
 * `/verify-email`. If the user is already authed, send them to the app.
 *
 * Only the bootstrap check matters here; we don't need the profile.
 */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const cognitoUser = useAuthStore((s) => s.cognitoUser);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  if (!bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (cognitoUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
