const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const port = 3000;

app.use(bodyParser.json());

AWS.config.update({ region: 'us-east-1' });

app.post('/create-lambda', (req, res) => {
    const functionName = req.body.functionName;
    const stackName = `lambda-stack-${functionName}`;

    // Write the CloudFormation template to a file
    const template = `
    AWSTemplateFormatVersion: '2010-09-09'
    Transform: 'AWS::Serverless-2016-10-31'
    Resources:
      ${functionName}:
        Type: 'AWS::Serverless::Function'
        Properties:
          Handler: index.handler
          Runtime: nodejs14.x
          CodeUri: .
          MemorySize: 128
          Timeout: 30
    `;

    fs.writeFileSync('template.yaml', template);

    // Use AWS SAM to package and deploy the CloudFormation stack
    exec(`sam deploy --template-file template.yaml --stack-name ${stackName} --capabilities CAPABILITY_IAM --no-fail-on-empty-changeset --parameter-overrides FunctionName=${functionName}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            res.status(500).json({ message: 'Failed to create Lambda function' });
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        res.status(200).json({ message: 'Lambda function created successfully' });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:3000`);
});