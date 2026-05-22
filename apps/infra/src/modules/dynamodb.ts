import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { createResourceName } from "../utils/common";
import type { AnyLambdaFn } from "../types";

interface DynamoDbConstructProps {
  /**
   * Lambdas that need read/write access to the table and the
   * `DYNAMO_DB_TABLE_NAME` env var. Mixed trigger types are fine.
   */
  lambdaFns: AnyLambdaFn[];
}

export class DynamoDbConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDbConstructProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, "MainTable", {
      tableName: createResourceName({ name: "main-table" }),
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: { name: "GSI2PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI2SK", type: dynamodb.AttributeType.STRING },
    });

    props.lambdaFns.forEach(({ fn }) => {
      this.table.grantReadWriteData(fn);
      fn.addEnvironment("DYNAMO_DB_TABLE_NAME", this.table.tableName);
    });
  }
}
