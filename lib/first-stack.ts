import {
  Duration,
  lambda_layer_awscli,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import {
  FlowLog,
  FlowLogDestination,
  FlowLogResourceType,
  FlowLogTrafficType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import * as kinesis from "aws-cdk-lib/aws-kinesis";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Runtime, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import {
  DatabaseClusterEngine,
  DatabaseSecret,
  ServerlessCluster,
} from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import * as path from "path";
import {
  DynamoEventSource,
  KinesisEventSource,
  SqsDlq,
} from "aws-cdk-lib/aws-lambda-event-sources";

export class FirstStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // const stream = new kinesis.Stream(this, "MyStream");

    const deadLetterQueue = new sqs.Queue(this, "deadLetterQueue");
    const deadLetterQueue2 = new sqs.Queue(this, "deadLetterQueue2");
    // data store:
    const testTable = new Table(this, "Companies", {
      tableName: "companies",
      partitionKey: { name: "id", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      // kinesisStream: stream,
      // replicationRegions: ["eu-west-1"],
      stream: StreamViewType.NEW_IMAGE,
    });

    const fn = new NodejsFunction(this, "chusme", {
      functionName: "handler",
      logRetention: RetentionDays.ONE_DAY,
      entry: path.join(__dirname, "..", "src", "index.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });

    const fn2 = new NodejsFunction(this, "chusme2", {
      functionName: "handler2",
      logRetention: RetentionDays.ONE_DAY,
      entry: path.join(__dirname, "..", "src", "index.ts"),
      handler: "handler2",
      runtime: Runtime.NODEJS_16_X,
    });

    // ---------- using dynamodb events
    fn.addEventSource(
      new DynamoEventSource(testTable, {
        startingPosition: StartingPosition.TRIM_HORIZON,
        batchSize: 10,
        bisectBatchOnError: true,
        onFailure: new SqsDlq(deadLetterQueue),
        retryAttempts: 10,
      })
    );

    fn2.addEventSource(
      new DynamoEventSource(testTable, {
        startingPosition: StartingPosition.TRIM_HORIZON,
        batchSize: 10,
        bisectBatchOnError: true,
        onFailure: new SqsDlq(deadLetterQueue2),
        retryAttempts: 10,
      })
    );

    // RDS -------------
    // const lolVpcFlowLogs = new LogGroup(this, "LolVpcFlowLogs", {
    //   retention: RetentionDays.THREE_MONTHS,
    // });
    // const vpc = new Vpc(this, "LolVpc", {
    //   vpcName: "LolVpc",
    //   maxAzs: 99,
    // });
    // const lolVpcFlowLogRole = new Role(this, "LolVpcFlowLogRole", {
    //   assumedBy: new ServicePrincipal("vpc-flow-logs.amazonaws.com"),
    // });
    // new FlowLog(this, "LolVpcFlowLog", {
    //   flowLogName: "LolVpcFlowLog",
    //   trafficType: FlowLogTrafficType.ALL,
    //   resourceType: FlowLogResourceType.fromVpc(vpc),
    //   destination: FlowLogDestination.toCloudWatchLogs(
    //     lolVpcFlowLogs,
    //     lolVpcFlowLogRole
    //   ),
    // });
    // const databaseName = "lolDB";
    // const cluster = new ServerlessCluster(this, "LolAuroraCluster", {
    //   engine: DatabaseClusterEngine.AURORA_MYSQL,
    //   vpc,
    //   removalPolicy: RemovalPolicy.DESTROY,
    //   credentials: { username: "clusteradmin" },
    //   clusterIdentifier: "lol-db",
    //   enableDataApi: true,
    //   defaultDatabaseName: databaseName,
    //   scaling: {
    //     minCapacity: 1,
    //     autoPause: Duration.seconds(0),
    //   },
    // });
    // const secret = cluster.node.children.filter(
    //   (child) => child instanceof DatabaseSecret
    // )[0] as DatabaseSecret;
  }
}
