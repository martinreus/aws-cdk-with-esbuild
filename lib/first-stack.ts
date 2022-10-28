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
  Choice,
  Condition,
} from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";
import * as path from "path";
import { finalHandler } from "../src";

export class FirstStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // functions
    const fn1 = new NodejsFunction(this, "fn1", {
      entry: path.join(__dirname, "..", "src", "dummy.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    const fn2 = new NodejsFunction(this, "fn2", {
      entry: path.join(__dirname, "..", "src", "dummy.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    const fn3 = new NodejsFunction(this, "fn3", {
      entry: path.join(__dirname, "..", "src", "dummy.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    const fn4 = new NodejsFunction(this, "fn4", {
      entry: path.join(__dirname, "..", "src", "dummy.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    const fn5 = new NodejsFunction(this, "fn5", {
      entry: path.join(__dirname, "..", "src", "dummy.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    const fn6 = new NodejsFunction(this, "fn6", {
      entry: path.join(__dirname, "..", "src", "dummy.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });

    // integrations
    const fn1Invoke = new LambdaInvoke(this, "fn1-invoke", {
      lambdaFunction: fn1,
      outputPath: "$.Payload",
    });
    const fn2Invoke = new LambdaInvoke(this, "fn2-invoke", {
      lambdaFunction: fn2,
      outputPath: "$.Payload",
    });
    const fn3Invoke = new LambdaInvoke(this, "fn3-invoke", {
      lambdaFunction: fn3,
      outputPath: "$.Payload",
    });
    const fn4Invoke = new LambdaInvoke(this, "fn4-invoke", {
      lambdaFunction: fn4,
      outputPath: "$.Payload",
    });
    const fn5Invoke = new LambdaInvoke(this, "fn5-invoke", {
      lambdaFunction: fn5,
      outputPath: "$.Payload",
    });
    const fn6Invoke = new LambdaInvoke(this, "fn6-invoke", {
      lambdaFunction: fn6,
      outputPath: "$.Payload",
    });
    // statemachine

    // state machine
    const succeed = new Succeed(this, "finish-engine");

    const definition = new Choice(this, "has-result-object")
      .when(
        Condition.isPresent("$.phantomBusterOutput.resultObject"),
        fn1Invoke
          .next(
            new Map(this, "process-lead-chunks-map", {
              // 1 max concurrency for now since processLeadsHandler has some parallel logic to
              // resolve emails via hunter, which has a rate limit. Can be optimized in the future though...
              maxConcurrency: 1,
              comment:
                "map prospect chunks to be processed in a separate lambda so it does not timeout",
            }).iterator(fn2Invoke)
          )
          .next(fn3Invoke)
          .next(succeed)
      )
      .otherwise(
        fn4Invoke.next(
          new Choice(this, "empty-result-count-greater-than-2")
            .when(
              Condition.numberGreaterThanEquals("$.state.emptyResultsCount", 2),
              fn5Invoke.next(
                new Choice(this, "is-engine-still-running")
                  .when(
                    Condition.numberEquals("$.runningInstances", 0),
                    fn6Invoke.next(succeed)
                  )
                  .otherwise(
                    new Wait(this, "wait-for-engine-finished", {
                      time: WaitTime.duration(Duration.minutes(1)),
                    }).next(fn5Invoke)
                  )
              )
            )
            .otherwise(succeed)
        )
      );

    const sm = new StateMachine(this, "parse-prospects-state-machine", {
      definition,
      // if an instance of a statemachine runs for more than 1 hour, something is probably wrong...
      timeout: Duration.hours(1),
      tracingEnabled: true,
    });
  }

  private createSimpleSM() {
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

    // flow control state machine
    const controlFn = new NodejsFunction(this, "controlfn", {
      entry: path.join(__dirname, "..", "src", "flow.ts"),
      handler: "consumer",
      runtime: Runtime.NODEJS_16_X,
    });

    const controlFnInvoke = new LambdaInvoke(this, "controlFnInvoke", {
      lambdaFunction: controlFn,
      outputPath: "$.Payload",
    });

    const controlFlow = controlFnInvoke.next(
      new Choice(this, "hasNextId")
        .when(Condition.isPresent("$.nextId"), controlFnInvoke)
        .otherwise(new Succeed(this, "finished"))
    );

    new StateMachine(this, "ControlFn", {
      definition: controlFlow,
      timeout: Duration.minutes(2),
    });
  }
}
