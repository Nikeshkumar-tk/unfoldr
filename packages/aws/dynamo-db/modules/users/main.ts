import { Logger } from "@unfoldr/logger";
import { getDdbItem, putDdbItem, queryDdbItems, updateItem } from "../../client";
import { userKeys } from "./keys";
import { User, UserStatus } from "./types";
import { buildInitialsAvatarUrl } from "../../../avatar";

export const createUser = async ({
  userId,
  email,
  name,
  profileCompleted = false,
  logger,
}: {
  logger: Logger;
  userId: string;
  email: string;
  name: string;
  profileCompleted?: boolean;
}) => {
  const existingUser = await getUserByEmail(email, logger);

  if (existingUser) {
    throw new Error("User already exists");
  }

  const userItem: User = {
    PK: userKeys.PK(userId),
    SK: userKeys.SK(),
    GSI1PK: userKeys.GSI1PK(email),
    GSI1SK: userKeys.GSI1SK(),
    email,
    userId,
    name,
    sub: userId,
    status: UserStatus.ACTIVE,
    createdAt: Date.now(),
    profileCompleted,
    avatarUrl: buildInitialsAvatarUrl(name || email),
  };

  await putDdbItem({ item: userItem, logger });
  return userItem;
};

export const getUserByEmail = async (email: string, logger: Logger) => {
  const result = await queryDdbItems<User>({
    query: {
      KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk",
      ExpressionAttributeValues: {
        ":gsi1pk": userKeys.GSI1PK(email),
        ":gsi1sk": userKeys.GSI1SK(),
      },
      IndexName: "GSI1",
    },
    logger,
  });
  return result.length > 0 ? result[0] : null;
};

export const getUserById = async (userId: string, logger: Logger) => {
  return getDdbItem<User>({
    pk: userKeys.PK(userId),
    sk: userKeys.SK(),
    logger,
  });
};

export const updateUserProfile = async ({
  userId,
  name,
  logger,
}: {
  userId: string;
  name: string;
  logger: Logger;
}) => {
  await updateItem({
    pk: userKeys.PK(userId),
    sk: userKeys.SK(),
    attributesToUpdate: {
      name,
      profileCompleted: true,
      avatarUrl: buildInitialsAvatarUrl(name),
    },
    logger,
  });
  return getUserById(userId, logger);
};
