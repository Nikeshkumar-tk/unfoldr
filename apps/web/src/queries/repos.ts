import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useOrgStore } from "../stores/orgStore";

export interface RepoResult {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
}

export const reposKeys = {
  search: (orgId: string, search: string) =>
    ["repos", orgId, search] as const,
};

export function useReposSearch(search: string) {
  const orgId = useOrgStore((s) => s.selectedOrg?.orgId);
  const [debounced, setDebounced] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 200);
    return () => clearTimeout(timer);
  }, [search]);

  return useQuery({
    queryKey: orgId ? reposKeys.search(orgId, debounced) : ["repos"],
    queryFn: async () => {
      if (!orgId) return [] as RepoResult[];
      const params = new URLSearchParams();
      if (debounced) params.set("search", debounced);
      const qs = params.toString();
      const res = await api<{ repos: RepoResult[] }>(
        "GET",
        `/orgs/${orgId}/repos${qs ? `?${qs}` : ""}`,
      );
      return res.repos;
    },
    enabled: !!orgId,
  });
}
