import { useCallback } from "react";
import {
  getCurrentUser,
  signOut as amplifySignOut,
} from "aws-amplify/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "./authStore";
import { useProfileQuery } from "../queries/profile";

/**
 * Single hook that callers use to read the current auth state and trigger
 * session changes. Combines the zustand session store with the tanstack
 * profile query — pages don't need to wire both themselves.
 */
export function useAuth() {
  const cognitoUser = useAuthStore((s) => s.cognitoUser);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const setCognitoUser = useAuthStore((s) => s.setCognitoUser);
  const reset = useAuthStore((s) => s.reset);

  const profileQuery = useProfileQuery();
  const qc = useQueryClient();

  const refreshSession = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCognitoUser(user);
    } catch {
      setCognitoUser(null);
    }
  }, [setCognitoUser]);

  const signOut = useCallback(async () => {
    await amplifySignOut();
    reset();
    qc.clear();
  }, [reset, qc]);

  return {
    cognitoUser,
    bootstrapped,
    profile: profileQuery.data ?? null,
    profileLoading: profileQuery.isLoading,
    /** True until the initial Cognito probe + profile fetch settle. */
    loading: !bootstrapped || (!!cognitoUser && profileQuery.isLoading),
    refreshSession,
    refreshProfile: profileQuery.refetch,
    signOut,
  };
}

export type { UserProfile } from "../queries/profile";
