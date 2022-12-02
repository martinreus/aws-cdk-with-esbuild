import { DynamoDB } from "aws-sdk";
import { v4 } from "uuid";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

const db = new DynamoDB.DocumentClient();

const lambdaClient = new LambdaClient({});

export const test = async (event: any, ctx: any) => {
  console.log("test " + JSON.stringify(event));
  console.log("a change");
  return {};
};

export const prehook = async (event: any, ctx: any) => {
  console.log(`sending payload to lambda: ${JSON.stringify(event)}`);
  const command = new InvokeCommand({
    FunctionName: process.env.lambdaFunctionName,
    Payload: JSON.stringify({
      hello: "hello from pre traffic hook lambda",
    }) as any,
  });
  await lambdaClient.send(command);
};
