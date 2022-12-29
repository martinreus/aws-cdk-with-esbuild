import * as aws from "aws-sdk";
import {
  MessageRecords,
  RateLimiterPayload,
} from "../lib/constructs/rateLimiter/messageType";
import { StateMachineContext } from "../lib/first-stack";
import { sleep } from "../lib/timeouts";
import { Item } from "./producerLambda";
import { RateLimitedResult } from "./workerLambda";

const sfClient = new aws.StepFunctions({});

export const handler = async (
  event: MessageRecords,
  ctx: any
): Promise<void> => {
  console.log(`smCallback event received: ${JSON.stringify(event)}`);

  // resume state machine execution, sending the workers' result to it
  for (let record of event.Records) {
    const messagePayload: RateLimitedResult = JSON.parse(record.body);

    const { result, context } = messagePayload;

    await sfClient // resume state machine from where the event came from
      .sendTaskSuccess({
        output: JSON.stringify(result),
        taskToken: context.token,
      })
      .promise();
  }
};
