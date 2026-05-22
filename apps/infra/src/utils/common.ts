import { CONFIGS } from "../config";

export const createResourceName = ({ name }: { name: string }) => {
  const stage = CONFIGS.STAGE || "dev";
  return `unfoldr-${name}-${stage}`;
};
