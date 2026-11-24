import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Placeholders so modules that read env can be imported. Tests never touch the database.
    env: {
      DATABASE_URL: "mysql://test:test@localhost:3306/test",
      CRON_SECRET: "test-cron-secret-0123456789",
    },
  },
});
