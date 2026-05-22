import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-md">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          We can&apos;t find that page
        </h1>
        <p className="text-sm text-muted-foreground">
          The link may be broken or the page may have been moved.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted transition-colors"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
