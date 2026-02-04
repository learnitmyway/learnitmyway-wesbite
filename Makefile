.PHONY: \
	build \
	dev \
	postcss postcss/watch \

build: postcss
	hugo

dev:
	npx parallelshell 'netlify dev' 'make postcss/watch'

postcss := npx postcss src/css/styles.css --dir static/dist/ styles.css

postcss:
	${postcss}

postcss/watch:
	${postcss} --watch