import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import { useAuthStore } from "../auth/authStore";

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  profileCompleted: boolean;
  avatarUrl: string;
  status?: string;
  createdAt?: number;
}

export const profileKeys = {
  me: ["profile", "me"] as const,
};

/**
 * The post-confirmation lambda creates the user row asynchronously, so the
 * very first GET /users/me after sign-up can race and return 404. Treat 404
 * as "not yet provisioned" rather than an error — pages handle null.
 */
async function fetchMyProfile(): Promise<UserProfile | null> {
  try {
    return await api<UserProfile>("GET", "/users/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export function useProfileQuery() {
  const cognitoUser = useAuthStore((s) => s.cognitoUser);
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: fetchMyProfile,
    enabled: !!cognitoUser,
  });
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string }) =>
      api<UserProfile>("PATCH", "/users/me", { json: input }),
    onSuccess: (updated) => {
      qc.setQueryData(profileKeys.me, updated);
    },
  });
}
