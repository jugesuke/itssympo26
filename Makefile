init:
	docker compose build
	npm install
	mkdir -p out
build:
	docker compose run --rm texlive latexmk main.tex
	npm run textlint $$(find . -name "*.tex")
texbuild:
	docker compose run --rm texlive latexmk main.tex
clean:
	docker compose run --rm texlive latexmk -c main.tex
lint:
	npm textlint $$(find . -name "*.tex")
