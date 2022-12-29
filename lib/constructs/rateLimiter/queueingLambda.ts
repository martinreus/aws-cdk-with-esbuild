import { SQS } from "aws-sdk";
import { sleep } from "../../timeouts";
import {
  MessageAttribute,
  MessageRecords,
  RecordContent,
  toSqsMessageAttributes,
} from "./messageType";

const client = new SQS({});

const ratePerSecondString = process.env.ratePerSecond;
const enqueuerQueue = process.env.enqueuerQueue;
const enqueuerInstancies = Number.parseInt(
  process.env.enqueuerInstancies || "1"
);
const ratePerSecond: number = Number.parseFloat(ratePerSecondString!);
const shouldWaitTime = (1 / ratePerSecond) * 1000 * enqueuerInstancies;

export const handler = async (event: MessageRecords, ctx: any) => {
  console.log(`${JSON.stringify(event)}`);

  for (const record of event.Records) {
    const startSend = Date.now();
    await client
      .sendMessage({
        MessageBody: record.body,
        MessageAttributes: toSqsMessageAttributes(record.messageAttributes),
        QueueUrl: enqueuerQueue!,
      })
      .promise();

    const sendFinish = Date.now() - startSend;
    const remainingWait = shouldWaitTime - sendFinish;
    if (remainingWait > 0) {
      await sleep(remainingWait);
    }
  }
};
