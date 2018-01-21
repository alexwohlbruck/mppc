# MPPC Google Assistant Actions

### Build
1. Make sure you have installed the [AWS CLI](https://aws.amazon.com/cli) and [http://www.7-zip.org](7zip) and added the corresponding executables to your computer's [environment variable PATH](https://www.computerhope.com/issues/ch000549.htm).
2. Configure your [IAM user credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-config-files.html) for the AWS CLI .
3. Run `npm run build` to transpile, compress, and upload code to AWS Lambda.

### Test
- Install the [`nodemon`](https://github.com/remy/nodemon) package globally using npm.

- Run `npm start` to start a development server on `localhost:8080`. Each action inside `./src` will correspond with an endpoint on the server, for example the `podcast` action can be accessed at `POST /podcast`. This is for testing only.

- Add your AWS credentials to environment variables or in `.aws/credentials` in order to test actions that access AWS data.