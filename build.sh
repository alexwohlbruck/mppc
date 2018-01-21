echo 'Transpiled with Babel'

7z a -r ./build.zip *
echo 'Zipped directory'

aws lambda update-function-code --function-name mppc-google-assistant-actions --zip-file fileb://build.zip
echo 'Upload completed'

rm build.zip
echo 'Removed build.zip'

rm -rf build
echo 'Removed ./build'