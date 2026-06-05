import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOrgStore } from "../stores/orgStore";
import {
  useProjectsQuery,
  useCreateProjectMutation,
} from "../queries/projects";
import { useReposSearch } from "../queries/repos";
import {
  createProjectSchema,
  ProjectType,
  Framework,
  PackageManager,
  DeploymentMode,
} from "../schemas/project";
import type { CreateProjectValues } from "../schemas/project";
import { cn } from "../lib/cn";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Spinner } from "../components/ui/spinner";
import { Alert, AlertDescription } from "../components/ui/alert";

const packageManagerDefaults: Record<
  PackageManager,
  { installCommand: string; buildCommand: string }
> = {
  [PackageManager.npm]: { installCommand: "npm install", buildCommand: "npm run build" },
  [PackageManager.yarn]: { installCommand: "yarn install", buildCommand: "yarn build" },
  [PackageManager.pnpm]: { installCommand: "pnpm install", buildCommand: "pnpm build" },
};

export function ProjectsPage() {
  const selectedOrg = useOrgStore((s) => s.selectedOrg);
  const navigate = useNavigate();
  const projectsQuery = useProjectsQuery();
  const createProjectMutation = useCreateProjectMutation();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      projectName: "",
      projectType: ProjectType.ReactApp,
      repoFullName: "",
      deploymentMode: DeploymentMode.shared,
      config: {
        framework: Framework.vite,
        packageManager: PackageManager.npm,
        installCommand: "npm install",
        buildCommand: "npm run build",
        outputDir: "dist",
      },
    },
  });

  const onSubmit = (values: CreateProjectValues) => {
    createProjectMutation.mutate(
      {
        projectName: values.projectName,
        projectType: values.projectType,
        repoFullName: values.repoFullName,
        config: values.config,
        deploymentMode: values.deploymentMode,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          form.reset();
        },
      },
    );
  };

  if (!selectedOrg) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select an organization to manage projects.
          </p>
        </div>
      </div>
    );
  }

  const projects = projectsQuery.data ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deploy and manage your projects for {selectedOrg.name}.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Create Project</Button>
        )}
      </div>

      {projectsQuery.isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {projectsQuery.isError && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load projects.</AlertDescription>
        </Alert>
      )}

      {createProjectMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {createProjectMutation.error instanceof Error
              ? createProjectMutation.error.message
              : "Failed to create project."}
          </AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold tracking-tight mb-4">
              New Project
            </h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input id="projectName" placeholder="my-awesome-app" {...form.register("projectName")} />
                {form.formState.errors.projectName && (
                  <p className="text-sm text-destructive">{form.formState.errors.projectName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Project Type</Label>
                <Controller
                  name="projectType"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {Object.values(ProjectType).map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>GitHub Repository</Label>
                <RepoSearchInput
                  value={form.watch("repoFullName")}
                  onChange={(repo) => form.setValue("repoFullName", repo, { shouldValidate: true })}
                />
                {form.formState.errors.repoFullName && (
                  <p className="text-sm text-destructive">{form.formState.errors.repoFullName.message}</p>
                )}
              </div>

              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                Deployment Mode
              </h3>
              <Controller
                name="deploymentMode"
                control={form.control}
                render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        value: DeploymentMode.shared,
                        title: "Shared",
                        note: "Serves on a subdomain of the platform's domain (e.g. my-app.example.com). Uses a shared S3 bucket and CloudFront distribution. Fastest to provision, no extra AWS costs.",
                      },
                      {
                        value: DeploymentMode.dedicated,
                        title: "Dedicated",
                        note: "Creates a private S3 bucket and a dedicated CloudFront distribution for this project. Served on its own *.cloudfront.net URL (no custom domain). Use when you need isolation, custom origin behaviors, or stricter access boundaries.",
                      },
                    ].map((opt) => {
                      const selected = field.value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={cn(
                            "text-left p-3 rounded-md border transition-colors",
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/40",
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {opt.title}
                            </span>
                            <span
                              className={cn(
                                "h-4 w-4 rounded-full border-2 shrink-0",
                                selected
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground/40",
                              )}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {opt.note}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              />

              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                Build Configuration
              </h3>

              <div className="space-y-2">
                <Label>Framework</Label>
                <Controller
                  name="config.framework"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select framework" /></SelectTrigger>
                      <SelectContent>
                        {Object.values(Framework).map((fw) => (
                          <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Package Manager</Label>
                <Controller
                  name="config.packageManager"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value: PackageManager) => {
                        field.onChange(value);
                        const defaults = packageManagerDefaults[value];
                        form.setValue("config.installCommand", defaults.installCommand);
                        form.setValue("config.buildCommand", defaults.buildCommand);
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select package manager" /></SelectTrigger>
                      <SelectContent>
                        {Object.values(PackageManager).map((pm) => (
                          <SelectItem key={pm} value={pm}>{pm}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="installCommand">Install Command</Label>
                <Input id="installCommand" placeholder="npm install" {...form.register("config.installCommand")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildCommand">Build Command</Label>
                <Input id="buildCommand" placeholder="npm run build" {...form.register("config.buildCommand")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outputDir">Output Directory</Label>
                <Input id="outputDir" placeholder="dist" {...form.register("config.outputDir")} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); form.reset(); }}>
                  Cancel
                </Button>
                <Button type="submit" loading={createProjectMutation.isPending}>
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!showForm && !projectsQuery.isLoading && projects.length === 0 && (
        <div className="p-12 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">
            No projects yet. Create your first project to get started.
          </p>
          <Button variant="outline" onClick={() => setShowForm(true)}>
            Create Project
          </Button>
        </div>
      )}

      {!showForm && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => {
            const projectId = project.SK.replace("METADATA#", "");
            return (
              <Card
                key={projectId}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/projects/${projectId}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">{project.projectName}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{project.projectType}</span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                      <span className="truncate">{project.repoFullName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RepoSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (repo: string) => void;
}) {
  const [search, setSearch] = useState(value);
  const [open, setOpen] = useState(false);
  const reposQuery = useReposSearch(search);
  const repos = reposQuery.data ?? [];

  return (
    <div className="relative">
      <Input
        placeholder="Search repositories..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
          {reposQuery.isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
              <Spinner className="h-3.5 w-3.5" /> Searching...
            </div>
          )}
          {!reposQuery.isLoading && repos.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">No repositories found.</div>
          )}
          {repos.map((repo) => (
            <button
              key={repo.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between gap-2"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(repo.fullName); setSearch(repo.fullName); setOpen(false); }}
            >
              <span className="truncate">{repo.fullName}</span>
              {repo.private && <span className="text-xs text-muted-foreground shrink-0">private</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
