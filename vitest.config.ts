import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      // The real `server-only` package throws outside RSC environments;
      // unit tests run in plain Node, so swap in an empty module.
      "server-only": path.resolve(root, "test/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
