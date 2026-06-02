import { HttpMethod } from "@unfoldr/types/http";
import { HttpError, NotFoundError, ForbiddenError } from "@unfoldr/types/errors";
import type { HttpLambdaHandler } from "@unfoldr/types/handler";
import { searchRepos } from "@unfoldr/github/src/repos";
import { getOrgById } from "@unfoldr/aws/dynamo-db/modules/organizations";
import { isOrgMember } from "@unfoldr/github/src/org-connection";

type ReposData = {
  [HttpMethod.GET]: unknown;
};

export const _handler: HttpLambdaHandler<ReposData> = async ({
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
    throw new NotFoundError("Organization not found");
  }

  const member = await isOrgMember({ orgId, userId, logger });
  if (!member) {
    throw new ForbiddenError("You are not a member of this organization");
  }

  const search = event.queryStringParameters?.search ?? "";

  const repos = await searchRepos({ orgId, search, logger });

  return { repos };
};
