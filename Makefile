build-inkvisitor:
	docker build -f Dockerfile -t inkvisitor:latest --build-arg="ENV=production" . && docker save inkvisitor:latest | gzip > inkvisitor.tar.gz