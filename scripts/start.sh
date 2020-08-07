#!/usr/bin/env bash

set -ev

# localhost:8889 is the proxy target for development
{ (cd server && PORT=8889 npm run start) & (cd web && npm run start); }
