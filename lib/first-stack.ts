import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import {
  Architecture,
  FilterCriteria,
  FilterRule,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import {
  SnsEventSource,
  SqsEventSource,
} from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import * as sf from "aws-cdk-lib/aws-stepfunctions";
import * as sft from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";
import * as path from "path";
import { ConstantRateLimiter } from "./constructs/rateLimiter/rateLimiter";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { RateLimiterPayload } from "./constructs/rateLimiter/messageType";
import { Subscription, Topic } from "aws-cdk-lib/aws-sns";
import { SqsSubscription } from "aws-cdk-lib/aws-sns-subscriptions";

export interface StateMachineContext {
  token: string;
  stateMachineName: string;
}

const STATE_MACHINE_NAME = "processParallelWithRateLimit";

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
      timeout: Duration.minutes(15),
    });

    const finalLambda = new NodejsFunction(this, "finalLambda", {
      entry: path.join(__dirname, "..", "src", "finalLambda.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.minutes(1),
    });

    const workerResultQueue = new Queue(this, "result-queue", {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const workerLambda = new NodejsFunction(this, "workerLambda", {
      entry: path.join(__dirname, "..", "src", "workerLambda.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      environment: {
        resultQueueUrl: workerResultQueue.queueUrl,
      },
    });
    workerResultQueue.grantSendMessages(workerLambda);

    const smResumeCallbackLambda = new NodejsFunction(
      this,
      "sm-resume-function",
      {
        entry: path.join(__dirname, "..", "src", "smCallback.ts"),
        handler: "handler",
        runtime: Runtime.NODEJS_16_X,
        architecture: Architecture.ARM_64,
        environment: {
          resultQueueUrl: workerResultQueue.queueUrl,
        },
      }
    );

    // only consume results from the worker which were posted by the state machine
    const smResumeEventSource = new SqsEventSource(workerResultQueue, {
      filters: [
        FilterCriteria.filter({
          body: {
            context: {
              stateMachineName: FilterRule.isEqual(STATE_MACHINE_NAME),
            },
          },
        }),
      ],
    });
    smResumeCallbackLambda.addEventSource(smResumeEventSource);

    // the rate limiter! reads from the service queue and delivers
    // messages read from the queue to the workerLambda at the defined
    // ratePerSecond
    new ConstantRateLimiter(this, "test-rate-limiter", {
      ratePerSecond: 2,
      serviceQueue,
      workerLambda,
    });

    // sending context and payload in the message body feels a bit wonky...
    const processor = new sft.SqsSendMessage(this, "publishRateLimitedTask", {
      messageBody: sf.TaskInput.fromObject({
        payload: sf.JsonPath.entirePayload,
        context: {
          token: sf.JsonPath.taskToken,
          stateMachineName: STATE_MACHINE_NAME,
        },
      } as RateLimiterPayload<string, StateMachineContext>),

      integrationPattern: sf.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      queue: serviceQueue,
    });

    const mapInvoke = new sf.Map(this, "mapProcessor", {
      maxConcurrency: 10,
    }).iterator(processor);

    // dummy producer produces some items for the statemachine to process
    const definition = new sft.LambdaInvoke(this, "startProducer", {
      lambdaFunction: producerLambda,
      outputPath: "$.Payload",
    })
      .next(mapInvoke)
      .next(
        new sft.LambdaInvoke(this, "invokeFinal", {
          lambdaFunction: finalLambda,
        })
      )
      .next(new sf.Succeed(this, "finish"));

    const sm = new StateMachine(this, STATE_MACHINE_NAME, {
      definition,
      timeout: Duration.minutes(1),
      tracingEnabled: true,
    });

    sm.grantTaskResponse(smResumeCallbackLambda);
  }
}
