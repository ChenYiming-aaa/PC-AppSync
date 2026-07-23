#!/bin/bash
set -e
node src/seed.js
node scripts/seed-admin.js
node src/index.js
