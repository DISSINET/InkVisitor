build-inkvisitor:
	docker build -f Dockerfile -t inkvisitor:latest --build-arg="ENV=production" . && docker save inkvisitor:latest | gzip > inkvisitor.tar.gz

build-inkvisitor-staging:
	docker build -f Dockerfile -t inkvisitor:staging --build-arg="ENV=staging" . && docker save inkvisitor:staging | gzip > inkvisitor-staging.tar.gz

build-inkvisitor-sandbox:
	docker build -f Dockerfile -t inkvisitor:sandbox --build-arg="ENV=sandbox" . && docker save inkvisitor:sandbox | gzip > inkvisitor-sandbox.tar.gz

build-niort:
	docker build -f Dockerfile -t inkvisitor:niort --build-arg="ENV=niort" . && docker save inkvisitor:niort | gzip > inkvisitor-niort.tar.gz