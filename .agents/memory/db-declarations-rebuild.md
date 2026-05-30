---
name: DB declarations rebuild requirement
description: When to rebuild @workspace/db TypeScript declarations after schema changes
---

## Rule
After adding or changing schema files in lib/db/src/schema/, run:
```
pnpm --filter @workspace/db exec tsc -p tsconfig.json
```

This regenerates lib/db/dist/ type declarations. Without this, api-server typecheck
reports "Module '@workspace/db' has no exported member 'users'" etc.

**Why:** @workspace/db uses composite + emitDeclarationOnly mode. The dist/ directory
contains the .d.ts files that downstream packages reference. If you add new schema files
but don't rebuild, the old dist/schema/index.d.ts only exports `{}` (empty).

**How to apply:** Any time you edit lib/db/src/schema/, immediately rebuild declarations
before running typecheck on api-server or other consumers.
