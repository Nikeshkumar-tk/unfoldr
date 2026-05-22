import { useEffect, type ReactNode } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { useAuthStore } from "./authStore";

/**
 * Bootstraps the Cognito session into the auth store on mount. Renders
 * children immediately — guards (RequireAuth / RedirectIfAuthed) wait for
 * `bootstrapped` to flip before deciding to redirect.
 *
 * The DB profile is *not* fetched here — `useProfileQuery` does that, gated
 * on `cognitoUser` being present.
 */
export function AuthBootstrapper({ children }: { children: ReactNode }) {
  const setCognitoUser = useAuthStore((s) => s.setCognitoUser);
  const markBootstrapped = useAuthStore((s) => s.markBootstrapped);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!cancelled) setCognitoUser(user);
      } catch {
        if (!cancelled) setCognitoUser(null);
      } finally {
        if (!cancelled) markBootstrapped();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setCognitoUser, markBootstrapped]);

  return <>{children}</>;
}
