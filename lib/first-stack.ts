import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import * as path from "path";

export class FirstStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // data store:
    const testTable = new Table(this, "ConcurrencyController", {
      tableName: "concurrencyController",
      partitionKey: { name: "id", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const serviceQueue = new Queue(this, "service", {
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const workerQueue = new Queue(this, "workerQueue", {
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const resultQueue = new Queue(this, "resultQueue", {
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

    const queueingLambda = new NodejsFunction(this, "queueingLambda", {
      entry: path.join(__dirname, "..", "src", "queueingLambda.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      environment: {
        workerSqsQueue: workerQueue.queueUrl,
        ratePerSecond: "2.5",
      },
      reservedConcurrentExecutions: 1,
      timeout: Duration.seconds(10),
    });

    const workerLambda = new NodejsFunction(this, "workerLambda", {
      entry: path.join(__dirname, "..", "src", "workerLambda.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
    });

    const event = new SqsEventSource(serviceQueue, {
      batchSize: 1,
    });

    queueingLambda.addEventSource(event);

    // testTable.grantReadWriteData(queueingLambda);
  }
}
