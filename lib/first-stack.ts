import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import {
  LoggingLevel,
  SlackChannelConfiguration,
} from "aws-cdk-lib/aws-chatbot";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  FilterPattern,
  LogGroup,
  MetricFilter,
  RetentionDays,
} from "aws-cdk-lib/aws-logs";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import * as path from "path";

export class FirstStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    //   const logGroup = new LogGroup(this, "log-group", {
    //     removalPolicy: RemovalPolicy.DESTROY,
    //     retention: RetentionDays.ONE_DAY,
    //   });

    const fn = new NodejsFunction(this, "chusme", {
      entry: path.join(__dirname, "..", "src", "index.ts"),
      handler: "test",
      runtime: Runtime.NODEJS_16_X,
    });
    const logGroup = fn.logGroup;

    const errorMetricFilter = new MetricFilter(this, "errorsFilter", {
      filterPattern: FilterPattern.anyTerm("error", "erro", "ERROR"),
      logGroup,
      metricNamespace: this.stackName,
      metricName: "errorsLogged",
    });

    const alarm = new cloudwatch.Alarm(this, "Errors", {
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 0,
      evaluationPeriods: 1,
      metric: errorMetricFilter.metric(),
      alarmDescription:
        "fires when there is an error logged in lambda function",
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    //Creating an SNS topic for the alarm
    const snsTopic = new Topic(this, `LogFilterTopic`, {
      displayName: "errorMetricTopic",
      fifo: false,
    });

    alarm.addAlarmAction(new SnsAction(snsTopic));

    //Configuring a Slack channel with AWS Chatbot
    new SlackChannelConfiguration(this, `LogDriverSlackChannel`, {
      slackChannelConfigurationName: "api-errors",
      slackChannelId: "C04EFF2KGCE",
      slackWorkspaceId: "T03BAHYCQPJ",
      notificationTopics: [snsTopic],
      // loggingLevel: LoggingLevel.ERROR,
    });
  }
}
