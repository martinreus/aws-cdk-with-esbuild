import { Function, Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

import { NestedStack, NestedStackProps, Stack, StackProps } from "aws-cdk-lib";
import {
  AccessLogFormat,
  Cors,
  Integration,
  LambdaIntegration,
  LogGroupLogDestination,
  MethodLoggingLevel,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { LambdaWithPreehook } from "./constructs/lambda-with-preehook";

// const fn = new NodejsFunction(this, "chusme", {
//   entry: path.join(__dirname, "..", "src", "index.ts"),
//   handler: "test",
//   runtime: Runtime.NODEJS_16_X,
// });

const defaultCorsPreflightOptions = {
  allowOrigins: Cors.ALL_ORIGINS,
  allowMethods: Cors.ALL_METHODS,
  allowHeaders: ["*"],
  allowCredentials: true,
};

const deployOpts = {
  loggingLevel: MethodLoggingLevel.INFO,
  dataTraceEnabled: true,
  tracingEnabled: true,
  metricsEnabled: true,
  accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
};

export class FirstStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bls = new BusinessLogicStack(this, "aBS");

    const fn = new NodejsFunction(this, "asdasd", {
      entry: path.join(__dirname, "..", "src", "index.ts"),
      handler: "test",
      runtime: Runtime.NODEJS_16_X,
      tracing: Tracing.ACTIVE,
    });

    const parent = new LambdaIntegration(fn);

    const ra = new RestApiStack(this, "aRA", {
      lambda: {
        integrations: {
          nestedStak: bls.integration,
          parentInt: parent,
        },
      },
    });
    ra.node.addDependency(bls);
  }
}

interface ResourceNestedStackProps extends NestedStackProps {}

interface ApiResourceArns {
  integrations?: { nestedStak: Integration; parentInt: Integration };
}

class BusinessLogicStack extends NestedStack {
  public integration: Integration;

  constructor(scope: Construct, id: string, props?: ResourceNestedStackProps) {
    super(scope, id, props);

    // const fn = new NodejsFunction(this, "chusme", {
    //   entry: path.join(__dirname, "..", "src", "index.ts"),
    //   handler: "test",
    //   runtime: Runtime.NODEJS_16_X,
    //   tracing: Tracing.ACTIVE,
    // });

    const preHook = new LambdaWithPreehook(
      this,
      "business",
      {
        lambdaProps: {
          entry: path.join(__dirname, "..", "src", "index.ts"),
          handler: "test",
          runtime: Runtime.NODEJS_16_X,
          tracing: Tracing.ACTIVE,
        },
      },
      {
        lambdaProps: {
          entry: path.join(__dirname, "..", "src", "index.ts"),
          handler: "prehook",
          runtime: Runtime.NODEJS_16_X,
          tracing: Tracing.ACTIVE,
        },
      }
    );
    const fn = preHook.lambdaAlias;

    this.integration = new LambdaIntegration(fn);
  }
}

interface RestApiStackProps extends NestedStackProps {
  lambda: ApiResourceArns;
}

class RestApiStack extends NestedStack {
  constructor(scope: Construct, id: string, props: RestApiStackProps) {
    super(scope, id, props);

    const lg = new LogGroup(this, "RestApiStack-log-group", {
      retention: RetentionDays.ONE_DAY,
    });

    const restApi = new RestApi(this, "RestApi", {
      defaultCorsPreflightOptions,
      deployOptions: {
        stageName: "new",
        accessLogDestination: new LogGroupLogDestination(lg),
        ...deployOpts,
      },
      retainDeployments: true,
      failOnWarnings: true,
    });

    restApi.root
      .resourceForPath("inStack")
      .addMethod("GET", props.lambda.integrations?.nestedStak!);

    restApi.root
      .resourceForPath("parent")
      .addMethod("GET", props.lambda.integrations?.parentInt!);
  }
}
