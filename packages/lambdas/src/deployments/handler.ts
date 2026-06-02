import { HttpMethod } from "@unfoldr/types/http";
import { HttpError, NotFoundError } from "@unfoldr/types/errors";
import type { HttpLambdaHandler } from "@unfoldr/types/handler";
import { createDeployment, queryDeploymentsByProject } from "@unfoldr/aws/dynamo-db/modules/deployments";
import { getUserById } from "@unfoldr/aws/dynamo-db/modules/users";
import type { DeploymentsData } from "./types";

export const _handler: HttpLambdaHandler<DeploymentsData> = async ({
  event,
  logger,
}) => {
  const userId = event.userId;
  if (!userId) {
    throw new HttpError(401, "Authentication required");
  }

  if (event.method === HttpMethod.GET) {
    const projectId = event.queryStringParameters?.projectId;
    if (!projectId) {
      throw new HttpError(400, "projectId query parameter is required");
    }

    const deployments = await queryDeploymentsByProject({ logger, projectId });
    return { deployments };
  }

  const { action, data } = event.data;

  if (action === "CREATE_DEPLOYMENT") {
    const user = await getUserById(userId, logger);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const deployment = await createDeployment({
      logger,
      projectId: data.projectId,
      orgId: data.orgId,
      stageId: data.stageId,
      stageName: data.stageName,
      user: { id: user.userId, name: user.name, email: user.email },
    });

    return { deployment };
  }

  throw new HttpError(400, `Unknown action: ${action}`);
};
