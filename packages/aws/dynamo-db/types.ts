import { Logger } from "@unfoldr/logger";

type GSIKeys<T extends string> = {
  [K in T]: {
    [P in `${K}PK`]: string;
  } & {
    [P in `${K}SK`]: string;
  };
}[T];

export type DbBaseType<T extends string = never> = {
  PK: string;
  SK: string;
} & Partial<GSIKeys<T>>;

export type GetItem = {
  tableName?: string;
  pk: string;
  sk: string;
  logger: Logger;
};

export type PutItem = {
  tableName?: string;
  item: Record<string, any>;
  logger: Logger;
  options?: {
    uniqueId?: {
      field: string;
    };
  };
};
