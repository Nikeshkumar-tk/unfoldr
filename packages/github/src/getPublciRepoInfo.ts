import { Octokit } from "@octokit/rest";

const octokit = new Octokit();

export async function getRepoInfo() {
  const res = await octokit.repos.get({
    owner: "facebook",
    repo: "react",
  });
  return res.data;
}
