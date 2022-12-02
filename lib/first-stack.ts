import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import {
  AuthorizationType as AppSyncAuthType,
  FieldLogLevel,
  GraphqlApi,
  MappingTemplate,
  Schema,
  UserPoolDefaultAction,
} from "@aws-cdk/aws-appsync-alpha";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { IUserPool, OAuthScope, UserPool } from "aws-cdk-lib/aws-cognito";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import {
  ServerlessCluster,
  DatabaseSecret,
  DatabaseClusterEngine,
} from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";

const rdsResponseTemplate = `
  ## Raise a GraphQL field error in case of a datasource invocation error
  #if($ctx.error)
      $utils.error($ctx.error.message, $ctx.error.type)
  #end

  $utils.toJson($utils.rds.toJsonObject($ctx.result)[0])
`;

export class FirstStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const vpc = new Vpc(this, "firstVPC", {
      vpcName: "firstVPC",
      maxAzs: 99,
      natGateways: 0,
    });

    // serverless MySQL
    const databaseName = "first";
    const cluster = new ServerlessCluster(this, "FirstDbCluster", {
      engine: DatabaseClusterEngine.AURORA_MYSQL,
      removalPolicy: RemovalPolicy.DESTROY,
      credentials: { username: "clusteradmin" },
      clusterIdentifier: "first-db-cluster",
      enableDataApi: true,
      defaultDatabaseName: databaseName,
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      scaling: {
        minCapacity: 1,
        autoPause: Duration.seconds(0),
      },
    });

    const secret = cluster.node.children.filter(
      (child) => child instanceof DatabaseSecret
    )[0] as DatabaseSecret;

    const userPool = new UserPool(this, "firstUserPool");
    userPool.addClient("first-app-client");

    const graphqlApi = new GraphqlApi(this, "firstGraphqlApi", {
      name: "firstGraphqlApi",
      schema: Schema.fromAsset(path.join(__dirname, "api.graphql")),
      logConfig: {
        retention: RetentionDays.THREE_MONTHS,
        fieldLogLevel: FieldLogLevel.ALL,
      },
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AppSyncAuthType.USER_POOL,
          userPoolConfig: {
            userPool,
            defaultAction: UserPoolDefaultAction.ALLOW,
          },
        },
      },
    });

    const rdsDS = graphqlApi.addRdsDataSource(
      "firstRdsGraphqlDs",
      cluster,
      secret,
      "first"
    );

    const noneDS = graphqlApi.addNoneDataSource("noneDs");

    noneDS.createResolver({
      typeName: "Query",
      fieldName: "getIcpParameters",
      requestMappingTemplate: MappingTemplate.fromString("{}"),
      responseMappingTemplate: MappingTemplate.fromString("{}"),
    });

    rdsDS.createResolver({
      typeName: "IcpParameters",
      fieldName: "industries",
      requestMappingTemplate: MappingTemplate.fromString(`
        {
          "version": "2018-05-29",
          "statements": [ "SELECT id, description FROM searchable_industry WHERE parent_industry_id IS NULL" ],
          "variableMap": {}
        }
      `),
      responseMappingTemplate: MappingTemplate.fromString(rdsResponseTemplate),
    });
  }
}
