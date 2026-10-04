#!/bin/sh
set -eu
./node_modules/.bin/tsx scripts/check-env.ts
./node_modules/.bin/prisma migrate deploy
exec node server.js
