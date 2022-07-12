import { Response, S3 } from "aws-sdk";
import { v4 } from "uuid";

export const test = async (event: any, ctx: any) => {
  const random = "";
  console.log(event);

  const s3B = new S3();

  console.log(`creating bucket... ${random}`);

  const created = await s3B
    .createBucket({
      Bucket: v4(),
    })
    .promise();

  console.log("Bucket created: " + JSON.stringify(created));
};
