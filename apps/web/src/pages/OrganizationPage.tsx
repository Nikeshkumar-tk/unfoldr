import { useOrgStore } from "../stores/orgStore";
import { useAuth } from "../auth/useAuth";
import {
  useGitHubConnectionQuery,
  useDisconnectGitHubMutation,
} from "../queries/github";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
import { Alert, AlertDescription } from "../components/ui/alert";

export function OrganizationPage() {
  const selectedOrg = useOrgStore((s) => s.selectedOrg);
  const { cognitoUser } = useAuth();

  const connectionQuery = useGitHubConnectionQuery();
  const disconnectMutation = useDisconnectGitHubMutation();

  if (!selectedOrg) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Organization
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select an organization to manage its settings.
          </p>
        </div>
      </div>
    );
  }

  const state = btoa(
    JSON.stringify({
      orgId: selectedOrg.orgId,
      userId: cognitoUser?.userId ?? "",
    }),
  );

  const githubInstallUrl = `https://github.com/apps/unfolder-auth/installations/new?state=${state}`;

  const connection = connectionQuery.data;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organization</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage settings for {selectedOrg.name}.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-sm font-semibold tracking-tight">
            Organization Details
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{selectedOrg.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="capitalize">
                {selectedOrg.role.toLowerCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span>{new Date(selectedOrg.joinedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">
                GitHub Connection
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Connect your GitHub organization to enable deployments.
              </p>
            </div>

            {connectionQuery.isLoading && (
              <Spinner className="h-5 w-5 text-muted-foreground" />
            )}

            {!connectionQuery.isLoading && connection?.connected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnectMutation.mutate()}
                loading={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending ? "Disconnecting…" : "Disconnect"}
              </Button>
            )}

            {!connectionQuery.isLoading && !connection?.connected && (
              <a href={githubInstallUrl}>
                <Button size="sm">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Connect GitHub
                </Button>
              </a>
            )}
          </div>

          {connectionQuery.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                Could not load GitHub connection status.
              </AlertDescription>
            </Alert>
          )}

          {disconnectMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>Failed to disconnect GitHub.</AlertDescription>
            </Alert>
          )}

          {connection?.connected && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-500 font-medium">Connected</span>
              </div>
              {connection.githubOrgName && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GitHub Org</span>
                  <span>{connection.githubOrgName}</span>
                </div>
              )}
              {connection.createdAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Connected since</span>
                  <span>
                    {new Date(connection.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {connection.repos && connection.repos.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Accessible repositories ({connection.repos.length})
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {connection.repos.map((repo) => (
                      <div
                        key={repo.id}
                        className="flex items-center gap-2 text-sm py-1"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                          />
                        </svg>
                        <span className="truncate">{repo.fullName}</span>
                        {repo.private && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            private
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
