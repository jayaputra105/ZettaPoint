---
name: Expo artifact port conflicts
description: Pitfalls when createArtifact conflicts with an existing workflow or backup directory in the same monorepo
---

## The problem
When `createArtifact` is called for an Expo app and a **backup copy** of that artifact also exists as a workspace package with the **same `name` field** in its `package.json`, pnpm's `--filter @workspace/<name>` matches both directories. The dev script runs in both, causing the second to fail with `EADDRINUSE` on the assigned port.

Additionally, if an old workflow for the same artifact is still running when the new artifact's workflow starts, the old one holds the port and the new one fails immediately.

## Fix
1. Rename the backup's `package.json` `name` field to something unique (e.g. `@workspace/zettapoint-mobile-backup`) before the new workflow starts.
2. Call `removeWorkflow({ name: "..." })` to stop any old workflow that occupies the same port, then `fuser -k <PORT>/tcp` if the process lingers.
3. Only then restart the newly registered workflow.

**Why:** pnpm workspace filters are name-based, not path-based. Two packages with the same name in the same workspace will both match a `--filter` command even if only one is intended.

**How to apply:** Any time you create a backup copy of an Expo artifact directory and keep it in the workspace, immediately rename its package name to avoid filter collisions.
