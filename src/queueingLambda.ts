import { DynamoDB, SQS } from "aws-sdk";
import { v4 } from "uuid";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { Duration } from "aws-cdk-lib";
import { sleep } from "../lib/timeouts";

const client = new SQS({});

const ratePerSecondString = process.env.ratePerSecond;
const workerSqsQueue = process.env.workerSqsQueue;

export const handler = async (event: any, ctx: any) => {
  const startTime = Date.now();
  console.log(JSON.stringify(event));
  const ratePerSecond: number = Number.parseFloat(ratePerSecondString!);
  const shouldWaitTime = (1 / ratePerSecond) * 1000;

  // simulate delays in SQS sending
  await sleep(Math.random() * 100 + 10);
  // const sendMessagePromise = client
  //   .sendMessage({
  //     MessageBody: JSON.stringify(event),
  //     QueueUrl: workerSqsQueue!,
  //   })
  //   .promise();

  const runTime = Date.now() - startTime;
  const remainingWait = shouldWaitTime - runTime;
  if (remainingWait < 0) {
    return;
  }
  await sleep(remainingWait);
};
