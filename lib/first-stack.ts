import { aws_s3 as s3, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Ec2TaskDefinition } from "aws-cdk-lib/aws-ecs";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export class FirstStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const bu = new s3.Bucket(this, "MyFirstBucket", {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      bucketName: "chusme",
    });
    // example resource
    // const queue = new sqs.Queue(this, 'FirstQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // const cluster = new Cluster(this, "Cluster");
    // cluster.addAsgCapacityProvider(new AsgCapacityProvider());

    const taskDef = new Ec2TaskDefinition(this, "asdasd");

    // const taskDef = new TaskDefinition(this, "chusme", {
    //   compatibility: Compatibility.EC2,
    // });
    // const service = new Ec2Service(this, "svc", {
    //   cluster,
    //   taskDefinition: taskDef,
    // });

    const codeAsset = Code.fromAsset("./src");

    const fn = new Function(this, "chusme", {
      code: codeAsset,
      handler: "main",
      runtime: Runtime.GO_1_X,
      environment: {
        S3_ARN: bu.bucketArn,
      },
    });

    bu.grantReadWrite(fn);
  }
}
