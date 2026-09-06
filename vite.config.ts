/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: [
        "src/features/pagination/buildBlocks.ts",
        "src/features/pagination/distribute.ts",
        "src/shared/lib/sanitize.ts",
        "src/shared/lib/localized.ts",
        "src/store/migrations.ts",
      ],
      exclude: [],
      thresholds: {
        statements: 100,
        lines: 100,
        functions: 100,
        branches: 90,
      },
    },
  },
});
