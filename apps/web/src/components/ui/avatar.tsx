import { cn } from "../../lib/cn";

/**
 * Placeholder avatar — renders the DiceBear initials SVG URL the backend
 * stores. Falls back to a colored initial circle if the URL is missing.
 */
export function Avatar({
  url,
  seed,
  className,
  size = 40,
}: {
  url?: string | null;
  /** Used both for the `alt` text and the fallback initial. */
  seed: string;
  className?: string;
  size?: number;
}) {
  const initial = (seed.trim()[0] ?? "?").toUpperCase();
  const dim = `${size}px`;

  if (url) {
    return (
      <img
        src={url}
        alt={seed}
        width={size}
        height={size}
        className={cn(
          "rounded-full border border-border bg-muted object-cover",
          className,
        )}
        style={{ width: dim, height: dim }}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full border border-border bg-muted text-muted-foreground flex items-center justify-center font-medium",
        className,
      )}
      style={{ width: dim, height: dim, fontSize: size * 0.4 }}
      aria-label={seed}
    >
      {initial}
    </div>
  );
}
