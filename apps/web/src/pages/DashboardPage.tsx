import { useOrgStore } from "../stores/orgStore";
import { Card, CardContent } from "../components/ui/card";

const stats = [
  {
    label: "Projects",
    value: "—",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    label: "Deployments",
    value: "—",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    label: "Team Members",
    value: "—",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    label: "Success Rate",
    value: "—",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
];

const activities = [
  {
    text: "Welcome to your dashboard! This is where you'll see deployment activity, project updates, and team events.",
    time: "Just now",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    text: "No projects yet. Head over to the Projects page to deploy your first application.",
    time: "Just now",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
];

export function DashboardPage() {
  const selectedOrg = useOrgStore((s) => s.selectedOrg);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {selectedOrg ? selectedOrg.name : "Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedOrg
            ? `Overview of your organization's activity.`
            : "Select an organization to get started."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${stat.bgColor}`}>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold tracking-tight mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {activities.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0 mt-0.5">
                  <span className="text-muted-foreground">{item.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm">{item.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold tracking-tight mb-2">Quick Start</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Get your first project deployed in minutes.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground shrink-0">
                  1
                </span>
                <span className="text-muted-foreground">Connect your GitHub repository</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground shrink-0">
                  2
                </span>
                <span className="text-muted-foreground">Configure build settings</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground shrink-0">
                  3
                </span>
                <span className="text-muted-foreground">Deploy to production</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold tracking-tight mb-2">Organization Info</h2>
            {selectedOrg ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span>{selectedOrg.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <span>{selectedOrg.role.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span>
                    {new Date(selectedOrg.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No organization selected. Go to the organizations page to pick one.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
