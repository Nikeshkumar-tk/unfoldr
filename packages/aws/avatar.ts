/**
 * Deterministic placeholder avatar URL using DiceBear's free initials API.
 * Swap this helper out when real image uploads land.
 */
export function buildInitialsAvatarUrl(seed: string): string {
  const safe = encodeURIComponent(seed.trim() || "user");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${safe}`;
}
