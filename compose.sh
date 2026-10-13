#!/usr/bin/env sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
command_name=${1:-help}
if [ "$#" -gt 0 ]; then
  shift
fi

case "$command_name" in
  config|build|logs)
    exec docker compose --project-directory "$project_dir" -f "$project_dir/compose.yml" "$command_name" "$@"
    ;;
  status)
    exec docker compose --project-directory "$project_dir" -f "$project_dir/compose.yml" ps "$@"
    ;;
  start)
    exec docker compose --project-directory "$project_dir" -f "$project_dir/compose.yml" up -d --build "$@"
    ;;
  stop)
    exec docker compose --project-directory "$project_dir" -f "$project_dir/compose.yml" stop "$@"
    ;;
  restart)
    exec docker compose --project-directory "$project_dir" -f "$project_dir/compose.yml" restart "$@"
    ;;
  test)
    exec docker compose --project-directory "$project_dir" -f "$project_dir/compose.yml" run --rm frontend sh -lc 'npm run typecheck && npm test'
    ;;
  help|-h|--help)
    printf '%s\n' \
      'Usage: ./compose.sh {config|build|start|stop|restart|logs|status|test}' \
      '  start   Build if needed and start the frontend development server' \
      '  test    Run TypeScript checks and unit tests in the development container'
    ;;
  *)
    printf 'Unknown command: %s\n' "$command_name" >&2
    printf '%s\n' 'Usage: ./compose.sh {config|build|start|stop|restart|logs|status|test}' >&2
    exit 2
    ;;
esac
