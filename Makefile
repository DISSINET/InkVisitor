deploy-backend:
	git checkout master && git pull && cd ./packages/server && npm run build && cd ../.. && ./deploy-backend.sh

deploy-frontend:
	git checkout master && git pull && cd ./packages/client && npm run build && cd ../.. && ./deploy-frontend.sh

deploy-dev-backend:
	git checkout master && git pull && cd ./packages/server && npm run build && cd ../.. && ./deploy-dev-backend.sh

deploy-dev-frontend:
	git checkout master && git pull && cd ./packages/client && npm run build && cd ../.. && ./deploy-dev-frontend.sh