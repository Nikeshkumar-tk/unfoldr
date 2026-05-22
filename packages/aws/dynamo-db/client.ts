import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  PutCommandOutput,
  QueryCommand,
  QueryCommandInput,
  UpdateCommand,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { Logger } from "@unfoldr/logger";
import { GetItem, PutItem } from "./types";
import {
  BatchWriteCommand,
  BatchWriteCommandOutput,
} from "@aws-sdk/lib-dynamodb";

let dynamoDbClient: DynamoDBClient;

const DYNAMO_DB_TABLE_NAME = process.env.DYNAMO_DB_TABLE_NAME;

//@ts-ignore
if (!dynamoDbClient) {
  dynamoDbClient = new DynamoDBClient({
    region: process.env.REGION || "us-east-1",
  });
}

export const dynamoDbDocumentClient = DynamoDBDocumentClient.from(
  dynamoDbClient,
  {
    marshallOptions: {
      removeUndefinedValues: true,
      convertEmptyValues: true,
      convertClassInstanceToMap: true,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  },
);

/**
 * Retrieves an item from DynamoDB using the provided primary key and sort key.
 *
 * @template T - The type of the item to be retrieved
 * @param {Object} params - The parameters for the operation
 * @param {string} params.pk - The partition key of the item
 * @param {string} params.sk - The sort key of the item
 * @param {string} [params.tableName] - Optional table name. If not provided, falls back to environment variable
 * @param {Object} params.logger - Logger object with info method
 * @returns {Promise<T | undefined>} The retrieved item cast to type T, or undefined if not found
 *
 * @example
 * const user = await getDdbItem<User>({
 *   pk: 'USER#123',
 *   sk: 'PROFILE',
 *   logger: console,
 * });
 */
export const getDdbItem = async <T>({
  pk,
  sk,
  tableName,
  logger,
}: GetItem): Promise<T | undefined> => {
  logger.info("Retrieving item from DynamoDB", { pk, sk });

  const command = new GetCommand({
    TableName: tableName || DYNAMO_DB_TABLE_NAME,
    Key: {
      PK: pk,
      SK: sk,
    },
  });

  const result = await dynamoDbDocumentClient.send(command);

  if (!result) {
    return undefined;
  }

  logger.info("Item retrieved from DynamoDB", { item: result.Item });

  return result.Item as T;
};

/**
 * Puts an item into DynamoDB.
 *
 * @param {Object} options - The options object.
 * @param {Record<string, any>} options.item - The item to put into DynamoDB.
 * @param {string} [options.tableName] - The name of the DynamoDB table. Falls back to DYNAMO_DB_TABLE_NAME environment variable if not provided.
 * @param {Object} options.logger - Logger for recording operation details.
 * @param {Object} [options.options] - Additional options for the operation.
 * @param {Object} [options.options.uniqueId] - Configuration for generating a unique ID.
 * @param {string} [options.options.uniqueId.field] - The field name to which the generated unique ID will be assigned.
 *
 * @returns {Promise<PutCommandOutput>} The response from DynamoDB.
 */
export const putDdbItem = async ({
  item,
  tableName,
  logger,
  options,
}: PutItem): Promise<PutCommandOutput> => {
  logger.info("Putting item in DynamoDB", { item });

  if (
    options?.uniqueId &&
    options?.uniqueId.field &&
    !item[options.uniqueId.field]
  ) {
    item[options.uniqueId.field] = createUniqueId();
  }

  const command = new PutCommand({
    TableName: tableName || DYNAMO_DB_TABLE_NAME,
    Item: item,
  });

  const response = await dynamoDbDocumentClient.send(command);

  logger.info("Item put in DynamoDB", { response });

  return response;
};

/**
 * Queries items from DynamoDB table using the specified query parameters
 *
 * @async
 * @template T - The type of items to be returned from the query
 * @param {Object} params - The parameters for the query operation
 * @param {Omit<QueryCommandInput, 'TableName'>} params.query - The DynamoDB query parameters (excluding TableName which is taken from env)
 * @param {Logger} params.logger - Logger instance for operation logging
 * @returns {Promise<T[]>} A promise that resolves to an array of query result items
 *
 * @example
 * const items = await queryDdbItems<UserItem>({
 *   query: {
 *     KeyConditionExpression: 'pk = :pk',
 *     ExpressionAttributeValues: { ':pk': 'USER#123' }
 *   },
 *   logger: console
 * });
 */
export interface PaginatedQueryResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, any>;
}

export const queryDdbItemsPaginated = async <T>({
  query,
  logger,
}: {
  query: Omit<QueryCommandInput, "TableName">;
  logger: Logger;
}): Promise<PaginatedQueryResult<T>> => {
  logger.info("Querying items (paginated) from DynamoDB", { query });

  const command = new QueryCommand({
    TableName: DYNAMO_DB_TABLE_NAME,
    ...query,
  });

  const result = await dynamoDbDocumentClient.send(command);

  return {
    items: (result.Items as T[]) ?? [],
    lastEvaluatedKey: result.LastEvaluatedKey,
  };
};

export const queryDdbItems = async <T>({
  query,
  logger,
}: {
  query: Omit<QueryCommandInput, "TableName">;
  logger: Logger;
}): Promise<T[]> => {
  logger.info("Querying items from DynamoDB", { query });

  const command = new QueryCommand({
    TableName: DYNAMO_DB_TABLE_NAME,
    ...query,
  });

  const result = await dynamoDbDocumentClient.send(command);

  if (!result) {
    return [];
  }

  logger.info("Items retrieved from DynamoDB", { items: result.Items });

  return result.Items as T[];
};

/**
 * Updates an item in DynamoDB with the specified attributes.
 *
 * @param {Object} params - The parameters for updating the item.
 * @param {string} params.pk - The partition key of the item to update.
 * @param {string | null} params.sk - The sort key of the item to update.
 * @param {Record<string, unknown>} params.attributesToUpdate - The attributes to update as key-value pairs.
 * @param {Logger} params.logger - The logger instance for recording the operation.
 * @returns {Promise<UpdateCommandOutput>} - A promise that resolves to the DynamoDB update command result.
 */
export const updateItem = async ({
  pk,
  sk,
  attributesToUpdate,
  logger,
}: {
  pk: string;
  sk: string | null;
  attributesToUpdate: Record<string, unknown>;
  logger: Logger;
}): Promise<UpdateCommandOutput> => {
  logger.info("Updating item in DynamoDB", { pk, sk, attributesToUpdate });

  const {
    updateExpression,
    expressionAttributeNames,
    expressionAttributeValues,
  } = constructUpdateExpression(attributesToUpdate);

  const command = new UpdateCommand({
    Key: {
      PK: pk,
      SK: sk,
    },
    TableName: DYNAMO_DB_TABLE_NAME,
    UpdateExpression: `SET ${updateExpression}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  });

  return await dynamoDbDocumentClient.send(command);
};

export const constructUpdateExpression = (
  attributesToUpdate: Record<string, unknown>,
) => {
  const updateExpression = Object.keys(attributesToUpdate)
    .map((_, index) => `#field${index} = :value${index}`)
    .join(", ");

  const expressionAttributeNames = Object.keys(attributesToUpdate).reduce(
    (acc, key, index) => ({
      ...acc,
      [`#field${index}`]: key,
    }),
    {},
  );

  const expressionAttributeValues = Object.entries(attributesToUpdate).reduce(
    (acc, [_, value], index) => ({
      ...acc,
      [`:value${index}`]: value,
    }),
    {},
  );

  return {
    updateExpression,
    expressionAttributeNames,
    expressionAttributeValues,
  };
};

/**
 * Lower-level update that accepts a raw UpdateExpression plus optional
 * ConditionExpression. Use this when you need REMOVE clauses, conditional
 * writes (ownership checks, idempotency), or attribute name aliases that
 * `updateItem` cannot express.
 *
 * Returns the updated attributes (ReturnValues: ALL_NEW) so callers can
 * inspect the post-write state without a follow-up GET.
 */
export const updateDdbItemRaw = async ({
  pk,
  sk,
  updateExpression,
  conditionExpression,
  expressionAttributeNames,
  expressionAttributeValues,
  logger,
}: {
  pk: string;
  sk: string;
  updateExpression: string;
  conditionExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
  logger: Logger;
}): Promise<UpdateCommandOutput> => {
  logger.info("Updating item (raw) in DynamoDB", {
    pk,
    sk,
    updateExpression,
    conditionExpression,
  });

  const command = new UpdateCommand({
    TableName: DYNAMO_DB_TABLE_NAME,
    Key: { PK: pk, SK: sk },
    UpdateExpression: updateExpression,
    ...(conditionExpression
      ? { ConditionExpression: conditionExpression }
      : {}),
    ...(expressionAttributeNames
      ? { ExpressionAttributeNames: expressionAttributeNames }
      : {}),
    ...(expressionAttributeValues
      ? { ExpressionAttributeValues: expressionAttributeValues }
      : {}),
    ReturnValues: "ALL_NEW",
  });

  const response = await dynamoDbDocumentClient.send(command);
  logger.info("Raw update completed", { response });
  return response;
};

export const deleteDdbItem = async ({
  key,
  logger,
}: {
  key: { PK: string; SK: string };
  logger: Logger;
}) => {
  const command = new DeleteCommand({
    TableName: DYNAMO_DB_TABLE_NAME,
    Key: key,
  });

  logger.info("Deleting item from DynamoDB", { key });

  const response = await dynamoDbDocumentClient.send(command);

  logger.info("Item deleted from DynamoDB", { response });

  return response;
};

const createUniqueId = () => {
  return crypto.randomUUID();
};

/**
 * Puts multiple items into DynamoDB in a batch operation.
 *
 * @param {Object} params - The parameters for the batch put operation.
 * @param {Record<string, any>[]} params.items - The array of items to put.
 * @param {string} [params.tableName] - The DynamoDB table name. Defaults to env variable if not provided.
 * @param {Logger} params.logger - Logger instance for operation logging.
 * @returns {Promise<BatchWriteCommandOutput>} The response from DynamoDB.
 */
export const putBatchDdbItems = async ({
  items,
  tableName,
  logger,
}: {
  items: Record<string, any>[];
  tableName?: string;
  logger: Logger;
}): Promise<BatchWriteCommandOutput> => {
  logger.info("Batch putting items in DynamoDB", { count: items.length });

  const command = new BatchWriteCommand({
    RequestItems: {
      [tableName || DYNAMO_DB_TABLE_NAME!]: items.map((item) => ({
        PutRequest: { Item: item },
      })),
    },
  });

  const response = await dynamoDbDocumentClient.send(command);

  logger.info("Batch put response from DynamoDB", { response });

  return response;
};
