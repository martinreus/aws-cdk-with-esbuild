import { DynamoDB } from "aws-sdk";

import * as _ from "lodash";
import { Record } from "aws-sdk/clients/dynamodbstreams";

const db = new DynamoDB.DocumentClient();

interface Event {
  Records: Record[];
}

export const handler = async (event: Event, ctx: any) => {
  if (!event.Records) {
    return;
  }

  const items = event.Records.filter(
    (record) =>
      !!record &&
      record.eventName != "REMOVE" &&
      !!record.dynamodb &&
      !!record.dynamodb.NewImage
  )
    .map((record) => record.dynamodb!.NewImage!)
    .map((record) => DynamoDB.Converter.unmarshall(record));

  console.log(JSON.stringify(items));
};
