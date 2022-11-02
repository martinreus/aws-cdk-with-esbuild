import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

import {
  App,
  CfnOutput,
  NestedStack,
  NestedStackProps,
  StackProps,
  Stack,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  AccessLogFormat,
  Cors,
  Deployment,
  LambdaIntegration,
  LogGroupLogDestination,
  Method,
  MethodLoggingLevel,
  MockIntegration,
  PassthroughBehavior,
  RestApi,
  Stage,
} from "aws-cdk-lib/aws-apigateway";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";

// const fn = new NodejsFunction(this, "chusme", {
//   entry: path.join(__dirname, "..", "src", "index.ts"),
//   handler: "test",
//   runtime: Runtime.NODEJS_16_X,
// });

export class FirstStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const restApi = new RestApi(this, "RestApi", {
      // defaultCorsPreflightOptions: {
      //   allowOrigins: Cors.ALL_ORIGINS,
      //   allowMethods: Cors.ALL_METHODS,
      //   allowHeaders: ["*"],
      //   allowCredentials: true,
      // },
      // deployOptions: {
      //   stageName: "new-one",
      // },

      restApiName: "RestApi",
      description: "Lalalal",
      minimumCompressionSize: 0,
      retainDeployments: true,
      failOnWarnings: true,

      deploy: false,
    });
    restApi.root.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowMethods: Cors.ALL_METHODS,
      allowHeaders: ["*"],
      allowCredentials: true,
    });

    const fn = new NodejsFunction(this, "chusme", {
      entry: path.join(__dirname, "..", "src", "index.ts"),
      handler: "test",
      runtime: Runtime.NODEJS_16_X,
    });

    restApi.root.addMethod("POST", new LambdaIntegration(fn));

    const petsStack = new PetsStack(this, {
      restApiId: restApi.restApiId,
      rootResourceId: restApi.restApiRootResourceId,
    });

    new DeployStack(this, {
      restApiId: restApi.restApiId,
      rootResourceId: restApi.restApiRootResourceId,
      methods: petsStack.methods,
    });

    new CfnOutput(this, "PetsURL", {
      value: `https://${restApi.restApiId}.execute-api.${this.region}.amazonaws.com/prod/pets`,
    });

    new CfnOutput(this, "BooksURL", {
      value: `https://${restApi.restApiId}.execute-api.${this.region}.amazonaws.com/prod/books`,
    });
  }
}

interface ResourceNestedStackProps extends NestedStackProps {
  readonly restApiId: string;

  readonly rootResourceId: string;
}

class PetsStack extends NestedStack {
  public readonly methods: Method[] = [];

  constructor(scope: Construct, props: ResourceNestedStackProps) {
    super(scope, "integ-restapi-import-PetsStack", props);

    const api = RestApi.fromRestApiAttributes(this, "RestApi", {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId,
    });

    const method = api.root
      // .resourceForPath("webhook")
      .addResource("pets", {
        defaultCorsPreflightOptions: {
          allowOrigins: Cors.ALL_ORIGINS,
          allowMethods: Cors.ALL_METHODS,
          allowHeaders: ["*"],
          allowCredentials: true,
        },
      })
      .addMethod(
        "GET",
        new MockIntegration({
          integrationResponses: [
            {
              statusCode: "200",
            },
          ],
          passthroughBehavior: PassthroughBehavior.NEVER,

          requestTemplates: {
            "application/json": '{ "statusCode": 200 }',
          },
        }),
        {
          methodResponses: [{ statusCode: "200" }],
        }
      );

    this.methods.push(method);
  }
}

interface DeployStackProps extends NestedStackProps {
  readonly restApiId: string;
  readonly rootResourceId: string;

  readonly methods?: Method[];
}

class DeployStack extends NestedStack {
  constructor(scope: Construct, props: DeployStackProps) {
    super(scope, "integ-restapi-import-DeployStack", props);

    const api = RestApi.fromRestApiAttributes(this, "RestApi", {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId,
    });

    const deployment = new Deployment(this, "Deployment", { api });

    if (props.methods) {
      for (const method of props.methods) {
        deployment.node.addDependency(method);
      }
    }

    const logGroup = new LogGroup(scope, "REST-api-log-group", {
      retention: RetentionDays.ONE_DAY,
    });

    new Stage(this, "restApiStage", {
      deployment,
      stageName: "with-deploy-stack",
      loggingLevel: MethodLoggingLevel.INFO,
      dataTraceEnabled: true,
      tracingEnabled: true,
      metricsEnabled: true,
      accessLogDestination: new LogGroupLogDestination(logGroup),
      accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
    });
  }
}
