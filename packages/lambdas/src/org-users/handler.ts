import { HttpMethod } from "@unfoldr/types/http";
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "@unfoldr/types/errors";
import type { HttpLambdaHandler } from "@unfoldr/types/handler";
import { createCognitoUserAsAdmin } from "@unfoldr/aws/cognito/main";
import {
  listUsersInOrg,
} from "@unfoldr/aws/dynamo-db/modules/org-users/main";
import { orgUserKeys } from "@unfoldr/aws/dynamo-db/modules/org-users/keys";
import { OrgRole } from "@unfoldr/aws/dynamo-db/modules/org-users/types";
import { getDdbItem } from "@unfoldr/aws/dynamo-db/client";
import type { OrgUser } from "@unfoldr/aws/dynamo-db/modules/org-users/types";
import { OrgUsersData } from "./types";

const PRIVILEGED_ROLES = new Set<OrgRole>([OrgRole.OWNER, OrgRole.ADMIN]);

async function getMembership(orgId: string, userId: string, logger: any) {
  return getDdbItem<OrgUser>({
    pk: orgUserKeys.PK(orgId),
    sk: orgUserKeys.SK(userId),
    logger,
  });
}

export const _handler: HttpLambdaHandler<OrgUsersData> = async ({
  event,
  logger,
}) => {
  if (!event.userId) throw new UnauthorizedError("Not authenticated");

  const orgId = event.pathParameters?.orgId;
  if (!orgId) throw new BadRequestError("Missing orgId in path");

  // Authorization: caller must be a member of the org.
  const callerMembership = await getMembership(orgId, event.userId, logger);
  if (!callerMembership)
    throw new ForbiddenError("You are not a member of this organization");

  if (event.method === HttpMethod.GET) {
    const members = await listUsersInOrg(orgId, logger);
    return {
      members: members.map((m) => ({
        userId: m.userId,
        email: m.userEmail,
        name: m.userName,
        avatarUrl: m.userAvatarUrl,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    };
  }

  // POST — invite. Only OWNER / ADMIN can invite.
  if (!PRIVILEGED_ROLES.has(callerMembership.role)) {
    throw new ForbiddenError("Only owners and admins can invite users");
  }

  const result = await createCognitoUserAsAdmin({
    email: event.data.email,
    name: event.data.name,
    orgId,
    role: event.data.role,
    logger,
  });

  return {
    invited: {
      userId: result.user.userId,
      email: result.user.email,
      name: result.user.name,
      avatarUrl: result.user.avatarUrl,
      role: result.role,
    },
  };
};
