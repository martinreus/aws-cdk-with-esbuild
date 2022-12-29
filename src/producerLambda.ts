import { SQS } from "aws-sdk";
import { v4 } from "uuid";
import { sleep } from "../lib/timeouts";

export interface Params {
  iterations: number;
  randomMaxWait?: number;
}

export interface Item {
  id: string;
  uuid: string;
  timestamp?: string;
}

export const handler = async (params: Params, ctx: any): Promise<Item[]> => {
  let producedItems: Item[] = [];
  for (let id = 0; id < params.iterations; id++) {
    producedItems.push({ id: `${id}`, uuid: v4().toString() });
  }

  return producedItems;
};
