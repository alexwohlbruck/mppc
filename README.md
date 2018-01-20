# MPPC Google Assistant Actions

### Build
- Make sure you have installed the [https://aws.amazon.com/cli/](AWS CLI) and [http://www.7-zip.org](7zip) and added the corresponding executables to your computer's [https://www.computerhope.com/issues/ch000549.htm](environment variable PATH)
- Configure your [https://docs.aws.amazon.com/cli/latest/userguide/cli-config-files.html](IAM user credentials) for the AWS CLI 
- Run `npm run build` to transpile, compress, and upload code to AWS Lambda

### Test
Run `npm start` to start a development server on `localhost:8080`. Each action inside ./src will correspond with an endpoin on the server, for example the `podcast` action can be accessed at `POST /podcast`.