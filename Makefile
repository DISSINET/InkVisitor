deploy-backend:
	git checkout master && git pull && cd ./packages/server && npm run build && cd ../.. && ./deploy-backend.sh

deploy-frontend:
	git checkout master && git pull && cd ./packages/client && npm run build && cd ../.. && ./deploy-frontend.sh