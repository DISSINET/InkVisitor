build-inkvisitor:
	docker build -f Dockerfile -t inkvisitor:latest --build-arg="ENV=production" . && docker save inkvisitor:latest | gzip > inkvisitor.tar.gz

build-niort:
	docker build -f Dockerfile -t inkvisitor:niort --build-arg="ENV=niort" . && docker save inkvisitor:niort | gzip > inkvisitor-niort.tar.gz