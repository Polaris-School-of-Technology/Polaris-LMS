FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . ./

# Vite only exposes env vars at build time. Load VITE_* from env.json (if present)
# so production builds include VITE_GOOGLE_CLIENT_ID, base URLs, etc.
RUN if [ -f env.json ]; then \
      node -e "const e=require('./env.json'); for (const [k,v] of Object.entries(e)) { if (k.startsWith('VITE_')) process.stdout.write(k+'='+String(v)+'\\n'); }" > .env.build; \
      export $(cat .env.build | xargs) && npm run build; \
    else \
      npm run build; \
    fi

FROM node:20-alpine AS runtime
WORKDIR /usr/src/app

RUN npm install -g serve
COPY --from=build /usr/src/app/dist ./dist

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "serve -s dist -l ${PORT}"]