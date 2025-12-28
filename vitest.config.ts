import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".")
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      all: true,
      include: ["lib/**/*", "app/api/**/*"],
      exclude: ["**/*.d.ts", "**/node_modules/**", "**/.next/**"],
      thresholds: {
        statements: 80,
        branches: 79.9,
        functions: 80,
        lines: 80
      }
    }
  }
});
