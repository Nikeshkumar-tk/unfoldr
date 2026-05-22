import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface OrgMembership {
  orgId: string;
  name: string;
  avatarUrl: string;
  role: string;
  joinedAt: number;
}

export const orgsKeys = {
  list: ["orgs"] as const,
};

export function useOrgsQuery() {
  return useQuery({
    queryKey: orgsKeys.list,
    queryFn: async () => {
      const res = await api<{ organizations: OrgMembership[] }>("GET", "/orgs");
      return res.organizations;
    },
  });
}

export function useCreateOrgMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string }) =>
      api<{ orgId: string; name: string; avatarUrl: string; role: string }>(
        "POST",
        "/orgs",
        { json: input },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgsKeys.list });
    },
  });
}
