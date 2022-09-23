import { DynamoDB } from "aws-sdk";

const db = new DynamoDB.DocumentClient();

interface Item {
  item: string;
  jobInfo: JobInfo;
}

interface JobInfo {
  date: string;
}

export const dateGeneratorHandler = async (
  event: any,
  ctx: any
): Promise<JobInfo> => {
  console.log("first handler entered");
  return { date: new Date().toISOString() };
};

export const producerHandler = async (
  jobInfo: JobInfo,
  ctx: any
): Promise<Item[]> => {
  console.log(`producer handler: ${JSON.stringify(jobInfo)}`);
  return [
    { item: "1", jobInfo },
    { item: "2", jobInfo },
    { item: "3", jobInfo },
    { item: "4", jobInfo },
    { item: "5", jobInfo },
    { item: "6", jobInfo },
  ];
};

export const processorHandler = async (item: Item, ctx: any) => {
  console.log(`processor handler: ${JSON.stringify(item)}`);
  return;
};

export const finalHandler = async (jobInfo: JobInfo, ctx: any) => {
  console.log(`final handler: ${JSON.stringify(jobInfo)}`);
  return;
};
