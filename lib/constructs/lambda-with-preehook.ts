import { Duration } from "aws-cdk-lib";
import {
  LambdaDeploymentConfig,
  LambdaDeploymentGroup,
} from "aws-cdk-lib/aws-codedeploy";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Alias, Function, Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export interface LProps {
  // metric5xxAlarm: IAlarm;
  lambdaProps: NodejsFunctionProps;
}

/**
 * Building block for creating a lambda function with a prehook function that can be used
 * to test deployment success on AWS.
 */
export class LambdaWithPreehook extends Construct {
  public lambdaAlias: Alias;
  public lambdaFunc: Function;
  public prehookLambdaFunc?: Function;

  /**
   * Constructs a new lambda with preehook lambda assigned to a deploy group
   *
   * @param scope scope of this lambda
   * @param id id for this lambda, for instace "Customer" or "ICP"
   * @param props additional required properties
   * @param prehookProps prehook lambda configuration for this lambda; if left empty, no prehook will be configured.
   *                     When configuring a prehook lambda, an environment var called lambdaFunctionName will be
   *                     injected into the process envs, and can be used to invoke the lambda function
   */
  constructor(
    scope: Construct,
    id: string,
    props: LProps,
    prehookProps?: LProps
  ) {
    super(scope, id);

    // lambda:
    this.lambdaFunc = new NodejsFunction(scope, `${id}LambdaFunction`, {
      description: `Function generated on: ${new Date().toISOString()}`,
      tracing: Tracing.ACTIVE,
      bundling: {
        externalModules: [],
      },
      logRetention: RetentionDays.THREE_MONTHS,
      runtime: Runtime.NODEJS_16_X,
      ...props.lambdaProps,
    });

    // deployment:
    this.lambdaAlias = new Alias(this, `${id}LambdaAlias`, {
      aliasName: "Live",
      version: this.lambdaFunc.currentVersion,
    });

    if (prehookProps) {
      const mergedHookProps: NodejsFunctionProps = {
        ...prehookProps.lambdaProps,
        environment: {
          ...prehookProps.lambdaProps.environment,
          lambdaFunctionName: this.lambdaFunc.functionName,
        },
      };
      this.prehookLambdaFunc = new NodejsFunction(
        scope,
        `${id}PreTrafficHookLambdaFn`,
        {
          description: `Function generated on: ${new Date().toISOString()}`,
          tracing: Tracing.ACTIVE,
          bundling: {
            externalModules: [],
          },
          logRetention: RetentionDays.THREE_MONTHS,
          runtime: Runtime.NODEJS_16_X,
          timeout: Duration.minutes(1),
          ...mergedHookProps,
        }
      );
      this.lambdaFunc.grantInvoke(this.prehookLambdaFunc);
    }

    new LambdaDeploymentGroup(this, `${id}LambdaDeploymentGroup`, {
      alias: this.lambdaAlias,
      preHook: this.prehookLambdaFunc,
      deploymentConfig: LambdaDeploymentConfig.ALL_AT_ONCE,
      ignorePollAlarmsFailure: true,
      // alarms: [props.metric5xxAlarm]
    });
  }

  public addToRolePolicy = (policyStatement: PolicyStatement) => {
    this.lambdaFunc.addToRolePolicy(policyStatement);
  };
}
