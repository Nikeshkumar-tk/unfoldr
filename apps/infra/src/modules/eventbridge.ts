import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";
import type { EventBridgeLambdaFn } from "../types";

export interface EventBridgeConstructProps {
  eventBridgeLambdas: EventBridgeLambdaFn[];
}

export class EventBridgeConstruct extends Construct {
  constructor(scope: Construct, id: string, props: EventBridgeConstructProps) {
    super(scope, id);

    for (const { fn, config } of props.eventBridgeLambdas) {
      new events.Rule(this, `${config.name}Rule`, {
        eventPattern: {
          source: [config.eventSource],
          detailType: [config.detailType],
        },
        targets: [new targets.LambdaFunction(fn)],
      });
    }
  }
}
