import { SQS } from "aws-sdk";
import { v4 } from "uuid";
import { sleep } from "../lib/timeouts";

export const handler = async (event: any, ctx: any): Promise<void> => {
  console.log(JSON.stringify(event));
};
