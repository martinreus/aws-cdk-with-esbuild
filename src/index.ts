import { DynamoDB } from "aws-sdk";
import { v4 } from "uuid";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const db = new DynamoDB.DocumentClient();

export const test = async (event: any, ctx: any) => {
  console.log(JSON.stringify({ level: "error", message: "test" }));

  console.error("teste de erro");
};
