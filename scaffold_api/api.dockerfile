ARG USER="scaffold"
ARG WORKDIR="/home/${USER}_api"
FROM python:3.13-slim-bookworm AS base

FROM base AS build
ARG USER
ARG WORKDIR
WORKDIR ${WORKDIR}

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PYTHONPATH=${WORKDIR} \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=0 \
    UV_PYTHON_DOWNLOADS=never \
    UV_PYTHON=/opt/.venv/bin/python3.13 \
    UV_PROJECT_ENVIRONMENT=/opt/.venv

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN groupadd -r ${USER} && useradd -r -g ${USER} --shell /bin/bash ${USER} \
    && apt-get update && apt-get install -y --no-install-recommends \
        curl=7.* \
        ca-certificates=20* \
        build-essential=12* \
        git=1:2.* \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* ~/.cache/* /usr/share/doc/*

COPY --from=ghcr.io/astral-sh/uv:0.6.14 /uv /usr/local/bin/uv

RUN python -m venv /opt/.venv
ENV PATH="/opt/.venv/bin:$PATH"

# Install dependencies
ARG INSTALL_DEV=false
RUN --mount=type=cache,target=/root/.cache \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    if [ "$INSTALL_DEV" = "true" ]; then \
        uv sync --locked --dev --no-install-workspace; \
    else \
        uv sync --locked --no-dev --no-install-workspace; \
    fi

COPY . .

# Sync the project
RUN --mount=type=cache,target=/root/.cache \
    if [ "$INSTALL_DEV" = "true" ]; then \
        uv sync --locked --dev --no-editable; \
    else \
        uv sync --locked --no-dev --no-editable; \
    fi

RUN chown -R ${USER}:${USER} ./

FROM base AS runner
ARG USER
ARG WORKDIR
WORKDIR ${WORKDIR}

ARG MAINTAINER="saran@tanantor.com"
LABEL maintainer=${MAINTAINER}

ENV WORKDIR=${WORKDIR} \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PYTHONPATH=${WORKDIR} \
    PATH="/opt/.venv/bin:$PATH"

RUN groupadd -r ${USER} && useradd -r -g ${USER} ${USER} \
    && apt-get update && apt-get install -y --no-install-recommends \
        tini=0.19.0-1+b3 \
        # PostgreSQL client tools for backup/restore operations:
        postgresql-client=15+248+deb12u1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* ~/.cache/* /usr/share/doc/* \
    && mkdir -p /tmp/nltk_data /tmp/matplotlib \
    && chown -R ${USER}:${USER} /tmp/nltk_data /tmp/matplotlib

USER ${USER}
EXPOSE 8123

COPY --from=build /opt/.venv /opt/.venv
COPY --from=build ${WORKDIR} .

ENTRYPOINT ["tini", "-g", "--"]
CMD ["./entry/api/start.sh"]
