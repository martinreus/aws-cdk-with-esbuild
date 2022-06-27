import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class FirstStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    new s3.Bucket(this, "MyFirstBucket", {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      bucketName: "chusme",
    });
    // example resource
    // const queue = new sqs.Queue(this, 'FirstQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
