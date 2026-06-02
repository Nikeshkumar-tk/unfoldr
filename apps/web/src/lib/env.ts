function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. Copy apps/web/.env.example to apps/web/.env.local and fill it in.`,
    );
  }
  return value;
}

export function getOrgName(): string {
  return required("VITE_ORG_NAME");
}

export function getUserPoolId(): string {
  return required("VITE_USER_POOL_ID");
}

export function getUserPoolClientId(): string {
  return required("VITE_USER_POOL_CLIENT_ID");
}

export function getApiBaseUrl(): string {
  // Strip any trailing slash so callers can concat with `/users/me` safely.
  return required("VITE_API_BASE_URL").replace(/\/$/, "");
}

export function getGitHubClientId(): string {
  return required("VITE_GITHUB_CLIENT_ID");
}
