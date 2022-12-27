import { SQS } from "aws-sdk";
import { sleep } from "../../timeouts";
import { MessageRecords } from "./messageType";

const client = new SQS({});

const ratePerSecondString = process.env.ratePerSecond;
const enqueuerQueue = process.env.enqueuerQueue;
const enqueuerInstancies = Number.parseInt(
  process.env.enqueuerInstancies || "1"
);
const ratePerSecond: number = Number.parseFloat(ratePerSecondString!);
const shouldWaitTime = (1 / ratePerSecond) * 1000 * enqueuerInstancies;

export const handler = async (event: MessageRecords, ctx: any) => {
  for (const record of event.Records) {
    const startSend = Date.now();
    await client
      .sendMessage({
        MessageBody: record.body,
        MessageAttributes: Object.keys(record.messageAttributes || {})
          .map((messageAttrKey) => ({
            [messageAttrKey]: {
              DataType: record.messageAttributes[messageAttrKey].dataType,
              StringValue:
                record.messageAttributes[messageAttrKey]?.stringValue,
              BinaryValue:
                record.messageAttributes[messageAttrKey]?.binaryValue,
            },
          }))
          .reduce((prev, curr) => ({ ...prev, ...curr })),
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
