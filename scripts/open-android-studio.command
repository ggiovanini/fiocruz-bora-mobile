#!/bin/zsh
set -eu
BORA_ROOT="${0:A:h:h}"
BORA_NODE_DIR="$HOME/.nvm/versions/node/v22.11.0/bin"
if [[ ! -x "$BORA_NODE_DIR/node" ]]; then
  echo "Node 22.11.0 não encontrado em $BORA_NODE_DIR."
  exit 1
fi
export PATH="$BORA_NODE_DIR:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
"$BORA_ROOT/android/gradlew" -p "$BORA_ROOT/android" --stop
/usr/bin/open -a 'Android Studio' --env "PATH=$PATH" "$BORA_ROOT/android"
