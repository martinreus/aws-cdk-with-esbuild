import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import * as path from "path";
import { ConstantRateLimiter } from "./constructs/rateLimiter/rateLimiter";

export class FirstStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const serviceQueue = new Queue(this, "service", {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const producerLambda = new NodejsFunction(this, "producerLambda", {
      entry: path.join(__dirname, "..", "src", "producerLambda.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      environment: {
        serviceQueue: serviceQueue.queueUrl,
      },
      timeout: Duration.minutes(15),
    });
    serviceQueue.grantSendMessages(producerLambda);

    const workerLambda = new NodejsFunction(this, "workerLambda", {
      entry: path.join(__dirname, "..", "src", "workerLambda.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
    });

    new ConstantRateLimiter(this, "test-rate-limiter", {
      ratePerSecond: 2,
      serviceQueue,
      workerLambda,
    });
  }
}
