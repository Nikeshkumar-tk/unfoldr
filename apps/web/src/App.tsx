import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { RedirectIfAuthed } from "./auth/RedirectIfAuthed";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { CompleteProfilePage } from "./pages/CompleteProfilePage";
import { OrganizationsPage } from "./pages/OrganizationsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AppShell } from "./components/AppShell";
import { getOrgName } from "./lib/env";

export function App() {
  useEffect(() => {
    document.title = getOrgName();
  }, []);

  return (
    <Routes>
      <Route
        path="/signin"
        element={
          <RedirectIfAuthed>
            <SignInPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/signup"
        element={
          <RedirectIfAuthed>
            <SignUpPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/reset-password"
        element={
          <RedirectIfAuthed>
            <ResetPasswordPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/verify-email"
        element={
          <RedirectIfAuthed>
            <VerifyEmailPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/complete-profile"
        element={
          <RequireAuth allowIncompleteProfile>
            <CompleteProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/organizations"
        element={
          <RequireAuth>
            <OrganizationsPage />
          </RequireAuth>
        }
      />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/projects"
          element={
            <PlaceholderPage
              title="Projects"
              description="Deploy and manage your projects."
            />
          }
        />
        <Route
          path="/deployments"
          element={
            <PlaceholderPage
              title="Deployments"
              description="View deployment history and status."
            />
          }
        />
        <Route
          path="/team"
          element={
            <PlaceholderPage
              title="Team"
              description="Manage your organization members."
            />
          }
        />
        <Route
          path="/settings"
          element={
            <PlaceholderPage
              title="Settings"
              description="Configure your organization settings."
            />
          }
        />
        <Route
          path="/organization"
          element={
            <PlaceholderPage
              title="Organization"
              description="Manage your organization details."
            />
          }
        />
        <Route
          path="/activity"
          element={
            <PlaceholderPage
              title="Activity"
              description="View your organization's activity log."
            />
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/organizations" replace />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      <div className="mt-8 p-12 rounded-lg border border-dashed border-border flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}
