#!/usr/bin/env bash

set -e

npx tailwindcss -i src/assets/css/input.css -o src/assets/css/output.css
ng build --configuration production
rm docs/*.*.js
cp -r dist/* docs/
