ARG WORKDIR="/app"
FROM node:22-alpine AS base

FROM base AS dev-base
ARG WORKDIR
WORKDIR ${WORKDIR}
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && \
    apk add --no-cache libc6-compat=1.2.2-r9 dumb-init=1.2.5-r3 bash=5.3.3-r1
COPY .npmrc package.json pnpm-lock.yaml* ./

FROM dev-base AS dev
ARG WORKDIR
WORKDIR ${WORKDIR}
ARG DEV_ENV_FILE=.env.local.docker
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm i --frozen-lockfile
COPY . .
RUN cp $DEV_ENV_FILE .env.development
EXPOSE 3000

FROM dev-base AS builder
ARG WORKDIR
ARG ENV_FILE=.env.placeholder
WORKDIR ${WORKDIR}
ENV NODE_ENV=production \
    DEPLOYMENT=container \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=dev ${WORKDIR} ./
RUN cp $ENV_FILE .env.production \
    && pnpm build

FROM base AS runner
ARG WORKDIR
ARG ENV_FILE=.env.placeholder
WORKDIR ${WORKDIR}
EXPOSE 3000
ENV PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NODE_ENV=production \
    DEPLOYMENT=container \
    NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs
USER nextjs
COPY --from=builder /bin/bash /bin/bash
COPY --from=builder /usr/lib/libreadline.so.8 /usr/lib/
COPY --from=builder /usr/lib/libncursesw.so.6 /usr/lib/
COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=builder ${WORKDIR}/${ENV_FILE} .
# The public and .next/static folders are not copied by default as these should ideally be handled by a CDN
# https://nextjs.org/docs/pages/api-reference/next-config-js/output#automatically-copying-traced-files
COPY --from=builder ${WORKDIR}/public ./public
COPY --from=builder --chown=nextjs:nodejs ${WORKDIR}/.contentlayer ./
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs ${WORKDIR}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs ${WORKDIR}/.next/static ./.next/static

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
