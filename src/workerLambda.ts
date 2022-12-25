import { v4 } from "uuid";
import { sleep } from "../lib/timeouts";

export const handler = async (event: any, ctx: any) => {
  const uuid = v4().toString();
  console.log(`hey, itsamee, ${uuid}! ${JSON.stringify(event)}`);
  await sleep(Math.random() * 1000 + 50);
  console.log(`finished! ${uuid}`);
};
