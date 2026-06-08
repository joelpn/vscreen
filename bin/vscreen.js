#!/usr/bin/env node

// We use tsx for development, but in production this will point to dist/index.js.
// Since we don't compile this bin file, we dynamically import the built index.
// When developing, you should run `pnpm dev` which uses `tsx src/index.ts`.

import { runCli } from "../dist/index.js";

runCli();
