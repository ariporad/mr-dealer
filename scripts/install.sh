#!/usr/bin/env bash

set -e

echo "Installing Client Dependencies..."
cd web
npm install
cd ..

echo "Installing Server Dependencies..."
cd server
npm install
cd ..