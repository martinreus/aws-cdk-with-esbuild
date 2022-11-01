import { DynamoDB } from "aws-sdk";
import { v4 } from "uuid";

const db = new DynamoDB.DocumentClient();

export const test = async (event: any, ctx: any) => {
  console.log("test " + JSON.stringify(event));
  return {};
};
