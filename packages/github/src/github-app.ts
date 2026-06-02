import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

export function createAppOctokit({
  appId,
  privateKey,
}: {
  appId: string;
  privateKey: string;
}) {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
    },
  });
}

export function createInstallationOctokit({
  appId,
  privateKey,
  installationId,
}: {
  appId: string;
  privateKey: string;
  installationId: number;
}) {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  });
}

export async function getInstallationRepos(
  octokit: Octokit,
): Promise<
  Array<{ id: number; name: string; fullName: string; private: boolean }>
> {
  const repos: Array<{
    id: number;
    name: string;
    fullName: string;
    private: boolean;
  }> = [];

  const iterator = octokit.paginate.iterator(
    octokit.rest.apps.listReposAccessibleToInstallation,
    { per_page: 100 },
  );
  console.log("Fetching repos for installation...");
  for await (const { data } of iterator) {
    for (const repo of data) {
      repos.push({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
      });
    }
  }

  return repos;
}

export async function getInstallationInfo(octokit: Octokit) {
  const { data } = await octokit.rest.apps.getAuthenticated();
  if (!data) {
    throw new Error("Failed to get authenticated app info");
  }
  return {
    appName: data.name,
    appUrl: data.html_url,
  };
}

export const getInstallationToken = async ({
  appId,
  privateKey,
  installationId,
}: {
  appId: string;
  privateKey: string;
  installationId: number;
}): Promise<string> => {
  const octokit = createInstallationOctokit({
    appId,
    privateKey,
    installationId,
  });

  /**
   * Generate installation auth token
   */
  const auth = (await octokit.auth({
    type: "installation",
  })) as {
    token: string;
  };

  if (!auth.token) {
    throw new Error("Failed to generate installation token");
  }

  return auth.token;
};
