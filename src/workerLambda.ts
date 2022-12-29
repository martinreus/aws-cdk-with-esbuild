import { v4 } from "uuid";
import { sleep } from "../lib/timeouts";
import {
  MessageRecords,
  RateLimiterPayload,
  toSqsMessageAttributes,
} from "../lib/constructs/rateLimiter/messageType";
import { Item } from "./producerLambda";
import * as aws from "aws-sdk";
import { StateMachineContext } from "../lib/first-stack";
import { SNS, SQS } from "aws-sdk";

const client = new SQS({});

const snsClient = new SNS({});

export interface RateLimitedResult {
  result: Item;
  context: any;
}

const resultQueueUrl = process.env.resultQueueUrl!;

export const handler = async (
  event: MessageRecords,
  ctx: any
): Promise<void> => {
  console.log(`worker event received: ${JSON.stringify(event)}`);

  // simulate "processing" each record
  for (let record of event.Records) {
    console.log(`record body: ${record.body}`);
    const messagePayload: RateLimiterPayload<Item, any> = JSON.parse(
      record.body
    );

    const { payload, context } = messagePayload;

    // simulate working time
    await sleep(Math.random() * 2000 + 50);

    await client
      .sendMessage({
        MessageBody: JSON.stringify({
          result: {
            ...payload,
            timestamp: `${new Date().toISOString()}`,
          },
          context,
        } as RateLimitedResult),
        MessageAttributes: toSqsMessageAttributes(record.messageAttributes),
        QueueUrl: resultQueueUrl,
      })
      .promise();
  }
};
