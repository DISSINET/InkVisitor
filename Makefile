deploy-backend:
	git checkout master && git pull && cd ./packages/server && npm run build && cd ../.. && ./deploy-backend.sh

deploy-frontend:
	git checkout master && git pull && cd ./packages/client && npm run build && cd ../.. && ./deploy-frontend.sh

deploy-dev-backend:
	git checkout master && git pull && cd ./packages/server && npm run build && cd ../.. && ./deploy-dev-backend.sh

deploy-dev-frontend:
	git checkout master && git pull && cd ./packages/client && npm run build && cd ../.. && ./deploy-dev-frontend.sh

build-staging:
	docker build -f Dockerfile -t inkvisitor:staging --build-arg="ENV=staging" . && docker save inkvisitor:staging -o inkvisitor-staging.tar

build-sandbox:
	docker build -f Dockerfile -t inkvisitor:sandbox --build-arg="ENV=sandbox" . && docker save inkvisitor:sandbox -o inkvisitor-sandbox.tar

build-data-import:
	docker build -f Dockerfile -t inkvisitor:data-import --build-arg="ENV=data-import" . && docker save inkvisitor:data-import -o inkvisitor-data-import.tar
