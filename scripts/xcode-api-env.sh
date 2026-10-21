# Sourced by the app bundle phase, after Xcode environment overrides.
if [[ "$CONFIGURATION" != *Debug* ]]; then
  BORA_ARCHIVE_API_URL=$("$NODE_BINARY" "$PROJECT_ROOT/scripts/testflight-env.cjs" "$PROJECT_ROOT/.env.testflight") || exit 1
  export EXPO_PUBLIC_API_URL="$BORA_ARCHIVE_API_URL"
  # The Release bundle must not inherit a previous Expo dotenv loading context.
  unset __EXPO_ENV_LOADED
  echo "Bóra Release: API definida pelo arquivo .env.testflight."
fi
