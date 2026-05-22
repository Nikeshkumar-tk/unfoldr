export const userKeys = {
  PK: (userId: string) => `USER#${userId}`,
  SK: () => `METADATA`,
  GSI1PK: (email: string) => `EMAIL#${email}`,
  GSI1SK: () => `METADATA`,
};
