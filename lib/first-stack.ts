import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  Fail,
  Map,
  StateMachine,
  Wait,
  WaitTime,
  Succeed,
  Pass,
} from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";
import * as path from "path";

export class FirstStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const fn = new NodejsFunction(this, "chusme", {
      entry: path.join(__dirname, "..", "src", "index.ts"),
      handler: "firstHandler",
      runtime: Runtime.NODEJS_16_X,
    });

    const fn2 = new NodejsFunction(this, "chusme2", {
      entry: path.join(__dirname, "..", "src", "index.ts"),
      handler: "secondHandler",
      runtime: Runtime.NODEJS_16_X,
    });

    const submitJob = new LambdaInvoke(this, "Submit Job", {
      lambdaFunction: fn,
      // Lambda's result is in the attribute `Payload`
      outputPath: "$.Payload",
    });

    const process = new LambdaInvoke(this, "Process", {
      lambdaFunction: fn2,
      // Pass just the field named "guid" into the Lambda, put the
      // Lambda's result in a field called "status" in the response
      // inputPath: "$.Payload",
      // outputPath: "$.Payload",
    });

    // const jobFailed = new Fail(this, "Job Failed", {
    //   cause: "AWS Batch Job Failed",
    //   error: "DescribeJob returned FAILED",
    // });

    const map = new Map(this, "map to parallel", {
      maxConcurrency: 2,
    });
    map.iterator(process);

    const definition = submitJob
      .next(map)
      .next(new Pass(this, "succeed state"));

    new StateMachine(this, "StateMachine", {
      definition,
      timeout: Duration.minutes(5),
    });
  }
}
