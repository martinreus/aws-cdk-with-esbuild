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
  Parallel,
  JsonPath,
} from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";
import * as path from "path";
import { finalHandler } from "../src";

export class FirstStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const fn = new NodejsFunction(this, "chusme", {
      entry: path.join(__dirname, "..", "src", "index.ts"),
      handler: "dateGeneratorHandler",
      runtime: Runtime.NODEJS_16_X,
    });
    const fn2 = new NodejsFunction(this, "chusme2", {
      entry: path.join(__dirname, "..", "src", "index.ts"),
      handler: "producerHandler",
      runtime: Runtime.NODEJS_16_X,
    });
    const fn3 = new NodejsFunction(this, "chusme3", {
      entry: path.join(__dirname, "..", "src", "index.ts"),
      handler: "processorHandler",
      runtime: Runtime.NODEJS_16_X,
    });
    const fn4 = new NodejsFunction(this, "chusme4", {
      entry: path.join(__dirname, "..", "src", "index.ts"),
      handler: "finalHandler",
      runtime: Runtime.NODEJS_16_X,
    });

    const generateDate = new LambdaInvoke(this, "SubmitDate", {
      lambdaFunction: fn,
      outputPath: "$.Payload",
    });
    const producer = new LambdaInvoke(this, "Produce", {
      lambdaFunction: fn2,
      outputPath: "$.Payload",
    });
    const processor = new LambdaInvoke(this, "Process", {
      lambdaFunction: fn3,
      outputPath: "$.Payload",
    });
    const finish = new LambdaInvoke(this, "Finish", {
      lambdaFunction: fn4,
      outputPath: "$.Payload",
    });

    const map = new Map(this, "map to parallel execution", {
      maxConcurrency: 2,
    });
    map.iterator(processor);

    const passGeneratedDate = new Pass(this, "pass along");
    const parallel = new Parallel(this, "parallel execution").branch(
      passGeneratedDate,
      producer.next(map)
    );

    const definition = generateDate.next(parallel).next(finish);

    new StateMachine(this, "StateMachine", {
      definition,
      timeout: Duration.minutes(5),
    });
  }
}
