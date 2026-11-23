import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // Bundle the shared workspace package; keep real npm dependencies external.
  noExternal: ["@latelylebanon/shared"],
});
