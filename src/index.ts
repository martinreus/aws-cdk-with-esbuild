import { DynamoDB } from "aws-sdk";

const db = new DynamoDB.DocumentClient();

interface Obj {
  existingItem: string;
}

export const firstHandler = async (event: any, ctx: any) => {
  console.log("first handler entered");
  return [
    { existingItem: "1" },
    { existingItem: "2" },
    { existingItem: "3" },
    { existingItem: "4" },
    { existingItem: "5" },
    { existingItem: "6" },
    { existingItem: "7" },
    { existingItem: "8" },
  ];
};

export const secondHandler = async (event: Obj, ctx: any) => {
  console.log(`second handler: ${JSON.stringify(event)}`);
  return event.existingItem;
};
