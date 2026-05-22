import type { ReactNode } from "react";
import { getOrgName } from "../lib/env";

export function AuthLayout({ children }: { children: ReactNode }) {
  const orgName = getOrgName();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-muted/40 to-background">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="mb-8 text-center">
          <div className="text-lg font-semibold tracking-tight text-foreground">
            {orgName}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            powered by Unfoldr
          </div>
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
