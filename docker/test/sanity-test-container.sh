#!/usr/bin/bash

PROJECT_DIR=$(readlink -f "$(dirname "$BASH_SOURCE")/../..")
VERSION=$(node -e "process.stdout.write(require('./package.json').version)")
TAGS=("$VERSION" "latest")

echo "Container Image Sanity"
for TAG in ${TAGS[@]}
do
  echo ""
  echo ""
  echo "  with tag '$TAG'"
  echo ""
  echo "    should successfully lint README.md"
  echo ""
  DOCKER_CMD="docker run --rm -v $PROJECT_DIR:/workdir davidanson/markdownlint-cli2:$TAG README.md"
  CMD_OUTPUT=$($DOCKER_CMD 2>&1)
  CMD_EXITCODE=$?
  if [ $CMD_EXITCODE -eq 0 ]; then
    echo "      TEST PASSED!"
  else
    echo "      $DOCKER_CMD"
    echo "$CMD_OUTPUT" | sed 's/^/        /'
    echo "      exit code: $CMD_EXITCODE"
    echo "      TEST FAILED!"
  fi
done
echo ""
echo "Test suite completed"