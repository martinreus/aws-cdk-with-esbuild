import { DynamoDB } from "aws-sdk";
import { v4 } from "uuid";

const db = new DynamoDB.DocumentClient();

export const test = async (event: any, ctx: any) => {
  const putRslt = await db
    .put({
      Item: {
        id: v4(),
        name: `a rand name ${v4()}`,
      },
      TableName: "testTable",
    })
    .promise();

  console.log("persisted? " + putRslt.$response);
};
