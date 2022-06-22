import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  }

  public bucket = (id: string, options: {
    bucketName: string,
  }): s3.CfnBucket => {
    const { bucketName } = options;

    return new s3.CfnBucket(this, id, {
      bucketName,
    });
  };

  public api = (id: string, options: {
    name: string,
    stageName?: string,
    definitionPath: string
  }): apigateway.SpecRestApi => {
    const {
      name, stageName, definitionPath
    } = options;
    return new apigateway.SpecRestApi(this, id, {
      restApiName: name,
      apiDefinition: apigateway.ApiDefinition.fromAsset(definitionPath),
      deployOptions: {
        stageName,
      },
      cloudWatchRole: false
    });
  };

  public createDeployStage = (id: string, options: {
    stageName: string,
    api: apigateway.IRestApi
  }): apigateway.Stage => {
    const {
      stageName, api
    } = options;

    return new apigateway.Stage(this, id, {
      stageName,
      deployment: new apigateway.Deployment(this, 'ApiDeployment', {
        api,
      })
    });
  };

  public lambdaFunction = (id: string, options: {
    entry: string,
    handler: string,
    role: iam.Role,
    runtime: lambda.Runtime,
    functionName?: string,
    layers?: string[],
    timeout?: number,
    memorySize?: number,
    environment?: { [p: string]: string }
  }): lambda.Function => {
    const {
      entry,
      handler,
      role,
      functionName,
      runtime,
      timeout,
      memorySize,
      environment
    } = options;

    return new lambdaNodeJs.NodejsFunction(this, id, {
      functionName,
      entry,
      handler,
      runtime,
      role,
      timeout: timeout ? Duration.minutes(timeout) : undefined,
      memorySize,
      bundling: {
        tsconfig: '../tsconfig.json'
      },
      environment
    });
  };

  public lambdaServiceRole = (id: string, options: {
    roleName?: string,
    policies?: iam.PolicyStatement[]
  }): iam.Role => {
    const { roleName, policies } = options;

    return new iam.Role(this, id, {
      roleName,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com', ),
      inlinePolicies: {
        'policy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [ 'logs:*' ],
              effect: iam.Effect.ALLOW,
              resources: [ '*' ]
            }),
            ...(policies ?? [])
          ]
        })
      }
    });
  };
}
