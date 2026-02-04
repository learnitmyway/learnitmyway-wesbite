.PHONY: \
	browser-sync browser-sync/watch \
	build \
	postcss postcss/watch \
	start

browser-sync := npx browser-sync start --serveStatic 'public'

browser-sync:
	${browser-sync}

browser-sync/watch:
	${browser-sync} --files 'public'

build: postcss
	hugo

postcss := npx postcss src/css/styles.css --dir static/dist/ styles.css

postcss: 
	${postcss}

postcss/watch:
	${postcss} --watch

start:
	npx parallelshell 'hugo --watch' 'make postcss/watch' 'make browser-sync/watch'
	
