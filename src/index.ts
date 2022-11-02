import { DynamoDB } from "aws-sdk";
import { v4 } from "uuid";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const db = new DynamoDB.DocumentClient();

export const test = async (event: any, ctx: any) => {
  event = sanitizeBigIntToString(event);

  console.log(`received event ${JSON.stringify(event)}`);
  const putRslt = await db
    .put({
      Item: marshall({
        id: v4(),
        ...event,
      }),
      TableName: "testTable",
    })
    .promise();

  console.log("persisted? " + JSON.stringify(putRslt.$response.error));
};

export function sanitizeBigIntToString(obj: any): any {
  const eventKeys = Object.keys(obj);

  for (const key of eventKeys) {
    switch (typeof obj[key]) {
      case "number":
        if (obj[key] >= Math.pow(2, 53)) {
          obj[key] = `${obj[key]}`;
        }
        break;
      case "object":
        obj[key] = sanitizeBigIntToString(obj[key]);
        break;
    }
  }
  return obj;
}
