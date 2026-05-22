import { HttpMethod } from "@unfoldr/types/http";
import { UnauthorizedError, NotFoundError } from "@unfoldr/types/errors";
import type { HttpLambdaHandler } from "@unfoldr/types/handler";
import {
  getUserById,
  updateUserProfile,
} from "@unfoldr/aws/dynamo-db/modules/users/main";
import { UsersMeData } from "./types";

export const _handler: HttpLambdaHandler<UsersMeData> = async ({
  event,
  logger,
}) => {
  if (!event.userId) throw new UnauthorizedError("Not authenticated");

  if (event.method === HttpMethod.GET) {
    const user = await getUserById(event.userId, logger);
    if (!user) throw new NotFoundError("Profile not found");
    return user;
  }

  // PATCH — update name + mark profileCompleted
  const updated = await updateUserProfile({
    userId: event.userId,
    name: event.data.name,
    logger,
  });
  return updated;
};
