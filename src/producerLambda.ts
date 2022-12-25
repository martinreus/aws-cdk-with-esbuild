import { SQS } from "aws-sdk";
import { v4 } from "uuid";
import { sleep } from "../lib/timeouts";

export interface Params {
  iterations: number;
  randomMaxWait?: number;
}

const downstreamServiceQueue = process.env.serviceQueue;

const client = new SQS({ apiVersion: "2012-11-05" });

export const handler = async (params: Params, ctx: any) => {
  for (let i = 0; i < params.iterations; i++) {
    await client
      .sendMessage({
        MessageBody: JSON.stringify({
          iterationId: i,
          time: Date.now(),
        }),
        QueueUrl: downstreamServiceQueue!,
      })
      .promise();

    if (params.randomMaxWait) {
      await sleep(Math.random() * params.randomMaxWait);
    }
  }
};
