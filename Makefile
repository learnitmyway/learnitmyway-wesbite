.PHONY: \
	build \
	dev \
	test \
	postcss postcss/watch \

build: test postcss
	hugo

test:
	npm test

dev:
	npx parallelshell 'netlify dev' 'make postcss/watch'

postcss := npx postcss src/css/styles.css --dir static/dist/ styles.css

postcss:
	${postcss}

postcss/watch:
	${postcss} --watch