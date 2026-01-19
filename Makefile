SHELL=/bin/bash
APP_NAME=scaffold
BACKEND_NAME=scaffold_api
FRONTEND_NAME=scaffold_frontend

BACKEND=${CURDIR}/${BACKEND_NAME}
FRONTEND=../${FRONTEND_NAME}

set-python-path=export PYTHONPATH=${BACKEND}

OS := $(shell uname)
ARCH := $(shell uname -m)

COMPOSE_PROJECT?=${APP_NAME}
COMPOSE_PROFILES?=d,b,g

LOG_LEVEL?=info

# Set platform for docker-compose based on OS and ARCH
ifeq (${OS},Darwin)
    ifeq (${ARCH},arm64)
        PLATFORM=linux/arm64/v8
    else
        PLATFORM=linux/amd64
    endif
else
    PLATFORM=linux/amd64
endif


sync:
	@cd ${BACKEND} && uv sync --all-extras --dev --no-cache

sync-no-cache:
	@cd ${BACKEND} && uv sync --all-extras --dev --no-cache

pre-commit-install: sync
	@cd ${BACKEND} && uv run pre-commit install

pre-commit-uninstall:
	@cd ${BACKEND} && uv run pre-commit uninstall

pre-commit-run:
	@cd ${BACKEND} && uv run pre-commit run --all-files

compose-build-backend:
	@PLATFORM=${PLATFORM} \
	COMPOSE_PROFILES=d,b \
	docker compose build ${BACKEND_NAME}

compose-build-frontend:
	@PLATFORM=${PLATFORM} \
	COMPOSE_PROFILES=f \
	docker compose -f docker-compose.yaml -f docker-compose.build.yaml build

COMPOSE_TIMEOUT?=120
compose-healthcheck:
	@timeout=${COMPOSE_TIMEOUT}; \
	while [ "$$timeout" -gt 0 ] && [ "$$(docker compose -p $(COMPOSE_PROJECT) ps | grep -E 'starting|unhealthy')" ]; do \
		echo "Waiting for services to become healthy..."; \
		sleep 5; \
		timeout=$$((timeout - 5)); \
	done; \
	if [ "$$timeout" -le 0 ]; then \
		echo "Timed out waiting for services to become healthy"; \
		exit 1; \
	fi; \
	if [ "$$(docker compose -p $(COMPOSE_PROJECT) ps | grep 'unhealthy')" ]; then \
		echo "One of more services are unhealthy"; \
		exit 1; \
	fi; \
	echo "All services are healthy"

compose-check-container-exit:
	@failed_migrations=$$(docker compose -p $(COMPOSE_PROJECT) ps -aq $(CONTAINER_NAME) | \
		xargs docker inspect -f '{{ .State.ExitCode }}' | \
		grep -v '^0' | \
		wc -l | \
		tr -d ' '); \
	failed_migrations=$${failed_migrations:-0}; \
	if [ "$$failed_migrations" -ne 0 ]; then \
		echo "Detected failed migrations, exiting with error"; \
		exit 1; \
	fi;

BUILD?=1
compose-up:
	@cmd="docker compose --env-file ${BACKEND}/.env up"; \
	if [ "${BUILD}" -eq 1 ]; then \
		cmd="$$cmd --build"; \
	fi; \
	LOG_LEVEL=${LOG_LEVEL} \
	PLATFORM=${PLATFORM} COMPOSE_PROFILES=${COMPOSE_PROFILES} \
	$$cmd -d; \
	${MAKE} compose-healthcheck


compose-down:
	@COMPOSE_PROFILES=${COMPOSE_PROFILES} docker compose down

compose-breakdown:
	@COMPOSE_PROFILES=a docker compose down -v

compose-dependencies:
	@${MAKE} compose-up COMPOSE_PROFILES=d

compose-backend:
	@${MAKE} compose-build-backend
	@${MAKE} compose-up COMPOSE_PROFILES=d,b,s

compose-frontend:
	@${MAKE} compose-up COMPOSE_PROFILES=d,f

compose-frontend-prod:
	@${MAKE} compose-build-frontend
	@PLATFORM=${PLATFORM} COMPOSE_PROFILES=f \
	docker compose -f docker-compose.yaml -f docker-compose.build.yaml up -d

compose-down-backend:
	@COMPOSE_PROFILES=b docker compose down

IS_E2E?=0
COMPOSE_PROFILES_TEST?=d,l
compose-test-containers:
	@cmd="docker compose -f ${BACKEND}/tests/docker-compose.yaml --env-file ${BACKEND}/.env up"; \
	if [ "${BUILD}" -eq 1 ]; then \
		cmd="$$cmd --build"; \
	fi; \
	IS_E2E=${IS_E2E} PLATFORM=${PLATFORM} COMPOSE_PROFILES=${COMPOSE_PROFILES_TEST} $$cmd -d;
	${MAKE} compose-healthcheck COMPOSE_PROJECT=tests
	@${MAKE} compose-check-container-exit COMPOSE_PROJECT=tests CONTAINER_NAME=db_migrate
	@${MAKE} compose-check-container-exit COMPOSE_PROJECT=tests CONTAINER_NAME=db_populate
	@${MAKE} compose-check-container-exit COMPOSE_PROJECT=tests CONTAINER_NAME=scaffold_test_api

compose-down-test-containers:
	@PLATFORM=${PLATFORM} COMPOSE_PROFILES=a \
	docker compose -f ${BACKEND}/tests/docker-compose.yaml --env-file ${BACKEND}/.env down

compose-breakdown-test-containers:
	@PLATFORM=${PLATFORM} COMPOSE_PROFILES=a \
	docker compose -f ${BACKEND}/tests/docker-compose.yaml --env-file ${BACKEND}/.env down -v

compose-test-e2e-containers:
	@${MAKE} compose-test-containers COMPOSE_PROFILES_TEST=d,b,l,s IS_E2E=1

prune-images:
	@docker image prune -f

prune-all:
	@docker system prune -a --volumes

# applies migrations to database tables
# e.g. DB_URI="postgresql://admin:admin_pass@localhost:7777/scaffold_db" make db-migrate"
db-migrate:
	@cd ${BACKEND} && \
	${set-python-path} && \
	uv run alembic -x db_url=${DB_URI} upgrade head

db-add-migration:
	@cd ${BACKEND} && \
	${set-python-path} && \
	uv run alembic upgrade head && \
	uv run alembic revision --autogenerate -m "${MESSAGE}"

db-populate:
	@cd ${BACKEND} && \
	${set-python-path} && \
	uv run python ${BACKEND}/app/db/setup/init_db.py

db-refresh: compose-breakdown compose-dependencies db-migrate db-populate

backend-run-local: sync
	@-docker stop ${BACKEND_NAME}
	@cd ${BACKEND} && \
	${set-python-path} && \
	LOG_LEVEL=${LOG_LEVEL} \
	uv run uvicorn app.main:app \
	--host 0.0.0.0 --port 8123 \
	--reload --log-level ${LOG_LEVEL}

frontend-install-local:
	@if [ -d "${FRONTEND}/node_modules" ]; then echo "already installed";  else cd ${FRONTEND} && pnpm i --frozen-lockfile; fi

frontend-run-local:
	cd ${FRONTEND} && pnpm run dev

test: test-backend

test-backend: sync compose-test-containers
	@cd ${BACKEND} && APP_ENV=local:host uv run pytest tests \
	-c pyproject.toml --cov-config=setup.cfg \
	-n auto -rpF
	@${MAKE} compose-down-test-containers

test-backend-single-thread: sync compose-test-containers
	@cd ${BACKEND} && APP_ENV=local:host uv run pytest tests \
	-c pyproject.toml --cov-config=setup.cfg \
	-vv -rpfP
	@${MAKE} compose-down-test-containers

test-unit-backend: sync compose-test-containers
	@cd ${BACKEND} && APP_ENV=local:host uv run pytest tests/unit_tests \
	-c pyproject.toml --cov-config=setup.cfg \
	-n auto -rpF
	@${MAKE} compose-down-test-containers

test-integration-backend: sync compose-test-containers
	@APP_ENV=local:host uv run pytest tests/integration_tests/ \
	-c pyproject.toml --cov-config=setup.cfg \
	-n 4 -rpF

mypy:
	@cd ${BACKEND} && uv run mypy .

ruff:
	@cd ${BACKEND} && uv run ruff format .
	@cd ${BACKEND} && uv run ruff check --fix

lint: ruff mypy pre-commit-run

lint-backend: ruff mypy pre-commit-run
	@cd ${BACKEND} && uv run mypy .

hadolint:
	@find . -type f \( -iname '*Dockerfile*' -or -iname '*.dockerfile' \) -print0 | xargs -0 hadolint


service-account-key-backend:
	@gcloud iam service-accounts keys create ./gcp-backend-sa-key.json \
	--iam-account=backend-sa-dev@scaffold-dev.iam.gserviceaccount.com
