import { defineConfig } from "vitest/config";

export default defineConfig({
  // Empty postcss config so Vite doesn't try to load the project's
  // postcss.config.js (which is meant for the Hugo CSS build, not tests).
  css: { postcss: {} },
  test: {
    include: ["netlify/functions/**/*.test.ts"],
    environment: "node",
  },
});
