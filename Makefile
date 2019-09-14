default: deps package deploy

deps:
	cd ./hello-world && yarn && cd ../
.PHONY: deps

clean:
	aws cloudformation delete-stack --stack-name schedule
.PHONY clean

package:
	sam package --template-file template.yaml --output-template-file output-template.yaml --s3-bucket REPLACE_THIS_WITH_YOUR_S3_BUCKET_NAME
.PHONY: package

deploy:
	sam deploy --template-file output-template.yaml --stack-name schedule --capabilities CAPABILITY_IAM
.PHONY: deploy