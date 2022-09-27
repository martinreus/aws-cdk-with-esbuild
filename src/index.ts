import { DynamoDB } from "aws-sdk";
import { time } from "console";

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

// final handler will receive the result of parallel process, so it contains the result of all
// branches in one array. One of them is the JobInfo object, the other is an array containing
// all the results of all the processorHandler outputs
export const finalHandler = async (rslt: any[], ctx: any) => {
  //rslt will contain one array and one JobInfo object
  const jobInfo: JobInfo | undefined = rslt.find(
    (entry) => !!(entry as JobInfo).date
  );

  console.log(`final handler: ${JSON.stringify(jobInfo)}`);
  return;
};
