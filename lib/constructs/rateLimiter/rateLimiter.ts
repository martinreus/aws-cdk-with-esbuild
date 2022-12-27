import { Duration, NestedStack, RemovalPolicy, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import { Architecture, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import * as path from "path";

export type RateLimiterProps = StackProps & {
  // how many invocations per second of the workerLambda we wish; worker lambda will be
  // invoked every 1/ratePerSecond milliseconds
  ratePerSecond: number;
  // if the ratePerSecond too high, it might be needed to increase the amount of concurrent enqueuer lambda functions,
  // which are dependent on how fast we can send messages to SQS. If 1/ratePerSecond is smaller than that,
  // incre3asing this is a good idea.
  // default is 1.
  enqueuerInstancies?: number;
  // serviceQueue is where the requests for the rate limited worker lambda will be made.
  serviceQueue: Queue;
  // lambda which will process all requests;
  // This Function's 'event' argument is of type 'MessageRecords'
  workerLambda: Function;
};

export class ConstantRateLimiter extends NestedStack {
  constructor(scope: Construct, id: string, props: RateLimiterProps) {
    super(scope, id, props);

    const enqueuerQueue = new Queue(this, `${id}EnqueuerQueue`, {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const enqueuer = new NodejsFunction(this, `${id}EnqueuerLambda`, {
      entry: path.join(__dirname, "queueingLambda.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      environment: {
        enqueuerQueue: enqueuerQueue.queueUrl,
        ratePerSecond: `${props.ratePerSecond}`,
        enqueuerInstancies: `${props.enqueuerInstancies || 1}`,
      },
      reservedConcurrentExecutions: props.enqueuerInstancies || 1,
      timeout: Duration.seconds(10),
    });
    enqueuerQueue.grantSendMessages(enqueuer);

    const enqueuerEvent = new SqsEventSource(props.serviceQueue, {
      batchSize: 1,
    });
    const workerEvent = new SqsEventSource(enqueuerQueue, {
      batchSize: 1,
    });

    enqueuer.addEventSource(enqueuerEvent);
    props.workerLambda.addEventSource(workerEvent);
  }
}
