import { create } from "zustand";
import type { AuthUser } from "aws-amplify/auth";

/**
 * Cognito session state.
 *
 * This store owns the *session*, not the DB profile — the profile lives in
 * tanstack-query (see queries/profile.ts) so it gets caching, invalidation,
 * and refetch-on-reconnect for free.
 *
 * `bootstrapped` flips to true the first time we successfully call
 * `getCurrentUser` (whether it returned a user or threw). Route guards use
 * this so they don't redirect during the initial probe.
 */
interface AuthState {
  cognitoUser: AuthUser | null;
  bootstrapped: boolean;
  setCognitoUser: (user: AuthUser | null) => void;
  markBootstrapped: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  cognitoUser: null,
  bootstrapped: false,
  setCognitoUser: (user) => set({ cognitoUser: user }),
  markBootstrapped: () => set({ bootstrapped: true }),
  reset: () => set({ cognitoUser: null, bootstrapped: true }),
}));
