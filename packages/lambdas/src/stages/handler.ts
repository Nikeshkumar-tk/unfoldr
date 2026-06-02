import { HttpMethod } from "@unfoldr/types/http";
import { HttpError, NotFoundError } from "@unfoldr/types/errors";
import type { HttpLambdaHandler } from "@unfoldr/types/handler";
import { createStage, queryStagesByProject } from "@unfoldr/aws/dynamo-db/modules/stages";
import { getUserById } from "@unfoldr/aws/dynamo-db/modules/users";
import type { StagesData } from "./types";

export const _handler: HttpLambdaHandler<StagesData> = async ({
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

    const stages = await queryStagesByProject({ logger, projectId });
    return { stages };
  }

  const { action, data } = event.data;

  if (action === "CREATE_STAGE") {
    const user = await getUserById(userId, logger);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const stage = await createStage({
      logger,
      projectId: data.projectId,
      orgId: data.orgId,
      name: data.name,
      branch: data.branch,
      environmentVariables: data.environmentVariables,
      user: { id: user.userId, name: user.name, email: user.email },
    });

    return { stage };
  }

  throw new HttpError(400, `Unknown action: ${action}`);
};
