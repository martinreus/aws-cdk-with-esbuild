import * as aws from "@aws-sdk/client-codedeploy";
import { LifecycleEventStatus } from "@aws-sdk/client-codedeploy";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda"; // ES Modules import
import * as _ from "lodash";
import { v4 } from "uuid";

const codedeploy = new aws.CodeDeploy({ apiVersion: "2014-10-06" });
export type LambdaDeployStatus =
  | LifecycleEventStatus.FAILED
  | LifecycleEventStatus.SUCCEEDED;

export const preTrafficHookWrapper = (
  preTrafficHook: (event: any, context: any) => Promise<LambdaDeployStatus>
) => {
  return async (event: any, context: any) => {
    const deploymentId = event.DeploymentId;
    const lifecycleEventHookExecutionId = event.LifecycleEventHookExecutionId;
    let validationTestResult: LambdaDeployStatus =
      LifecycleEventStatus.SUCCEEDED;

    console.log(
      `Entering create client prehook. (${deploymentId}-${lifecycleEventHookExecutionId})`
    );
    // only perform preehook checks in dev env
    // if (process.env.stage == DEVELOPMENT) {
    try {
      validationTestResult = await preTrafficHook(event, context);
    } catch (e) {
      console.log(`failed lambda traffic prehook; ${JSON.stringify(e)}`);
      validationTestResult = LifecycleEventStatus.FAILED;
    }
    // }

    // Complete the pre hook by sending CodeDeploy the validation status
    var params = {
      deploymentId: deploymentId,
      lifecycleEventHookExecutionId: lifecycleEventHookExecutionId,
      status: validationTestResult, // status can be 'Succeeded' or 'Failed'
    };

    // Pass CodeDeploy the prepared validation test results.
    await codedeploy.putLifecycleEventHookExecutionStatus(params);
  };
};
