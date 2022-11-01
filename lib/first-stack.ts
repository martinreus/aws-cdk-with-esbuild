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
  Cors,
  Deployment,
  LambdaIntegration,
  Method,
  MockIntegration,
  PassthroughBehavior,
  RestApi,
  Stage,
} from "aws-cdk-lib/aws-apigateway";

// const fn = new NodejsFunction(this, "chusme", {
//   entry: path.join(__dirname, "..", "src", "index.ts"),
//   handler: "test",
//   runtime: Runtime.NODEJS_16_X,
// });

export class FirstStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "integ-restapi-import-RootStack");

    const restApi = new RestApi(this, "RestApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ["*"],
        allowCredentials: true,
      },
      deploy: false,
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
    const booksStack = new BooksStack(this, {
      restApiId: restApi.restApiId,
      rootResourceId: restApi.restApiRootResourceId,
    });
    new DeployStack(this, {
      restApiId: restApi.restApiId,
      methods: petsStack.methods.concat(booksStack.methods),
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

    const method = api.root.addResource("pets").addMethod(
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

class BooksStack extends NestedStack {
  public readonly methods: Method[] = [];

  constructor(scope: Construct, props: ResourceNestedStackProps) {
    super(scope, "integ-restapi-import-BooksStack", props);

    const api = RestApi.fromRestApiAttributes(this, "RestApi", {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId,
    });

    const method = api.root.addResource("books").addMethod(
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

  readonly methods?: Method[];
}

class DeployStack extends NestedStack {
  constructor(scope: Construct, props: DeployStackProps) {
    super(scope, "integ-restapi-import-DeployStack", props);

    const deployment = new Deployment(this, "Deployment", {
      api: RestApi.fromRestApiId(this, "RestApi", props.restApiId),
    });
    if (props.methods) {
      for (const method of props.methods) {
        deployment.node.addDependency(method);
      }
    }
    new Stage(this, "Stage", { deployment });
  }
}
