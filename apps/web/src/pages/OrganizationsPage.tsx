import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Spinner } from "../components/ui/spinner";
import { Avatar } from "../components/ui/avatar";
import { ApiError } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { getOrgName } from "../lib/env";
import { useOrgStore } from "../stores/orgStore";
import { useOrgsQuery, useCreateOrgMutation, type OrgMembership } from "../queries/orgs";
import { createOrgSchema, type CreateOrgValues } from "../schemas/organization";

export function OrganizationsPage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const setSelectedOrg = useOrgStore((s) => s.setSelectedOrg);
  const [creating, setCreating] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const brandName = getOrgName();

  function handleOrgClick(org: OrgMembership) {
    setSelectedOrg(org);
    navigate("/dashboard");
  }

  const orgsQuery = useOrgsQuery();
  const orgs = orgsQuery.data ?? null;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-background">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold tracking-tight">{brandName}</span>
            <span className="text-xs text-muted-foreground">
              · powered by Unfoldr
            </span>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-2 text-sm">
                <Avatar
                  url={profile.avatarUrl}
                  seed={profile.name || profile.email}
                  size={28}
                />
                <span className="hidden sm:inline text-muted-foreground">
                  {profile.name || profile.email}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              loading={signingOut}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Your organizations
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Organizations group people working on the same deployments.
            </p>
          </div>
          <Button onClick={() => setCreating(true)}>New organization</Button>
        </div>

        {orgsQuery.isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {orgsQuery.error instanceof ApiError
                ? orgsQuery.error.message
                : "Couldn't load your organizations."}
            </AlertDescription>
          </Alert>
        )}

        {orgsQuery.isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6 text-muted-foreground" />
          </div>
        )}

        {!orgsQuery.isLoading && orgs && orgs.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <p className="text-base font-medium">No organizations yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first organization to get started.
              </p>
              <Button onClick={() => setCreating(true)}>
                Create organization
              </Button>
            </CardContent>
          </Card>
        )}

        {!orgsQuery.isLoading && orgs && orgs.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orgs.map((org) => (
              <li key={org.orgId}>
                <button
                  type="button"
                  onClick={() => handleOrgClick(org)}
                  className="w-full text-left"
                >
                  <Card className="hover:border-foreground/20 transition-colors cursor-pointer hover:shadow-sm">
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar url={org.avatarUrl} seed={org.name} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{org.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {org.role.toLowerCase()}
                        </div>
                      </div>
                      <svg className="h-4 w-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </CardContent>
                  </Card>
                </button>
              </li>
            ))}
          </ul>
        )}

        {creating && (
          <CreateOrgDialog
            onClose={() => setCreating(false)}
            onCreated={() => setCreating(false)}
          />
        )}
      </main>
    </div>
  );
}

function CreateOrgDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const form = useForm<CreateOrgValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: "" },
  });
  const { register, handleSubmit, formState } = form;
  const mutation = useCreateOrgMutation();

  async function onSubmit(values: CreateOrgValues) {
    try {
      await mutation.mutateAsync(values);
      onCreated();
    } catch (err) {
      form.setError("root", {
        message:
          err instanceof ApiError
            ? err.message
            : "Couldn't create the organization.",
      });
    }
  }

  const rootError = formState.errors.root?.message;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-org-title"
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="space-y-4 p-6">
              <div>
                <h2
                  id="create-org-title"
                  className="text-lg font-semibold tracking-tight"
                >
                  New organization
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Give your organization a name. You can change it later.
                </p>
              </div>
              {rootError && (
                <Alert variant="destructive">
                  <AlertDescription>{rootError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="org-name">Name</Label>
                <Input
                  id="org-name"
                  type="text"
                  placeholder="Acme Inc"
                  autoFocus
                  aria-invalid={!!formState.errors.name}
                  {...register("name")}
                />
                {formState.errors.name && (
                  <p className="text-xs text-destructive" role="alert">
                    {formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={mutation.isPending}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Creating…" : "Create"}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
