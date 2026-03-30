# Git Hooks

Autark can install a `pre-push` hook that triggers deployment proposals automatically when you push a selected branch.

## Setup

Interactive setup:

```bash
autark setup
```

Example with explicit values:

```bash
autark setup --branch genesis --build-command "npm run build"
```

The command installs:

```text
.git/hooks/pre-push
```

## What the Hook Does

When you push the configured branch, the hook:

1. checks the current branch name
2. runs the configured build command
3. verifies the build output directory exists
4. runs `autark deploy <buildDir>`
5. cancels the push if deployment fails

## Example Demo Hook

For the example-site demo flow, a build command can copy the demo assets into the deployment directory:

```bash
autark setup --branch genesis --build-command "mkdir -p src/test/fixtures/example-site/dist && cp src/test/fixtures/example-site/index.html src/test/fixtures/example-site/script.js src/test/fixtures/example-site/dist/"
```

## View or Remove the Hook

```bash
cat .git/hooks/pre-push
rm .git/hooks/pre-push
```

Reinstall with overwrite:

```bash
autark setup --force
```

## Notes

- the hook runs from the repository root
- the build command should produce or refresh the deployment directory used by `autark deploy`
- if deployment fails, the push is blocked intentionally
