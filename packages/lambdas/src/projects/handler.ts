import { HttpMethod } from "@unfoldr/types/http";
import { HttpError, NotFoundError, ForbiddenError } from "@unfoldr/types/errors";
import type { HttpLambdaHandler } from "@unfoldr/types/handler";
import {
  createProject,
  updateProject,
  deleteProject,
  queryProjectsByOrg,
} from "@unfoldr/aws/dynamo-db/modules/projects";
import { getOrgById } from "@unfoldr/aws/dynamo-db/modules/organizations";
import { listUsersInOrg } from "@unfoldr/aws/dynamo-db/modules/org-users";
import { getUserById } from "@unfoldr/aws/dynamo-db/modules/users";
import type { ProjectsData } from "./types";

export const _handler: HttpLambdaHandler<ProjectsData> = async ({
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

  const members = await listUsersInOrg(orgId, logger);
  const isMember = members.some((m) => m.userId === userId);
  if (!isMember) {
    throw new ForbiddenError("You are not a member of this organization");
  }

  if (event.method === HttpMethod.GET) {
    const projects = await queryProjectsByOrg({ orgId, logger });
    return { projects };
  }

  const { action, data } = event.data;

  if (action === "CREATE_PROJECT") {
    const user = await getUserById(userId, logger);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const project = await createProject({
      logger,
      orgId,
      user: { id: user.userId, name: user.name, email: user.email },
      projectType: data.projectType,
      projectName: data.projectName,
      repoFullName: data.repoFullName,
      config: data.config,
    });

    return { project };
  }

  if (action === "UPDATE_PROJECT") {
    const user = await getUserById(userId, logger);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const project = await updateProject({
      logger,
      orgId,
      projectId: data.projectId,
      user: { id: user.userId, name: user.name, email: user.email },
      projectName: data.projectName,
      repoFullName: data.repoFullName,
      config: data.config,
    });

    return { project };
  }

  if (action === "DELETE_PROJECT") {
    await deleteProject({
      logger,
      orgId,
      projectId: data.projectId,
    });

    return { deleted: true };
  }

  throw new HttpError(400, `Unknown action: ${action}`);
};
