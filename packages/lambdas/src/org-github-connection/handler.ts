import type { HttpLambdaHandler } from "@unfoldr/types/handler";
import { HttpMethod } from "@unfoldr/types/http";
import {
  getOrgGithubConnection,
  deleteOrgGithubConnection,
  isOrgMember,
} from "@unfoldr/github/src/org-connection";
import { getOrgById } from "@unfoldr/aws/dynamo-db/modules/organizations/main";
import { HttpError } from "@unfoldr/types/errors";

type ConnectionData = {
  [HttpMethod.GET]: never;
  [HttpMethod.DELETE]: never;
};

export const _handler: HttpLambdaHandler<ConnectionData> = async ({
  event,
  logger,
}) => {
  const orgId = event.pathParameters?.orgId;
  if (!orgId) {
    throw new HttpError(400, "Missing orgId path parameter");
  }

  const userId = event.userId;
  if (!userId) {
    throw new HttpError(401, "Authentication required");
  }

  const org = await getOrgById(orgId, logger);
  if (!org) {
    throw new HttpError(404, "Organization not found");
  }

  const member = await isOrgMember({ orgId, userId, logger });
  if (!member) {
    throw new HttpError(403, "You are not a member of this organization");
  }

  if (event.method === HttpMethod.DELETE) {
    await deleteOrgGithubConnection({ orgId, logger });
    return { connected: false };
  }

  return getOrgGithubConnection({ orgId, logger });
};
