import { defineConfig } from "vitest/config";

// Standalone Free-build test config. Declared explicitly so Vitest does not
// walk up to a parent workspace config.
export default defineConfig({
  test: {
    projects: ["packages/core", "packages/cli", "packages/api"],
  },
});
