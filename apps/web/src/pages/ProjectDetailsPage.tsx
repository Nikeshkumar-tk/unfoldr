import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useProjectsQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from "../queries/projects";
import {
  createProjectSchema,
  ProjectType,
  Framework,
  PackageManager,
} from "../schemas/project";
import type { CreateProjectValues } from "../schemas/project";
import { useStagesQuery, useCreateStageMutation } from "../queries/stages";
import { useDeploymentsQuery, useCreateDeploymentMutation } from "../queries/deployments";
import type { DeploymentStatus } from "../queries/deployments";
import {
  createDeploymentFormSchema,
  type CreateDeploymentFormValues,
} from "../schemas/deployment";
import {
  createStageFormSchema,
  type CreateStageFormValues,
} from "../schemas/stage";
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
import { cn } from "../lib/cn";

const statusConfig: Record<
  DeploymentStatus,
  { color: string; border: string; badge: string }
> = {
  PENDING: {
    color: "text-amber-600 dark:text-amber-400",
    border: "border-l-amber-400",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  IN_PROGRESS: {
    color: "text-blue-600 dark:text-blue-400",
    border: "border-l-blue-400",
    badge:
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  COMPLETED: {
    color: "text-green-600 dark:text-green-400",
    border: "border-l-green-400",
    badge:
      "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  },
  FAILED: {
    color: "text-red-600 dark:text-red-400",
    border: "border-l-red-400",
    badge: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
};

function formatDuration(startedAt: number, endedAt: number): string {
  const ms = endedAt - startedAt;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [showStageDialog, setShowStageDialog] = useState(false);

  const projectsQuery = useProjectsQuery();
  const stagesQuery = useStagesQuery(projectId ?? "");
  const deploymentsQuery = useDeploymentsQuery(projectId ?? "");
  const createDeploymentMutation = useCreateDeploymentMutation();
  const createStageMutation = useCreateStageMutation();

  const updateProjectMutation = useUpdateProjectMutation();
  const deleteProjectMutation = useDeleteProjectMutation();
  const [editingProject, setEditingProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const deployForm = useForm<CreateDeploymentFormValues>({
    resolver: zodResolver(createDeploymentFormSchema),
    defaultValues: { stageId: "", stageName: "" },
  });

  const stageForm = useForm<CreateStageFormValues>({
    resolver: zodResolver(createStageFormSchema),
    defaultValues: {
      name: "",
      branch: "",
      environmentVariables: [],
    },
  });

  const editForm = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: stageForm.control,
    name: "environmentVariables",
  });

  const project = projectsQuery.data?.find(
    (p) => p.SK.replace("METADATA#", "") === projectId,
  );

  const stages = stagesQuery.data ?? [];
  const hasStages = stages.length > 0;

  const onDeploySubmit = (values: CreateDeploymentFormValues) => {
    if (!project) return;
    createDeploymentMutation.mutate(
      { projectId: projectId!, stageId: values.stageId, stageName: values.stageName },
      {
        onSuccess: () => {
          setShowDeployDialog(false);
          deployForm.reset();
        },
      },
    );
  };

  const onStageSubmit = (values: CreateStageFormValues) => {
    if (!project) return;
    const envVars: Record<string, string> = {};
    for (const { key, value } of values.environmentVariables) {
      if (key) envVars[key] = value;
    }

    createStageMutation.mutate(
      {
        projectId: projectId!,
        name: values.name,
        branch: values.branch,
        environmentVariables:
          Object.keys(envVars).length > 0 ? envVars : undefined,
      },
      {
        onSuccess: () => {
          setShowStageDialog(false);
          stageForm.reset();
        },
      },
    );
  };

  const openEdit = () => {
    if (!project) return;
    editForm.reset({
      projectName: project.projectName,
      projectType: ProjectType.ReactApp,
      repoFullName: project.repoFullName,
      config: {
        framework: project.config.framework as Framework,
        packageManager: project.config.packageManager as PackageManager,
        installCommand: project.config.installCommand,
        buildCommand: project.config.buildCommand,
        outputDir: project.config.outputDir,
      },
    });
    setEditingProject(true);
  };

  const onEditSubmit = (values: CreateProjectValues) => {
    if (!project) return;
    updateProjectMutation.mutate(
      {
        projectId: projectId!,
        projectName: values.projectName,
        repoFullName: values.repoFullName,
        config: values.config,
      },
      {
        onSuccess: () => {
          setEditingProject(false);
          editForm.reset();
        },
      },
    );
  };

  const onDeleteConfirm = () => {
    if (!project) return;
    deleteProjectMutation.mutate(projectId!, {
      onSuccess: () => navigate("/projects"),
    });
  };

  if (projectsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-6 w-6" />
        {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => { setEditingProject(false); editForm.reset(); }} />
          <div className="relative z-50 w-full max-w-lg mx-4 bg-card border border-border rounded-lg shadow-xl max-h-[85vh] flex flex-col">
            <div className="p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold tracking-tight mb-1">Edit Project</h3>
              <p className="text-sm text-muted-foreground mb-6">Update {project?.projectName}.</p>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input {...editForm.register("projectName")} />
                </div>
                <div className="space-y-2">
                  <Label>GitHub Repository</Label>
                  <Input {...editForm.register("repoFullName")} />
                </div>
                <div className="space-y-2">
                  <Label>Framework</Label>
                  <Controller name="config.framework" control={editForm.control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.values(Framework).map((fw) => <SelectItem key={fw} value={fw}>{fw}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <Label>Package Manager</Label>
                  <Controller name="config.packageManager" control={editForm.control} render={({ field }) => (
                    <Select value={field.value} onValueChange={(value: PackageManager) => {
                      field.onChange(value);
                      const defaults: Record<PackageManager, { installCommand: string; buildCommand: string }> = {
                        [PackageManager.npm]: { installCommand: "npm install", buildCommand: "npm run build" },
                        [PackageManager.yarn]: { installCommand: "yarn install", buildCommand: "yarn build" },
                        [PackageManager.pnpm]: { installCommand: "pnpm install", buildCommand: "pnpm build" },
                      };
                      editForm.setValue("config.installCommand", defaults[value].installCommand);
                      editForm.setValue("config.buildCommand", defaults[value].buildCommand);
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.values(PackageManager).map((pm) => <SelectItem key={pm} value={pm}>{pm}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <Label>Install Command</Label>
                  <Input {...editForm.register("config.installCommand")} />
                </div>
                <div className="space-y-2">
                  <Label>Build Command</Label>
                  <Input {...editForm.register("config.buildCommand")} />
                </div>
                <div className="space-y-2">
                  <Label>Output Directory</Label>
                  <Input {...editForm.register("config.outputDir")} />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setEditingProject(false); editForm.reset(); }}>Cancel</Button>
                  <Button type="submit" loading={updateProjectMutation.isPending}>{updateProjectMutation.isPending ? "Saving..." : "Save Changes"}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setDeletingProject(false)} />
          <div className="relative z-50 w-full max-w-md mx-4 bg-card border border-border rounded-lg shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 dark:bg-red-950">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">Delete Project</h3>
                  <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm mb-6">Are you sure you want to delete <strong>{project?.projectName}</strong>? All associated deployments, stages, and data will be permanently removed.</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeletingProject(false)}>Cancel</Button>
                <Button variant="destructive" loading={deleteProjectMutation.isPending} onClick={onDeleteConfirm}>{deleteProjectMutation.isPending ? "Deleting..." : "Delete"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <button
          onClick={() => navigate("/projects")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Projects
        </button>
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">
              Project not found.
            </p>
            <Button variant="outline" onClick={() => navigate("/projects")}>
              View all projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deployments = deploymentsQuery.data ?? [];
  const lastDeployment = project.lastDeploymentDetails;
  const deployedUrl = project.deploymentInfo?.[0]?.cloudfrontUrl;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/projects")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Projects
        </button>
        <nav className="text-sm text-muted-foreground">
          <span
            className="hover:text-foreground cursor-pointer transition-colors"
            onClick={() => navigate("/projects")}
          >
            Projects
          </span>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">
            {project.projectName}
          </span>
        </nav>
      </div>

      {/* Project Details Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {project.projectName}
              </h1>
              {deployedUrl && (
                <a
                  href={deployedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-1 text-sm font-medium text-primary hover:underline"
                >
                  {deployedUrl}
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </a>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <svg
                    className="h-3.5 w-3.5 shrink-0"
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
                  <span className="truncate max-w-[260px]">
                    {project.repoFullName}
                  </span>
                </div>
                <span>·</span>
                <span>Created {formatDate(project.createdAt)}</span>
                <span>·</span>
                <span className="capitalize">{project.config.framework}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="px-1.5 py-0.5 rounded bg-muted">
                  {project.config.packageManager}
                </span>
                <span className="text-muted-foreground">:</span>
                <span className="bg-muted px-1.5 py-0.5 rounded font-mono">
                  {project.config.installCommand}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="bg-muted px-1.5 py-0.5 rounded font-mono">
                  {project.config.buildCommand}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="bg-muted px-1.5 py-0.5 rounded font-mono">
                  {project.config.outputDir}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex gap-1">
                <button
                  onClick={openEdit}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit project"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeletingProject(true)}
                  className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950 text-muted-foreground hover:text-red-600 transition-colors"
                  title="Delete project"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                {project.projectType}
              </span>
            </div>
          </div>

          {lastDeployment && (
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Last deploy
              </span>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  statusConfig[lastDeployment.status].badge,
                )}
              >
                {lastDeployment.status}
              </span>
              <span className="text-sm text-muted-foreground">
                on {lastDeployment.stage.stageName}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatDate(lastDeployment.createdAt)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stages */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Stages</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Define deployment stages with environment-specific variables.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowStageDialog(true)}>
            Create Stage
          </Button>
        </div>

        {stagesQuery.isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-5 w-5" />
          </div>
        )}

        {stagesQuery.isError && (
          <Alert variant="destructive">
            <AlertDescription>Failed to load stages.</AlertDescription>
          </Alert>
        )}

        {!stagesQuery.isLoading && stages.length === 0 && (
          <Card>
            <CardContent className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                No stages configured yet. Create a stage to start deploying.
              </p>
              <Button variant="outline" onClick={() => setShowStageDialog(true)}>
                Create Stage
              </Button>
            </CardContent>
          </Card>
        )}

        {stages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stages.map((stage) => {
              const envVarCount = Object.keys(stage.environmentVariables).length;
              return (
                <Card key={stage.stageId}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                        <svg
                          className="h-3.5 w-3.5 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                          />
                        </svg>
                      </div>
                      <span className="font-medium text-sm">
                        {stage.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stage.branch}
                      {envVarCount > 0 ? ` · ${envVarCount} env variable${envVarCount !== 1 ? "s" : ""}` : ""}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Deployments */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Deployments
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trigger and track deployments for this project.
            </p>
          </div>
          {hasStages ? (
            <Button size="sm" onClick={() => setShowDeployDialog(true)}>
              New Deploy
            </Button>
          ) : (
            <Button size="sm" disabled title="Create a stage first">
              New Deploy
            </Button>
          )}
        </div>

        {deploymentsQuery.isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-5 w-5" />
          </div>
        )}

        {deploymentsQuery.isError && (
          <Alert variant="destructive">
            <AlertDescription>Failed to load deployments.</AlertDescription>
          </Alert>
        )}

        {!deploymentsQuery.isLoading && deployments.length === 0 && (
          <Card>
            <CardContent className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                No deployments yet. Trigger your first deployment to see it
                here.
              </p>
              <Button
                variant="outline"
                onClick={() => setShowDeployDialog(true)}
                disabled={!hasStages}
                title={!hasStages ? "Create a stage first" : undefined}
              >
                Create Deployment
              </Button>
            </CardContent>
          </Card>
        )}

        {deployments.length > 0 && (
          <div className="space-y-3">
            {[...deployments]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((deployment) => {
                const cfg = statusConfig[deployment.status];
                const startedAt = deployment.startedAt;
                const endedAt = deployment.endedAt;

                let duration: string | null = null;
                if (startedAt) {
                  if (endedAt) {
                    duration = formatDuration(startedAt, endedAt);
                  } else {
                    const elapsed = formatDuration(
                      startedAt,
                      Date.now(),
                    );
                    duration = `${elapsed} (in progress)`;
                  }
                }

                return (
                  <Card
                    key={deployment.deploymentId}
                    className={cn("overflow-hidden border-l-4", cfg.border)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                cfg.badge,
                              )}
                            >
                              {deployment.status
                                .replace("_", " ")
                                .toLowerCase()
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {deployment.stage.stageName}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(deployment.createdAt)}
                            {" by "}
                            {deployment.createdBy.name}
                          </p>
                          {duration && (
                            <p className="text-xs text-muted-foreground">
                              {deployment.status === "IN_PROGRESS"
                                ? "Running for "
                                : "Took "}
                              {duration}
                            </p>
                          )}
                        </div>
                        <span className={cn("text-xs shrink-0", cfg.color)}>
                          {deployment.status === "COMPLETED" && (
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                          {deployment.status === "FAILED" && (
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                              />
                            </svg>
                          )}
                          {deployment.status === "IN_PROGRESS" && (
                            <Spinner className="h-4 w-4" />
                          )}
                          {deployment.status === "PENDING" && (
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </section>

      {/* Create Deployment Dialog */}
      {showDeployDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => {
              setShowDeployDialog(false);
              deployForm.reset();
            }}
          />
          <div className="relative z-50 w-full max-w-md mx-4 bg-card border border-border rounded-lg shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold tracking-tight mb-1">
                Create New Deployment
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Deploy {project.projectName} to a stage.
              </p>

              <form
                onSubmit={deployForm.handleSubmit(onDeploySubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage</Label>
                  <Controller
                    name="stageId"
                    control={deployForm.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(stageId) => {
                          const selectedStage = stages.find(
                            (s) => s.stageId === stageId,
                          );
                          field.onChange(stageId);
                          deployForm.setValue(
                            "stageName",
                            selectedStage?.name ?? "",
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.map((stage) => (
                            <SelectItem key={stage.stageId} value={stage.stageId}>
                              {stage.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {deployForm.formState.errors.stageId && (
                    <p className="text-sm text-destructive">
                      {deployForm.formState.errors.stageId.message}
                    </p>
                  )}
                </div>

                {createDeploymentMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {createDeploymentMutation.error instanceof Error
                        ? createDeploymentMutation.error.message
                        : "Failed to create deployment."}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDeployDialog(false);
                      deployForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={createDeploymentMutation.isPending}
                  >
                    {createDeploymentMutation.isPending
                      ? "Deploying..."
                      : "Deploy"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Stage Dialog */}
      {showStageDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => {
              setShowStageDialog(false);
              stageForm.reset();
            }}
          />
          <div className="relative z-50 w-full max-w-lg mx-4 bg-card border border-border rounded-lg shadow-xl max-h-[85vh] flex flex-col">
            <div className="p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold tracking-tight mb-1">
                Create Stage
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Define a deployment stage with its own environment variables.
              </p>

              <form
                onSubmit={stageForm.handleSubmit(onStageSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="stageName">Stage Name</Label>
                  <Input
                    id="stageName"
                    placeholder="e.g. production"
                    {...stageForm.register("name")}
                  />
                  {stageForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {stageForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    placeholder="e.g. main"
                    {...stageForm.register("branch")}
                  />
                  {stageForm.formState.errors.branch && (
                    <p className="text-sm text-destructive">
                      {stageForm.formState.errors.branch.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Environment Variables</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ key: "", value: "" })}
                    >
                      Add Variable
                    </Button>
                  </div>
                  {fields.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No environment variables defined.
                    </p>
                  )}
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          placeholder="KEY"
                          {...stageForm.register(
                            `environmentVariables.${index}.key`,
                          )}
                        />
                        {stageForm.formState.errors.environmentVariables?.[
                          index
                        ]?.key && (
                          <p className="text-sm text-destructive mt-1">
                            {
                              stageForm.formState.errors.environmentVariables[
                                index
                              ].key.message
                            }
                          </p>
                        )}
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="VALUE"
                          {...stageForm.register(
                            `environmentVariables.${index}.value`,
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 mt-0.5"
                        onClick={() => remove(index)}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>

                {createStageMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {createStageMutation.error instanceof Error
                        ? createStageMutation.error.message
                        : "Failed to create stage."}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowStageDialog(false);
                      stageForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={createStageMutation.isPending}
                  >
                    {createStageMutation.isPending
                      ? "Creating..."
                      : "Create Stage"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
