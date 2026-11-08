import { defineConfig } from "vitest/config";

// Suíte 100% offline: fastify.inject() (sem porta/rede), pg-mem (sem Docker/Postgres).
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
