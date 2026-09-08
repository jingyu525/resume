/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  base: "/resume/",
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
    // 含 .mjs：规则自检测试需要直接 import scripts/rules/*.mjs，
    // 写成 .ts 会让 tsc（strict）要求这些工具脚本提供 .d.mts 类型声明，得不偿失。
    include: ["tests/**/*.test.{ts,tsx,mjs}"],
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
