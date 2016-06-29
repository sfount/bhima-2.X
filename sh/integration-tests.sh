#!/bin/bash

# bash script mode
set -uo pipefail

# This assumes you run tests from the top level bhima directory.
echo "Building test database for integration tests ..."


# npm run dev assumes development environment file is settup, export these 
# environment variables
export $(sed -e '/^#/d' .env.development | xargs)

# set build timeout
TIMEOUT=${BUILD_TIMEOUT:-8}

# build the test database
mysql -u $DB_USER -p$DB_PASS -e "DROP DATABASE IF EXISTS $DB_NAME ;"
mysql -u $DB_USER -p$DB_PASS -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8 COLLATE utf8_unicode_ci;"
mysql -u $DB_USER -p$DB_PASS $DB_NAME < server/models/schema.sql
mysql -u $DB_USER -p$DB_PASS $DB_NAME < server/models/procedures.sql
mysql -u $DB_USER -p$DB_PASS $DB_NAME < server/models/test/data.sql

echo "Building server ...."

# build and start the server
./node_modules/.bin/gulp build
cd bin
NODE_ENV=development node server/app.js &
NODE_PID=$!

# make sure we have enough time for the server to start
echo "Sleeping for $TIMEOUT seconds."
sleep $TIMEOUT

echo "Running tests ..."

# run the tests
../node_modules/.bin/mocha server/test/api/

echo "Cleaning up test instance"

# kill the server
kill $NODE_PID
