import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import { Spinner } from "../components/ui/spinner";

interface RequireAuthProps {
  children: ReactNode;
  /** Skip the profileCompleted check (use this on /complete-profile itself). */
  allowIncompleteProfile?: boolean;
}

export function RequireAuth({
  children,
  allowIncompleteProfile = false,
}: RequireAuthProps) {
  const { cognitoUser, profile, bootstrapped, profileLoading } = useAuth();
  const location = useLocation();

  // Initial probe still in flight — show a spinner so we don't bounce the
  // user to /signin while we're still figuring out if they're authed.
  if (!bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (!cognitoUser) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // Cognito user present, profile still loading.
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  // Block app pages until the user has completed their profile.
  // /complete-profile sets allowIncompleteProfile so it can render itself.
  if (!allowIncompleteProfile && profile && !profile.profileCompleted) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
}
