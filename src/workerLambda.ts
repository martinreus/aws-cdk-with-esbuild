import { v4 } from "uuid";
import { sleep } from "../lib/timeouts";
import { MessageRecords } from "../lib/constructs/rateLimiter/messageType";

export const handler = async (event: MessageRecords, ctx: any) => {
  const uuid = v4().toString();
  console.log(
    `${new Date().toISOString()}: test received , ${uuid}! ${JSON.stringify(
      event
    )}`
  );
  await sleep(Math.random() * 2000 + 50);
  console.log(`finished! ${uuid}`);
};
