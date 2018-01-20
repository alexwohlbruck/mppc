rm build.zip
7z a -r ./build.zip *
aws lambda update-function-code --function-name mppc-google-assistant-actions --zip-file fileb://build.zip