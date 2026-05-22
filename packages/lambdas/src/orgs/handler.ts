import { HttpMethod } from "@unfoldr/types/http";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@unfoldr/types/errors";
import type { HttpLambdaHandler } from "@unfoldr/types/handler";
import {
  createOrganization,
  OrgNameTakenError,
} from "@unfoldr/aws/dynamo-db/modules/organizations/main";
import {
  createOrgUser,
  listOrgsForUser,
} from "@unfoldr/aws/dynamo-db/modules/org-users/main";
import { OrgRole } from "@unfoldr/aws/dynamo-db/modules/org-users/types";
import { getUserById } from "@unfoldr/aws/dynamo-db/modules/users/main";
import { OrgsData } from "./types";

export const _handler: HttpLambdaHandler<OrgsData> = async ({
  event,
  logger,
}) => {
  if (!event.userId) throw new UnauthorizedError("Not authenticated");

  if (event.method === HttpMethod.GET) {
    // List orgs the caller is a member of (via GSI1 on OrgUser).
    const memberships = await listOrgsForUser(event.userId, logger);
    return {
      organizations: memberships.map((m) => ({
        orgId: m.orgId,
        name: m.orgName,
        avatarUrl: m.orgAvatarUrl,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    };
  }

  // POST — create a new org, with the caller as OWNER.
  const me = await getUserById(event.userId, logger);
  if (!me) throw new NotFoundError("Profile not found");

  try {
    const org = await createOrganization({
      name: event.data.name,
      createdBy: event.userId,
      logger,
    });
    await createOrgUser({
      orgId: org.orgId,
      userId: event.userId,
      role: OrgRole.OWNER,
      orgName: org.name,
      orgAvatarUrl: org.avatarUrl,
      userEmail: me.email,
      userName: me.name,
      userAvatarUrl: me.avatarUrl,
      logger,
    });
    return {
      orgId: org.orgId,
      name: org.name,
      avatarUrl: org.avatarUrl,
      role: OrgRole.OWNER,
    };
  } catch (err) {
    if (err instanceof OrgNameTakenError) {
      throw new ConflictError(err.message);
    }
    throw err;
  }
};
