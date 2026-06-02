import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrgMembership } from "../queries/orgs";

interface OrgState {
  selectedOrg: OrgMembership | null;
  setSelectedOrg: (org: OrgMembership) => void;
  clearSelectedOrg: () => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set) => ({
      selectedOrg: null,
      setSelectedOrg: (org) => set({ selectedOrg: org }),
      clearSelectedOrg: () => set({ selectedOrg: null }),
    }),
    {
      name: "unfoldr-selected-org",
    },
  ),
);
